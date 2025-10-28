package spacegraph.util.vis;

import com.jogamp.common.nio.Buffers;
import com.jogamp.newt.event.KeyEvent;
import com.jogamp.opengl.GL;
import com.jogamp.opengl.GL2;
import com.jogamp.opengl.glu.GLU;
import jcog.data.list.Lst;
import jcog.math.v3;
import spacegraph.input.finger.Finger;
import spacegraph.input.key.KeyPressed;
import spacegraph.space2d.ReSurface;
import spacegraph.space2d.Surface;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * An abstract 3D graph viewer that handles:
 * - VBO creation and management (OpenGL)
 * - Force-directed layout
 * - Basic camera interaction (rotate, zoom, translate)
 * - Node/Edge data structures
 * 
 * Subclasses must handle how to populate the node/edge data (e.g., from JFR or other data sources).
 */
public abstract class AbstractGraph3DViewer extends Surface implements KeyPressed {

    protected final Map<String, GraphNode> nodes = new HashMap<>();
    protected final Map<EdgeKey, GraphEdge> edgeMap = new HashMap<>();

    // After filtering, we keep a list for rendering
    protected final List<GraphEdge> edgesForRendering = new Lst<>();

    // Camera & interaction
    protected float camDistance = 200f;
    protected float camAngleX;
    protected float camAngleY;
    protected float camTranslateX;
    protected float camTranslateY;
    protected float zoomFactor = 2; 
    protected boolean rotating = false;
    protected boolean translating = false;
    protected float lastMouseX, lastMouseY;

    // OpenGL resources
    protected GL2 gl;
    protected final GLU glu = new GLU();
    protected int nodeVbo, edgeVbo;
    protected int nodeColorVbo, edgeColorVbo;
    protected int nodeCount, edgeCount;

    // Buffers to render
    protected float[] nodePositions, edgePositions;
    protected float[] nodeColors, edgeColors;

    // Layout parameters
    protected final ForceDirectedLayout3D layout = new ForceDirectedLayout3D();
    protected float repulsion = 1f / 10;
    protected float attraction = 1f / 50f;
    protected float maxSpeed = 1;
    protected float momentum = 0;
    protected float rad = 510;

    // Activity ranges
    protected int maxNodeActivity = 1, maxEdgeActivity = 1;

    // ------------------------------------------------------------------------
    // Abstract methods - implement in subclasses to load or populate graph data
    // ------------------------------------------------------------------------
    /**
     * Subclass must load data (e.g., from JFR or some other source).
     * Typically called in the constructor or on-demand.
     */
    protected abstract void loadData(int capacity);

    // ------------------------------------------------------------------------
    // Overridable lifecycle
    // ------------------------------------------------------------------------
    @Override
    protected void starting() {
        super.starting();
        focus();
    }

    @Override
    protected void stopping() {
        if (gl != null) {
            gl.glDeleteBuffers(1, new int[]{nodeVbo}, 0);
            gl.glDeleteBuffers(1, new int[]{edgeVbo}, 0);
            gl.glDeleteBuffers(1, new int[]{nodeColorVbo}, 0);
            gl.glDeleteBuffers(1, new int[]{edgeColorVbo}, 0);
            gl = null;
        }
    }

    // ------------------------------------------------------------------------
    // Graph building & filtering
    // ------------------------------------------------------------------------
    protected GraphNode nodeOrNew(String key, String methodName) {
        return nodes.computeIfAbsent(key, k -> new GraphNode(methodName));
    }

    protected GraphEdge edgeOrNew(String srcKey, String tgtKey, GraphNode source, GraphNode target) {
        return edgeMap.computeIfAbsent(new EdgeKey(srcKey, tgtKey), k -> new GraphEdge(source, target));
    }

    /**
     * Removes nodes/edges that do not meet the given thresholds.
     * Then rebuilds edgesForRendering and re-computes max activities.
     */
    public void filterByActivity(int minNodeActivity, int minEdgeActivity) {
        if (minEdgeActivity > 0) {
            edgeMap.values().removeIf(e -> e.activity < minEdgeActivity);
        }
        if (minNodeActivity > 0) {
            // Strictly remove nodes that are below threshold
            nodes.values().removeIf(n -> n.activity < minNodeActivity);
        }
        // Remove edges that reference removed nodes
        edgeMap.values().removeIf(e -> !nodes.containsValue(e.source) || !nodes.containsValue(e.target));
        computeMaxActivities();
        buildEdgesForRendering();
    }

    /**
     * Returns the top N nodes by activity.
     */
    public List<GraphNode> getTopNodes(int n) {
        return nodes.values().stream()
                .sorted(Comparator.comparingInt(GraphNode::getActivity).reversed())
                .limit(n)
                .toList();
    }

    /**
     * Returns the top N edges by activity.
     */
    public List<GraphEdge> getTopEdges(int n) {
        return edgeMap.values().stream()
                .sorted(Comparator.comparingInt(GraphEdge::getActivity).reversed())
                .limit(n)
                .toList();
    }

    /**
     * Filter the current graph to only keep top N nodes by activity.
     * All other nodes are removed, as are any edges referencing them.
     */
    public void keepOnlyTopNNodes(int n) {
        // Get the set of top node references
        Set<GraphNode> keepers = new HashSet<>(getTopNodes(n));
        // Remove all others
        nodes.values().removeIf(node -> !keepers.contains(node));
        // Remove edges referencing removed nodes
        edgeMap.values().removeIf(e -> !nodes.containsValue(e.source) || !nodes.containsValue(e.target));
        computeMaxActivities();
        buildEdgesForRendering();
    }

    /**
     * Compute the maximum node and edge activity for color scaling.
     */
    protected void computeMaxActivities() {
        maxNodeActivity = 1;
        maxEdgeActivity = 1;
        for (var node : nodes.values()) {
            maxNodeActivity = Math.max(maxNodeActivity, node.activity);
        }
        for (var edge : edgeMap.values()) {
            maxEdgeActivity = Math.max(maxEdgeActivity, edge.activity);
        }
    }

    protected void buildEdgesForRendering() {
        edgesForRendering.clear();
        edgesForRendering.addAll(edgeMap.values());
    }

    // ------------------------------------------------------------------------
    // Rendering
    // ------------------------------------------------------------------------
    @Override
    protected void render(ReSurface r) {
        if (this.gl == null) {
            init(r);
        }

        // Layout the graph each frame or only occasionally. Here, we do each frame:
        layoutGraph();

        var w = (int) r.w;
        var h = (int) r.h;
        var aspect = ((float) w) / h;

        // Set viewport and clear
        gl.glViewport(0, 0, w, h);
        gl.glClear(GL2.GL_COLOR_BUFFER_BIT | GL2.GL_DEPTH_BUFFER_BIT);

        // Setup projection
        gl.glMatrixMode(GL2.GL_PROJECTION);
        gl.glLoadIdentity();
        glu.gluPerspective(45.0f, aspect, 1.0f, 2000.0f);

        // Setup model-view
        gl.glMatrixMode(GL2.GL_MODELVIEW);
        gl.glLoadIdentity();
        var dist = camDistance / zoomFactor;
        glu.gluLookAt(
                camTranslateX, camTranslateY, dist,
                camTranslateX, camTranslateY, 0,
                0, 1, 0
        );
        gl.glRotatef(camAngleY, 1f, 0f, 0f);
        gl.glRotatef(camAngleX, 0f, 1f, 0f);

        // Draw edges
        if (edgeCount > 0) {
            gl.glLineWidth(2f);
            gl.glEnableClientState(GL2.GL_VERTEX_ARRAY);
            gl.glEnableClientState(GL2.GL_COLOR_ARRAY);

            gl.glBindBuffer(GL.GL_ARRAY_BUFFER, edgeVbo);
            gl.glVertexPointer(3, GL.GL_FLOAT, 0, 0);

            gl.glBindBuffer(GL.GL_ARRAY_BUFFER, edgeColorVbo);
            gl.glColorPointer(3, GL.GL_FLOAT, 0, 0);

            gl.glDrawArrays(GL.GL_LINES, 0, edgeCount);

            gl.glDisableClientState(GL2.GL_VERTEX_ARRAY);
            gl.glDisableClientState(GL2.GL_COLOR_ARRAY);
        }

        // Draw nodes
        if (nodeCount > 0) {
            gl.glPointSize(9f);
            gl.glEnableClientState(GL2.GL_VERTEX_ARRAY);
            gl.glEnableClientState(GL2.GL_COLOR_ARRAY);

            gl.glBindBuffer(GL.GL_ARRAY_BUFFER, nodeVbo);
            gl.glVertexPointer(3, GL.GL_FLOAT, 0, 0);

            gl.glBindBuffer(GL.GL_ARRAY_BUFFER, nodeColorVbo);
            gl.glColorPointer(3, GL.GL_FLOAT, 0, 0);

            gl.glDrawArrays(GL.GL_POINTS, 0, nodeCount);

            gl.glDisableClientState(GL2.GL_VERTEX_ARRAY);
            gl.glDisableClientState(GL2.GL_COLOR_ARRAY);
        }
    }

    protected void init(ReSurface r) {
        if (!(r.gl instanceof GL2)) {
            System.out.println("No GL2 context available.");
            return;
        }
        gl = r.gl;
        gl.glEnable(GL2.GL_DEPTH_TEST);
        gl.glClearDepth(1.0);
        gl.glDepthFunc(GL2.GL_LESS);
        gl.glClearColor(0, 0, 0, 1);

        gl.glDisable(GL2.GL_LIGHTING);
        gl.glDisable(GL2.GL_CULL_FACE);

        nodeVbo = genBuffer(gl);
        edgeVbo = genBuffer(gl);
        nodeColorVbo = genBuffer(gl);
        edgeColorVbo = genBuffer(gl);

        // Subclass or caller should have built the data by now.
        //uploadData(gl);
    }

    protected int genBuffer(GL2 gl) {
        var buffers = new int[1];
        gl.glGenBuffers(1, buffers, 0);
        return buffers[0];
    }

    protected synchronized void layoutGraph() {
        layout.layout(nodes.values(), edgesForRendering, repulsion, attraction, maxSpeed, momentum, rad);
        prepareBuffers();
        if (gl != null)
            uploadData(gl);
    }

    /**
     * Prepare local arrays for rendering (positions + colors).
     */
    protected void prepareBuffers() {
        nodeCount = nodes.size();
        edgeCount = edgesForRendering.size() * 2; // 2 line vertices per edge

        nodePositions = new float[nodeCount * 3];
        nodeColors    = new float[nodeCount * 3];
        edgePositions = new float[edgeCount * 3];
        edgeColors    = new float[edgeCount * 3];

        // Fill node arrays
        int idx = 0;
        for (var node : nodes.values()) {
            var p = node.position;
            nodePositions[idx]   = p.x;
            nodePositions[idx+1] = p.y;
            nodePositions[idx+2] = p.z;

            var c = valueColor(node.activity, maxNodeActivity);
            nodeColors[idx]   = c[0];
            nodeColors[idx+1] = c[1];
            nodeColors[idx+2] = c[2];
            idx += 3;
        }

        // Fill edge arrays
        idx = 0;
        for (var edge : edgesForRendering) {
            var s = edge.source.position;
            var t = edge.target.position;

            // source
            edgePositions[idx]   = s.x;
            edgePositions[idx+1] = s.y;
            edgePositions[idx+2] = s.z;
            var c = valueColor(edge.activity, maxEdgeActivity);
            edgeColors[idx]   = c[0];
            edgeColors[idx+1] = c[1];
            edgeColors[idx+2] = c[2];
            idx += 3;

            // target
            edgePositions[idx]   = t.x;
            edgePositions[idx+1] = t.y;
            edgePositions[idx+2] = t.z;
            // same color for both ends
            edgeColors[idx]   = c[0];
            edgeColors[idx+1] = c[1];
            edgeColors[idx+2] = c[2];
            idx += 3;
        }
    }

    /**
     * Upload geometry to GPU.
     */
    protected void uploadData(GL2 gl) {
        if (nodePositions != null && nodePositions.length > 0) {
            var nodeBuffer = Buffers.newDirectFloatBuffer(nodePositions);
            gl.glBindBuffer(GL.GL_ARRAY_BUFFER, nodeVbo);
            gl.glBufferData(
                    GL.GL_ARRAY_BUFFER,
                    (long) nodeBuffer.limit() * Float.BYTES,
                    nodeBuffer,
                    GL.GL_STATIC_DRAW
            );
        }

        if (edgePositions != null && edgePositions.length > 0) {
            var edgeBuffer = Buffers.newDirectFloatBuffer(edgePositions);
            gl.glBindBuffer(GL.GL_ARRAY_BUFFER, edgeVbo);
            gl.glBufferData(
                    GL.GL_ARRAY_BUFFER,
                    (long) edgeBuffer.limit() * Float.BYTES,
                    edgeBuffer,
                    GL.GL_STATIC_DRAW
            );
        }

        if (nodeColors != null && nodeColors.length > 0) {
            var nodeColorBuffer = Buffers.newDirectFloatBuffer(nodeColors);
            gl.glBindBuffer(GL.GL_ARRAY_BUFFER, nodeColorVbo);
            gl.glBufferData(
                    GL.GL_ARRAY_BUFFER,
                    (long) nodeColorBuffer.limit() * Float.BYTES,
                    nodeColorBuffer,
                    GL.GL_STATIC_DRAW
            );
        }

        if (edgeColors != null && edgeColors.length > 0) {
            var edgeColorBuffer = Buffers.newDirectFloatBuffer(edgeColors);
            gl.glBindBuffer(GL.GL_ARRAY_BUFFER, edgeColorVbo);
            gl.glBufferData(
                    GL.GL_ARRAY_BUFFER,
                    (long) edgeColorBuffer.limit() * Float.BYTES,
                    edgeColorBuffer,
                    GL.GL_STATIC_DRAW
            );
        }

        // Unbind
        gl.glBindBuffer(GL.GL_ARRAY_BUFFER, 0);
    }

    /**
     * Map raw 'value' to an RGB color, scaled by 'maxVal'.
     * Subclasses can override for more advanced coloring.
     */
    protected float[] valueColor(int value, int maxVal) {
        float ratio = (float) value / (float) maxVal;
        ratio = Math.min(1.0f, 4 * ratio);
        // gradient: from (0,0,1) -> (1,0,0)
        float r = ratio;
        float g = 1.0f - ratio;
        float b = 0.0f;
        return new float[]{r, g, b};
    }

    // ------------------------------------------------------------------------
    // Keyboard & Mouse
    // ------------------------------------------------------------------------
    @Override
    public Surface finger(Finger f) {
        if (f.pressed(0)) {
            var x = f.posPixel.x;
            var y = f.posPixel.y;
            var dx = x - lastMouseX;
            var dy = y - lastMouseY;

            if (!rotating && !translating) {
                // Decide if SHIFT is pressed or something to differentiate rotate vs translate
                // for now we assume left-drag is rotate
                rotating = true;
            }

            if (rotating) {
                camAngleX += dx * 0.25f;
                camAngleY -= dy * 0.25f;
            } else if (translating) {
                camTranslateX += dx * 0.1f;
                camTranslateY -= dy * 0.1f;
            }

            lastMouseX = x;
            lastMouseY = y;
        } else {
            rotating = false;
            translating = false;
        }
        return this;
    }

    @Override
    public boolean key(KeyEvent e, boolean pressedOrReleased) {
        // Act only on key release
        if (pressedOrReleased) {
            return false;
        }

        switch (e.getKeyCode()) {
            case KeyEvent.VK_F: // Filter step
                filterByActivity(++this.minFilterNodes, ++this.minFilterEdges);
                break;
            case KeyEvent.VK_S: // Show top N nodes
                var topN = 10;
                var topNodes = getTopNodes(topN);
                System.out.println("Top " + topN + " nodes by activity:");
                topNodes.forEach(node -> System.out.println(node.getMethodName() + ": " + node.getActivity()));
                break;
            case KeyEvent.VK_E: // Show top N edges
                topN = 10;
                var topEdges = getTopEdges(topN);
                System.out.println("Top " + topN + " edges by activity:");
                topEdges.forEach(edge -> System.out.println(edge.source.getMethodName()
                        + " -> " + edge.target.getMethodName() + ": " + edge.getActivity()));
                break;
            case KeyEvent.VK_UP: // Increase attraction
                attraction *= 1.1f;
                System.out.println("Attraction increased to: " + attraction);
                break;
            case KeyEvent.VK_DOWN: // Decrease attraction
                attraction /= 1.1f;
                System.out.println("Attraction decreased to: " + attraction);
                break;
            case KeyEvent.VK_LEFT: // Increase repulsion
                repulsion *= 1.1f;
                System.out.println("Repulsion increased to: " + repulsion);
                break;
            case KeyEvent.VK_RIGHT: // Decrease repulsion
                repulsion /= 1.1f;
                System.out.println("Repulsion decreased to: " + repulsion);
                break;
            case KeyEvent.VK_M: // Increase momentum
                momentum = Math.min(momentum + 0.1f, 0.9f);
                System.out.println("Momentum increased to: " + momentum);
                break;
            case KeyEvent.VK_N: // Decrease momentum
                momentum = Math.max(momentum - 0.1f, 0.0f);
                System.out.println("Momentum decreased to: " + momentum);
                break;
            case KeyEvent.VK_PLUS: // Increase max speed
            case KeyEvent.VK_EQUALS:
                maxSpeed *= 1.1f;
                System.out.println("Max speed increased to: " + maxSpeed);
                break;
            case KeyEvent.VK_MINUS: // Decrease max speed
                maxSpeed /= 1.1f;
                System.out.println("Max speed decreased to: " + maxSpeed);
                break;
            case KeyEvent.VK_O: // Increase radius
                rad *= 1.1f;
                System.out.println("Radius increased to: " + rad);
                break;
            case KeyEvent.VK_P: // Decrease radius
                rad /= 1.1f;
                System.out.println("Radius decreased to: " + rad);
                break;
            default:
                return false;
        }
        return true;
    }

    // Provide a default min node/edge filter so we can increment with F
    protected int minFilterNodes = 0;
    protected int minFilterEdges = 0;

    // ------------------------------------------------------------------------
    // Inner Data Classes
    // ------------------------------------------------------------------------
    protected record EdgeKey(String src, String tgt) {}

    public static class GraphNode {
        public v3 position;
        public v3 velocity = new v3();
        public int activity = 0;
        private final String methodName;

        public GraphNode(String methodName) {
            this.methodName = methodName;
            ThreadLocalRandom rng = ThreadLocalRandom.current();
            this.position = new v3(
                    rng.nextFloat() - 0.5f,
                    rng.nextFloat() - 0.5f,
                    rng.nextFloat() - 0.5f
            ).normalized().scaled(50);
        }

        public int getActivity() {
            return activity;
        }

        public String getMethodName() {
            return methodName;
        }
    }

    public static class GraphEdge {
        public final GraphNode source, target;
        public int activity = 0;

        public GraphEdge(GraphNode source, GraphNode target) {
            this.source = source;
            this.target = target;
        }

        public int getActivity() {
            return activity;
        }
    }

    public static class ForceDirectedLayout3D {

        /**
         * A naive 3D force-directed layout iteration
         */
        public void layout(
                Collection<GraphNode> nodes,
                List<GraphEdge> edges,
                float repulsion,
                float attraction,
                float maxSpeed,
                float momentum,
                float rad
        ) {
            // Single iteration or many, up to you. We'll do a small one for demonstration.
            int iterations = 1;
            List<GraphNode> nodeList = new Lst<>(nodes);
            int nodeSize = nodeList.size();
            v3 t = new v3();

            for (int i = 0; i < iterations; i++) {
                // Repulsion
                for (int j = 0; j < nodeSize; j++) {
                    GraphNode v = nodeList.get(j);
                    for (int k = j + 1; k < nodeSize; k++) {
                        GraphNode u = nodeList.get(k);
                        t.set(v.position);
                        v3 delta = t.subbed(u.position);
                        float length = delta.length();
                        if (length < Float.MIN_NORMAL) {
                            // random tweak
                            delta.randomized(ThreadLocalRandom.current(), repulsion * repulsion);
                        } else {
                            float distance = length + 1;
                            float force = (repulsion * repulsion) / distance;
                            delta.normalized().scaled(force);
                        }
                        v.velocity.added(delta);
                        u.velocity.subbed(delta);
                    }
                }

                // Attraction
                for (GraphEdge e : edges) {
                    v3 delta = new v3(e.target.position).subbed(e.source.position);
                    float distance = delta.length();
                    if (distance < Float.MIN_NORMAL) {
                        delta.randomized(ThreadLocalRandom.current(), 1 / attraction);
                    } else {
                        float force = (distance * distance) * attraction;
                        delta.normalized().scaled(force);
                    }
                    e.source.velocity.added(delta);
                    e.target.velocity.subbed(delta);
                }

                // Move nodes
                for (GraphNode v : nodes) {
                    v.velocity.clamp(-maxSpeed, maxSpeed);
                    v.position.added(v.velocity);
                    v.position.clamp(-rad, +rad);
                    v.velocity.scaled(momentum);
                }
            }
        }
    }
}

package spacegraph.space2d.container.layout;

import jcog.Util;
import jcog.math.v2;
import jcog.random.XoRoShiRo128PlusRandom;
import jcog.signal.FloatRange;
import jcog.tree.rtree.Spatialization;
import jcog.tree.rtree.rect.RectF;
import spacegraph.space2d.container.graph.Graph2D;
import spacegraph.space2d.container.graph.NodeVis;
import spacegraph.util.MutableRectFloat;

import java.util.Random;

import static jcog.Util.fma;

/**
 * A force-directed layout algorithm that attempts to position nodes of a graph
 * in 2D space by applying repulsive forces between all nodes and attractive forces along edges.
 *
 * Improvements:
 * - More modular and readable code.
 * - Optional Barnes-Hut approximation to reduce complexity from O(n²) for repulsive forces.
 * - Parameterizable iterations and force scaling.
 * - Better documentation and clearer naming.
 */
public class Force2D<X> extends DynamicLayout2D<X> {

    protected final Random rng = new XoRoShiRo128PlusRandom(1);

    /** Speed of repulsive force application */
    public final FloatRange repelSpeed = new FloatRange(0.02f, 0, 0.3f);
    /** Speed of attractive force application (edges) */
    public final FloatRange attractSpeed = new FloatRange(0.6f, 0, 2.0f);
    /** Scaling factor of the layout */
    public final FloatRange scaleFactor = new FloatRange(0.8f, 0.02f, 2.0f);
    /** Exponent for scaling node sizes based on their priority */
    public final FloatRange scaleExponent = new FloatRange(1.0f, 0.1f, 2.0f);
    /** Minimum node size factor */
    public final FloatRange scaleMin = new FloatRange(0.1f, 0.02f, 2.0f);
    /** Node spacing factor in node radii */
    public final FloatRange nodeSpacing = new FloatRange(0.01f, 0.0f, 1.0f);
    /** Momentum factor: 1.0 - momentum LERP */
    public final FloatRange speed = new FloatRange(0.12f, 0.0f, 1.0f);

    /** Number of iterations per layout step */
    protected int iterations = 1;

    /** Maximum distance at which repulsion is considered */
    protected float maxRepelDist;

    /** Factor controlling equilibrium distances (scales the "ideal" distance between connected nodes) */
    protected float equilibriumDistFactor;

    /** Temporary arrays and references */
    protected transient double[] dxy;
    protected transient int n;
    protected transient MutableRectFloat<X>[] nn;
    protected transient Graph2D<X> graph;

    /** If true, use a Barnes-Hut approximation for repulsive forces */
    protected boolean useBarnesHut = false;

    @Override
    public void init(NodeVis<X> newNode, Graph2D<X> g) {
        float rx = g.w() / 2 * (rng.nextFloat() * 2 - 1);
        float ry = g.h() / 2 * (rng.nextFloat() * 2 - 1);
        newNode.posXYWH(g.cx() + rx, g.cy() + ry, 1, 1);
    }

    @Override
    protected void layout(Graph2D<X> g, float dtS) {
        this.graph = g;
        this.n = nodes.size();
        if (n == 0 || iterations <= 0)
            return;


        float sqrtN = Util.sqrt(1.0f + n);
        float s = scaleFactor.floatValue();
        float gRadius = g.radius();
        maxRepelDist = 2 * gRadius;
        equilibriumDistFactor = s * nodeSpacing.floatValue();

        double scale = gRadius * s / sqrtN;
        float repelSp = (float) (repelSpeed.doubleValue() / iterations * scale);
        float attractSp = (float) (attractSpeed.doubleValue() / iterations * scale);
        float sp = speed.floatValue();

        RectF gg = g.bounds;
        nn = nodes.array();

        if (dxy == null || dxy.length < n * 2) {
            dxy = new double[n * 2];
        }

        float min = (float) (scaleMin.floatValue() * scale);
        float exponent = scaleExponent.floatValue();

        // Initialize node sizes and reset displacement array
        {
            int id = 0;
            for (int a = 0; a < n; a++) {
                setNodeSize(nn[a], min, scale, exponent);
                dxy[id++] = 0;
                dxy[id++] = 0;
            }
        }

        // Barnes-Hut setup (optional)
        BarnesHutTree bhTree = null;
        if (useBarnesHut && n > 1) {
            bhTree = new BarnesHutTree(nn);
        }

        for (int i = 0; i < iterations; i++) {

            preIteration();

            // Repel nodes (O(n²) or O(n log n) if Barnes-Hut used)
            if (useBarnesHut && bhTree != null) {
                bhTree.buildTree();
                barnesHutRepel(bhTree, repelSp);
            } else {
                directRepel(repelSp);
            }

            // Attract nodes along edges
            directAttract(attractSp);

            postIteration();

            applyDisplacements(sp, gg);
        }

        this.graph = null; // release reference
    }

    /** Setup node size based on priority */
    protected void setNodeSize(MutableRectFloat<X> m, double min, double scale, double exponent) {
        float p = (float) (min + Math.pow(Math.sqrt(m.node.pri) * scale, exponent));
        m.size(p, p);
    }

    /** Called before each iteration */
    protected void preIteration() {
    }

    /** Called after each iteration */
    protected void postIteration() {
    }

    protected void applyDisplacements(float speed, RectF gg) {
        int idx = 0;
        for (int a = 0; a < n; a++) {
            MutableRectFloat<X> A = nn[a];
            A.move(dxy[idx++], dxy[idx++]);
            A.clamp(gg);
            A.commitLerp(speed);
        }
    }

    private void directAttract(float attractSpeed) {
        for (int a = 0; a < n; a++) {
            attractNode(a, nn[a], attractSpeed);
        }
    }

    private void directRepel(float repelSpeed) {
        for (int a = 0; a < n; a++) {
            MutableRectFloat<X> A = nn[a];
            float ar = A.radius() / 2;
            for (int b = a + 1; b < n; b++) {
                MutableRectFloat<X> B = nn[b];
                repelPair(a, A, ar, b, B, repelSpeed);
            }
        }
    }

    private final transient v2 delta = new v2();

    private void attractNode(int a, MutableRectFloat<X> A, float attractSpeed) {
        NodeVis<X> from = A.node;
        float px = A.x, py = A.y;
        float aRad = A.radius();

        from.outs.forEachValue(ab -> {
            NodeVis<X> bv = ab.to;
            if (bv == null) return;

            MutableRectFloat<X> B = bv.m;
            float abRad = aRad + B.radius();
            float lenIdeal = abRad * (1 + equilibriumDistFactor);

            delta.set(B.x - px, B.y - py);
            float len = delta.normalize();
            if (len > lenIdeal) {
                float s = attractSpeed * weightToVelocity(ab.weight) / 2;
                s = Math.min(len - lenIdeal, s);
                float dx = delta.x, dy = delta.y;
                moveDisplacement(a, dx, dy, s);
                B.move(dx, dy, -s);
            }
        });
    }

    private static float weightToVelocity(float weight) {
        return weight;
    }

    private void repelPair(int a, MutableRectFloat A, float ar, int b, MutableRectFloat B, float repelSpeed) {
        double len = delta.set(A.x - B.x, A.y - B.y).normalize();
        if (len >= maxRepelDist) return;

        float br = B.radius() / 2;
        double radSum = (ar + br);
        double ideal = radSum * (1 + equilibriumDistFactor);
        len -= ideal;

        double s = repelSpeed;
        if (len > 0) {
            s /= (1 + (len * len)) / (1 + radSum);
        }

        if (s > Spatialization.EPSILONf) {
            double dx = delta.x * s, dy = delta.y * s;
            moveDisplacement(a, dx, dy, br);
            moveDisplacement(b, dx, dy, -ar);
        }
    }

    protected void moveDisplacement(int a, double dx, double dy, double scale) {
        int idx = a * 2;
        dxy[idx] = fma(scale, dx, dxy[idx]);
        dxy[idx + 1] = fma(scale, dy, dxy[idx + 1]);
    }

    /** Barnes-Hut approximation */
    private void barnesHutRepel(BarnesHutTree bhTree, float repelSpeed) {
        for (int a = 0; a < n; a++) {
            MutableRectFloat<X> A = nn[a];
            float ar = A.radius() / 2f;
            bhTree.applyRepulsion(a, A, ar, repelSpeed, this);
        }
    }

    // Inner class for Barnes-Hut (simplified)
    static class BarnesHutTree<X> {
        BHNode root;
        MutableRectFloat<X>[] nodes;
        float xmin, xmax, ymin, ymax;

        BarnesHutTree(MutableRectFloat<X>[] nodes) {
            this.nodes = nodes;
        }

        void buildTree() {
            // Compute bounding box
            xmin = ymin = Float.POSITIVE_INFINITY;
            xmax = ymax = Float.NEGATIVE_INFINITY;

            for (MutableRectFloat<X> n : nodes) {
                float x = n.x;
                float y = n.y;
                if (x < xmin) xmin = x;
                if (y < ymin) ymin = y;
                if (x > xmax) xmax = x;
                if (y > ymax) ymax = y;
            }

            root = new BHNode(xmin, ymin, xmax - xmin, ymax - ymin);
            for (int i = 0; i < nodes.length; i++) {
                root.insert(i, nodes[i].x, nodes[i].y);
            }
            root.computeMassCenter(nodes);
        }

        void applyRepulsion(int a, MutableRectFloat<X> A, float ar, float repelSpeed, Force2D<X> layout) {
            root.applyForce(a, A, ar, repelSpeed, layout);
        }

        static class BHNode {
            float x, y, w, h;
            int pointIndex = -1; // leaf node if >=0
            BHNode nw, ne, sw, se;
            int massCount;
            double massX, massY;

            BHNode(float x, float y, float w, float h) {
                this.x = x;
                this.y = y;
                this.w = w;
                this.h = h;
            }

            boolean insert(int index, float px, float py) {
                // If no children and empty
                if (pointIndex == -1 && nw == null) {
                    pointIndex = index;
                    massCount = 1;
                    massX = px;
                    massY = py;
                    return true;
                }

                // If leaf and new point different
                if (pointIndex >= 0) {
                    // subdivide
                    subdivide();
                    int oldIndex = pointIndex;
                    pointIndex = -1;
                    insertNode(oldIndex, massX, massY);
                    insertNode(index, px, py);
                    return true;
                }

                return insertNode(index, px, py);
            }

            private boolean insertNode(int idx, double px, double py) {
                double midx = x + w/2;
                double midy = y + h/2;

                if (px < midx) {
                    if (py < midy) return nw.insert(idx, (float)px, (float)py);
                    else return sw.insert(idx, (float)px, (float)py);
                } else {
                    if (py < midy) return ne.insert(idx, (float)px, (float)py);
                    else return se.insert(idx, (float)px, (float)py);
                }
            }

            private void subdivide() {
                float hw = w/2f;
                float hh = h/2f;
                nw = new BHNode(x, y, hw, hh);
                ne = new BHNode(x+hw, y, hw, hh);
                sw = new BHNode(x, y+hh, hw, hh);
                se = new BHNode(x+hw, y+hh, hw, hh);
            }

            void computeMassCenter(MutableRectFloat<?>[] nodes) {
                if (nw == null && pointIndex >= 0) {
                    massCount = 1;
                    massX = nodes[pointIndex].x;
                    massY = nodes[pointIndex].y;
                    return;
                }

                massCount = 0;
                massX = 0;
                massY = 0;
                if (nw != null) {
                    nw.computeMassCenter(nodes);
                    ne.computeMassCenter(nodes);
                    sw.computeMassCenter(nodes);
                    se.computeMassCenter(nodes);
                    addMass(nw);
                    addMass(ne);
                    addMass(sw);
                    addMass(se);
                }
            }

            private void addMass(BHNode child) {
                if (child.massCount > 0) {
                    massX += child.massX;
                    massY += child.massY;
                    massCount += child.massCount;
                }
            }

            void applyForce(int a, MutableRectFloat A, float ar, float repelSpeed, Force2D<?> layout) {
                if (massCount == 0) return;

                double dx = massX / massCount - A.x;
                double dy = massY / massCount - A.y;
                double dist = Math.sqrt(dx*dx + dy*dy);

                if (nw == null && pointIndex >= 0 && pointIndex != a) {
                    // Directly compute force with this single node
                    layout.repelPair(a, A, ar, pointIndex, layout.nn[pointIndex], repelSpeed);
                } else {
                    // Check if we can treat this cell as a single mass
                    if ((w / dist) < 0.5) {
                        // Treat as single mass
                        // Approximate force: Just a repulsive push from the mass center.
                        if (dist < layout.maxRepelDist && dist > 1e-5) {
                            double ideal = (ar + ar) * (1 + layout.equilibriumDistFactor);
                            double len = dist - ideal;
                            double s = repelSpeed;
                            if (len > 0) s /= (1 + (len * len)) / (1 + ar + ar);
                            if (s > Spatialization.EPSILONf) {
                                dx /= dist;
                                dy /= dist;
                                layout.moveDisplacement(a, dx, dy, s * massCount);
                            }
                        }
                    } else if (nw != null) {
                        nw.applyForce(a, A, ar, repelSpeed, layout);
                        ne.applyForce(a, A, ar, repelSpeed, layout);
                        sw.applyForce(a, A, ar, repelSpeed, layout);
                        se.applyForce(a, A, ar, repelSpeed, layout);
                    }
                }
            }
        }
    }
}

package spacegraph.space2d.container.layout;

import jcog.math.v2;
import jcog.tree.rtree.rect.RectF;
import spacegraph.space2d.container.graph.Graph2D;
import spacegraph.space2d.container.graph.NodeVis;
import spacegraph.util.MutableRectFloat;

import java.util.concurrent.ThreadLocalRandom;

/** untested */
public class EfficientForce2D<X> extends DynamicLayout2D<X> {

    private static final float DEFAULT_REPULSION = 1.0f;
    private static final float DEFAULT_ATTRACTION = 0.1f;
    private static final float DEFAULT_GRAVITY = 0.05f;
    private static final float DEFAULT_DAMPING = 0.8f;
    private static final float MAX_VELOCITY = 10.0f;
    private static final float MIN_DISTANCE = 0.1f;

    private final float repulsion;
    private final float attraction;
    private final float gravity;
    private final float damping;

    private v2[] forces;
    private v2[] velocities;

    public EfficientForce2D() {
        this(DEFAULT_REPULSION, DEFAULT_ATTRACTION, DEFAULT_GRAVITY, DEFAULT_DAMPING);
    }

    public EfficientForce2D(float repulsion, float attraction, float gravity, float damping) {
        this.repulsion = repulsion;
        this.attraction = attraction;
        this.gravity = gravity;
        this.damping = damping;
    }

    @Override
    public void layout(Graph2D<X> graph, float dtS) {
        int nodeCount = graph.nodeCount();
        if (nodeCount == 0) return;

        ensureArrays(nodeCount);
        resetForces();

        calculateForces(graph);
        updatePositions(graph, dtS);
    }

    private void ensureArrays(int nodeCount) {
        if (forces == null || forces.length < nodeCount) {
            forces = new v2[nodeCount];
            velocities = new v2[nodeCount];
            for (int i = 0; i < nodeCount; i++) {
                forces[i] = new v2();
                velocities[i] = new v2();
            }
        }
    }

    private void resetForces() {
        for (v2 force : forces) {
            force.set(0, 0);
        }
    }

    private void calculateForces(Graph2D<X> graph) {
        MutableRectFloat<X>[] nodes = this.nodes.array();;
        int nodeCount = nodes.length;
        v2 delta = new v2();
        v2 center = new v2(graph.cx(), graph.cy());

        for (int i = 0; i < nodeCount; i++) {
            MutableRectFloat<X> nodeI = nodes[i];
            NodeVis<X> visI = nodeI.node;

            // Repulsion
            for (int j = i + 1; j < nodeCount; j++) {
                MutableRectFloat<X> nodeJ = nodes[j];
                delta.set(nodeJ.cx() - nodeI.cx(), nodeJ.cy() - nodeI.cy());
                float distance = Math.max(delta.length(), MIN_DISTANCE);
                float repulsiveForce = repulsion / (distance * distance);
                delta.normalize();
                delta.scaled(repulsiveForce);
                forces[i].subbed(delta);
                forces[j].added(delta);
            }

            // Attraction and Gravity
            int I = i;
            visI.outs.forEachValue(edge -> {
                NodeVis<X> target = edge.to;
                if (target == null)
                    return;

                var J = target;
                delta.set(J.cx() - nodeI.cx(), J.cy() - nodeI.cy());
                float distance = delta.length();
                delta.normalize();
                delta.scaled(distance * attraction * edge.weight);
                forces[I].added(delta);
                //forces[j].subbed(delta); //TODO
            });

            // Gravity
            forces[i].added(center.x - nodeI.cx(), center.y - nodeI.cy());
            forces[i].normalize();
            forces[i].scaled(gravity);
        }
    }

    private void updatePositions(Graph2D<X> graph, float dtS) {
        MutableRectFloat<X>[] nodes = this.nodes.array();
        RectF bounds = graph.bounds;

        for (int i = 0; i < nodes.length; i++) {
            MutableRectFloat<X> node = nodes[i];
            v2 velocity = velocities[i];

            velocity.added(forces[i].scaled(dtS, damping));
            if (velocity.length() > MAX_VELOCITY) {
                velocity.normalize();
                velocity.scaled(MAX_VELOCITY);
            }

            float newX = node.cx() + velocity.x * dtS;
            float newY = node.cy() + velocity.y * dtS;

            newX = Math.max(bounds.x, Math.min(newX, bounds.x + bounds.w));
            newY = Math.max(bounds.y, Math.min(newY, bounds.y + bounds.h));

            node.pos(newX - node.w / 2, newY - node.h / 2);
        }
    }

    @Override
    public void init(NodeVis<X> newNode, Graph2D<X> graph) {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        float x = graph.cx() + (random.nextFloat() - 0.5f) * graph.w();
        float y = graph.cy() + (random.nextFloat() - 0.5f) * graph.h();
        newNode.posXYWH(x, y, 1, 1);
    }
}
package spacegraph.space2d.container.layout;

import jcog.math.v2;
import spacegraph.space2d.container.graph.Graph2D;
import spacegraph.space2d.container.graph.NodeVis;
import spacegraph.util.MutableRectFloat;

import static spacegraph.space2d.container.layout.SemiForce2D.TreeForce2D.assignSerialID;

/**
 * A simplified ForceAtlas2-like layout:
 * - Stronger attraction for edges.
 * - Log-based repulsion to reduce clutter.
 */
public class ForceAtlas2D<X> extends Force2D<X> {

    private float gravity = 0.1f; // Pull nodes towards the center
    private float scalingRatio = 1.0f;

    @Override
    protected void layout(Graph2D<X> g, float dtS) {
        this.graph = g;
        this.n = nodes.size();
        if (n == 0 || iterations <= 0)
            return;

        nn = nodes.array();
        if (dxy == null || dxy.length < n * 2) dxy = new double[n * 2];

        assignSerialID(nn);

        // Reset displacements
        for (int i = 0; i < n*2; i++) dxy[i] = 0;

        float width = g.bounds.w, height = g.bounds.h;
        float area = width * height;
        float k = (float)Math.sqrt(area / n);

        var scaleMin = this.scaleMin.asFloat();
        var scaleExp = scaleExponent.asFloat();
        for (int i = 0, length = n; i < length; i++)
            setNodeSize(nn[i], scaleMin, k, scaleExp);


        float centerX = g.cx(), centerY = g.cy();

        for (int i = 0; i < iterations; i++) {
            preIteration();
            // Repulsion (log-based)
            for (int a = 0; a < n; a++) {
                for (int b = a+1; b < n; b++) {
                    applyRepulsionFA2(a,b);
                }
            }

            // Attraction along edges
            for (int a = 0; a < n; a++) {
                applyAttractionFA2(a);
            }

            // Gravity: pull nodes towards center
            for (int a = 0; a < n; a++) {
                applyGravity(a, centerX, centerY);
            }

            postIteration();
            applyDisplacements(speed.floatValue(), g.bounds);
        }

        this.graph = null;
    }

    private final v2 deltaVec = new v2();

    private void applyRepulsionFA2(int a, int b) {
        MutableRectFloat<X> A = nn[a];
        MutableRectFloat<X> B = nn[b];
        float dx = A.x - B.x;
        float dy = A.y - B.y;
        float dist = (float)Math.sqrt(dx*dx + dy*dy) + 0.01f;
        float force = (scalingRatio * (1f + (float)Math.log(dist))) / dist;
        double rx = dx * force;
        double ry = dy * force;
        moveDisplacement(a, rx, ry, 1);
        moveDisplacement(b, rx, ry, -1);
    }

    private void applyAttractionFA2(int a) {
        MutableRectFloat<X> A = nn[a];
        A.node.outs.forEachValue(ab -> {
            NodeVis<X> W = ab.to;
            if (W == null) return;
            int wIndex = W.i;
            if (wIndex == Integer.MIN_VALUE) return; //uninitialized

            MutableRectFloat<X> B = nn[wIndex];

            float dx = A.x - B.x;
            float dy = A.y - B.y;
            float dist = (float)Math.sqrt(dx*dx + dy*dy) + 0.01f;
            float force = dist * dist * 0.0001f; // simplified
            double rx = dx/dist * force;
            double ry = dy/dist * force;
            moveDisplacement(a, rx, ry, -1);
            moveDisplacement(wIndex, rx, ry, 1);
        });
    }

    private void applyGravity(int a, float cx, float cy) {
        MutableRectFloat<X> A = nn[a];
        float dx = A.x - cx;
        float dy = A.y - cy;
        float dist = (float)Math.sqrt(dx*dx + dy*dy) + 0.01f;
        double rx = -dx/dist * gravity;
        double ry = -dy/dist * gravity;
        moveDisplacement(a, rx, ry, 1);
    }
}

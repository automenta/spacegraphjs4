package spacegraph.space2d.container.layout;

import jcog.math.v2;
import jcog.tree.rtree.rect.RectF;
import spacegraph.space2d.container.graph.Graph2D;
import spacegraph.space2d.container.graph.NodeVis;
import spacegraph.util.MutableRectFloat;

import static spacegraph.space2d.container.layout.SemiForce2D.TreeForce2D.assignSerialID;

/**
 * Fruchterman-Reingold algorithm variant.
 * This uses a classical approach of attraction and repulsion with a "temperature" parameter
 * to gradually stabilize the layout.
 */
public class FruchtermanReingold2D<X> extends Force2D<X> {

    protected float area;     // Area of the layout
    protected float k;        // Optimal distance
    protected float temperature = 1.0f;
    protected float cooling = 0.95f; // Cooling factor per iteration

    @Override
    protected void layout(Graph2D<X> g, float dtS) {
        this.graph = g;
        this.n = nodes.size();
        if (n == 0 || iterations <= 0)
            return;

        nn = nodes.array();
        if (dxy == null || dxy.length < n * 2) dxy = new double[n * 2];

        assignSerialID(nn);

        RectF gg = g.bounds;
        float width = gg.w, height = gg.h;
        area = width * height;
        k = (float)Math.sqrt(area / n);

        var scaleMin = this.scaleMin.asFloat();
        var scaleExp = scaleExponent.asFloat();
        for (int i = 0, length = n; i < length; i++)
            setNodeSize(nn[i], scaleMin, k, scaleExp);

        // Reset displacements
        for (int i = 0; i < n*2; i++) dxy[i] = 0;

        for (int i = 0; i < iterations; i++) {
            preIteration();
            // Repulsive forces
            for (int v = 0; v < n; v++) {
                for (int u = v+1; u < n; u++) {
                    applyRepulsion(v, u);
                }
            }

            // Attractive forces
            for (int v = 0; v < n; v++) {
                applyAttraction(v);
            }

            // Apply temperature and move nodes
            applyDisplacementsFruchterman(gg);
            temperature *= cooling;
            postIteration();
        }

        this.graph = null;
    }

    private final v2 deltaVec = new v2();

    private void applyRepulsion(int v, int u) {
        MutableRectFloat<X> V = nn[v];
        MutableRectFloat<X> U = nn[u];
        float dx = V.x - U.x;
        float dy = V.y - U.y;
        float dist = (float) Math.sqrt(dx*dx + dy*dy) + 0.001f;
        float force = (k*k / dist);
        double rx = dx/dist * force;
        double ry = dy/dist * force;
        moveDisplacement(v, rx, ry, 1);
        moveDisplacement(u, rx, ry, -1);
    }

    private void applyAttraction(int v) {
        MutableRectFloat<X> V = nn[v];
        V.node.outs.forEachValue(ab -> {
            NodeVis<X> W = ab.to;
            if (W == null) return;
            int wIndex = W.i;
            MutableRectFloat<X> U = nn[wIndex];

            float dx = V.x - U.x;
            float dy = V.y - U.y;
            float dist = (float)Math.sqrt(dx*dx + dy*dy) + 0.001f;
            float force = (dist*dist / k);
            double rx = dx/dist * force;
            double ry = dy/dist * force;
            moveDisplacement(v, rx, ry, -1);
            moveDisplacement(wIndex, rx, ry, 1);
        });
    }

    private void applyDisplacementsFruchterman(RectF gg) {
        for (int i = 0; i < n; i++) {
            MutableRectFloat<X> node = nn[i];
            double dx = dxy[i*2], dy = dxy[i*2+1];
            float dist = (float)Math.sqrt(dx*dx + dy*dy);
            if (dist > 0) {
                float limit = Math.min(dist, temperature);
                double rx = dx/dist * limit;
                double ry = dy/dist * limit;
                node.move(rx, ry);
                node.clamp(gg);
                node.commitLerp(speed.floatValue());
            }
        }
    }
}

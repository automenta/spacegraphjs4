package spacegraph.space2d.container.layout;

import jcog.data.graph.MinTree;
import spacegraph.util.MutableRectFloat;

/** partially enforces an explicit structure while applying some degree of Force2D constraints */
public abstract class SemiForce2D<X> extends Force2D<X> {


    public static class TreeForce2D<X> extends SemiForce2D<X> {

        int j = -1;

        @Override
        protected synchronized void postIteration() {
            var g = new MinTree.Graph(graph.nodeCount());
            assignSerialID(nn);
            for (var s : nn) {
                if (s == null) break;
                var S = s.node;
                S.outs.forEach((t, e) -> g.edge(S.i, e.to.i, 1));
            }

            var nodeSpacing = 1 + this.nodeSpacing.floatValue();

//            float sx = 50, sy = 50;
            g.apply().forEach(p -> apply(p, nodeSpacing, nodeSpacing));

//            System.out.println(tree);
        }

        protected static int assignSerialID(MutableRectFloat[] nn) {
            var j = 0;
            for (var s : nn) {
                if (s == null) break;
                s.node.i = j++;
            }
            return j;
        }

        /** recursive */
        private void apply(MinTree.Graph.IntTree p, float nodeSpacingX, float nodeSpacingY) {
            var size = p.size(); if (size==0) return;

            var P = nn[p.id];

            var children = p.children;
            if (children!=null) {

                double r = P.radius();


                var n = children.length;
                var sx = nodeSpacingX * r * Math.sqrt(n);
                var sy = nodeSpacingY * r;

                var cn = 0;
                float pushParentX = 0, pushParentY = 0;
                for (var c : children) {
                    var xi = P.x + sx * (size == 1 ? 0 : size * (((float) cn) / (size - 1) - 0.5f) * 1);
                    var yi = P.y + sy;

                    var C = nn[c.id];
                    double xd = xi - C.x, yd = yi - C.y;

                    pushParentX += -xd/2/n; pushParentY += -yd/2/n;

                    C.move(xd/2, yd/2);

                    //C.posLERP(P.x + xi, P.y + yi, 0.25f);
                    apply(c, nodeSpacingX, nodeSpacingY);
                    cn++;
                }

                P.move(pushParentX, pushParentY);
            }
        }


    }
}
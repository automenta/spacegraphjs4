package toxi.geom;

import jcog.tree.rtree.RTree;
import jcog.tree.rtree.rect.RectF;
import jcog.tree.rtree.split.AxialSplit;
import toxi.physics2d.VerletParticle2D;

import java.util.function.Consumer;

/** removal has bug */
public class RTreeQuadTree<X extends VerletParticle2D> extends RTree<X> implements SpatialIndex<X> {

    public RTreeQuadTree() {
        super(RTreeQuadTree::b, 3, AxialSplit.the);
    }

    static RectF b(Vec2D v) {
        float DEFAULT_RADIUS = 0.5f;
        return b(v, DEFAULT_RADIUS);
    }

    private static RectF b(Vec2D v, float radius) {
        return RectF.XYWH(v.x, v.y, radius*2, radius*2);
    }


    @Override
    public synchronized boolean index(X p) {
        return add(p);
    }

    @Override
    public boolean isIndexed(X item) {
        return contains(item);
    }

    @Override
    public synchronized void itemsWithinRadius(Vec2D p, float radius, Consumer<X> results) {
        intersectsWhile(b(p, radius), (t) -> {
            results.accept(t);
            return true;
        });
    }

    @Override
    public synchronized boolean reindex(X p, Consumer<X> each) {
        if (unindex(p)) {
            each.accept(p);

            return index(p);

        }
        return false;
    }

    @Override
    public synchronized boolean unindex(X p) {
        return remove(p);
    }

}

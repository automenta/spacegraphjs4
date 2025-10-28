package spacegraph.space2d.container.graph;

import com.jogamp.opengl.GL2;
import jcog.data.map.ConcurrentFastIteratingHashMap;
import jcog.data.pool.Pool;
import spacegraph.space2d.ReSurface;
import spacegraph.space2d.widget.windo.Windo;
import spacegraph.util.MutableRectFloat;
import spacegraph.video.Draw;

public class NodeVis<X> extends Windo {

    public transient X id; //TODO WeakReference

    /**
     * optional priority component
     */
    public float pri;

    private static final ConcurrentFastIteratingHashMap EMPTY
            = new ConcurrentFastIteratingHashMap<>(EdgeVis.EmptyArray);;
    /**
     * outgoing edges
     */
    public ConcurrentFastIteratingHashMap<X, EdgeVis<X>> outs =
            EMPTY;

    public final MutableRectFloat<X> m = new MutableRectFloat<>(this);

    private float r, g, b, a;

    /** general re-purposeable serial integer */
    public transient int i;

    NodeVis(X id) {
        if (id == null) throw new NullPointerException();
        this.i = Integer.MIN_VALUE;
        this.id = id;
        pri = 0.5f;
        r = g = b = 0.5f;
    }

    private void setBounds() {
        m.set(bounds);
    }

    void end(Pool<EdgeVis<X>> edgePool) {
        hide();
        removeOuts(edgePool);
        this.i = Integer.MIN_VALUE;
        //this.id = null; //causes NPE
    }

    void paintEdges(GL2 gl) {
        for (var e : outs.valueArray())
            e.draw(this, gl);
    }

    @Override
    protected void paintIt(GL2 gl, ReSurface R) {
        gl.glColor4f(r, g, b, a);
        Draw.rect(bounds, gl);
    }

    public void color(float r, float g, float b) {
        color(r,g,b,1);
    }

    public boolean pinned() {
        return false;
    }

    private void removeOuts(Pool<EdgeVis<X>> pool) {
        outs.clear(e -> {
            e.clear();
            pool.put(e);
        });
        outs = EMPTY;
    }


    /**
     * adds or gets existing edge
     */
    EdgeVis<X> out(NodeVis<X> target, Pool<EdgeVis<X>> pool) {
        var tid = target.id;
        if (tid == null)
            return null;

        if (outs == EMPTY)
            outs = new ConcurrentFastIteratingHashMap<>(EdgeVis.EmptyArray);

        var y = outs.compute(tid, (tt, yy) -> {
            var yy1 = yy;
            if (yy1 == null) {
                yy1 = pool.get();
                yy1.to = target;
            }
            return yy1;
        });
        y.invalid = false;
        return y;
    }

    public void update() {
        //remove dead edges, or edges to NodeVis's which have been recycled after removal
        outs.removeIf((x, e) -> {
            if (e.invalid) return true;
            var ee = e.to;
            return ee == null;
            //return ee == null || !x.equals(ee.id);
        });
    }

    void invalidateEdges() {
        for (var e : outs.valueArray())
            e.invalid = true;
    }

    public void color(float... rgba) {
        //assert(rgba.length==4);
        this.r = rgba[0]; this.g = rgba[1]; b = rgba[2]; a = rgba[3];
    }

    public void color(float r, float g, float b, float a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    void pre() {
        setBounds();
    }

    void post() {
        if (posChanged(m)) // just in case
            layout();
    }

    public void colorHash() {
        var x = this.id;
        colorHash(x!=null ? x.hashCode() : 0);
    }

    public void colorHash(int h) {
        colorHash(h, 1.0f);
    }

    public void colorHash(int h, float alpha) {
        var color = new float[4];
        Draw.colorHash(h, color, alpha);
        color(color);
    }
}
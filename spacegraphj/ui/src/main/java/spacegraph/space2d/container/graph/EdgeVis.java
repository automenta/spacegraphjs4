package spacegraph.space2d.container.graph;

import com.jogamp.opengl.GL2;
import jcog.Util;
import jcog.tree.rtree.rect.RectF;
import spacegraph.video.Draw;

public class EdgeVis<X> {
    public NodeVis<X> to;

    public boolean invalid;

    public float r, g, b, a;
    public float weight;
    private int renderer;


    public EdgeVis() {
        clear();
    }

    public void clear() {
        invalid = true;
        to = null;
        r = g = b = 0.0f;
        a = 0.75f;
        weight = 1;
        renderer = DEFAULT_RENDERER;
    }

    private static final int DEFAULT_RENDERER = EdgeVisRenderer.TriangleThin.ordinal();

    enum EdgeVisRenderer {
        Line {
            @Override
            public void render(EdgeVis e, NodeVis from, GL2 gl) {
                gl.glLineWidth(1.0f + e.weight * 4.0f);
                e.color(gl);
                NodeVis to = e.to;
                Draw.linf(from.cx(), from.cy(), to.cx(), to.cy(), gl);
            }
        },
        TriangleThin {
            @Override
            protected void render(EdgeVis e, NodeVis from, GL2 gl) {
                tri(e, from, 1/3f, gl);
            }
        },
        Triangle {
            @Override
            public void render(EdgeVis e, NodeVis from, GL2 gl) {
                tri(e, from, 1, gl);
            }
        };

        private static void tri(EdgeVis e, NodeVis from, float thickness, GL2 gl) {
            NodeVis to = e.to;
            if (to == null)
                return;

            RectF f = from.bounds, t = to.bounds;
            float baseScale = Math.min(f.w, f.h) * thickness;
            float base = Util.lerpSafe(Util.sqrt(e.weight), 0, baseScale);
            if (base > 0) {
                e.color(gl);
                Draw.halfTriEdge2D(f.cx(), f.cy(), t.cx(), t.cy(), base, gl);
            }
        }

        protected abstract void render(EdgeVis e, NodeVis from, GL2 gl);
    }

    private void color(GL2 gl) {
        gl.glColor4f(r, g, b, a);
    }

    public EdgeVis<X> weight(float w) {
        weight = w;
        return this;
    }

    public EdgeVis<X> weightAddLerp(float w, float rate) {
        this.weight = Util.lerpSafe(rate, this.weight, this.weight + w);
        return this;
    }
    public EdgeVis<X> weightLerp(float w, float rate) {
        this.weight = Util.lerpSafe(rate, this.weight, w);
        return this;
    }

    public EdgeVis<X> color(float r, float g, float b, float a) {
        color(r,g,b);
        this.a = a;
        return this;
    }

    public EdgeVis<X> color(float r, float g, float b) {
        this.r = r;
        this.g = g;
        this.b = b;
        return this;
    }

    public EdgeVis<X> colorLerp(float r, float g, float b /* TODO type */, float rate) {
        if (r==r) this.r = Util.lerpSafe(rate, this.r, r);
        if (g==g) this.g = Util.lerpSafe(rate, this.g, g);
        if (b==b) this.b = Util.lerpSafe(rate, this.b, b);
        return this;
    }
    public EdgeVis<X> colorAddLerp(float r, float g, float b /* TODO type */, float rate) {
        if (r==r) this.r = Util.lerpSafe(rate, this.r, r + this.r);
        if (g==g) this.g = Util.lerpSafe(rate, this.g, g + this.g);
        if (b==b) this.b = Util.lerpSafe(rate, this.b, b + this.b);
        return this;
    }

    final void draw(NodeVis<X> from, GL2 gl) {
        NodeVis<X> t = this.to;
        if (t != null && t.visible())
            renderers[renderer].render(this, from, gl);
    }

    static final EdgeVisRenderer[] renderers = EdgeVisRenderer.values();

    static final EdgeVis[] EmptyArray = new EdgeVis[0];

}
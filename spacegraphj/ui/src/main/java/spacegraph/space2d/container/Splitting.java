package spacegraph.space2d.container;

import jcog.Util;
import jcog.math.v2;
import jcog.tree.rtree.Spatialization;
import jcog.tree.rtree.rect.RectF;
import org.eclipse.collections.api.block.procedure.primitive.BooleanProcedure;
import org.jetbrains.annotations.Nullable;
import spacegraph.input.finger.Finger;
import spacegraph.input.finger.FingerRenderer;
import spacegraph.input.finger.state.SurfaceDragging;
import spacegraph.space2d.Surface;
import spacegraph.space2d.container.collection.MutableArrayContainer;
import spacegraph.space2d.widget.Widget;
import spacegraph.space2d.widget.button.CheckBox;
import spacegraph.space2d.widget.button.PushButton;

/**
 * Splits a surface into a top and bottom or left and right sections
 */
public class Splitting<X extends Surface, Y extends Surface> extends MutableArrayContainer {


    /** TODO atomic */
    private float split = Float.NaN;

    /** TODO atomic */
    private boolean vertOrHoriz = true;

    private float minSplit = 0, maxSplit = 1;
    private float margin = 0.0125f;

    public Splitting() {
        this(null, 0.5f, null);
    }

    public Splitting(X top, float split, Y bottom) {
        super(null, null, null);
        set(top, split, bottom);
    }

    public Splitting(X top, float split, boolean vertOrHoriz, Y bottom) {
        this(top, split, bottom);
        direction(vertOrHoriz);
    }

    public final Splitting<X, Y> vertical() {
        return direction(true);
    }
    public final Splitting<X, Y> horizontal() {
        return direction(false);
    }

    public Splitting<X, Y> direction(boolean vertOrHoriz) {
        boolean w = this.vertOrHoriz;
        if (w != vertOrHoriz) {
            this.vertOrHoriz = vertOrHoriz;
            layout();
        }
        return this;
    }


    public Splitting<X, Y> split(float split) {
        float s = this.split;
        if (!Util.equals(s, Spatialization.EPSILON)) {
            this.split = split;
            layout();
        }
        return this;
    }

    public Splitting<X, Y> set(X top, float split, Y bottom) {
        split(split);
        T(top);
        B(bottom);
        return this;
    }

    @Nullable public Surface resizer() {
        return get(2);
    }

    @Override
    public void doLayout(float dtS) {

        Surface bot = B(), top = T();
        Surface resizer = this.resizer();

        if (top != null && bot != null /*&& a.visible() && b.visible()*/) {

            float X = x(), Y = y(), h = h(), w = w();

            float x2 = X + w;
            float y2 = Y + h;
            if (vertOrHoriz) {

                float Ysplit = Y + split * h;


                top.pos(RectF.XYXY(X, Ysplit, x2, y2));
                bot.pos(RectF.XYXY(X, Y, x2, Ysplit));

                if (resizer != null) {
                    resizer.pos(RectF.XYXY(
                            X, Ysplit - margin / 2 * h,
                            x2, Ysplit + margin / 2 * h));
                }
            } else {
                float Xsplit = X + split * w;

                top.pos(RectF.XYXY(X, Y, Xsplit, y2));
                bot.pos(RectF.XYXY(Xsplit, Y, x2, y2));

                if (resizer != null) {
                    float m = margin / 2 * w;
                    resizer.pos(RectF.XYXY(
                    Xsplit - m, Y,
                    Xsplit + m, y2));
                }
            }

            if (resizer!=null) resizer.show();
            top.show();
            bot.show();

        } else {
            if (resizer != null) resizer.hide();
            if (top != null /*&& top.visible()*/) {
                top.pos(bounds);
                top.show();
            } else if (bot != null /*&& bot.visible()*/) {
                bot.pos(bounds);
                bot.show();
            }
        }


    }

    public Splitting margin(float m) {
        margin = m;
        return this;
    }

    @Override
    public int childrenCount() {
        return 2;
    }

    public final Splitting<X, Y> T(X s) {
        setAt(0, s);
        return this;
    }

    public final Splitting<X, Y> B(Y s) {
        setAt(1, s);
        return this;
    }

    public final Splitting<X, Y> L(X s) {
        T(s);
        return this;
    }

    public final Splitting<X, Y> R(Y s) {
        B(s);
        return this;
    }

    public final X T() {
        return (X) get(0);
    }

    public final Y B() {
        return (Y) get(1);
    }

    public final X L() {
        return T();
    }

    public final Y R() {
        return B();
    }


    public Splitting resizeable() {
        return resizeable(0.1f, 0.9f);
    }

    public Splitting resizeable(float minSplit, float maxSplit) {
        this.minSplit = minSplit;
        this.maxSplit = maxSplit;
        synchronized (this) {
            if (this.resizer() == null)
                setAt(2, new ResizeBar()); //TODO
        }
        return this;
    }

    /**
     * TODO button to toggle horiz/vert/auto and swap
     */
    private class Resizer extends Widget {
        final SurfaceDragging drag = new SurfaceDragging(this, 0) {

            @Override
            public FingerRenderer renderer(Finger finger) {
                return vertOrHoriz ? FingerRenderer.rendererResizeNS : FingerRenderer.rendererResizeEW;
            }


            @Override
            public boolean drag(Finger f) {
                focus();
                v2 b = f.posRelative(Splitting.this);
                float pct = vertOrHoriz ? b.y : b.x;
                split(Util.clamp(pct, minSplit, maxSplit));
                return true;
            }

        };

        {
            color.set(0.1f, 0.1f, 0.1f, 0.5f);
        }

        @Override
        public Surface finger(Finger f) {
            f.test(drag);
            return this;
        }
    }

    private class ResizeBar extends Bordering {

        final Surface hv = new CheckBox("*").set(vertOrHoriz).on((BooleanProcedure)
                (Splitting.this::direction));

        final PushButton swap = new PushButton("<->").clicked(() -> {
            //synchronized (Splitting.this) {
            X a = Splitting.this.L();
            if (a != null) {
                Y b = Splitting.this.R();
                if (b != null) {
                    if (children.compareAndSet(0, a, b)) {
                        children.setOpaque(1, a);
                    }
                }
            }

        });

        ResizeBar() {
            set(new Resizer());
        }

        @Override
        protected void doLayout(float dtS) {
            if (vertOrHoriz) {
                north(null);
                south(null);
                east(hv);
                west(swap);
            } else {
                east(null);
                west(null);
                north(hv);
                south(swap);
            }

            super.doLayout(dtS);
        }
    }


}
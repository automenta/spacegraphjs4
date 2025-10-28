package spacegraph.space2d.widget.text;

import com.jogamp.opengl.GL2;
import jcog.tree.rtree.rect.RectF;
import spacegraph.space2d.Surface;
import spacegraph.space2d.container.Splitting;
import spacegraph.space2d.container.Stacking;
import spacegraph.space2d.container.unit.AspectAlign;
import spacegraph.space2d.widget.Widget;
import spacegraph.video.ImageTexture;

public class Labelling extends Splitting {

    public Labelling(Surface label, Surface content) {
        super(label, 0.95f, content);
    }

    public static Surface awesome(Surface x, String icon) {
        return new Stacking(x, ImageTexture.awesome(icon).view(1));
    }

    public static Surface the(String label, Surface content) {
        assert(content!=null);

        Surface s, labelSurface;
        if (label.isEmpty()) {
            s = content;
            labelSurface = null;
        } else {
            s = new Labelling(labelSurface = new BitmapLabel(label).align(AspectAlign.Align.LeftCenter), content);
        }

        return s instanceof Widget ? s : new Widget(s) {
            @Override protected void paintWidget(RectF bounds, GL2 gl) {
                super.paintWidget(
                    labelSurface == null ? bounds : labelSurface.bounds
                , gl);
            }
        };
    }

//    @Override
//    protected void paintIt(GL2 gl, ReSurface r) {
//        super.paintIt(gl, r);
//    }
//
//    @Override
//    public Surface finger(Finger finger) {
//        Surface s = super.finger(finger);
//        if (s == this)
//
//        return s;
//    }
}
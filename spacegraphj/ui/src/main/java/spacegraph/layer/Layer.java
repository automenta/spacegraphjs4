package spacegraph.layer;

import com.jogamp.opengl.GL2;
import jcog.signal.meter.SafeAutoCloseable;

/** a top-level render stage */
public sealed interface Layer extends SafeAutoCloseable permits AbstractLayer {
    void init(GL2 gl);

    void render(long startNS, float dtS, GL2 gl);

    void visible(boolean b);

    /** return whether the layer has changed and needs re-rendered */
    boolean changed();
}
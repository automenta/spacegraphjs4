package spacegraph.input.finger.impl;

import spacegraph.input.finger.Finger;
import spacegraph.input.finger.Fingering;
import spacegraph.space2d.Surface;

import java.util.function.Function;

public abstract class MouseFinger extends Finger {

    protected MouseFinger(int buttons) {
        super(buttons);
    }

    /** called for each layer. returns true if continues down to next layer*/
    protected Surface finger(Function<Finger, Surface> s) {

        posGlobal.set(posPixel); //HACK

        Fingering ff = this.fingering.get();

        Surface touchNext;
        try {
            touchNext = s.apply(this);
        } catch (RuntimeException e) {
            touchNext = null;
            e.printStackTrace(); //TODO
        }

        //touching.accumulateAndGet(touchNext, ff::touchNext);
        touching.set(ff.touchNext(touching.get(), touchNext));

        commitButtons();
        clearRotation();

        return touchNext;
    }

    @Override
    public Surface cursorSurface() {
        return new CursorSurface(this);
    }

    static final int MAX_BUTTONS = 9;

}
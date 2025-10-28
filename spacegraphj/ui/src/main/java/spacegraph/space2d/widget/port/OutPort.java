package spacegraph.space2d.widget.port;

import org.jetbrains.annotations.Nullable;
import spacegraph.space2d.widget.port.util.Wiring;


/** output only port */
public class OutPort extends Port {
    @Override
    public boolean onWireIn(@Nullable Wiring w, boolean preOrPost) {
        if (preOrPost) {
            if (w.start instanceof OutPort) {
                return false;
            }
        }
        return super.onWireIn(w, preOrPost);
    }
}

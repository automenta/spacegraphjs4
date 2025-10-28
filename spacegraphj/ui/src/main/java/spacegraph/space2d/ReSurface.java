package spacegraph.space2d;

import com.jogamp.opengl.GL2;
import com.jogamp.opengl.fixedfunc.GLMatrixFunc;
import jcog.Research;
import jcog.data.list.Lst;
import jcog.math.v2;
import jcog.tree.rtree.rect.RectF;
import spacegraph.space2d.hud.Zoomed;
import spacegraph.video.JoglWindow;

import java.util.function.DoubleConsumer;

import static com.jogamp.opengl.fixedfunc.GLMatrixFunc.GL_PROJECTION;

/** surface rendering context */
public class ReSurface extends SurfaceCamera {

    private final Lst<SurfaceCamera> stack = new Lst();

    public float minVisibilityPixelPct =
            //0.5f;
            1;

    /** time since last frame (seconds) */
    public float frameDT;

    /** can be used to calculate frame latency */
    public float frameDTideal;

    /** load metric as a temporal level-of-detail (QoS criteria)
     *    (0 = perfectly on-time, >= 1  stalled )
     *  TODO use EWMA
     */
    @Research
    public final DoubleConsumer load =
            null; //new FloatAveragedWindow(3, 0.5f);


    public long frameNS;


    public transient GL2 gl;

//    @Deprecated private boolean scaleChanged;

    /** cached pixel to surface scale factor */
    public transient float psw;
    public transient float psh;

    /** ortho restart */
    public ReSurface start(float pw, float ph, @Deprecated long startNS, float dtS, float fps, GL2 gl) {
        assert(pw >= 1 && ph >= 1);

        this.frameNS = startNS;
        this.frameDTideal = (float) (1.0/ Math.max(1.0E-9, fps));
        this.gl = gl;
        this.pw = pw;
        this.ph = ph;

        this.frameDT = dtS;

        if (load!=null)
            this.load.accept( Math.max((float) 0, dtS - frameDTideal) / frameDTideal );

        set(pw/2, ph/2, 1, 1);
        return this;
    }

    public ReSurface set(Zoomed.Camera cam, v2 scale) {
        return set(cam.x, cam.y, scale.x, scale.y);
    }

    public ReSurface set(float cx, float cy, float sx, float sy) {

        this.scaleX = sx;
        float sxw = (this.w = pw / sx)/2;
        this.x1 = cx - sxw;
        this.x2 = cx + sxw;
        this.psw = sx;

        this.scaleY = sy;
        float syh = (this.h = ph / sy)/2;
        this.y1 = cy - syh;
        this.y2 = cy + syh;
        this.psh = sy;

        return this;
    }

    public RectF pixelVisible() {
        return RectF.XYXY(0, 0, pw, ph);
    }

    /**
     * surface visibility by camera bounds
     */
    public final boolean isVisible(RectF bounds) {
        return bounds.intersects(RectF.XYXY(x1, y1, x2, y2));
    }

    /**
     * surface visibility by pixels
     */
    public final boolean isVisiblePixels(RectF bounds) {
        // Check pixel visibility
        float minPixels = minVisibilityPixelPct;
        float widthPixels = bounds.w * psw;
        float heightPixels = bounds.h * psh;
        return widthPixels >= minPixels && heightPixels >= minPixels;
    }

    /**
     * Calculates the visible percentage of a surface
     * @param bounds the surface bounds to check
     * @param minPixelsToBeVisible minimum required pixels for visibility
     * @return visible percentage (0 if not visible)
     */
    public final float visiblePercentage(RectF bounds, float minPixelsToBeVisible) {
        if (!isVisible(bounds))
            return 0;

        float widthPixels = bounds.w * psw;
        float heightPixels = bounds.h * psh;

        if (widthPixels < minPixelsToBeVisible || heightPixels < minPixelsToBeVisible) {
            return 0;
        } else {
            return Math.min(widthPixels, heightPixels);
        }

    }

    public final float visP(RectF bounds, float minPixelsToBeVisible) {
        float p = bounds.w * psw;
        if (p < minPixelsToBeVisible) return 0;

        float q = bounds.h * psh;
        if (q < minPixelsToBeVisible) return 0;

        return Math.min(p, q);
    }

    private boolean isVis(RectF bounds, float minPixelsToBeVisible) {
        return bounds.w >= minPixelsToBeVisible / psw &&
                bounds.h >= minPixelsToBeVisible / psh;
    }


    public void push(Zoomed.Camera cam, v2 scale) {
        SurfaceCamera prev = clone();
        stack.add(prev);
        set(cam, prev.scaleX!=1 || prev.scaleY!=1 ?
            scale.scaleClone(prev.scaleX, prev.scaleY) :
            scale);
    }

    public void pop() {
        set(stack.removeLast());
    }

    public void end() {
        gl = null;
    }

// Deprecated viewOrtho method - removed
//
//    public void viewVolume(RectF s) {
//        float l = s.left();
//        float b = s.bottom();
//        float px1 = ((l - x1) * scaleX);
//        float py1 = ((b - y1) * scaleY);
//        float px2 = ((l - x1 + s.w) * scaleX);
//        float py2 = ((b - y1 + s.h) * scaleY);
//        gl.glViewport(round(s.x), round(s.y), round(px2 - px1), round(py2 - py1));
//    }

    /**
     * Prepares the OpenGL context for rendering
     * @param w the JoglWindow to render to
     * @param root the root surface to render
     */
    private void setupRenderContext(JoglWindow w, Surface root) {
        int W = w.W(), H = w.H();
        this.pw = W;
        this.ph = H;
        this.x1 = this.y1 = 0;
        this.x2 = root.w();
        this.y2 = root.h();

        var gl = w.gl;
        gl.glViewport(0, 0, W, H);
        gl.glMatrixMode(GL_PROJECTION);
        gl.glLoadIdentity();
        gl.glOrtho(0, W, 0, H, -1.5, 1.5);
        gl.glMatrixMode(GLMatrixFunc.GL_MODELVIEW);
    }

    /**
     * Renders the surface hierarchy
     * @param root the root surface to render
     * @param w the JoglWindow to render to
     * @param startNS the start time in nanoseconds
     * @param dtS the delta time in seconds
     */
    public final void render(Surface root, JoglWindow w, long startNS, float dtS) {
        setupRenderContext(w, root);
        start(w.W(), w.H(), startNS, dtS, w.renderFPS, w.gl);
        try {
            root.renderIfVisible(this);
        } finally {
            end();
        }
    }

}
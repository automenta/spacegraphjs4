package spacegraph.video;

import com.jogamp.newt.event.KeyListener;
import com.jogamp.newt.event.WindowEvent;
import com.jogamp.newt.event.WindowListener;
import com.jogamp.newt.event.WindowUpdateEvent;
import com.jogamp.newt.opengl.GLWindow;
import com.jogamp.opengl.*;
import jcog.Log;
import jcog.Util;
import jcog.data.list.FastCoWList;
import jcog.data.map.ConcurrentFastIteratingHashSet;
import jcog.event.ListTopic;
import jcog.event.Off;
import jcog.event.Topic;
import jcog.signal.meter.SafeAutoCloseable;
import jcog.util.ArrayUtil;
import org.jctools.queues.MpscUnboundedArrayQueue;
import org.slf4j.Logger;
import spacegraph.UI;
import spacegraph.layer.Layer;
import spacegraph.util.animate.Animated;
import spacegraph.video.font.HersheyFont;

import java.util.Collection;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

import static com.jogamp.opengl.GL.GL_COLOR_BUFFER_BIT;
import static com.jogamp.opengl.GL.GL_DEPTH_BUFFER_BIT;


public class JoglWindow implements GLEventListener, WindowListener {

    static {
        System.setProperty("java.awt.headless", "true"); //HACK
    }

    public static final Logger logger = Log.log(JoglWindow.class);
    private static final Collection<JoglWindow> windows = new ConcurrentFastIteratingHashSet<>(new JoglWindow[0]);
    private static GLCapabilitiesImmutable config;

    static {
        Util.time("GLCapabilities", logger, () -> {

            var c = new GLCapabilities(
                GLProfile.getDefault()
                //GLProfile.getMaximum(true)
                //GLProfile.getGL2GL3()
            );

            c.setStencilBits(1);
            c.setSampleBuffers(true);
            c.setNumSamples(2);
//		c.setAlphaBits(4);

            config = c;
        });

    }

    public final Topic<JoglWindow> eventClosed = new ListTopic<>();

    public final Topic<JoglWindow> onUpdate = new ListTopic<>();

    /**
     * render loop
     */
    private final MyAnimator animator;

    private final AtomicBoolean
        posChange = new AtomicBoolean(false),
        sizeChange = new AtomicBoolean(false);

    public GLWindow window;
    public GL2 gl;

    /**
     * update time since last cycle (S)
     */
    public float dtS = 0;
    public float renderFPS = UI.FPS_default;
    private long lastRenderNS = System.nanoTime();

    private int nx = -1, ny = -1, nw = -1, nh = -1;

    private final AtomicBoolean changed = new AtomicBoolean(true);

    private final FastCoWList<Layer> layers = new FastCoWList<>(Layer.class);

    public JoglWindow() {
        window = GLWindow.create(config);
        window.addWindowListener(this);
        window.addGLEventListener(this);
        window.setAutoSwapBufferMode(false);

        animator = new JoglWindowAnimator(UI.FPS_init);
    }

    public JoglWindow(int pw, int ph) {
        this();
        if (pw > 0 && ph > 0)
            showInit(pw, ph);
    }

    private void display(List<GLAutoDrawable> drawables) {
        updateWindow();

        var d = drawables.isEmpty() ? null : drawables.getFirst();
        if (d != null)
            d.display();
    }

    private void updateWindow() {
        dtS = (float) animator.loop.cycleTimeS; //HACK

        onUpdate.accept(JoglWindow.this);

        var w = window;
        if (Util.next(posChange))
            w.setPosition(nx, ny);
        if (Util.next(sizeChange))
            w.setSurfaceSize(nw, nh);
    }

    public void off() {
        var w = this.window;
        if (w != null)
            w.destroy();

        this.window = null;
        this.gl = null;
    }

    public void printHardware() {
        System.err.print("GL:");
        System.err.println(gl);
        System.err.print("GL_VERSION=");
        System.err.println(gl.glGetString(GL.GL_VERSION));
        System.err.print("GL_EXTENSIONS: ");
        System.err.println(gl.glGetString(GL.GL_EXTENSIONS));
    }

    /** width in pixels */
    public final int W() {
        return window.getSurfaceWidth();
    }

    /** height in pixels */
    public final int H() {
        return window.getSurfaceHeight();
    }

    @Override
    public void dispose(GLAutoDrawable arg0) {
        animator.loop.stop();
    }

    @Override
    public void windowResized(WindowEvent windowEvent) {
        this.nw = W();
        this.nh = H();
        changed();
    }

    private void changed() {
        changed.set(true);
    }

    @Override
    public void windowMoved(WindowEvent windowEvent) {
        this.nx = getX();
        this.ny = getY();
    }

    @Override
    public void windowDestroyNotify(WindowEvent windowEvent) {
        animator.stop();
        eventClosed.accept(this);

        layers.forEach(SafeAutoCloseable::close);
        layers.clear();
    }

    @Override
    public void windowDestroyed(WindowEvent windowEvent) {
        windows.remove(this);
    }

    @Override
    public void windowGainedFocus(WindowEvent windowEvent) {
        animator.loop.fps(renderFPS);
    }

    @Override
    public void windowLostFocus(WindowEvent windowEvent) {
        animator.loop.fps(UI.renderFPSUnfocusedRate * renderFPS);
    }

    @Override
    public void windowRepaint(WindowUpdateEvent windowUpdateEvent) {

    }

    private static void clear(GL2 gl) {
        //clearMotionBlur(0.5f, gl);
        clearComplete(gl);
    }

    protected static void clearComplete(GL2 gl) {
        gl.glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    }

    private static void clearMotionBlur(float rate /* TODO */, GL2 gl) {


        gl.glAccum(GL2.GL_LOAD, 0.5f);

        gl.glAccum(GL2.GL_ACCUM, 0.5f);


        gl.glAccum(GL2.GL_RETURN, rate);
        gl.glClear(GL2.GL_DEPTH_BUFFER_BIT);


    }

    private final MpscUnboundedArrayQueue<Runnable> runLater =
            new MpscUnboundedArrayQueue(4);
            //new ConcurrentLinkedQueue<>();

    public void runLater(Runnable r) {
        runLater.add(r);
    }

    @Override
    public final void display(GLAutoDrawable drawable) {
        var nowNS = System.nanoTime();
        this.lastRenderNS = nowNS;

        runLater.drain(Runnable::run);

        if (this.changed.getAndSet(false) || layersChanged())
            redisplay(nowNS);
    }

    private boolean layersChanged() {
        for (var l : layers)
            if (l.changed())
                return true;
        return false;
    }

    private void redisplay(long nowNS) {
        clear(gl); //TODO move out to top level so its once

        var renderDtNS = nowNS - lastRenderNS;
        var dtS = (float) (renderDtNS / 1.0E9);

        for (var l : layers)
            l.render(nowNS, dtS, gl);

        //window.swapBuffers();
        window.getDelegatedDrawable().swapBuffers();

        //gl.glFlush();  //<- not helpful
        //gl.glFinish(); //<- not helpful
    }

    @Override
    public void reshape(GLAutoDrawable drawable, int x, int y, int width, int height) {

    }

    public void showInit(int w, int h) {
        showInit("", w, h);
    }

    private void showInit(String title, int w, int h, int x, int y) {
        var W = this.window;

        this.nw = w; this.nh = h; //HACK
        W.setSurfaceSize(w, h); //force init

        if (x != Integer.MIN_VALUE) {
            this.nx = x; this.ny = y; //HACK
            W.setPosition(x, y);
        }

        W.setTitle(title);

        W.setVisible(false, true);
    }

    public void isVisible(boolean b) {
        layers.forEach(l -> l.visible(b));
//        if (!b) {
//            setSize(0, 0);
//        } else {
//            setSize(Math.max(1, getWidth()), Math.max(1, getHeight()));
//        }
    }

    public void setPosition(int x, int y) {
        synchronized(posChange) {
            if (nx != x || ny != y) {
                nx = x;
                ny = y;
                Util.once(posChange);
            }
        }
    }

    public void setSize(int w, int h) {
        synchronized(sizeChange) {
            if (nw != w || nh != h) {
                nw = w;
                nh = h;
                sizeChange.setRelease(true);
            }
        }
    }

    @Override
    public void init(GLAutoDrawable drawable) {

        var gl = this.gl = drawable.getGL().getGL2();
        windows.add(this);

        gl.setSwapInterval(
            gl.getGLProfile().isHardwareRasterizer() ?
                0 :
                2 //lower framerate
        );

        HersheyFont.load(gl);


        //ready
        animator.add(window);
        setFPS(renderFPS);
    }

    public void setFPS(float render) {
        animator.loop.fps(renderFPS = render);
    }

    private void showInit(String title, int w, int h) {
        showInit(title, w, h, Integer.MIN_VALUE, Integer.MIN_VALUE);
    }

    public void addKeyListener(KeyListener m) {
        if (ArrayUtil.indexOf(window.getKeyListeners(), m) == -1)
            window.addKeyListener(m);
    }

    public Off onUpdate(Consumer<JoglWindow> c) {
        return onUpdate.on(c);
    }

    public Off onUpdate(Animated c) {
        return onUpdate.on(s -> c.animate(dtS));
    }

    public Off onUpdate(Runnable c) {
        return onUpdate.on(s -> c.run());
    }

    /**
     * x-pixel coordinate of window left edge
     */
    public int getX() {
        return window.getX();
    }

    /**
     * y-pixel coordinate of window top edge.
     * note: this is the reverse direction of the generally-expected cartesian upward-pointing y-axis
     */
    public int getY() {
        return window.getY();
    }

    public float getScreenW() {
        return window.getScreen().getWidth();
    }

    public float getScreenH() {
        return window.getScreen().getHeight();
    }

    /**
     * min dimension
     */
    public float getWidthHeightMin() {
        return Math.min(W(), H());
    }


    public boolean add(Layer l) {
        synchronized(layers) {
            if (layers.containsInstance(l))
                return false;

            l.init(gl);

            layers.add(l);
        }

        return true;
    }

    public boolean remove(Layer l) {
        return layers.remove(l);
    }

    private boolean wasVisible;

    private final class JoglWindowAnimator extends MyAnimator {

        JoglWindowAnimator(float FPS_init) {
            super(FPS_init);
        }

        @Override protected void run() {
            var visible = isVisible();

            if (wasVisible!=visible)
                JoglWindow.this.isVisible(visible);

            if (visible)
                JoglWindow.this.display(drawables);

            wasVisible = visible;
        }

        private boolean isVisible() {
            var w = window;
            return w!=null && w.isVisible();
        }

    }
}
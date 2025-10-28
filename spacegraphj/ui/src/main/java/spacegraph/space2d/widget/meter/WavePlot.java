package spacegraph.space2d.widget.meter;

import jcog.Util;
import jcog.signal.ITensor;
import jcog.signal.buffer.CircularFloatBuffer;
import jcog.tree.rtree.rect.RectF;
import spacegraph.space2d.MenuSupplier;
import spacegraph.space2d.ReSurface;
import spacegraph.space2d.Surface;
import spacegraph.space2d.container.grid.Gridding;
import spacegraph.space2d.container.time.Timeline2D;
import spacegraph.space2d.widget.button.PushButton;

import java.awt.*;
import java.awt.image.BufferedImage;

import static java.awt.BasicStroke.CAP_ROUND;
import static java.awt.BasicStroke.JOIN_MITER;
import static jcog.Util.unitizeSafe;

/** TODO refactor as a Container for the Bitmap matrix */
public class WavePlot extends Surface implements BitmapMatrixView.BitmapPainter, MenuSupplier, Timeline2D.TimeRangeAware {

//    public final FloatRange alpha = new FloatRange(0.75f, 0.01f, 1.0f);

    boolean drawModeBarsOrLine = false;
    private Color color = Color.getHSBColor((float)Math.random(), 0.5f, 1);
    private float strokeWidth = 1.5f;

    private final int w, h;

    @Deprecated @FunctionalInterface
    public interface WaveEvaluator {
        /** mean amplitude of the given time range */
        float amplitude(double start, double end);
    }

    protected final WaveEvaluator buffer;


    public transient float yMin;
    public transient float yMax;
    private transient BitmapMatrixView bmp;
    private transient Graphics2D gfx;

    volatile boolean update = true;

    /**
     * visualization bounds
     */
    public long start, end;


    public WavePlot(int w, int h, WaveEvaluator buffer) {
        this.w = w;
        this.h = h;
        this.yMin = -1;
        this.yMax = +1;
        this.buffer = buffer;
        this.start = 0;
        this.end = 1;
        update();
    }

    public WavePlot(ITensor wave, int start, int end, int pixWidth, int pixHeight) {
        this(pixWidth, pixHeight, (s,e)->{
            double ss = s, ee = e;
            double sum = Util.interpMean(wave::getAt, wave.volume(), ss, ee, false);
            return (float) sum;
        });
        setTime(start, end);
    }

    @Deprecated public WavePlot(CircularFloatBuffer wave, int pixWidth, int pixHeight) {
        this(pixWidth, pixHeight, (s,e)-> (float) wave.mean(s, e));
    }

    @Override
    public synchronized void setTime(long tStart, long tEnd) {
        if (update || tStart !=this.start || tEnd !=this.end) {
            this.start = tStart;
            this.end = tEnd;
            update = true;
        }
    }

    @Override
    protected void stopping() {
        if (gfx != null) {
            gfx.dispose();
            gfx = null;
        }
        if (bmp != null) {
            bmp.stop();
            bmp = null;
        }
        super.stopping();
    }

    @Override
    protected synchronized void render(ReSurface r) {
        if (bmp == null) {
            bmp = new BitmapMatrixView(w, h, this) {
                @Override public boolean alpha() {
                    return true;
                }
            };
            bmp.start(this);
        }

        if (update)
            update = !bmp.updateIfShowing(); //keep updating till updated


        bmp.pos(drawPosition()).renderIfVisible(r);
    }

    /** override to change draw position */
    protected RectF drawPosition() {
        return bounds;
    }

    public void update() {
        update = true;
    }

//    @Deprecated public void updateLive() {
//        updateLive(Integer.MAX_VALUE);
//    }

//    @Deprecated public void updateLive(int lastSamples) {
//        lastSamples = Math.min(buffer.capacity()-1, lastSamples);
//        setTime((this.end - lastSamples), buffer.bufEnd);
//    }


    private static final Color transparent = new Color(0, 0, 0, 0);


    @Override
    public void paint(BufferedImage buf, int[] pix) {

        if (gfx == null) {
            gfx = (Graphics2D) buf.getGraphics();
            gfx.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
//            ((Graphics2D)gfx).setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_OFF);
//            ((Graphics2D)gfx).setRenderingHint(RenderingHints.KEY_ALPHA_INTERPOLATION, RenderingHints.VALUE_ALPHA_INTERPOLATION_SPEED);
//            ((Graphics2D)gfx).setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_SPEED);
//            ((Graphics2D)gfx).setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_OFF);
//            ((Graphics2D)gfx).setRenderingHint(RenderingHints.KEY_DITHERING, RenderingHints.VALUE_DITHER_DISABLE);
        }

        gfx.setBackground(transparent);
        gfx.clearRect(0, 0, w, h);
        gfx.setColor(color);
        gfx.setStroke(new BasicStroke(
            strokeWidth
            ,CAP_ROUND,JOIN_MITER,10,null,0
        ));

        float minValue = this.yMin, maxValue = this.yMax;
        float yRange = yMax - yMin;

//        float yRange = ((maxValue) - (minValue));
        float yAbsRange = Math.max(Math.abs(maxValue), Math.abs(minValue));
        if (yAbsRange < Float.MIN_NORMAL) {
            //no signal
            //TODO display message
            return;
            //absRange = 1;
        }


        int w = this.w, h = this.h;
        long start = this.start, end = this.end;

        double dx = (end - start)/ (double)w;

        double sStart = start;
        int px = -1, py = -1;

        for (int x = 0; x < w; x++) {

            double sEnd = x < w-1 ? sStart + dx : end /* make up any lost fraction */;

            float amp = buffer.amplitude(sStart,sEnd);
            if (amp==amp) {
                amp = Util.clampSafe(amp, -1, +1);

                float intensity =
                        unitizeSafe(Math.abs(amp) / yAbsRange);

//            Draw.hsb(rgba, intensity, 0.9f, 0.1f*intensity + 0.9f, alpha);
                float ic = jcog.Util.fma(intensity, 0.9f, 0.1f);

                //float[] sc = s.color();
                //float iBase = Util.unitize(intensity / 2 + 0.5f);
                //gfx.setColor(new Color(sc[0] * iBase, sc[1] * iBase, sc[2] * iBase, alpha));


                double a = Util.normalizeRange(amp, yMin, yRange);

                if (drawModeBarsOrLine) {
                    int yMid = h / 2;
                    int sampleRadius = (int) (a * h/2);
                    //gfx.setColor(new Color(ic, 1 - ic, 0)); //R|G
                    gfx.drawLine(x, yMid - sampleRadius, x, yMid + sampleRadius);
                } else {
                    //gfx.setColor(Color.GRAY); //R|G
                    int nx = x;
                    int ny = (int) ((1-a) * h);
                    if (px < 0) {
                        //gfx.drawRect(x, (int) (a * h), 1, 1);
                    } else
                        gfx.drawLine(px, py, nx, ny);

                    px = nx;
                    py = ny;
                }
            }

            sStart = sEnd;
        }
    }

//    private float sampleX(int x, int w, int first, int last) {
//        return ((float) x) / w * (last - first) + first;
//    }

    @Override
    public Surface menu() {
        return new Gridding(
                PushButton.iconAwesome("play"),
                PushButton.iconAwesome("microphone"),
                PushButton.iconAwesome("save"), //remember
                PushButton.iconAwesome("question-circle") //recognize

                //TODO trim, etc
        );
    }

}
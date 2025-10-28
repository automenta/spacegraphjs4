package spacegraph.space2d.widget.meter;

import com.jogamp.common.nio.Buffers;
import com.jogamp.opengl.GL2;
import jcog.Str;
import jcog.Util;
import jcog.data.list.Lst;
import jcog.event.Off;
import jcog.math.CumulativeSum;
import jcog.signal.tensor.TensorRing;
import org.eclipse.collections.api.block.procedure.primitive.FloatProcedure;
import org.jetbrains.annotations.Nullable;
import spacegraph.space2d.ReSurface;
import spacegraph.space2d.container.Bordering;
import spacegraph.space2d.container.Stacking;
import spacegraph.space2d.container.grid.Gridding;
import spacegraph.space2d.container.unit.AspectAlign;
import spacegraph.space2d.widget.text.BitmapLabel;
import spacegraph.video.Draw;

import java.nio.FloatBuffer;
import java.util.function.DoubleSupplier;

/**
 * A single, consolidated 2D plotting widget that supports multiple data series,
 * multiple plot types (line, bar, XY, histogram), auto-ranging, titles, labels, etc.
 */
public final class Plot2D extends Stacking {

    private FloatBuffer b;

    /**
     * Types of plots supported by Plot2D.
     */
    public enum PlotType {
        LINE,
        BAR,
        XY,
        HISTOGRAM
    }

    /**
     * Configuration options for the plot (background color, line width, etc.).
     */
    public static final class PlotConfig {
        public final float[] backgroundColor = {0, 0, 0, 0.75f};
        public float lineWidth = 2f;
        public boolean showLabels = true;
        public boolean showMeanBar = true;

        public PlotConfig backgroundColor(float r, float g, float b, float a) {
            this.backgroundColor[0] = r;
            this.backgroundColor[1] = g;
            this.backgroundColor[2] = b;
            this.backgroundColor[3] = a;
            return this;
        }

        public PlotConfig lineWidth(float width) {
            this.lineWidth = width;
            return this;
        }

        public PlotConfig showLabels(boolean show) {
            this.showLabels = show;
            return this;
        }

        public PlotConfig showMeanBar(boolean show) {
            this.showMeanBar = show;
            return this;
        }

    }

    /**
     * Interface for data series to be plotted.
     */
    public interface Series {
        String name();
        void update();            // Called before plotting to fetch new data, if needed
        float maxValue();
        float minValue();
        float meanValue();
        float[] color();          // RGBA color
        int capacity();
        int size();
        float get(int i);         // i=0 is the oldest or newest sample, depending on implementation
        void clear();

        /**
         * Returns a [0..1] normalized value for the i-th data point, based on the
         * series minValue() and maxValue().
         */
        default float normalized(int i) {
            var val = get(i);
            float mn = minValue(), mx = maxValue();
            return mx == mn ? 0.5f : (val - mn) / (mx - mn);
        }

        default float normalizedMean() {
            return Util.normalize(meanValue(), minValue(), maxValue());
        }
    }

    /**
     * An abstract base that implements common auto-range logic.
     */
    public static abstract class AbstractSeries implements Series {
        private final AutoRange autoRange = new AutoRange();
        protected int capacity;
        protected transient float minValue, maxValue, meanValue;
        private String name;
        private final float[] color = {1, 1, 1, 0.75f}; // default color
        boolean autoMin = true, autoMax = true;

        protected final void setName(String name) {
            this.name = name;
            Draw.colorHash(name, color); // Use a hash-based color if desired:
        }

        @Override
        public String name() {
            return name;
        }

        @Override
        public float[] color() {
            return color;
        }

        @Override
        public float maxValue() {
            return maxValue;
        }

        @Override
        public float minValue() {
            return minValue;
        }

        @Override
        public float meanValue() {
            return meanValue;
        }

        @Override
        public int capacity() {
            return capacity;
        }

        /**
         * Called to recalc min/max/mean if you want auto-ranging.
         */
        public Series commit() {
            autoRange.restart();
            forEach(autoRange);
            if (autoRange.count == 0) {
                range(0, 0, 0); // No data
            } else {
                var mm = (float) (autoRange.sum / autoRange.count);
                if (autoMin || autoMax) {
                    float mn = autoRange.min, mx = autoRange.max;
                    range(autoMin ? mn : Float.NaN, autoMax ? mx : Float.NaN, mm);
                } else {
                    if (Float.isFinite(mm))
                        this.meanValue = mm;
                }
            }
            return this;
        }

        /**
         * Utility to set the series range (min, max, mean).
         */
        private Series range(float min, float max, float mean) {
            if (min==min) this.minValue = min;
            if (max==max) this.maxValue = max;
            this.meanValue = mean;
            return this;
        }

        /**
         * Visit each valid data value in the series.
         */
        public abstract void forEach(org.eclipse.collections.api.block.procedure.primitive.FloatProcedure f);

        private static final class AutoRange implements FloatProcedure {
            float min, max;
            double sum;
            int count;

            void restart() {
                min = Float.POSITIVE_INFINITY;
                max = Float.NEGATIVE_INFINITY;
                sum = 0;
                count = 0;
            }

            @Override
            public void value(float v) {
                if (!Float.isNaN(v)) {
                    if (v < min) min = v;
                    if (v > max) max = v;
                    sum += v;
                    count++;
                }
            }
        }
    }

    /**
     * Ring-buffer-based Series for efficient, fixed-size plotting.
     * Uses a TensorRing to store data in a circular fashion.
     */
    public static class RingSeries extends AbstractSeries {
        private final TensorRing data;

        public RingSeries(String name, int capacity) {
            this.capacity = capacity;
            data = new TensorRing(1, capacity);
            setName(name);
            clear();
        }

        /**
         * Add a new sample to the ring.
         */
        public void add(double v) {
            if (Double.isNaN(v)) return;
            data.setSpin((float) v);
        }

        @Override
        public float get(int i) {
            // We read in reverse: index 0 is the oldest or newest? Up to you.
            // Typically, "size()" is capacity, so you might prefer the newest
            // sample at the end. This returns data in chronological order
            // or reversed. Adjust as needed.
            return data.getAt(capacity - 1 - i);
        }

        @Override
        public void clear() {
            data.fillAll(Float.NaN);
        }

        @Override
        public int size() {
            // We keep a full ring, so "size" can be capacity or a partial fill.
            // If you want partial fill logic, you'd store a pointer of actual usage.
            return capacity;
        }

        @Override
        public void forEach(FloatProcedure f) {
            data.forEach(f);
        }

        @Override
        public void update() {
            // If you want to pull new data automatically, override this or feed externally.
        }
    }

    // --------------------------------------------------------------------------------
    // Internal Label Manager
    // --------------------------------------------------------------------------------

    private static final class PlotLabels extends Bordering {
        private final BitmapLabel min = new BitmapLabel();
        private final BitmapLabel mean = new BitmapLabel();
        private final BitmapLabel max = new BitmapLabel();
        private final Gridding seriesContainer;

        PlotLabels() {
            super();

            min.align(AspectAlign.Align.TopRight);
            mean.align(AspectAlign.Align.TopRight);
            max.align(AspectAlign.Align.TopRight);

            west(seriesContainer = new Gridding().vertical());
            borderWest = 1/3f;
            center(new Gridding(max, mean, min).vertical());
            borderEast = 1/3f;
        }

        public void updateSeriesLabels(Lst<Series> s) {
            if (s.size()!=seriesContainer.size()) {
                seriesContainer.clear();
                for (var x : s)
                    seriesContainer.add(new BitmapLabel());
            }
            var cc = seriesContainer.children();
            for (int i = 0, length = cc.length; i < length; i++) {
                var x = cc[i];
                var bl = (BitmapLabel) x;
                var si = s.get(i);
                bl.fgColor.set(si.color());
                bl.text(si.name()/* + " " + s.get(i).lastValue() */);
            }
        }

        public void updateRangeLabels(String minValueStr, String meanValueStr, String maxValueStr) {
            min.text(minValueStr);
            mean.text(meanValueStr);
            max.text(maxValueStr);
        }
    }

    private final Lst<Series> series = new Lst<>();
    private final PlotLabels labels = new PlotLabels();
    private final PlotConfig config;
    private final int maxHistory; // for convenience if you want to auto-create ring series
    private boolean invalid;  // Marks that we need to recalc or re-render

    private PlotType plotType = PlotType.LINE;

    private transient float minValue, meanValue, maxValue;
    private transient String minValueStr = "", meanValueStr = "", maxValueStr = "";

    @Nullable private Off on;

    public Plot2D(int maxHistory) {
        this(new PlotConfig(), maxHistory);
    }

    public Plot2D(PlotConfig config, int maxHistory) {
        super();
        this.config = config;
        this.maxHistory = maxHistory;
    }

    public final Plot2D type(PlotType plotType) {
        this.plotType = plotType;
        invalid = true;
        return this;
    }

    public PlotType getPlotType() {
        return plotType;
    }

    public Plot2D addSeries(Series s) {
        series.add(s);
        invalid = true;
        return this;
    }

    public Series addSeries(String name, float[] x) {
        addSeries(newSeries(name, x));
        return series.getLast();
    }

    public Plot2D addSeries(String name, DoubleSupplier f) {
        return addSeries(name, f, Float.NaN, Float.NaN);
    }

    /**
     * Convenience: add a new ring-based Series using a DoubleSupplier as data source.
     * If you have a min/max, you can clamp or simply rely on auto-range.
     */
    public Plot2D addSeries(String name, DoubleSupplier f, float min, float max) {
        var rs = new RingSeries(name, maxHistory) {
            @Override
            public void update() {
                add(f.getAsDouble());
                commit();
            }
        };
        rs.autoMin = min!=min;
        rs.autoMax = max!=max;
        if (!rs.autoMin) rs.minValue = min;
        if (!rs.autoMax) rs.maxValue = max;
        series.add(rs);
        invalid = true;
        return this;
    }

    /**
     * If you need to attach an external trigger to call update() or something else.
     * This is optional usage from your original code.
     */
    public Plot2D on(java.util.function.Function<Runnable, Off> trigger) {
        if (on != null) {
            on.close();
            on = null;
        }
        this.on = trigger.apply(this::markInvalid);
        return this;
    }

    /**
     * Mark that we need to recalc or re-render on next pass.
     */
    public void markInvalid() {
        invalid = true;
    }

    /**
     * Force an update pass (re-query Series data, recalc min/max, etc.).
     */
    public void update() {
        if (series.isEmpty()) {
            minValueStr = maxValueStr = meanValueStr = "";
            return;
        }

        float minVal = Float.POSITIVE_INFINITY, maxVal = Float.NEGATIVE_INFINITY;

        // Let each series update itself, gather min/max
        for (var s : series) {
            s.update();
            var mn = s.minValue();
            var mx = s.maxValue();
            if (Float.isFinite(mn) && mn < minVal) minVal = mn;
            if (Float.isFinite(mx) && mx > maxVal) maxVal = mx;
        }

        // Fallback if no valid data
        if (!Float.isFinite(minVal) || !Float.isFinite(maxVal)) {
            minValue = meanValue = maxValue = 0;
            minValueStr = meanValueStr = maxValueStr = "Inf";
        } else {
            minValue = minVal;
            maxValue = maxVal;
            minValueStr = Str.n4(minVal);
            if (series.size() == 1) {
                // For single series, also show mean in the max label
                meanValueStr = Str.n4(meanValue = series.getFirst().meanValue());
            } else {
                meanValueStr = "";
            }
            maxValueStr = Str.n4(maxVal);
        }

        var cc = children();
        if (cc.length == 0 || cc[cc.length-1]!=labels) {
            remove(labels);
            add(labels);
        }
    }

    // --------------------------------------------------------------------------------
    // Rendering
    // --------------------------------------------------------------------------------

    @Override
    protected void renderContent(ReSurface r) {
        if (invalid) {
            update();
            invalid = false;
        }

        // Draw the actual plot using normalized [0..1] bounds
        Draw.bounds(bounds, r.gl, this::paintPlot);

        // Update text labels for range and title
        if (config.showLabels) {
            labels.show();
            labels.updateSeriesLabels(series);
            labels.updateRangeLabels(minValueStr, meanValueStr, maxValueStr);
        } else
            labels.hide();

        // Render child widgets (labels, etc.)
        super.renderContent(r);
    }

    /**
     * Paint the plot in unit space ([0..1] in x and y).
     */
    private void paintPlot(GL2 gl) {
        // Background
        gl.glColor4fv(config.backgroundColor, 0);
        Draw.rect(gl, 0, 0, 1, 1);

        // Axis lines (top and bottom)
        gl.glColor4f(1, 1, 1, 1);
        gl.glLineWidth(config.lineWidth);
        Draw.linf(0, 0, 1, 0, gl);
        Draw.linf(0, 1, 1, 1, gl);

        // If there's no data, bail out
        if (series.isEmpty() || (minValue == maxValue))
            return;

        switch (plotType) {
            case LINE -> renderLinePlot(gl);
            case BAR -> renderBarPlot(gl);
            case XY -> renderXYPlot(gl);
            case HISTOGRAM -> renderHistogramPlot(gl);
        }
    }

    /**
     * Renders each series as a line plot across [0..1].
     */
    private void renderLinePlot(GL2 gl) {
        // We'll use a simple FloatBuffer approach (similar to old linePlotter) or immediate mode.
        // For each series, we draw a separate line strip.
        float min = Float.POSITIVE_INFINITY, max = Float.NEGATIVE_INFINITY;
        for (var s : series) {
            float smin = s.minValue(), smax = s.maxValue();
            min = Math.min(min, smin); max = Math.max(max, smax);
        }

        for (var s : series) {
            renderLinePlot(gl, s, min, max);

            // Optionally draw a mean bar
            if (config.showMeanBar) {
                var meanNorm = Util.normalize(s.meanValue(), min, max);
                var color = s.color();
                gl.glColor4f(color[0], color[1], color[2], 0.5f);
                var barHeight = 0.02f; // as fraction of total
                Draw.rect(0f, meanNorm - barHeight / 2, 1f, barHeight, gl);
            }

//            // If label is wanted on the right
//            if (config.showLabels) {
//                // You can place series name at the last sample's position, for instance:
//                var name = s.name();
//                var yLast = s.normalized(sz - 1);
//                HersheyFont.hersheyText(
//                        gl, name, 0.03f, 1f, yLast, 0, Draw.TextAlignment.Right);
//            }
        }
    }
    private void renderLinePlot(GL2 gl, Series s, float min, float max) {
        int sz = s.size();
        if (sz < 2)
            return;

        int bCap = sz*2;
        if (b == null || b.capacity() < bCap) b = Buffers.newDirectFloatBuffer(bCap);
        else b.clear();

        float szMin1 = sz - 1f;
        int index = 0;
        for (int i = 0; i < sz; i++) {
            float v = s.get(i);
            if (v==v)
                b.put(new float[] {
                    i / szMin1,Util.normalize(v, min, max)
                });
        }

        int validSz = b.position() / 2;
        if (validSz < 2)
            return;

        gl.glColor4fv(s.color(), 0);

        gl.glEnableClientState(GL2.GL_VERTEX_ARRAY);

        gl.glVertexPointer(2, GL2.GL_FLOAT, 0, b.flip());

        gl.glDrawArrays(GL2.GL_LINE_STRIP, 0, validSz);

        gl.glDisableClientState(GL2.GL_VERTEX_ARRAY);
    }

//    private static void renderLinePlot(GL2 gl, Series s, float min, float max) {
//        var sc = s.color();
//        gl.glColor4fv(sc, 0);
//
//        var sz = s.size();
//        float SZmin1 = (sz - 1);
//
//        gl.glBegin(GL2.GL_LINE_STRIP);
//        for (var i = 0; i < sz; i++) {
//            var v = s.get(i);
//            if (v==v) {
//                var x = i / SZmin1;
//                var y = Util.normalize(v, min, max);
//                gl.glVertex2f(x, y);
//            }
//        }
//        gl.glEnd();
//    }

    /**
     * Renders each series as a "bar wave" across [0..1].
     */
    private void renderBarPlot(GL2 gl) {
        float min = Float.POSITIVE_INFINITY, max = Float.NEGATIVE_INFINITY;
        for (var s : series) {
            float smin = s.minValue(), smax = s.maxValue();
            min = Math.min(min, smin); max = Math.max(max, smax);
        }
        for (var s : series)
            renderBarPlot(gl, s, min, max);
    }

    private void renderBarPlot(GL2 gl, Series s, float min, float max) {
        var sz = s.size();
        var dx = 1f / sz;

        var bCap = s.capacity() * 4 * 2;
        if (b == null || b.capacity() < bCap) b = Buffers.newDirectFloatBuffer(bCap); // 4 vertices per quad, 2 coordinates each
        else b.clear();

        for (var i = 0; i < sz; i++) {
            var x1 = i * dx;
            var x2 = x1 + dx;
            var si = s.get(i);
            if (si==si) {
                var y = Util.normalize(si, min, max);
                b.put(new float[]{
                    x1, 0,
                    x2, 0,
                    x2, y,
                    x1, y
                });
            }
        }
        b.flip();

        // Generate and bind VBO
        var vbo = new int[1];
        gl.glGenBuffers(1, vbo, 0);
        gl.glBindBuffer(GL2.GL_ARRAY_BUFFER, vbo[0]);
        gl.glBufferData(GL2.GL_ARRAY_BUFFER, b.capacity() * Float.BYTES, b, GL2.GL_STATIC_DRAW);

        // Set color once
        gl.glColor4fv(s.color(), 0);

        // Enable and specify pointer to vertex data
        gl.glEnableClientState(GL2.GL_VERTEX_ARRAY);
        gl.glVertexPointer(2, GL2.GL_FLOAT, 0, 0);

        gl.glDrawArrays(GL2.GL_QUADS, 0, sz * 4);

        // Disable client state and unbind VBO
        gl.glDisableClientState(GL2.GL_VERTEX_ARRAY);
        gl.glBindBuffer(GL2.GL_ARRAY_BUFFER, 0);

        // Optionally delete VBO if not reused
        gl.glDeleteBuffers(1, vbo, 0);
    }

//    private static void renderBarPlot(GL2 gl, Series s, float min, float max) {
//        var sz = s.size();
//        var dx = 1f / sz;
//        gl.glColor4fv(s.color(), 0);
//
//        gl.glBegin(GL2.GL_QUADS);
//        for (var i = 0; i < sz; i++) {
//            var x1 = i * dx;
//            var x2 = x1 + dx;
//
//            var si = s.get(i);
//            if (si==si) {
//                var y = Util.normalize(si, min, max);
//                // Bottom and top
//                gl.glVertex2f(x1, 0);
//                gl.glVertex2f(x2, 0);
//                gl.glVertex2f(x2, y);
//                gl.glVertex2f(x1, y);
//            }
//        }
//        gl.glEnd();
//    }

    /**
     * Renders an XY plot using the first two series as X and Y.
     * If more than 2 series are present, only the first two are used.
     */
    private void renderXYPlot(GL2 gl) {
        if (series.size() != 2)
            throw new UnsupportedOperationException();

        var sx = series.get(0);
        var sy = series.get(1);

        gl.glColor4fv(sx.color(), 0);
        gl.glBegin(GL2.GL_LINE_STRIP);
        float minX = sx.minValue(), maxX = sx.maxValue();
        float minY = sy.minValue(), maxY = sy.maxValue();
        var n = Math.min(sx.size(), sy.size());
        for (var i = 0; i < n; i++)
            gl.glVertex2f(Util.normalize(sx.get(i), minX, maxX), Util.normalize(sy.get(i), minY, maxY));
        gl.glEnd();

//        // If label is wanted
//        if (config.showLabels) {
//            HersheyFont.hersheyText(gl,
//                    sx.name() + " vs. " + sy.name(), 0.03f, 1f, 1f, 0, Draw.TextAlignment.Right);
//        }
    }

    /**
     * Renders a histogram from each series, with a fixed number of bins.
     */
    private void renderHistogramPlot(GL2 gl) {
        // For simplicity, we'll do 32 bins for each series.
        final var BINS = 32;
        var binWidth = 1f / BINS;

        for (var s : series) {
            var minV = s.minValue();
            var maxV = s.maxValue();
            if (maxV <= minV) continue; // no data range
            var range = maxV - minV;

            // Compute histogram
            var histo = new float[BINS];
            var count = s.size();
            for (var i = 0; i < count; i++) {
                var val = s.get(i);
                if (Float.isNaN(val)) continue;
                var bin = (int) (BINS * (val - minV) / range);
                if (bin < 0) bin = 0;
                if (bin >= BINS) bin = BINS - 1;
                histo[bin]++;
            }

            // Normalize by total count
            for (var i = 0; i < BINS; i++)
                histo[i] /= count;

            // Draw
            gl.glColor4fv(s.color(), 0);
            gl.glBegin(GL2.GL_QUADS);
            for (var i = 0; i < BINS; i++) {
                var x1 = i * binWidth;
                var x2 = x1 + binWidth;
                var y = histo[i];
                gl.glVertex2f(x1, 0);
                gl.glVertex2f(x2, 0);
                gl.glVertex2f(x2, y);
                gl.glVertex2f(x1, y);
            }
            gl.glEnd();

//            // If label is wanted
//            if (config.showLabels) {
//                HersheyFont.hersheyText(gl, s.name() + " Hist", 0.03f, 1f, 1f, 0, Draw.TextAlignment.Right);
//            }
        }
    }

    public static Series newSeries(String name, float[] data) {
        var rs = new RingSeries(name, data.length);
        for (var f : data)
            rs.add(f);
        rs.commit();
        return rs;
    }

    @Override
    protected void stopping() {
        if (on != null) {
            on.close();
            on = null;
        }
        super.stopping();
    }


    public static CumulativeSum mean(DoubleSupplier o, int interval) {
        return new CumulativeSum(o, interval);
    }
}

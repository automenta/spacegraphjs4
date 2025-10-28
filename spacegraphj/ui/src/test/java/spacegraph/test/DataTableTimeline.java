package spacegraph.test;

import jcog.data.bit.MetalBitSet;
import jcog.data.list.Lst;
import jcog.signal.buffer.CircularFloatBuffer;
import spacegraph.space2d.ReSurface;
import spacegraph.space2d.Surface;
import spacegraph.space2d.container.Bordering;
import spacegraph.space2d.container.Splitting;
import spacegraph.space2d.container.grid.Gridding;
import spacegraph.space2d.container.time.Timeline2D;
import spacegraph.space2d.container.unit.AspectAlign;
import spacegraph.space2d.widget.button.CheckBox;
import spacegraph.space2d.widget.button.PushButton;
import spacegraph.space2d.widget.meter.WavePlot;
import spacegraph.space2d.widget.text.BitmapLabel;
import spacegraph.space2d.widget.text.Labelling;
import tech.tablesaw.api.NumericColumn;
import tech.tablesaw.api.Table;
import tech.tablesaw.io.csv.CsvReadOptions;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import static spacegraph.SpaceGraph.window;

public class DataTableTimeline extends Gridding {

    //WavePlot waveView[];

    private Table table;
    private Timeline2D<Gridding> l;
    MetalBitSet visible;

    public DataTableTimeline(Table t) {
        super(VERTICAL);

        clear();
        this.table = t;

        int colCount = t.columnCount();


        int range = 512;
        l = new Timeline2D<>(0, range, new Gridding().vertical());

//        List<WavePlot> waves = new Lst<>(colCount);

        visible = MetalBitSet.bits(colCount); visible.setAll(true);
//        for (int c = 0; c < colCount; c++) {
//            //waveView[c] = plot(c);
//        }

//        ((MutableContainer)l.the()).add(new Timeline2D.TimelineGrid());

        add(l.withControls());

        update();
    }

    private WavePlot plot(int c) {
        WavePlot w = new WavePlot(buffer(table.rowCount(), table.numberColumn(c)),
            //1024, 64
            512,16
        );
        w.yMin = 0; w.yMax = 1;
        return w;
    }

    public Surface controls() {
        Gridding cols = new Gridding().vertical();
        Lst<CheckBox> boxes = new Lst<>();
        int n = table.columnCount();
        for (int c = 0; c < n; c++) {
            int C = c;
            var l = new BitmapLabel(table.columnNames().get(c))
                    .align(AspectAlign.Align.LeftCenter);
            var b = new CheckBox(" ");
            b.set(visible.test(c)).on(v->{
                setVisible(C, v);
                update();
            });
            boxes.add(b);
            cols.add(new Splitting(b, 0.1f, l).horizontal());
        }
        var m = new Bordering();
        m.center(cols);
        m.north(new Gridding(
            new PushButton("All", ()->{
                for (var b : boxes) b.set(true);
                //for (int i = 0; i < n; i++) setVisible(i, true);
                //update();
            }),
            new PushButton("None", ()->{
                for (var b : boxes) b.set(false);
                //for (int i = 0; i < n; i++) setVisible(i, false);
                //update();
            }),
            new PushButton("Vis: tSNE", ()->{
                //TODO
            })
        ));
        return m;
    }

    private boolean update = false;

    public void update() {
        update = true;
    }

    @Override
    protected void renderContent(ReSurface r) {
        if (update) {
            update = false;
            _update();
        }
        super.renderContent(r);
    }

    public void _update() {
        synchronized (l) {
            List<String> cNames = table.columnNames();
            int colCount = table.columnCount();

            Gridding w = l.the();
            w.clear();
            for (int c = 0; c < colCount; c++) {
                //WavePlot cw = waveView[c];
                if (visible(c)) {
                    w.add(Labelling.the(cNames.get(c), plot(c) /*cw*/));
                }
            }
            l.update();
            //l.layout();
        }
    }

    public void setVisible(int column, boolean v) {
        visible.set(column, v);
//        waveView[column].update();
    }

    private boolean visible(int col) {
        return visible.test(col);
    }


    private static CircularFloatBuffer buffer(int rowCount, NumericColumn<?> cc) {
        var buf = new CircularFloatBuffer(rowCount);
        for (Number cx : cc)
            buf.write(cx!=null ? cx.floatValue() : Float.NaN);
        return buf;
    }

    public static void main(String[] args) {
        String file = "/home/me/narl/nario.csv";
        CsvReadOptions.Builder csv = CsvReadOptions.builder(file).separator('\t');
        var table = Table.read().csv(csv);

        //table = table.retainColumns(1,2,3,4, 12, 29, 34); //HACK

        DataTableTimeline tv = new DataTableTimeline(table);
        window(tv, 1024, 900);
        window(tv.controls(), 512, 400);
    }

    @Deprecated public static Surface waveRandom(int range) {
        int samplesPerRange = 10;
        CircularFloatBuffer c = new CircularFloatBuffer(range * samplesPerRange);
        ThreadLocalRandom rng = ThreadLocalRandom.current();
        for (int i = 0; i < range * samplesPerRange; i++)
            c.write(new float[] {rng.nextFloat()});

        return new WavePlot(c, 500, 500);
    }
}

package spacegraph.test;

import jcog.Util;
import jcog.exe.Exe;
import spacegraph.space2d.Surface;
import spacegraph.space2d.container.ContainerSurface;
import spacegraph.space2d.container.Splitting;
import spacegraph.space2d.container.graph.GraphEdit2D;
import spacegraph.space2d.container.grid.Containers;
import spacegraph.space2d.container.grid.Gridding;
import spacegraph.space2d.meta.MetaFrame;
import spacegraph.space2d.meta.ProtoWidget;
import spacegraph.space2d.meta.WizardFrame;
import spacegraph.space2d.widget.button.CheckBox;
import spacegraph.space2d.widget.button.HexButton;
import spacegraph.space2d.widget.button.PushButton;
import spacegraph.space2d.widget.chip.NoiseVectorChip;
import spacegraph.space2d.widget.chip.SpeakChip;
import spacegraph.space2d.widget.menu.ListMenu;
import spacegraph.space2d.widget.menu.TabMenu;
import spacegraph.space2d.widget.menu.view.GridMenuView;
import spacegraph.space2d.widget.meter.Plot2D;
import spacegraph.space2d.widget.port.LabeledPort;
import spacegraph.space2d.widget.port.Port;
import spacegraph.space2d.widget.port.TogglePort;
import spacegraph.space2d.widget.sketch.Sketch2DBitmap;
import spacegraph.space2d.widget.slider.FloatSlider;
import spacegraph.space2d.widget.slider.SliderModel;
import spacegraph.space2d.widget.slider.XYSlider;
import spacegraph.space2d.widget.text.BitmapLabel;
import spacegraph.space2d.widget.text.Labelling;
import spacegraph.space2d.widget.text.VectorLabel;
import spacegraph.space2d.widget.textedit.TextEdit;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Consumer;
import java.util.function.Supplier;

import static spacegraph.SpaceGraph.window;

public enum WidgetTest {
    ;

    static final Map<String, Supplier<Surface>> menu;

    static {
        Map<String, Supplier<Surface>> m = Map.of(
        "Container", () -> Containers.grid(
                Labelling.the("grid",
                    Containers.grid(ib(), ib(), ib(), ib(), ib(), ib(), ib(), ib())
                ),
                Labelling.the("grid wide",
                    new Gridding(Util.PHI_min_1f, ib(), ib(), ib(), ib(), ib(), ib(), ib(), ib())
                ),
                Labelling.the("grid tall",
                    new Gridding(Util.PHIf, ib(), ib(), ib(), ib(), ib(), ib(), ib(), ib())
                ),
                Labelling.the("column",
                    Containers.col(ib(), ib(), ib(), ib(), ib(), ib(), ib(), ib())
                ),
                Labelling.the("row",
                    Containers.row(ib(), ib(), ib(), ib(), ib(), ib(), ib(), ib())
                ),
                Labelling.the("vsplit",
                    Containers.col(ib(), 0.618f, ib())
                ),
                Labelling.the("hsplit",
                    Containers.row(ib(), 0.618f, ib())
                )
            ),
            "Button", () -> Containers.grid(
                    new PushButton("PushButton"),
                    new CheckBox("CheckBox"),
                    new HexButton("gears", "HexButton")
            ),
            "Slider", () -> Containers.grid(
                    Containers.row(Containers.grid(new FloatSlider("solid slider", 0.25f, 0, 1    /* pause */),
                            new FloatSlider("knob slider", 0.75f, 0, 1).type(SliderModel.KnobHoriz)),
                            0.9f,
                            new FloatSlider(0.33f, 0, 1).type(SliderModel.KnobVert)),
                    new XYSlider()
                ),
//                "Dialog", () -> grid(
//                        new TextEdit0("xyz").show(),
//                        new FloatSlider(0.33f, 0.25f, 1, "Level"),
//                        new ButtonSet(ButtonSet.Mode.One, new CheckBox("X"), new CheckBox("y"), new CheckBox("z")),
//
//                        Submitter.text("OK", (String result) -> {
//                        })
//                ),

            "Wizard", ProtoWidget::new,

            "Label", () -> Containers.grid(
                new VectorLabel("vector"),
                new BitmapLabel("bitmap")
            ),
            "TextEdit", () ->
                Containers.col(
                    new TextEdit("Edit this\n...").focus(),
                    new TextEdit(16, 1).text("One Line Only").background(0.5f, 0, 0, 1),
                    new TextEdit(16, 4).text("Multi-line").background(0.0f, 0.25f, 0, 0.8f)
                ),

            "Graph2D", () -> new TabMenu(graph2dDemos()),

            "Wiring", () -> new TabMenu(wiringDemos())

            //"Geo", OSMTest::osmTest
    );

        m = new HashMap<>(m); //escape arg limitation of Map.of()
        m.put("Sketch", () -> new MetaFrame(new Sketch2DBitmap(256, 256)));
        m.put("Speak", SpeakChip::new);
        m.put("Resplit", () -> new Splitting(
                new Splitting<>(ib(), Util.PHI_min_1f, true, ib()).resizeable(),
                Util.PHI_min_1f,
                new Splitting<>(ib(), Util.PHI_min_1f, false, ib()).resizeable()
            ).resizeable());
        m.put("Timeline", Timeline2DTest::timeline2dTest);
        m.put("Hover", HoverTest::hoverTest);
        m.put("Chart", WidgetTest::chartDemo);
//        m.put("Tsne", TsneTest::testTsneModel);
//        m.put("Signal", SignalViewTest::newSignalView);
        menu = m;
    }

    private static Surface chartDemo() {
        var s = new Gridding();

        var n = 64;
        var f = 10f;
        var a = new float[n];
        var b = new float[n];
        var c = new float[n];
        for (var i = 0; i < n; i++) {
            a[i] = (float) Math.sin((f * i) / n);
            b[i] = (float) Math.cos((f * i) / n);
            c[i] = (float) Math.cos((f / 3 * i) / n);
        }

        {
            var p1 = new Plot2D(n);
            p1.addSeries("a", a);
            s.add(p1);
        }
        {
            var p2 = new Plot2D(n);
            p2.addSeries("a", a);
            p2.addSeries("b", b);
            s.add(p2);
        }
        {
            var p1 = new Plot2D(n).type(Plot2D.PlotType.BAR);
            p1.addSeries("a", a);
            s.add(p1);
        }
        {
            var p1 = new Plot2D(n).type(Plot2D.PlotType.HISTOGRAM);
            p1.addSeries("a", a);
            s.add(p1);
        }
        {
            var p1 = new Plot2D(n).type(Plot2D.PlotType.XY);
            p1.addSeries("a", a);
            p1.addSeries("c", c);
            s.add(p1);
        }

        return s;
    }


    private static Map<String, Supplier<Surface>> graph2dDemos() {
        return Map.of(
            "Simple", Graph2DTest::newSimpleGraph,
            "UJMP", Graph2DTest::newUjmpGraph,
            "Types", Graph2DTest::newTypeGraph,
            "TreeMap2D", Graph2DTest::newTreeMapGraph
        );
    }

    public static void main(String[] args) {
        window(widgetDemo(), 1200, 800);
//            .dev()
    }

    public static ContainerSurface widgetDemo() {
        //return new TabMenu(menu);
        return new ListMenu(menu, new GridMenuView());
    }

    private static Map<String, Supplier<Surface>> wiringDemos() {
        return Map.of(
                "Empty", () -> wiringDemo(g -> { }),
                "Intro", () -> wiringDemo(g -> {
                    g.add(widgetDemo()).posRel(1, 1, 0.5f, 0.25f);
                    for (var i = 1; i < 3; i++)
                        g.add(new WizardFrame(new ProtoWidget())).posRel(0.5f, 0.5f, 0.45f / i, 0.35f / i);
                }),
                //"", ()-> wiringDemo((g)->{})
                "Basic", () -> wiringDemo(g -> {
                    /* switched signal */

                    var A = new NoiseVectorChip();
                    ContainerSurface a = g.add(A).sizeRel(0.25f, 0.25f);


                    Port B = LabeledPort.generic();
                    ContainerSurface b = g.add(B).sizeRel(0.25f, 0.25f);

                    var AB = new TogglePort();
                    g.add(AB).sizeRel(0.25f, 0.25f);

                    //Loop.of(() -> { A.out(Texts.n4(Math.random())); }).setFPS(0.3f);
                })
        );
    }

    private static Surface wiringDemo(Consumer<GraphEdit2D> o) {
        return new GraphEdit2D() {
            @Override
            protected void starting() {
                super.starting();
                pos(((Surface) parent).bounds); //HACK
                Exe.runLater(() -> physics.invokeLater(() -> o.accept(this)));
            }
        };
    }

    private static Surface ib() {
        return PushButton.iconAwesome(switch (ThreadLocalRandom.current().nextInt(6)) {
            case 0 -> "code";
            case 1 -> "trash";
            case 2 -> "wrench";
            case 3 -> "fighter-jet";
            case 4 -> "exclamation-triangle";
            case 5 -> "shopping-cart";
            //            case 6: s = "dna"; break;
            default -> null;
        });
    }

}
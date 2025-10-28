package spacegraph.space2d.meta.obj;

import jcog.data.list.Lst;
import jcog.exe.Loop;
import jcog.math.FloatSupplier;
import jcog.pri.PLink;
import jcog.signal.DoubleRange;
import jcog.signal.FloatRange;
import jcog.signal.IntRange;
import jcog.signal.MutableEnum;
import jcog.thing.Part;
import jcog.thing.Parts;
import jcog.util.Reflect;
import org.eclipse.collections.api.block.procedure.primitive.FloatProcedure;
import org.jetbrains.annotations.Nullable;
import spacegraph.SpaceGraph;
import spacegraph.space2d.Surface;
import spacegraph.space2d.container.Splitting;
import spacegraph.space2d.container.graph.Graph2D;
import spacegraph.space2d.container.grid.Containers;
import spacegraph.space2d.container.grid.Gridding;
import spacegraph.space2d.container.layout.Force2D;
import spacegraph.space2d.container.unit.MutableUnitContainer;
import spacegraph.space2d.container.unit.Scale;
import spacegraph.space2d.meta.LoopPanel;
import spacegraph.space2d.widget.button.CheckBox;
import spacegraph.space2d.widget.button.EnumSwitch;
import spacegraph.space2d.widget.button.PushButton;
import spacegraph.space2d.widget.port.FloatPort;
import spacegraph.space2d.widget.port.util.Wiring;
import spacegraph.space2d.widget.slider.FloatSlider;
import spacegraph.space2d.widget.slider.IntSlider;
import spacegraph.space2d.widget.text.BitmapLabel;
import spacegraph.space2d.widget.text.Labelling;
import spacegraph.space2d.widget.text.VectorLabel;

import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.BiFunction;

/**
 * Enhanced version of ObjectSurface, combining features from ObjectSurface and ObjectSurface2,
 * and adding new functionality based on the graph-based approach from ObjectSurface3.
 */
public class ObjectSurface3 extends MutableUnitContainer<Surface> {

    private final GraphedObject graph;
    private final RenderingMode renderer;

    public ObjectSurface3(Object x) {
        this(x, 3); // Default depth
    }

    public ObjectSurface3(Object x, int depth) {
        this(x, depth, new BlockRenderer(null)); // Default to block renderer
    }

    @SafeVarargs
    public ObjectSurface3(Object x, int depth, RenderingMode renderer, Map<Class<?>, BiFunction<?, Object, Surface>>... fallbackMaps) {
        super();
        this.graph = new GraphedObject(x, depth, fallbackMaps);
        this.renderer = renderer;
        this.renderer.setGraph(graph); // Provide the graph to the renderer
        set(renderer.render());
    }

    /**
     * One Node per unique Java object, so we never render duplicates.
     */
    public static class Node {
        public final Object instance;
        public final List<Edge> edges = new Lst<>();
        public String label; // optional, for convenience

        public Node(Object instance) {
            this.instance = instance;
        }

        @Override
        public String toString() {
            return label != null ? label : String.valueOf(instance);
        }
    }

    /**
     * Directed edge from "from" Node to "to" Node with a "relation" label (e.g. field name).
     */
    public static class Edge {
        public final Node from, to;
        public final String relation;

        public Edge(Node from, Node to, String relation) {
            this.from = from;
            this.to = to;
            this.relation = relation;
        }
    }

    /**
     * Encapsulates the entire ObjectGraph built from a root object by reflection.
     * You can pass in specialized logic from an AutoBuilder or fallback map if desired.
     */
    public static class GraphedObject {
        private final Map<Object, Node> visited = new IdentityHashMap<>();
        private final Node rootNode;
        private final int maxDepth;
        private final Map<Class<?>, BiFunction<?, Object, Surface>> fallback;

        /**
         * Full constructor allowing your own AutoBuilder or fallback for specialized objects.
         */
        @SafeVarargs
        public GraphedObject(Object rootObject,
                             int maxDepth,
                             Map<Class<?>, BiFunction<?, Object, Surface>>... fallbackMaps) {
            this.fallback = new HashMap<>();
            if (fallbackMaps != null) {
                for (var fm : fallbackMaps) {
                    this.fallback.putAll(fm);
                }
            }
            this.maxDepth = maxDepth;
            this.rootNode = findOrCreateNode(rootObject);
            graph(rootNode, 0);
        }

        /**
         * Variation that omits fallback maps and just uses a single AutoBuilder.
         */
        public GraphedObject(Object rootObject, int maxDepth) {
            this.fallback = Collections.emptyMap();
            this.maxDepth = maxDepth;
            this.rootNode = findOrCreateNode(rootObject);
            graph(rootNode, 0);
        }

        /** @return the root Node of the graph. */
        public Node getRootNode() {
            return rootNode;
        }

        /** @return all discovered nodes in the graph. */
        public Collection<Node> nodes() {
            return visited.values();
        }

        /**
         * Recursively reflect and expand child objects as edges in the graph.
         */
        private void graph(Node node, int depth) {
            if (depth >= maxDepth) return;
            var obj = node.instance;
            if (obj == null) return;

            // 1) Reflect over fields.
            Reflect.on(obj.getClass()).fields(true, false, false).forEach((fName,v)->{
                var child = v.get();
                var childNode = findOrCreateNode(child);
                node.edges.add(new Edge(node, childNode, fName));
                graph(childNode, depth + 1);
            });

            // 2) If it's a Collection, link each element.
            if (obj instanceof Collection<?> coll) {
                var idx = 0;
                for (var c : coll) {
                    if (c != null) {
                        var childNode = findOrCreateNode(c);
                        var i = idx++;
                        node.edges.add(new Edge(node, childNode,
                                Integer.toString(i)
                        ));
                        graph(childNode, depth + 1);
                    }
                }
            }
            // 3) If it's a Map, link each entry.
            else if (obj instanceof Map<?,?> map) {
                for (var e : map.entrySet()) {
                    if (e != null) {
                        var entryNode = findOrCreateNode(e);
                        node.edges.add(new Edge(node, entryNode, "entry"));
                        graph(entryNode, depth + 1);
                    }
                }
            }

            // Could also handle arrays, etc. if desired.
        }

        /**
         * Finds or creates a Node for the given object reference.
         */
        private Node findOrCreateNode(Object obj) {
            return visited.computeIfAbsent(obj, (o) -> {
                var n = new Node(o);
                n.label = label(o);
                return n;
            });
        }

        /**
         * Attempts to derive a label from the object.
         * Could incorporate autoBuilder/fallback logic if you prefer.
         */
        private String label(Object o) {
            return String.valueOf(o);
        }
    }

    /* -------------------------------------------------------------------------
         2) RENDERING MODES
       ------------------------------------------------------------------------- */

    /**
     * Interface for a "rendering mode" that turns the model into a Surface.
     */
    public abstract static class RenderingMode {
        protected GraphedObject graph;

        public void setGraph(GraphedObject graph) {
            this.graph = graph;
        }

        protected Surface build(Object x) {
            if (x instanceof Object[] || x instanceof Collection)
                return null;

            return new ObjectSurface(x, 1).built(); //HACK TODO subsume all ObjectSurface functionality
        }

        public abstract Surface render();
    }



    /**
     * "Block" layout: recurses from root, building a nested tree layout.
     * This mode resembles the original "ObjectSurface" approach.
     */
    public static class BlockRenderer extends RenderingMode {
        private final Set<Node> visited = Collections.newSetFromMap(new IdentityHashMap<>());

        public BlockRenderer(GraphedObject graph) {
            this.graph = graph;
        }

        @Override
        public Surface render() {
            if (graph == null) return null;
            return block(graph.getRootNode());
        }

        @Nullable
        private Surface block(Node node) {
            if (!visited.add(node)) {
                // Already rendered -> show minimal label
                return Labelling.the("(already shown)", null);
            }

            var content = build(node.instance);

            Surface childrenContainer = null;
            if (content==null && !node.edges.isEmpty()) {
                var children = new Lst<Surface>();
                for (var e : node.edges) {
                    var child = block(e.to);
                    if (child != null)
                        children.add(Labelling.the(e.relation, child));
                }
                childrenContainer = contain(children);
            }

            if (content!=null && childrenContainer!=null)
                content = new Splitting<>(content, 0.5f, childrenContainer);
            else if (content == null && childrenContainer!=null)
                content = childrenContainer;

            return content!=null ? Labelling.the(node.label, content) : new BitmapLabel(node.label);
        }

        private static Surface contain(List<Surface> children) {
            return switch (children.size()) {
                case 0 -> null;
                case 1 -> children.get(0);
                default -> new Gridding(children);
            };
        }
    }

    /**
     * "Graph" layout: displays all objects exactly once in a 2D graph
     * with edges drawn between them (similar to ObjectGraphs).
     */
    public static class GraphRenderer extends RenderingMode {

        public GraphRenderer(GraphedObject graph) {
            this.graph = graph;
        }

        @Override
        public Surface render() {
            if (graph == null) return null;
            // Create a Graph2D for the entire model
            var graph2D = new Graph2D<Node>();
            graph2D.render((node, graph) -> {
                var x = node.id;
                var edges = x.edges;
                for (int i = 0, size = edges.size(); i < size; i++)
                    graph.edge(node, graph.nodeOrAdd(edges.get(i).to)).weight(1).color(1, 1, 1);
                node.set(new Scale(Labelling.the(x.label, null), 0.9f));
            });
            graph2D.update(
                    new Force2D<>()
            );

            graph2D.set(graph.nodes());
            return graph2D.widget();
        }
    }

//    public static class InteractiveGraphRenderer extends RenderingMode {
//        public InteractiveGraphRenderer(GraphedObject graph) {
//            this.graph = graph;
//        }
//
//        @Override
//        public Surface render() {
//            if (graph == null) return null;
//
//            GraphEdit2D graphEdit2D = new GraphEdit2D();
//
//            // Create nodes
//            Map<Node, Windo> nodeMap = new HashMap<>();
//            for (Node node : graph.nodes()) {
//                Surface nodeContent = new BlockRenderer(graph).block(node); // Use existing BlockRenderer for node content
//                if (nodeContent == null) {
//                    nodeContent = new BitmapLabel(node.label);
//                }
//                Windo windo = graphEdit2D.add(nodeContent);
//                nodeMap.put(node, windo);
//            }
//
//            // Create edges
//            for (Node node : graph.nodes()) {
//                // Create edges with proper typing
//                for (Edge edge : node.edges) {
//                    Windo sourceWindo = nodeMap.get(node);
//                    Windo targetWindo = nodeMap.get(edge.to);
//
//                    if (sourceWindo != null && targetWindo != null) {
//                        // Get the Surface content from Windo
//                        graphEdit2D.addWire(new Wire(sourceWindo.the(), targetWindo.the()));
//                    }
//                }
//            }
//
//            return graphEdit2D;
//        }
//    }

    public enum Surfaces {
        ;

        /**
         * Example: columns or vertical stacking. (You can replace with your own container.)
         */
        public static Surface col(String label, List<Surface> children) {
            // Use your container system (like "Containers.col").
            // This is just an example wrapper that adds a label to a stacked layout.
            return Labelling.the(label, Containers.col(children));
        }
    }

    /* -------------------------------------------------------------------------
         4) EXAMPLE USAGE & MIGRATION PATH
       ------------------------------------------------------------------------- */

    public static void main(String[] args) {
        List<Object> root = new Lst<>();
        root.add("Hello World");
        root.add(42);
        root.add(3.14159);
        root.add(Map.of("a", "x", "b","y"));
        root.add(List.of(new FloatRange(0.6f, 0.0f, 1.0f), new Lst<>(new String[] { "x", "y" })));

        var graph = new GraphedObject(root, 3);

        SpaceGraph.window(new ObjectSurface3(root, 3, new BlockRenderer(graph)), 1300, 800);
        SpaceGraph.window(new ObjectSurface3(root, 3, new GraphRenderer(graph)), 1200, 800);
        //SpaceGraph.window(new ObjectSurface3(root, 3, new InteractiveGraphRenderer(graph)), 1200, 800);
    }

    public static final Map<Class, BiFunction<?, Object, Surface>> builtin = new HashMap<>()
    {{
//        builder.annotation(Essence.class, (x, xv, e) -> {
//           return xv; //forward  //TODO
//        });

        put(Map.Entry.class, (Map.Entry x, Object relation) -> new VectorLabel(x.toString()));

        put(FloatRange.class, (FloatRange x, Object relation) -> new LiveFloatSlider(ObjectSurface.objLabel(x, relation), x.min, x.max, x, x::set));
        put(DoubleRange.class, (DoubleRange x, Object relation) -> new LiveFloatSlider(ObjectSurface.objLabel(x, relation), (float) x.min, (float) x.max, () -> (float) x.get(), x::set));

        put(PLink.class, (PLink x, Object relation) -> new LiveFloatSlider(ObjectSurface.objLabel(x, relation), 0, 1, x, x::pri));

        put(IntRange.class, (IntRange x, Object relation) -> x instanceof MutableEnum ? null : new MyIntSlider(x, ObjectSurface.relationLabel(relation)));

        put(Runnable.class, (Runnable x, Object relation) -> new PushButton(ObjectSurface.objLabel(x, relation), x));
        put(AtomicBoolean.class, (AtomicBoolean x, Object relation) -> new MyAtomicBooleanCheckBox(ObjectSurface.objLabel(x, relation), x));

        put(Loop.class, (Loop l, Object relation) -> new LoopPanel(l));

        put(MutableEnum.class, (MutableEnum<?> x, Object relation) -> EnumSwitch.the(x, ObjectSurface.relationLabel(relation)));

        put(String.class, (String x, Object relation) -> new VectorLabel(x)); //TODO support multi-line word wrap etc

        put(Part.class, (Part<?> p, Object rel) -> {
//                var P = new BitmapLabel((rel!=null ? rel + " -> " : "") + p.toString()); //ObjectSurface(p);

            //TODO make dynamic
            /*, 1 */
            List<Surface> subs = p instanceof Parts ?
                    ((Parts) p).subs().map(ObjectSurface::new)
                            .toList() : null;
            if (subs.isEmpty()) {
                return null;
            } else {
                //return new Splitting(P, 0.5f, new spacegraph.space2d.meta.Surfaces(subs)).resizeable();
                return new spacegraph.space2d.meta.Surfaces<>(subs);
            }
        });

        put(Collection.class, (Collection<?> cx, Object relation) -> {
            if (cx.isEmpty())
                return null;

            List<Surface> yy = new Lst<>(cx.size());

            //return SupplierPort.button(relationLabel(relation), ()-> {

            for (Object cxx : cx) {
                if (cxx == null)
                    continue;

                Surface yyy = build(cxx);

                if (yyy != null)
                    yy.add(yyy); //TODO depth, parent, ..
            }
            if (yy.isEmpty())
                return null;

            Surface xx = collectionSurface(yy);

            String l = ObjectSurface.relationLabel(relation);

            return l.isEmpty() ? xx : Labelling.the(l, xx);
            //});
        });
//        classer.put(Surface.class, (Surface x, Object relation) -> {
//            return x.parent==null ? LabeledPane.the(relationLabel(relation), x) : x;
//        });

//        classer.put(Pair.class, (p, rel)->{
//           return new Splitting(build(p.getOne()), 0.5f, build(p.getTwo())).resizeable();
//        });
    }

        @Deprecated private Surface build(Object cxx) {
            return new ObjectSurface(cxx, 1 /* ? */) {
                @Override
                protected Surface wrap(Surface b) {
                    return b;
                }
            };
        }
    };

    private static @Nullable Surface collectionSurface(List<Surface> x) {
        Surface y = null;
        int xs = x.size();
        switch (xs) {
            case 0:
                return null; //TODO shouldnt happen
            case 1:
                //                //outer.add(new Scale(cx.get(0), Widget.marginPctDefault));
                y = x.get(0);
                break;

            default:
                if (xs == 2) {
                    y = new Splitting(x.get(0), 0.5f, x.get(1)).resizeable();
                }

                //TODO selector
                if (y == null)
                    y = new Gridding(x);
                break;
        }
        return y;
        //return new ObjectMetaFrame(obj, y, context);

    }

    private static class MyIntSlider extends IntSlider {
        //        private final String k;

        MyIntSlider(IntRange p, String k) {
            super(p);
            text(k);
        }

//        @Override
//        public String text() {
//            return k;
//            //return k + '=' + super.text();
//        }
    }

    private static class MyAtomicBooleanCheckBox extends CheckBox {
        final AtomicBoolean a;

        MyAtomicBooleanCheckBox(String yLabel, AtomicBoolean x) {
            super(yLabel, x);
            this.a = x;
        }

        @Override
        public boolean canRender(spacegraph.space2d.ReSurface r) {
            set(a.getOpaque()); //load
            return super.canRender(r);
        }
    }

    public static final class LiveFloatSlider extends FloatPort {

        //private static final float EPSILON = 0.001f;

        public final FloatSlider slider;
        private final FloatSupplier get;

        public LiveFloatSlider(String label, float min, float max, FloatSupplier get, FloatProcedure set) {
            super();

            this.get = get;
            slider = new FloatSlider(get.asFloat(), min, max).text(label).on(set);

            //set(LabeledPane.the(label, slider));
            set(slider);

            on(set::value);
        }

        @Override
        protected void renderContent(spacegraph.space2d.ReSurface r) {
            //TODO configurable rate
            boolean autoUpdate = true;
            if (autoUpdate) {
                slider.set(this.get.asFloat());
            }

            super.renderContent(r);
        }

        @Override
        protected void onWired(Wiring w) {
            out();
        }
    }
}

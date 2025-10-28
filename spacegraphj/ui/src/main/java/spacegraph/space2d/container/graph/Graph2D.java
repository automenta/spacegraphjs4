package spacegraph.space2d.container.graph;

import com.google.common.collect.Iterables;
import com.jogamp.opengl.GL2;
import jcog.data.graph.AdjGraph;
import jcog.data.graph.MapNodeGraph;
import jcog.data.map.CellMap;
import jcog.data.pool.MetalPool;
import jcog.data.pool.Pool;
import org.jetbrains.annotations.Nullable;
import spacegraph.space2d.ReSurface;
import spacegraph.space2d.Surface;
import spacegraph.space2d.container.Splitting;
import spacegraph.space2d.container.collection.MutableContainer;
import spacegraph.space2d.container.collection.MutableListContainer;
import spacegraph.space2d.container.collection.MutableMapContainer;
import spacegraph.space2d.container.grid.Gridding;
import spacegraph.space2d.container.unit.Clipped;
import spacegraph.space2d.meta.obj.ObjectSurface;
import spacegraph.space2d.widget.text.VectorLabel;

import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Stream;

/**
 * 2D directed/undirected graph widget
 * designed for high-performance realtime animated visualization of many graph nodes and edges
 * that can appear, disappear, and re-appear between frames
 * <p>
 * TODO generify for use in Dynamics3D
 */
public class Graph2D<X> extends MutableMapContainer<X, NodeVis<X>> {


	private static final Graph2DUpdater NullUpdater = (c, d) -> {};
	/**
	 * invalidates all edges by setting their dirty flag
	 */
	protected static final Graph2DRenderer InvalidateEdges =
			(n, g) -> n.invalidateEdges();

	protected final GraphEditor<X> edit = new GraphEditor<>(this);

	private final Pool<EdgeVis<X>> edgePool = new MetalPool<>() {
		@Override public EdgeVis<X> create() {
			return new EdgeVis<>();
		}
	};

	private List<Graph2DRenderer<X>> renderers = Collections.EMPTY_LIST;

	private Consumer<NodeVis<X>> builder = x -> {
		x.set(new VectorLabel(x.id.toString()));
		//generic default builder
		//x.set(new PushButton(x.id.toString()));
	};

	private Graph2DUpdater<X> updater = NullUpdater;

	private final transient Set<NodeVis<X>> wontRemain = Collections.newSetFromMap(new IdentityHashMap<>());

	@Nullable
    private transient Iterable<X> nextNodes;
	private transient boolean nextAddOrReplace;

	public Graph2D() {
		this(NullUpdater);
	}

	public Graph2D(Graph2DUpdater<X> updater) {
		super();
		update(updater);
	}

	@Override
	public boolean delete() {
		if (super.delete()) {
			edgePool.delete();
//            nodeCache.clear();
			//TODO anything else?
			return true;
		}
		return false;
	}

	@Override
	protected void hide(NodeVis<X> key, Surface s) {
		s.hide();
	}

	public Surface widget() {
		return widget(null);
	}

	/**
	 * TODO impl using MetaFrame menu
	 */
	public Surface widget(Object controls) {
		var cfg = configWidget();

		if (controls != null)
			cfg.add(new ObjectSurface(controls));

		addControls(cfg);

		return new Splitting<>(new Clipped(this), 0.1f, cfg).vertical().resizeable();
	}

	protected void addControls(MutableListContainer cfg) {

	}

	/**
	 * adds a rendering stage.  these are applied successively at each visible node
	 */
	@SafeVarargs
	public final Graph2D<X> render(Graph2DRenderer<X>... renderStages) {
		synchronized(this) {
            var nextRenderStages = List.of(renderStages);
			if (!renderers.equals(nextRenderStages)) {
				renderers = nextRenderStages;
				layout();
			}
		}
		return this;
	}

	public Graph2D<X> build(Consumer<NodeVis<X>> builder) {
		synchronized(this) {
			if (this.builder != builder) {
				this.builder = builder;
				layout();
			}
		}
		return this;
	}

	/**
	 * TODO to support dynamically changing updater, apply the updater's init procdure to all existing nodes.  do this in between frames so there is no interruption if rendering current frame.  this means saving a 'nextUpdater' reference to delay application
	 */
	public Graph2D<X> update(Graph2DUpdater<X> u) {
		synchronized(this) {
			if (this.updater != u) {
				this.updater = u;
				layout();
			}
		}
		return this;
	}

	public MutableListContainer configWidget(Object... extraConfigurables) {
        var g = new Gridding();
		g.add(new ObjectSurface(updater));
		for (var l : renderers)
			g.add(new ObjectSurface(l));
		for (var o : extraConfigurables)
			g.add(new ObjectSurface(o));
		return g;
	}

	public int nodeCount() {
		return cells.size();
	}

	@Override
	protected void doLayout(float dtS) {
        var nextNodes = this.nextNodes;
		if (nextNodes!=null) {
			this.nextNodes = null;
			updateNodes(nextNodes, nextAddOrReplace);
			for (var r : renderers)
				r.nodes(cells, edit);
		}
	}

	@Override
	protected boolean canRender(ReSurface r) {
        if (!super.canRender(r)) return false;

        forEachValue(NodeVis::pre);
        updater.update(this, r.frameDT);
        forEachValue(NodeVis::post);
        return true;
    }

	@Override
	protected void paintIt(GL2 gl, ReSurface r) {
		for (var nn : cells.map.valueArray()) {
			var n = nn.value;
			if (n!=null && n.visible())
				n.paintEdges(gl);
		}
	}

	public final Graph2D<X> add(Stream<X> nodes) {
		return add(nodes::iterator);
	}

	public final Graph2D<X> set(Stream<X> nodes) {
		return set(nodes::iterator);
	}

	public final Graph2D<X> add(Iterable<X> nodes) {
		return update(nodes, true);
	}

	public final Graph2D<X> set(Iterable<X> nodes) { return update(nodes, false); }

	public final Graph2D<X> set(AdjGraph g) {
		return set(g.nodes());
	}

	public final Graph2D<X> set(MapNodeGraph g) { return set(g.nodes()); }

	public final Graph2D<X> add(MapNodeGraph g) {
		return add(g.nodes());
	}

	@Override
	public MutableContainer clear() {
		set(Collections.EMPTY_LIST);
		return null;
	}

	private Graph2D<X> update(Iterable<X> nodes, boolean addOrReplace) {
		nextAddOrReplace = addOrReplace;
		nextNodes = nodes;
		layout();
		return this;
	}

	@Override
	protected void stopping() {
		edgePool.delete();
		super.stopping();
	}

	private void updateNodes(Iterable<X> nodes, boolean addOrReplace) {
		Set<NodeVis<X>> ww;
		if (!addOrReplace) {
 			ww = this.wontRemain;

			for (var c : cells.map.valueArray())
				if (c!=null) {
					var cv = c.value;
					if (cv!=null)
						ww.add(cv);
				}

			if (ww.isEmpty()) ww = null;
		} else
			ww = null;

//		try {
			for (var _x : nodes) {
                if (_x != null) { //HACK
                    var n = nodeOrAdd(_x);
                    if (ww != null)
						ww.remove(n);
                }
            }
//		} catch (NoSuchElementException e) {
//			//TODO HACK
//		}

		if (ww!=null) {
			cells.removeAll(Iterables.transform(ww, x ->x.id));
			ww.clear();
		}

	}

	private NodeVis<X> nodeOrAdd(X _x) {
		if (_x == null) throw new NullPointerException();
        var v = compute(key(_x),
			x -> x == null ?
				materialize(_x) :
				rematerialize(key(_x), x)
		).value;
		if (v.parent == null)
			v.start(this);

		v.show();
		return v;
	}

	protected X key(X x) {
		return x;
	}

	private NodeVis<X> materialize(X x) {
		var y = new NodeVis<>(x);
		builder.accept(y);
		updater.init(y, this);
		for (var r : renderers)
			r.node(y, edit);
		return y;
	}

	/**
	 * node continues being materialized
	 */
	private NodeVis<X> rematerialize(X key, NodeVis<X> xx) {
		xx.update();
		return xx;
	}

	@Override
	protected final void unmaterialize(NodeVis<X> v) {
		v.end(edgePool);
		v.delete();
	}

	/**
	 * iterative animated geometric update; processes the visual representation of the content
	 */
	@FunctionalInterface
	public interface Graph2DUpdater<X> {

		void update(Graph2D<X> g, float dtS);

		/**
		 * set an initial location (and/or size) for a newly created NodeVis
		 */
		default void init(NodeVis<X> newNode, Graph2D<X> g) { }
	}


	/**
	 * one of zero or more sequentially-applied "layers" of the representation of the graph,
	 * responsible for materializing/decorating/rendering each individual node it is called for,
	 * and the graph that holds it (including edges, etc) via the supplied GraphEditing interface.
	 */
	@FunctionalInterface
	public interface Graph2DRenderer<X> {

		/**
		 * called for each node being processed.  can edit the NodeVis
		 * and generate new links from it to target nodes.
		 */
		void node(NodeVis<X> node, GraphEditor<X> graph);

		default void nodes(CellMap<X, ? extends NodeVis<X>> cells, GraphEditor<X> edit) {
			cells.forEachValue(nv -> {
				if (nv.visible())
					node(nv, edit);
			});
		}

	}

	/**
	 * wraps all graph construction procedure in this interface for which layers construct graph with
	 */
	public static final class GraphEditor<X> {

		final Graph2D<X> g;

		GraphEditor(Graph2D<X> g) {
			this.g = g;
		}

		public @Nullable NodeVis<X> node(Object x) {
			return g.cells.get(x);
		}

		public NodeVis<X> nodeOrAdd(X x) {
			return g.nodeOrAdd(x);
		}

		/**
		 * adds a visible edge between two nodes, if they exist and are visible
		 */
		public @Nullable EdgeVis<X> edge(Object from, Object to) {
			var fromNode = from instanceof NodeVis fv ? fv : node(from);
			return fromNode != null ? edge(fromNode, to) : null;
		}

		/**
		 * adds a visible edge between two nodes, if they exist and are visible
		 */
		public @Nullable EdgeVis<X> edge(NodeVis<X> from, Object to) {

			var t = to instanceof NodeVis tn ? tn : g.cells.getValue(to);

			if (t == null) return null;

			if (from == t) return null; //ignored TOOD support self edges?

			return from.out(t, g.edgePool);
		}

	}

}
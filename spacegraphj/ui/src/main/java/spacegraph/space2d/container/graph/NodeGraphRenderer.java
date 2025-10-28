package spacegraph.space2d.container.graph;

import jcog.data.graph.AdjGraph;
import jcog.data.graph.MapNodeGraph;
import jcog.data.graph.path.FromTo;
import org.jetbrains.annotations.Nullable;

/**
 * layer which renders NodeGraph nodes and edges
 */
public class NodeGraphRenderer<N, E> implements Graph2D.Graph2DRenderer<MapNodeGraph.AbstractNode<N, E>> {


    public static class AdjGraphRenderer<N, E> implements Graph2D.Graph2DRenderer<N> {

        public final AdjGraph<N,E> g;

        public AdjGraphRenderer(AdjGraph<N,E> graph) {
            g = graph;
        }

        @Override
        public void node(NodeVis<N> node, Graph2D.GraphEditor<N> graph) {
            N x = node.id;

            g.neighborEdges(x, (y, e)->{
                EdgeVis<N> ee = graph.edge(node, y);
                if (ee!=null) updateEdge(x, e, y, ee);
            });

            style(node);

        }

        protected void style(NodeVis<N> node) {
            node.color(0.5f, 0.5f, 0.5f);
            node.resize(20.0f, 10.0f);
        }

        protected void updateEdge(N x, E e, N y, EdgeVis<N> ee) {
            ee.weight(0.1f).color(0.5f, 0.5f, 0.5f, 0.75f);
        }
    }


    @Override
    public void node(NodeVis<MapNodeGraph.AbstractNode<N, E>> from, Graph2D.GraphEditor<MapNodeGraph.AbstractNode<N, E>> graph) {
        MapNodeGraph.AbstractNode<N, E> F = from.id;

        from.colorHash();

        for (FromTo<MapNodeGraph.AbstractNode<N, E>, E> e : F.edges(false, true)) {
            MapNodeGraph.AbstractNode<N, E> T = e.other(F);
            EdgeVis<MapNodeGraph.AbstractNode<N, E>> ee = graph.edge(from, T);
            if (ee!=null)
                edge(from, e, ee, T);
        }

    }

    protected void edge(NodeVis<MapNodeGraph.AbstractNode<N, E>> from, FromTo<MapNodeGraph.AbstractNode<N, E>, E> edge, @Nullable EdgeVis<MapNodeGraph.AbstractNode<N, E>> edgeVis, MapNodeGraph.AbstractNode<N, E> to) {
        edgeVis.weight = 0.1f;
        edgeVis.a = 0.75f;
        edgeVis.r = edgeVis.g = edgeVis.b = 0.5f;
    }

}
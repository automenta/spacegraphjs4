import * as d3 from 'd3-force-3d';

class LayoutManager {
    constructor(graphManager, sceneManager, config) {
        this.graphManager = graphManager;
        this.sceneManager = sceneManager;
        this.config = config.layout;
        this.simulation = this.initSimulation();

        this.graphManager.addEventListener('node:added', this.addNode.bind(this));
        this.graphManager.addEventListener('node:removed', this.removeNode.bind(this));
        this.graphManager.addEventListener('edge:added', this.addEdge.bind(this));
        this.graphManager.addEventListener('edge:removed', this.removeEdge.bind(this));
    }

    initSimulation() {
        const simulation = d3.forceSimulation3d()
            .numDimensions(3)
            .nodes(this.graphManager.getNodes())
            .force('link', d3.forceLink(this.graphManager.getEdges()).id(d => d.id).distance(this.config.link.distance))
            .force('charge', d3.forceManyBody().strength(this.config.charge.strength))
            .force('center', d3.forceCenter(0, 0, 0))
            .on('tick', this.ticked.bind(this));
        return simulation;
    }

    addNode({ node }) {
        this.simulation.nodes().push(node);
        this.simulation.alpha(0.3).restart();
    }

    removeNode({ node }) {
        const nodes = this.simulation.nodes().filter(n => n.id !== node.id);
        this.simulation.nodes(nodes);
        this.simulation.alpha(0.3).restart();
    }

    addEdge({ edge }) {
        this.simulation.force('link').links().push(edge);
        this.simulation.alpha(0.3).restart();
    }

    removeEdge({ edge }) {
        const links = this.simulation.force('link').links().filter(l => l.id !== edge.id);
        this.simulation.force('link').links(links);
        this.simulation.alpha(0.3).restart();
    }

    ticked() {
        this.sceneManager.updateLayout(this.simulation.nodes());
    }

    destroy() {
        this.simulation.stop();
        // Remove event listeners from graphManager
    }
}

export default LayoutManager;
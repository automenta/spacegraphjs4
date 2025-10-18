import * as d3 from 'd3-force-3d';

class LayoutManager {
    constructor(nodes, edges, sceneManager) {
        this.nodes = nodes;
        this.edges = edges;
        this.sceneManager = sceneManager;

        this.simulation = this.initSimulation();
    }

    initSimulation() {
        const simulation = d3.forceSimulation3d()
            .numDimensions(3)
            .nodes(this.nodes);

        simulation
            .force('link', d3.forceLink(this.edges).id(d => d.id).distance(10))
            .force('charge', d3.forceManyBody().strength(-15))
            .force('center', d3.forceCenter(0, 0, 0))
            .on('tick', this.ticked.bind(this));

        return simulation;
    }

    ticked() {
        // The simulation has updated the positions in the data.
        // Now, update the visual representation in the SceneManager.
        this.sceneManager.updateLayout(this.simulation.nodes());
    }

    destroy() {
        this.simulation.stop();
    }
}

export default LayoutManager;
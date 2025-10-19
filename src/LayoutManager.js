import * as d3 from 'd3-force-3d';

class LayoutManager {
    constructor(config, graphManager, sceneManager) {
        this.config = config.layout;
        this.graphManager = graphManager;
        this.sceneManager = sceneManager;

        // Bind event handlers once
        this._onNodeAddedHandler = this._onNodeAdded.bind(this);
        this._onNodeRemovedHandler = this._onNodeRemoved.bind(this);
        this._onEdgeAddedHandler = this._onEdgeAdded.bind(this);
        this._onEdgeRemovedHandler = this._onEdgeRemoved.bind(this);

        this.simulation = this._initSimulation();

        // Subscribe to graph events
        this.graphManager.addEventListener('node:added', this._onNodeAddedHandler);
        this.graphManager.addEventListener('node:removed', this._onNodeRemovedHandler);
        this.graphManager.addEventListener('edge:added', this._onEdgeAddedHandler);
        this.graphManager.addEventListener('edge:removed', this._onEdgeRemovedHandler);
    }

    _initSimulation() {
        const { alpha, alphaDecay, velocityDecay, force } = this.config;
        const simulation = d3.forceSimulation()
            .numDimensions(3)
            .force('link', d3.forceLink([]).id(d => d.id).distance(force.link))
            .force('charge', d3.forceManyBody().strength(force.charge))
            .force('center', d3.forceCenter(0, 0, 0))
            .alpha(alpha)
            .alphaDecay(alphaDecay)
            .velocityDecay(velocityDecay)
            .on('tick', this._onTick.bind(this));
        return simulation;
    }

    _updateSimulation() {
        const nodes = this.graphManager.getNodes();
        const edges = this.graphManager.getEdges();

        this.simulation.nodes(nodes);
        this.simulation.force('link').links(edges);
        this.simulation.alpha(this.config.alpha).restart();
    }

    _onNodeAdded() {
        this._updateSimulation();
    }

    _onNodeRemoved() {
        this._updateSimulation();
    }

    _onEdgeAdded() {
        this._updateSimulation();
    }

    _onEdgeRemoved() {
        this._updateSimulation();
    }

    _onTick() {
        this.sceneManager.updateLayout(this.simulation.nodes());
    }

    destroy() {
        this.simulation.stop();
        // Unsubscribe from graph events to prevent memory leaks
        this.graphManager.removeEventListener('node:added', this._onNodeAddedHandler);
        this.graphManager.removeEventListener('node:removed', this._onNodeRemovedHandler);
        this.graphManager.removeEventListener('edge:added', this._onEdgeAddedHandler);
        this.graphManager.removeEventListener('edge:removed', this._onEdgeRemovedHandler);
    }
}

export default LayoutManager;
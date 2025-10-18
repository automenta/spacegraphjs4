import * as THREE from 'three';

class GraphManager extends THREE.EventDispatcher {
    constructor(elements = []) {
        super();
        this.nodes = new Map();
        this.edges = new Map();
        this.processInitialElements(elements);
    }

    processInitialElements(elements) {
        elements.filter(el => el.type !== 'edge').forEach(node => this.addNode(node));
        elements.filter(el => el.type === 'edge').forEach(edge => this.addEdge(edge));
    }

    addNode(node) {
        if (this.nodes.has(node.id)) return;
        this.nodes.set(node.id, { ...node });
        this.dispatchEvent({ type: 'node:added', node });
    }

    addEdge(edge) {
        if (this.edges.has(edge.id) || !this.nodes.has(edge.source) || !this.nodes.has(edge.target)) {
            return;
        }
        this.edges.set(edge.id, { ...edge });
        this.dispatchEvent({ type: 'edge:added', edge });
    }

    removeNode(nodeId) {
        if (!this.nodes.has(nodeId)) return;

        const node = this.nodes.get(nodeId);
        this.nodes.delete(nodeId);
        this.dispatchEvent({ type: 'node:removed', node });

        // Also remove connected edges
        this.edges.forEach(edge => {
            if (edge.source === nodeId || edge.target === nodeId) {
                this.removeEdge(edge.id);
            }
        });
    }

    removeEdge(edgeId) {
        if (!this.edges.has(edgeId)) return;
        const edge = this.edges.get(edgeId);
        this.edges.delete(edgeId);
        this.dispatchEvent({ type: 'edge:removed', edge });
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    getEdge(edgeId) {
        return this.edges.get(edgeId);
    }

    getNodes() {
        return [...this.nodes.values()];
    }

    getEdges() {
        return [...this.edges.values()];
    }
}

export default GraphManager;
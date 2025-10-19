import * as THREE from 'three';

class GraphManager extends THREE.EventDispatcher {
    constructor(config) {
        super();
        this.config = config;
        this.nodes = new Map();
        this.edges = new Map();
    }

    add(element) {
        if (element.type === 'edge') {
            this.addEdge(element);
        } else {
            this.addNode(element);
        }
    }

    addNode(node) {
        if (this.nodes.has(node.id)) {
            console.warn(`Node with ID ${node.id} already exists.`);
            return;
        }
        this.nodes.set(node.id, node);
        this.dispatchEvent({ type: 'node:added', node });
    }

    addEdge(edge) {
        if (this.edges.has(edge.id)) {
            console.warn(`Edge with ID ${edge.id} already exists.`);
            return;
        }
        this.edges.set(edge.id, edge);
        this.dispatchEvent({ type: 'edge:added', edge });
    }

    remove(elementId) {
        if (this.nodes.has(elementId)) {
            this.removeNode(elementId);
        } else if (this.edges.has(elementId)) {
            this.removeEdge(elementId);
        }
    }

    removeNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        // Also remove connected edges
        const edgesToRemove = [];
        this.edges.forEach(edge => {
            if (edge.source === nodeId || edge.target === nodeId) {
                edgesToRemove.push(edge.id);
            }
        });
        edgesToRemove.forEach(edgeId => this.removeEdge(edgeId));

        this.nodes.delete(nodeId);
        this.dispatchEvent({ type: 'node:removed', nodeId });
    }

    removeEdge(edgeId) {
        const edge = this.edges.get(edgeId);
        if (!edge) return;
        this.edges.delete(edgeId);
        this.dispatchEvent({ type: 'edge:removed', edgeId });
    }

    getNodes() {
        return Array.from(this.nodes.values());
    }

    getEdges() {
        return Array.from(this.edges.values());
    }

    getSubgraph(nodeId) {
        if (!this.nodes.has(nodeId)) {
            return null;
        }

        const inScope = new Set([nodeId]);
        const relevantEdges = new Set();

        this.edges.forEach(edge => {
            if (edge.source === nodeId) {
                inScope.add(edge.target);
                relevantEdges.add(edge.id);
            } else if (edge.target === nodeId) {
                inScope.add(edge.source);
                relevantEdges.add(edge.id);
            }
        });

        return {
            nodes: new Set(Array.from(inScope).filter(id => this.nodes.has(id))),
            edges: relevantEdges,
        };
    }
}

export default GraphManager;

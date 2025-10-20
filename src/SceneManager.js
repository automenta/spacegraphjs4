import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import ElementFactory from './ElementFactory.js';
import { disposeObject } from './utils.js';

class SceneManager {
    static dependencies = ['config', 'renderer', 'graph', 'SpaceGraph', 'animation'];
    constructor(config, renderer, graph, SpaceGraph, animationManager) {
        this.config = config;
        this.scene = renderer.getScene();
        this.graphManager = graph;
        this.eventDispatcher = SpaceGraph;
        this.animationManager = animationManager;
        this.elements = new Map(); // Visual objects
        this.elementFactory = new ElementFactory(config.styles);

        this._addLighting();

        // Bind event handlers once
        this._onNodeAddedHandler = this._onNodeAdded.bind(this);
        this._onNodeRemovedHandler = this._onNodeRemoved.bind(this);
        this._onEdgeAddedHandler = this._onEdgeAdded.bind(this);
        this._onEdgeRemovedHandler = this._onEdgeRemoved.bind(this);

        this.hoverFrame = this.createHoverFrame();
        this.scene.add(this.hoverFrame);

        // Subscribe to graph events
        this.graphManager.addEventListener('node:added', this._onNodeAddedHandler);
        this.graphManager.addEventListener('node:removed', this._onNodeRemovedHandler);
        this.graphManager.addEventListener('edge:added', this._onEdgeAddedHandler);
        this.graphManager.addEventListener('edge:removed', this._onEdgeRemovedHandler);
    }

    _addLighting() {
        const { ambient, directional } = this.config.scene.lighting;
        const ambientLight = new THREE.AmbientLight(ambient.color, ambient.intensity);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(directional.color, directional.intensity);
        directionalLight.position.set(directional.position.x, directional.position.y, directional.position.z);
        this.scene.add(directionalLight);
    }

    createHoverFrame() {
        // Geometry will be set dynamically, so we start with an empty one.
        const frameGeometry = new THREE.BufferGeometry();
        const frameMaterial = new THREE.LineBasicMaterial({ color: this.config.scene.hover.color, linewidth: 2 });
        const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
        frame.visible = false;
        return frame;
    }

    _onNodeAdded({ node }) {
        this._addElement(node);
    }

    _onEdgeAdded({ edge }) {
        this._addElement(edge);
    }

    _onNodeRemoved({ nodeId }) {
        this._removeElement(nodeId);
    }

    _onEdgeRemoved({ edgeId }) {
        this._removeElement(edgeId);
    }

    _addElement(element) {
        if (this.elements.has(element.id)) {
            console.warn(`Element with ID ${element.id} already exists.`);
            return;
        }

        const object = this.elementFactory.create(element, this.elements);

        if (object) {
            this.elements.set(element.id, object);
            this.scene.add(object);
        }
    }

    _removeElement(elementId) {
        const object = this.elements.get(elementId);
        if (!object) return;

        this.scene.remove(object);
        disposeObject(object);
        this.elements.delete(elementId);
    }

    update(elementId, props) {
        const object = this.elements.get(elementId);
        if (!object) {
            console.warn(`Element with ID ${elementId} not found.`);
            return;
        }

        if (props.position) {
            object.position.set(props.position.x, props.position.y, props.position.z);
            this.updateConnectedEdges(elementId);
        }

        this.elementFactory.update(object, props);
    }

    updateLayout(simulationNodes) {
        // Update node positions from the simulation
        simulationNodes.forEach(nodeData => {
            const nodeObject = this.elements.get(nodeData.id);
            if (nodeObject) {
                nodeObject.position.set(nodeData.x, nodeData.y, nodeData.z);
            }
        });

        // Update edge geometries to reflect new node positions
        this.elements.forEach(element => {
            if (element.userData.type === 'edge') {
                this.elementFactory._updateEdgeGeometry(element, this.elements.get(element.userData.source), this.elements.get(element.userData.target));
            }
        });
    }

    updateConnectedEdges(nodeId) {
        this.elements.forEach(element => {
            if (element.userData.type === 'edge' && (element.userData.source === nodeId || element.userData.target === nodeId)) {
                this.elementFactory._updateEdgeGeometry(element, this.elements.get(element.userData.source), this.elements.get(element.userData.target));
            }
        });
    }

    setHovered(elementId, isHovered) {
        const element = this.elements.get(elementId);

        if (!element || !isHovered) {
            this.hoverFrame.visible = false;
            return;
        }

        const box = new THREE.Box3().setFromObject(element, true);
        const size = box.getSize(new THREE.Vector3());

        // Check if the object has a valid, non-zero size
        if (size.x === 0 && size.y === 0 && size.z === 0) {
            this.hoverFrame.visible = false;
            return;
        }
        const center = box.getCenter(new THREE.Vector3());

        // Dispose of the old geometry to prevent memory leaks
        if (this.hoverFrame.geometry) {
            this.hoverFrame.geometry.dispose();
        }

        // Create a new geometry that matches the bounding box
        const frameGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const frameEdges = new THREE.EdgesGeometry(frameGeometry);

        this.hoverFrame.geometry = frameEdges;
        this.hoverFrame.position.copy(center);
        this.hoverFrame.scale.set(1, 1, 1).multiplyScalar(this.config.scene.hover.scale); // Reset scale before applying
        this.hoverFrame.visible = true;
    }

    destroy() {
        // Unsubscribe from graph events
        this.graphManager.removeEventListener('node:added', this._onNodeAddedHandler);
        this.graphManager.removeEventListener('node:removed',this._onNodeRemovedHandler);
        this.graphManager.removeEventListener('edge:added', this._onEdgeAddedHandler);
        this.graphManager.removeEventListener('edge:removed',this._onEdgeRemovedHandler);

        // Clear scene
        [...this.elements.keys()].forEach(id => this._removeElement(id));
        if (this.hoverFrame) {
            disposeObject(this.hoverFrame);
            this.scene.remove(this.hoverFrame);
        }
    }

    clear() {
        [...this.elements.keys()].forEach(id => this._removeElement(id));
    }

    setScope(subgraph) {
        const { fadeDuration, outOfScopeOpacity } = this.config.scope;

        this.elements.forEach((element, id) => {
            const inScope = subgraph.nodes.has(id) || subgraph.edges.has(id);
            const targetOpacity = inScope ? 1.0 : outOfScopeOpacity;
            this._tweenOpacity(element, targetOpacity, fadeDuration);
        });
    }

    resetScope() {
        const { fadeDuration } = this.config.scope;
        this.elements.forEach(element => {
            this._tweenOpacity(element, 1.0, fadeDuration);
        });
    }

    _tweenOpacity(element, targetOpacity, duration) {
        if (element instanceof CSS3DObject) {
            this.animationManager.createTween(element.element.style, { opacity: targetOpacity }, duration).start();
        } else if (element.material) {
            const material = element.material;
            material.transparent = true;
            this.animationManager.createTween(material, { opacity: targetOpacity }, duration).start();
        }
    }

    onConfigUpdate(newConfig) {
        this.config = newConfig;
        this.elementFactory.styles = newConfig.styles;
    }
}

export default SceneManager;

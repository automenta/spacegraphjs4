import * as THREE from 'three';
import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';
import CameraManager from './CameraManager.js';
import InteractionManager from './InteractionManager.js';
import LayoutManager from './LayoutManager.js';

class SpaceGraph extends THREE.EventDispatcher {
    constructor(container, { elements = [], backgroundColor = 0x000000, bloom = {} } = {}) {
        super();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 35; // Zoom out to see the whole graph

        this.cameraManager = new CameraManager(camera, container);
        this.renderer = new Renderer(container, camera, { bloom });
        this.renderer.setBackgroundColor(backgroundColor);
        this.sceneManager = new SceneManager(this.renderer.getScene(), this);
        this.interactionManager = new InteractionManager(camera, this.renderer.renderer.domElement, this.sceneManager, this);

        // Process initial elements
        const nodes = elements.filter(el => el.type !== 'edge');
        const edges = elements.filter(el => el.type === 'edge');

        nodes.forEach(node => this.sceneManager.addNode(node));
        edges.forEach(edge => this.sceneManager.addEdge(edge));

        // Initialize layout manager
        this.layoutManager = new LayoutManager(
            nodes,
            edges,
            this.onLayoutUpdate.bind(this)
        );

        this.start();
    }

    onLayoutUpdate() {
        // Update node positions
        this.layoutManager.simulation.nodes().forEach(nodeData => {
            const nodeObject = this.sceneManager.nodes.get(nodeData.id);
            if (nodeObject) {
                nodeObject.position.set(nodeData.x, nodeData.y, nodeData.z);
            }
        });

        // Update edge positions
        this.sceneManager.edges.forEach(edge => {
            const sourceNode = this.sceneManager.nodes.get(edge.userData.source);
            const targetNode = this.sceneManager.nodes.get(edge.userData.target);
            if (sourceNode && targetNode) {
                const positions = edge.geometry.attributes.position;
                positions.setXYZ(0, sourceNode.position.x, sourceNode.position.y, sourceNode.position.z);
                positions.setXYZ(1, targetNode.position.x, targetNode.position.y, targetNode.position.z);
                positions.needsUpdate = true;
                if (edge.material.isLineDashedMaterial) {
                    edge.computeLineDistances();
                }
            }
        });
    }

    add(element) {
        this.sceneManager.add(element);
    }

    remove(elementId) {
        this.sceneManager.remove(elementId);
    }

    update(elementId, props) {
        this.sceneManager.update(elementId, props);
    }

    flyTo(elementId) {
        const element = this.sceneManager.elements.get(elementId);
        if (element) {
            this.cameraManager.flyTo(element);
        }
    }

    goBack() {
        this.cameraManager.goBack();
    }

    // A simple animation loop
    start() {
        this.renderer.setAnimationLoop((time) => {
            this.cameraManager.update(time);
            this.renderer.render();
        });
    }

    destroy() {
        // 1. Stop the animation loop
        this.renderer.setAnimationLoop(null);

        // 2. Clean up managers
        this.interactionManager.destroy();
        this.sceneManager.destroy(); // Will clear the scene and dispose objects

        // 3. Destroy the renderer and remove its canvas
        this.renderer.destroy();

        // 4. Remove all event listeners from the SpaceGraph instance itself
        // The _listeners property is an internal detail of THREE.EventDispatcher
        if (this._listeners) {
            Object.keys(this._listeners).forEach(type => {
                delete this._listeners[type];
            });
        }
    }

    // Alias for addEventListener
    on(type, listener) {
        this.addEventListener(type, listener);
    }
}

export default SpaceGraph;
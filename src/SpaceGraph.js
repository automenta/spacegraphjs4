import * as THREE from 'three';
import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';
import CameraManager from './CameraManager.js';
import InteractionManager from './InteractionManager.js';
import LayoutManager from './LayoutManager.js';
import GraphManager from './GraphManager.js';
import { mergeConfig } from './Config.js';

class SpaceGraph extends THREE.EventDispatcher {
    constructor(container, userConfig = {}) {
        super();
        const config = mergeConfig(userConfig);

        this.graphManager = new GraphManager(config.graph.elements);

        const camera = new THREE.PerspectiveCamera(
            config.camera.fov,
            container.clientWidth / container.clientHeight,
            config.camera.near,
            config.camera.far
        );
        camera.position.set(config.camera.position.x, config.camera.position.y, config.camera.position.z);

        this.cameraManager = new CameraManager(camera, container, config);
        this.renderer = new Renderer(container, camera, config);
        this.sceneManager = new SceneManager(this.renderer.getScene(), this.graphManager, this, config);
        this.layoutManager = new LayoutManager(this.graphManager, this.sceneManager, config);
        this.interactionManager = new InteractionManager(camera, this.renderer.renderer.domElement, this.sceneManager, this, config);

        this.start();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.on('focus', (event) => this.flyTo(event.id));
        this.on('defocus', () => this.goBack());
    }

    add(element) {
        if (element.type === 'edge') {
            this.graphManager.addEdge(element);
        } else {
            this.graphManager.addNode(element);
        }
    }

    remove(elementId) {
        // Check if it's a node or an edge and call the appropriate method
        if (this.graphManager.nodes.has(elementId)) {
            this.graphManager.removeNode(elementId);
        } else if (this.graphManager.edges.has(elementId)) {
            this.graphManager.removeEdge(elementId);
        }
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
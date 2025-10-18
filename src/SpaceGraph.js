import * as THREE from 'three';
import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';
import CameraManager from './CameraManager.js';
import InteractionManager from './InteractionManager.js';
import LayoutManager from './LayoutManager.js';
import GraphManager from './GraphManager.js';

class SpaceGraph extends THREE.EventDispatcher {
    constructor(container, { elements = [], backgroundColor = 0x000000, bloom = {} } = {}) {
        super();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 35; // Zoom out to see the whole graph

        this.graphManager = new GraphManager();
        this.cameraManager = new CameraManager(camera, container);
        this.renderer = new Renderer(container, camera, { bloom });
        this.renderer.setBackgroundColor(backgroundColor);
        this.sceneManager = new SceneManager(this.renderer.getScene(), this, this.graphManager);
        this.interactionManager = new InteractionManager(camera, this.renderer.renderer.domElement, this.sceneManager, this);
        this.layoutManager = new LayoutManager(this.graphManager, this.sceneManager);

        // Process initial elements
        elements.forEach(element => this.graphManager.add(element));

        this.start();
    }

    add(element) {
        this.graphManager.add(element);
    }

    remove(elementId) {
        this.graphManager.remove(elementId);
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
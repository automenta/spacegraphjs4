import * as THREE from 'three';
import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';
import CameraManager from './CameraManager.js';
import InteractionManager from './InteractionManager.js';

class SpaceGraph extends THREE.EventDispatcher {
    constructor(container, { elements = [] } = {}) {
        super();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 5;

        this.cameraManager = new CameraManager(camera);
        this.renderer = new Renderer(container, camera);
        this.sceneManager = new SceneManager(this.renderer.getScene(), this); // Pass `this` as the event dispatcher
        // InteractionManager should listen on the WebGL canvas, which is the base layer.
        this.interactionManager = new InteractionManager(camera, this.renderer.renderer.domElement, this.sceneManager, this);


        // Initialize with a set of elements
        elements.forEach(element => {
            this.sceneManager.add(element);
        });

        // Initial render
        this.start();
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
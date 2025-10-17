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
        this.sceneManager = new SceneManager(this.renderer.getScene());
        this.interactionManager = new InteractionManager(camera, this.renderer.cssRenderer.domElement, this.sceneManager, this.cameraManager, this);


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
        this.renderer.setAnimationLoop(null);
        this.renderer.destroy();
        this.interactionManager.destroy();
        // Clear all elements from the scene
        [...this.sceneManager.elements.keys()].forEach(id => this.sceneManager.remove(id));
        // Remove all event listeners
        this.removeEventListener();
    }

    // Alias for addEventListener
    on(type, listener) {
        this.addEventListener(type, listener);
    }
}

export default SpaceGraph;
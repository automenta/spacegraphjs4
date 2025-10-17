import * as THREE from 'three';
import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';
import CameraManager from './CameraManager.js';
import InteractionManager from './InteractionManager.js';

class SpaceGraph {
    constructor(container, { elements = [] } = {}) {
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 5;

        this.cameraManager = new CameraManager(camera);
        this.renderer = new Renderer(container, camera);
        this.sceneManager = new SceneManager(this.renderer.getScene());
        this.interactionManager = new InteractionManager(camera, this.renderer.renderer.domElement, this.sceneManager, this.cameraManager);


        // Initialize with a set of elements
        elements.forEach(element => {
            this.sceneManager.add(element);
        });

        // Initial render
        this.start();
    }

    add(element) {
        this.sceneManager.add(element);
        this.renderer.render(); // Re-render after adding
    }

    remove(elementId) {
        this.sceneManager.remove(elementId);
        this.renderer.render(); // Re-render after removing
    }

    update(elementId, props) {
        this.sceneManager.update(elementId, props);
        this.renderer.render(); // Re-render after updating
    }

    // A simple animation loop
    start() {
        this.renderer.setAnimationLoop((time) => {
            this.cameraManager.update(time);
            this.renderer.render();
        });
    }

    destroy() {
        this.renderer.destroy();
        this.interactionManager.destroy();
        // Additional cleanup for other managers will go here
    }
}

export default SpaceGraph;
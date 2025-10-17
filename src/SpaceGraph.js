import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';

class SpaceGraph {
    constructor(container, { elements = [] } = {}) {
        this.renderer = new Renderer(container);
        this.sceneManager = new SceneManager(this.renderer.getScene());

        // Initialize with a set of elements
        elements.forEach(element => {
            this.sceneManager.add(element);
        });

        // Initial render
        this.renderer.render();
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
        this.renderer.setAnimationLoop(() => {
            // No updates per frame in this phase, but the loop is ready
            this.renderer.render();
        });
    }

    destroy() {
        this.renderer.destroy();
        // Additional cleanup for other managers will go here
    }
}

export default SpaceGraph;
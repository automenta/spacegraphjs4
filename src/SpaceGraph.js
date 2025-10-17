import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';

class SpaceGraph {
    constructor(container) {
        this.renderer = new Renderer(container);
        this.sceneManager = new SceneManager(this.renderer.getScene());

        this.sceneManager.addStaticCube();

        // Perform the initial render
        this.renderer.render();
    }
}

export default SpaceGraph;
import { ReSurface } from './ReSurface.js';
import { Stacking } from './containers/Stacking.js';
import { Stats } from './components/Stats.js';

/**
 * Manages an orthographic scene graph of surfaces.
 * This is analogous to the OrthoSurfaceGraph.java class.
 */
export class OrthoSurfaceGraph {
    constructor(content, joglWindow, scene, camera) {
        this.rendering = new ReSurface(null, scene, camera);
        this.root = new Stacking();
        this.window = joglWindow;
        this.content = content;
        this.stats = new Stats();

        if (this.content) {
            this.root.addChild(this.content);
        }
        this.root.addChild(this.stats);
        // this.root.start(this);
    }

    setRootSurface(surface) {
        if (this.content) {
            this.root.removeChild(this.content);
        }
        this.content = surface;
        this.root.addChild(this.content);
    }

    /**
     * Resizes the root surface.
     * @param {number} width - The new width.
     * @param {number} height - The new height.
     */
    resize(width, height) {
        this.root.resize(width, height);
    }

    /**
     * Renders the scene graph.
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer.
     * @param {number} startNS - The start time in nanoseconds.
     * @param {number} dtS - The delta time in seconds.
     */
    render(renderer, startNS, dtS) {
        this.stats.update();
        if (!this.root.isEmpty()) {
            const canvas = renderer.domElement;
            this.rendering.start(renderer, canvas.width, canvas.height, startNS, dtS);
            this.root.render(this.rendering);
        }
    }

    /**
     * Finds the surface at the given coordinates.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @returns {Surface|null} - The surface at the given coordinates, or null if none is found.
     */
    findSurfaceAt(x, y) {
        return this.root.finger(x, y);
    }
}

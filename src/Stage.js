import { ContainerSurface } from './ContainerSurface.js';
import * as THREE from 'three';
import { ReSurface } from './ReSurface.js';

/**
 * The Stage is the root of the scene graph. It creates the renderer and scene,
 * and manages the rendering loop.
 */
export class Stage extends ContainerSurface {
    constructor() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        super({ width, height });

        // The Stage is its own parent
        this.parent = this;

        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Create the scene
        this.scene = new THREE.Scene();

        // Create the camera. We use an orthographic camera for 2D rendering.
        this.camera = new THREE.OrthographicCamera(0, width, height, 0, -1000, 1000);
        this.camera.position.z = 500;

        // Create the ReSurface context
        this.resurface = new ReSurface(this.renderer, this.scene, this.camera);

        // Add a resize listener
        window.addEventListener('resize', this.onResize.bind(this), false);
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.bounds.width = width;
        this.bounds.height = height;

        this.renderer.setSize(width, height);

        this.camera.left = 0;
        this.camera.right = width;
        this.camera.top = height;
        this.camera.bottom = 0;
        this.camera.updateProjectionMatrix();
    }

    /**
     * The main rendering loop.
     */
    render() {
        const now = performance.now();
        const dt = (now - (this.lastTime || now)) / 1000;
        this.lastTime = now;

        // Start a new rendering frame in the ReSurface context
        this.resurface.start(this.bounds.width, this.bounds.height, now, dt);

        // Render the scene graph, starting from this Stage
        this.renderIfVisible(this.resurface);

        // Finally, render the THREE.js scene
        this.renderer.render(this.scene, this.camera);
    }
}

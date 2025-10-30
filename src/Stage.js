import { ContainerSurface } from './ContainerSurface.js';
import * as THREE from 'three';

/**
 * The Stage is the root of the scene graph. It creates the renderer and scene,
 * and manages the rendering loop.
 */
export class Stage extends ContainerSurface {
    constructor() {
        super({ width: window.innerWidth, height: window.innerHeight });

        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Create the scene
        this.scene = new THREE.Scene();

        // Create the camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 500;

        // Add a resize listener
        window.addEventListener('resize', this.onResize.bind(this), false);
    }

    onResize() {
        this.bounds.width = window.innerWidth;
        this.bounds.height = window.innerHeight;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        // Render the scene
        this.renderer.render(this.scene, this.camera);

        // Render the surfaces
        super.render(this.renderer, this.scene, this.camera);
    }
}

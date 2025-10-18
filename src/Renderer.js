import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

class Renderer {
    constructor(container, camera) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = camera;

        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        // CSS3D Renderer
        this.cssRenderer = new CSS3DRenderer();

        this.setup();
    }

    setup() {
        // WebGL Renderer Setup
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = 0;
        this.renderer.domElement.style.zIndex = 0; // Ensure WebGL is in the background

        // CSS3D Renderer Setup
        this.cssRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.cssRenderer.domElement);
        this.cssRenderer.domElement.style.position = 'absolute';
        this.cssRenderer.domElement.style.top = 0;
        this.cssRenderer.domElement.style.zIndex = 1; // CSS layer on top
        this.cssRenderer.domElement.style.pointerEvents = 'none'; // Let clicks pass through to the canvas

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.cssRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
        this.cssRenderer.render(this.scene, this.camera);
    }

    getScene() {
        return this.scene;
    }

    setBackgroundColor(color) {
        this.scene.background = new THREE.Color(color);
    }

    setAnimationLoop(callback) {
        this.renderer.setAnimationLoop(callback);
    }

    destroy() {
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.renderer.setAnimationLoop(null);
        this.renderer.dispose();
        if (this.renderer.domElement.parentElement === this.container) {
            this.container.removeChild(this.renderer.domElement);
        }
        if (this.cssRenderer.domElement.parentElement === this.container) {
            this.container.removeChild(this.cssRenderer.domElement);
        }
    }
}

export default Renderer;
import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

class Renderer {
    constructor(container, camera, options = {}) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = camera;
        this.options = options;

        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        // CSS3D Renderer
        this.cssRenderer = new CSS3DRenderer();

        this.setup();
        this.setupPostprocessing();
    }

    setup() {
        // WebGL Renderer Setup
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
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

    setupPostprocessing() {
        const renderTarget = new THREE.WebGLRenderTarget(
            this.container.clientWidth,
            this.container.clientHeight,
            {
                format: THREE.RGBAFormat // Explicitly set format
            }
        );

        this.composer = new EffectComposer(this.renderer, renderTarget);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const bloomOptions = this.options.bloom;
        if (bloomOptions && bloomOptions.enabled) {
            this.bloomPass = new UnrealBloomPass(
                new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
                bloomOptions.strength || 1.5,
                bloomOptions.radius || 0.4,
                bloomOptions.threshold || 0.85
            );
            this.composer.addPass(this.bloomPass);
        }
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.cssRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.render();
    }

    render() {
        this.composer.render();
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

        this.container.contains(this.renderer.domElement) && this.container.removeChild(this.renderer.domElement);
        this.container.contains(this.cssRenderer.domElement) && this.container.removeChild(this.cssRenderer.domElement);
    }
}

export default Renderer;
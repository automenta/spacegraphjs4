import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

class Renderer {
    static dependencies = ['config', 'camera', 'container'];
    constructor(config, camera, container) {
        this.config = config.renderer;
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = camera;

        this._setupRenderers();
        this._setupDomLayers();
        this._setupPostprocessing();
        this.setBackgroundColor(this.config.backgroundColor);


        this.onWindowResize = this._onWindowResize.bind(this);
        window.addEventListener('resize', this.onWindowResize);
    }

    _setupRenderers() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.config.antialias,
            alpha: this.config.alpha
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.cssRenderer = new CSS3DRenderer();
    }

    _setupDomLayers() {
        this.cssPointerEventsContainer = document.createElement('div');
        this.cssPointerEventsContainer.style.position = 'absolute';
        this.cssPointerEventsContainer.style.top = '0';
        this.cssPointerEventsContainer.style.left = '0';
        this.cssPointerEventsContainer.style.width = '100%';
        this.cssPointerEventsContainer.style.height = '100%';
        this.cssPointerEventsContainer.style.zIndex = '10'; // High z-index for interaction
        this.container.appendChild(this.cssPointerEventsContainer);

        const setupElement = (element, zIndex, pointerEvents = 'none') => {
            element.style.position = 'absolute';
            element.style.top = '0';
            element.style.left = '0';
            element.style.width = '100%';
            element.style.height = '100%';
            element.style.zIndex = zIndex;
            element.style.pointerEvents = pointerEvents;
            this.container.appendChild(element);
        };

        setupElement(this.renderer.domElement, 1);
        setupElement(this.cssRenderer.domElement, 2);
    }

    _setupPostprocessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloomConfig = this.config.bloom;

        if (bloomConfig && bloomConfig.enabled) {
            this.bloomPass = new UnrealBloomPass(
                new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
                bloomConfig.strength,
                bloomConfig.radius,
                bloomConfig.threshold
            );
            this.composer.addPass(this.bloomPass);
        }
    }

    _onWindowResize() {
        const { clientWidth, clientHeight } = this.container;
        this.camera.aspect = clientWidth / clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(clientWidth, clientHeight);
        this.cssRenderer.setSize(clientWidth, clientHeight);
        this.composer.setSize(clientWidth, clientHeight);
    }

    render() {
        this.composer.render();
        this.cssRenderer.render(this.scene, this.camera);
    }

    getScene() {
        return this.scene;
    }

    getDomElement() {
        return this.cssPointerEventsContainer;
    }

    isBloomEnabled() {
        return this.bloomPass ? this.bloomPass.enabled : false;
    }

    setBloom(enabled) {
        if (this.bloomPass) {
            this.bloomPass.enabled = enabled;
        }
    }

    setBackgroundColor(color) {
        this.scene.background = new THREE.Color(color);
    }

    setAnimationLoop(callback) {
        this.renderer.setAnimationLoop(callback);
    }

    destroy() {
        window.removeEventListener('resize', this.onWindowResize);
        this.renderer.setAnimationLoop(null);
        this.renderer.dispose();

        [this.renderer.domElement, this.cssRenderer.domElement, this.cssPointerEventsContainer].forEach(element => {
            element.parentElement.removeChild(element);
        });
    }

    onConfigUpdate(newConfig) {
        this.config = newConfig.renderer;
        this.setBackgroundColor(this.config.backgroundColor);
        this.setBloom(this.config.bloom.enabled);
    }
}

export default Renderer;

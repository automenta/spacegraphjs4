import * as THREE from 'three';

class Renderer {
    constructor(container, camera) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = camera;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.setup();
    }

    setup() {
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    getScene() {
        return this.scene;
    }

    setAnimationLoop(callback) {
        this.renderer.setAnimationLoop(callback);
    }

    destroy() {
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.renderer.setAnimationLoop(null);
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}

export default Renderer;
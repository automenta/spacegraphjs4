import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class ControlsManager extends THREE.EventDispatcher {
    constructor(camera, domElement, config = {}, sceneManager, interactionManager) {
        super();
        this.camera = camera;
        this.domElement = domElement;
        this.config = config;
        this.sceneManager = sceneManager;
        this.interactionManager = interactionManager;
        this.orbitControls = null;
        this.focusedElementId = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this._onWheel = this._onWheel.bind(this);
        this._onClick = this._onClick.bind(this);

        this.init();
    }

    init() {
        if (this.config.orbit) {
            this.orbitControls = new OrbitControls(this.camera, this.domElement);
            this.orbitControls.enableDamping = true;
            this.orbitControls.dampingFactor = 0.05;
            this.orbitControls.screenSpacePanning = false;
        }

        if (this.config.autoZoom) {
            this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
        }

        this.interactionManager.addEventListener('click', this._onClick);
    }

    _onClick({ id }) {
        if (id) {
            if (this.focusedElementId === id) {
                this.defocus();
            } else {
                this.focus(id);
            }
        } else if (this.focusedElementId) {
            this.defocus();
        }
    }

    _onWheel(event) {
        event.preventDefault();

        this.mouse.x = (event.clientX / this.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.domElement.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([...this.sceneManager.elements.values()], true);

        let target;
        if (intersects.length > 0) {
            target = intersects[0].point;
        } else {
            target = new THREE.Vector3();
            this.raycaster.ray.at(10, target); // Project a point 10 units away
        }

        this.dispatchEvent({ type: 'zoom', delta: event.deltaY, target });
    }

    enable() {
        if (this.orbitControls) {
            this.orbitControls.enabled = true;
        }
    }

    disable() {
        if (this.orbitControls) {
            this.orbitControls.enabled = false;
        }
    }

    update() {
        if (this.orbitControls?.enabled) {
            this.orbitControls.update();
        }
    }

    focus(id) {
        if (this.focusedElementId === id) return;
        this.focusedElementId = id;
        this.dispatchEvent({ type: 'focus', id });
    }

    defocus() {
        const id = this.focusedElementId;
        if (!id) return;
        this.focusedElementId = null;
        this.dispatchEvent({ type: 'defocus', id });
    }

    destroy() {
        if (this.orbitControls) {
            this.orbitControls.dispose();
        }
        this.domElement.removeEventListener('wheel', this._onWheel);
        this.interactionManager.removeEventListener('click', this._onClick);
    }
}

export default ControlsManager;

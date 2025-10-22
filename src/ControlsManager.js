import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class ControlsManager extends THREE.EventDispatcher {
    static dependencies = ['config', 'camera', 'raycast', 'renderer'];
    constructor(config, camera, raycastManager, renderer) {
        super();
        this.config = config.controls;
        this.camera = camera;
        this.domElement = renderer.getDomElement();
        this.raycastManager = raycastManager;
        this.orbitControls = null;
        this.autoNavigateEnabled = config.controls.autoNavigate.enabled;

        this._onWheel = this._onWheel.bind(this);
        this.init();
    }

    init() {
        this.setOrbitControls(this.config.orbit.enabled);

        if (this.config.autoNavigate.enabled) {
            this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
        }
    }

    isOrbitControlsEnabled() {
        return this.orbitControls ? this.orbitControls.enabled : false;
    }

    isAutoNavigateEnabled() {
        return this.autoNavigateEnabled;
    }

    setOrbitControls(enabled) {
        if (enabled) {
            if (!this.orbitControls) {
                this.orbitControls = new OrbitControls(this.camera, this.domElement);
                Object.assign(this.orbitControls, this.config.orbit);
            }
            this.orbitControls.enabled = true;
        } else {
            if (this.orbitControls) {
                this.orbitControls.enabled = false;
            }
        }
    }

    setAutoNavigate(enabled) {
        this.autoNavigateEnabled = enabled;
        if (enabled) {
            this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
        } else {
            this.domElement.removeEventListener('wheel', this._onWheel);
        }
    }

    _onWheel(event) {
        event.preventDefault();

        const x = (event.clientX / this.domElement.clientWidth) * 2 - 1;
        const y = -(event.clientY / this.domElement.clientHeight) * 2 + 1;
        const target = this.raycastManager.raycastDollyTarget(x, y);

        this.dispatchEvent({ type: 'dolly', delta: event.deltaY, target });
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

    destroy() {
        if (this.orbitControls) {
            this.orbitControls.dispose();
        }
        this.domElement.removeEventListener('wheel', this._onWheel);
    }

    onConfigUpdate(newConfig) {
        this.config = newConfig.controls;
        this.setOrbitControls(this.config.orbit.enabled);
        this.setAutoNavigate(this.config.autoNavigate.enabled);
    }
}

export default ControlsManager;

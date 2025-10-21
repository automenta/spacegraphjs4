import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class ControlsManager extends THREE.EventDispatcher {
    static dependencies = ['config', 'camera', 'scene', 'interaction', 'graph', 'renderer'];
    constructor(config, camera, sceneManager, interactionManager, graphManager, renderer) {
        super();
        this.config = config.controls;
        this.camera = camera;
        this.domElement = renderer.getDomElement();
        this.sceneManager = sceneManager;
        this.interactionManager = interactionManager;
        this.graphManager = graphManager;
        this.orbitControls = null;
        this.focusedElementId = null;
        this.scopedElementId = null;
        this.autoNavigateEnabled = config.controls.autoNavigate.enabled;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

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

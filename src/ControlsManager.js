import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class ControlsManager extends THREE.EventDispatcher {
    constructor(config, camera, domElement, sceneManager, interactionManager, graphManager) {
        super();
        this.config = config.controls;
        this.camera = camera;
        this.domElement = domElement;
        this.sceneManager = sceneManager;
        this.interactionManager = interactionManager;
        this.graphManager = graphManager;
        this.orbitControls = null;
        this.focusedElementId = null;
        this.scopedElementId = null;
        this.autoZoomEnabled = config.controls.autoZoom.enabled;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this._onWheel = this._onWheel.bind(this);
        this._onClick = this._onClick.bind(this);
        this._onDoubleClick = this._onDoubleClick.bind(this);

        this.init();
    }

    init() {
        this.setOrbitControls(this.config.orbit.enabled);

        if (this.config.autoZoom.enabled) {
            this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
        }

        this.interactionManager.addEventListener('click', this._onClick);
        this.interactionManager.addEventListener('doubleClick', this._onDoubleClick);
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

    setAutoZoom(enabled) {
        this.autoZoomEnabled = enabled;
        if (enabled) {
            this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
        } else {
            this.domElement.removeEventListener('wheel', this._onWheel);
        }
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

    _onDoubleClick({ id }) {
        if (!id) {
            if (this.scopedElementId) {
                this.unscope();
            }
            return;
        }

        if (this.scopedElementId === id) {
            this.unscope();
        } else {
            this.scope(id);
        }
    }

    destroy() {
        if (this.orbitControls) {
            this.orbitControls.dispose();
        }
        this.domElement.removeEventListener('wheel', this._onWheel);
        this.interactionManager.removeEventListener('click', this._onClick);
        this.interactionManager.removeEventListener('doubleClick', this._onDoubleClick);
    }

    scope(id) {
        if (this.scopedElementId === id) return;
        const subgraph = this.graphManager.getSubgraph(id);
        if (subgraph) {
            this.scopedElementId = id;
            this.sceneManager.setScope(subgraph);
        }
    }

    unscope() {
        if (!this.scopedElementId) return;
        this.scopedElementId = null;
        this.sceneManager.resetScope();
    }
}

export default ControlsManager;

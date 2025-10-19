import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';
import CameraManager from './CameraManager.js';
import InteractionManager from './InteractionManager.js';
import LayoutManager from './LayoutManager.js';
import GraphManager from './GraphManager.js';
import ControlsManager from './ControlsManager.js';
import { defaultConfig } from './config.js';

// A simple deep merge function for config objects
function deepMerge(target, source) {
    const output = { ...target };
    if (target && source && typeof target === 'object' && typeof source === 'object') {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && key in target && target[key] && typeof target[key] === 'object') {
                output[key] = deepMerge(target[key], source[key]);
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
}
class SpaceGraph extends THREE.EventDispatcher {
    constructor(config) {
        super();
        this.config = deepMerge(defaultConfig, config);
        this.container = this.config.container;

        this._initCamera();
        this._initManagers();
        this._initEventListeners();

        this.config.elements?.forEach(element => this.addElement(element));

        this.start();
    }

    _initCamera() {
        const { clientWidth, clientHeight } = this.container;
        const { fov, near, far, initialPosition } = this.config.camera;
        this.camera = new THREE.PerspectiveCamera(fov, clientWidth / clientHeight, near, far);
        this.camera.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
    }

    _initManagers() {
        this.graphManager = new GraphManager(this.config);
        this.renderer = new Renderer(this.config, this.camera);
        this.sceneManager = new SceneManager(this.config, this.renderer.getScene(), this, this.graphManager);
        this.interactionManager = new InteractionManager(this.config, this.camera, this.renderer.getDomElement(), this.sceneManager);
        this.controlsManager = new ControlsManager(this.config, this.camera, this.renderer.getDomElement(), this.sceneManager, this.interactionManager, this.graphManager);
        this.cameraManager = new CameraManager(this.config, this.camera, this.renderer.getDomElement(), this.controlsManager);
        this.layoutManager = new LayoutManager(this.config, this.graphManager, this.sceneManager);
    }

    _initEventListeners() {
        this.controlsManager.addEventListener('focus', ({ id }) => this.flyTo(id));
        this.controlsManager.addEventListener('defocus', () => this.goBack());
        this.controlsManager.addEventListener('zoom', ({ delta, target }) => this.cameraManager.zoom(target, delta));
    }

    // Public API
    addElement(element) {
        this.graphManager.add(element);
    }

    removeElement(id) {
        this.graphManager.remove(id);
    }

    addNode(nodeData) {
        this.graphManager.addNode(nodeData);
    }

    removeNode(nodeId) {
        this.graphManager.removeNode(nodeId);
    }

    connect(sourceId, targetId, edgeProps = {}) {
        const edge = {
            id: `edge-${sourceId}-${targetId}-${Date.now()}`,
            source: sourceId,
            target: targetId,
            type: 'edge',
            ...edgeProps
        };
        this.graphManager.addEdge(edge);
    }

    update(id, props) {
        this.sceneManager.update(id, props);
    }

    flyTo(id) {
        const element = this.sceneManager.elements.get(id);
        if (element) {
            this.cameraManager.flyTo(element);
        }
    }

    goBack() {
        this.cameraManager.goBack();
    }

    start() {
        this.renderer.setAnimationLoop((time) => {
            TWEEN.update(time);
            this.cameraManager.update(time);
            this.controlsManager.update();
            this.renderer.render();
        });
    }

    destroy() {
        this.renderer.setAnimationLoop(null);
        this.interactionManager.destroy();
        this.sceneManager.destroy();
        this.renderer.destroy();
        this.layoutManager.destroy();
        this.graphManager.destroy();
        this.controlsManager.destroy();

        if (this._listeners) {
            Object.keys(this._listeners).forEach(type => delete this._listeners[type]);
        }
    }

    on(type, listener) {
        this.addEventListener(type, listener);
    }
}

export default SpaceGraph;

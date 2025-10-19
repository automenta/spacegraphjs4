import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';
import CameraManager from './CameraManager.js';
import InteractionManager from './InteractionManager.js';
import LayoutManager from './LayoutManager.js';
import GraphManager from './GraphManager.js';
import ControlsManager from './ControlsManager.js';
import FisheyeManager from './FisheyeManager.js';
import { defaultConfig } from './config.js';
import { deepMerge } from './utils.js';
class SpaceGraph extends THREE.EventDispatcher {
    constructor(config) {
        super();
        this.config = deepMerge(defaultConfig, config);
        this.container = this.config.container;
        this.scopedNodeId = null;

        this._initManagers();
        this.start();
    }

    _initManagers() {
        const { clientWidth, clientHeight } = this.container;
        const { fov, near, far, initialPosition } = this.config.camera;
        this.camera = new THREE.PerspectiveCamera(fov, clientWidth / clientHeight, near, far);
        this.camera.position.set(initialPosition.x, initialPosition.y, initialPosition.z);

        this.graphManager = new GraphManager(this.config);
        this.renderer = new Renderer(this.config, this.camera);
        this.sceneManager = new SceneManager(this.config, this.renderer.getScene(), this, this.graphManager);
        this.interactionManager = new InteractionManager(this.config, this.camera, this.renderer.getDomElement(), this.sceneManager);
        this.controlsManager = new ControlsManager(this.config, this.camera, this.renderer.getDomElement(), this.sceneManager, this.interactionManager, this.graphManager);
        this.cameraManager = new CameraManager(this.config, this.camera, this.renderer.getDomElement(), this.controlsManager);
        this.layoutManager = new LayoutManager(this.config, this.graphManager, this.sceneManager);
        this.fisheyeManager = new FisheyeManager(this.config, this.camera, this.sceneManager);

        this._initEventListeners();
    }

    _initEventListeners() {
        this.controlsManager.addEventListener('focus', ({ id }) => this.flyTo(id));
        this.controlsManager.addEventListener('defocus', () => this.goBack());
        this.controlsManager.addEventListener('zoom', ({ delta, target }) => this.cameraManager.zoom(target, delta));
        this.interactionManager.addEventListener('doubleClick', ({ id }) => this.toggleScope(id));
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
        if (id) {
            const element = this.sceneManager.elements.get(id);
            if (element) {
                this.cameraManager.flyTo(element);
            }
        } else {
            // If no id is provided, fly to the entire scene
            const allElements = [...this.sceneManager.elements.values()];
            this.cameraManager.flyTo(allElements);
        }
    }

    goBack() {
        this.cameraManager.goBack();
    }

    toggleScope(nodeId) {
        if (!this.scopedNodeId) {
            // No node is currently scoped, so scope the clicked node
            const subgraph = this.graphManager.getSubgraph(nodeId);
            if (subgraph) {
                this.sceneManager.setScope(subgraph);
                this.scopedNodeId = nodeId;
            }
        } else {
            // A node is already scoped
            if (this.scopedNodeId === nodeId || nodeId === null) {
                // Clicked the same node again or the background, so reset scope
                this.sceneManager.resetScope();
                this.scopedNodeId = null;
            } else {
                // Clicked a different node, so switch scope
                this.sceneManager.resetScope();
                const subgraph = this.graphManager.getSubgraph(nodeId);
                if (subgraph) {
                    this.sceneManager.setScope(subgraph);
                    this.scopedNodeId = nodeId;
                }
            }
        }
    }

    // Methods for dynamic data loading
    setBloom(enabled) {
        this.renderer.setBloom(enabled);
    }

    setOrbitControls(enabled) {
        this.controlsManager.setOrbitControls(enabled);
    }

    setAutoZoom(enabled) {
        this.controlsManager.setAutoZoom(enabled);
    }

    setFisheye(enabled) {
        if (enabled) {
            this.fisheyeManager.enable();
        } else {
            this.fisheyeManager.disable();
        }
    }

    clear() {
        this.graphManager.clear();
        this.sceneManager.clear();
        this.cameraManager.reset();
        this.layoutManager.stop();
    }

    load(elements) {
        elements.forEach(element => this.addElement(element));
        this.layoutManager.start();
    }

    start() {
        this.renderer.setAnimationLoop((time) => {
            TWEEN.update(time);
            this.cameraManager.update(time);
            this.controlsManager.update();
            this.fisheyeManager.update();
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
        this.fisheyeManager.destroy();

        if (this._listeners) {
            Object.keys(this._listeners).forEach(type => delete this._listeners[type]);
        }
    }

    on(type, listener) {
        this.addEventListener(type, listener);
    }
}

export default SpaceGraph;

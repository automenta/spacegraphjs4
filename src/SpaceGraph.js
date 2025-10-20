import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { defaultConfig } from './config.js';
import { deepMerge } from './utils.js';

class SpaceGraph extends THREE.EventDispatcher {
    constructor(config) {
        super();
        this.config = deepMerge(defaultConfig, config);
        this.container = this.config.container;
        this.scopedNodeId = null;
        this.managers = {};

        this._initManagers();
        this._initEventListeners();
        this.start();
    }

    _initManagers() {
        // Core components
        const { clientWidth, clientHeight } = this.container;
        const { fov, near, far, initialPosition } = this.config.camera;
        this.camera = new THREE.PerspectiveCamera(fov, clientWidth / clientHeight, near, far);
        this.camera.position.set(initialPosition.x, initialPosition.y, initialPosition.z);

        // Dynamically instantiate managers based on the order defined in the config
        const managerClasses = this.config.managers;
        const managerInstances = {
            'SpaceGraph': this,
            'config': this.config,
            'camera': this.camera,
            'container': this.container,
        };

        const creationOrder = ['graph', 'renderer', 'scene', 'interaction', 'controls', 'camera', 'layout', 'fisheye'];

        for (const name of creationOrder) {
            if (managerClasses[name]) {
                const ManagerClass = managerClasses[name];
                // A bit of magic to get the constructor parameter names
                const paramNames = ManagerClass.toString().match(/constructor\s*\(([^)]*)/)[1].split(',').map(p => p.trim());
                const args = paramNames.map(p => managerInstances[p]);
                this.managers[name] = new ManagerClass(...args);
                managerInstances[name] = this.managers[name];
            }
        }
    }

    _initEventListeners() {
        this.managers.interaction.addEventListener('click', ({ id }) => this.toggleFocus(id));
        this.managers.interaction.addEventListener('doubleClick', ({ id }) => this.toggleScope(id));
        this.managers.controls.addEventListener('zoom', ({ delta, target }) => this.managers.camera.zoom(target, delta));
    }

    toggleFocus(nodeId) {
        if (this.focusedNodeId === nodeId) {
            this.goBack();
            this.focusedNodeId = null;
        } else if (nodeId) {
            this.flyTo(nodeId);
            this.focusedNodeId = nodeId;
        } else if (this.focusedNodeId) {
            this.goBack();
            this.focusedNodeId = null;
        }
    }

    // Public API
    addElement(element) { this.managers.graph.add(element); }
    removeElement(id) { this.managers.graph.remove(id); }
    addNode(nodeData) { this.managers.graph.addNode(nodeData); }
    removeNode(nodeId) { this.managers.graph.removeNode(nodeId); }
    connect(sourceId, targetId, edgeProps = {}) {
        const edge = { id: `edge-${sourceId}-${targetId}-${Date.now()}`, source: sourceId, target: targetId, type: 'edge', ...edgeProps };
        this.managers.graph.addEdge(edge);
    }
    update(id, props) { this.managers.scene.update(id, props); }

    flyTo(id) {
        const element = id ? this.managers.scene.elements.get(id) : [...this.managers.scene.elements.values()];
        if (element) {
            this.managers.camera.flyTo(element);
        }
    }

    goBack() { this.managers.camera.goBack(); }

    toggleScope(nodeId) {
        // If a node is already scoped, reset it first.
        if (this.scopedNodeId) {
            this.managers.scene.resetScope();
        }

        // If the clicked node is the one already scoped, we just reset.
        // Otherwise, scope to the new node.
        if (nodeId && this.scopedNodeId !== nodeId) {
            const subgraph = this.managers.graph.getSubgraph(nodeId);
            if (subgraph) {
                this.managers.scene.setScope(subgraph);
                this.scopedNodeId = nodeId;
            }
        } else {
            this.scopedNodeId = null;
        }
    }

    // Getters for UI
    isBloomEnabled() { return this.managers.renderer.isBloomEnabled(); }
    isOrbitControlsEnabled() { return this.managers.controls.isOrbitControlsEnabled(); }
    isAutoZoomEnabled() { return this.managers.controls.isAutoZoomEnabled(); }
    isFisheyeEnabled() { return this.managers.fisheye.isEnabled(); }

    // Setters
    setBloom(enabled) { this.managers.renderer.setBloom(enabled); }
    setOrbitControls(enabled) { this.managers.controls.setOrbitControls(enabled); }
    setAutoZoom(enabled) { this.managers.controls.setAutoZoom(enabled); }
    setFisheye(enabled) { this.managers.fisheye.setEnabled(enabled); }

    // Lifecycle
    clear() {
        this.managers.graph.clear();
        this.managers.scene.clear();
        this.managers.camera.reset();
        this.managers.layout.stop();
    }

    load(elements) {
        elements.forEach(element => this.addElement(element));
        this.managers.layout.start();
    }

    start() {
        this.managers.renderer.setAnimationLoop((time) => {
            TWEEN.update(time);
            // Dynamically update all managers
            for (const manager of Object.values(this.managers)) {
                if (typeof manager.update === 'function') {
                    manager.update(time);
                }
            }
            this.managers.renderer.render();
        });
    }

    destroy() {
        this.managers.renderer.setAnimationLoop(null);
        // Dynamically destroy all managers
        for (const manager of Object.values(this.managers)) {
            if (typeof manager.destroy === 'function') {
                manager.destroy();
            }
        }
        if (this._listeners) {
            Object.keys(this._listeners).forEach(type => delete this._listeners[type]);
        }
    }

    on(type, listener) { this.addEventListener(type, listener); }
}

export default SpaceGraph;

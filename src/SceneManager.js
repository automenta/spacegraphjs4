import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import ObjectFactory from './ObjectFactory.js';

class SceneManager {
    constructor(config, scene, eventDispatcher, graphManager) {
        this.config = config;
        this.scene = scene;
        this.eventDispatcher = eventDispatcher;
        this.graphManager = graphManager;
        this.elements = new Map(); // Visual objects
        this.objectFactory = new ObjectFactory(config.styles);

        this._addLighting();

        // Bind event handlers once
        this._onNodeAddedHandler = this._onNodeAdded.bind(this);
        this._onNodeRemovedHandler = this._onNodeRemoved.bind(this);
        this._onEdgeAddedHandler = this._onEdgeAdded.bind(this);
        this._onEdgeRemovedHandler = this._onEdgeRemoved.bind(this);

        this.hoverFrame = this.createHoverFrame();
        this.scene.add(this.hoverFrame);

        // Subscribe to graph events
        this.graphManager.addEventListener('node:added', this._onNodeAddedHandler);
        this.graphManager.addEventListener('node:removed', this._onNodeRemovedHandler);
        this.graphManager.addEventListener('edge:added', this._onEdgeAddedHandler);
        this.graphManager.addEventListener('edge:removed', this._onEdgeRemovedHandler);
    }

    _addLighting() {
        const { ambient, directional } = this.config.scene.lighting;
        const ambientLight = new THREE.AmbientLight(ambient.color, ambient.intensity);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(directional.color, directional.intensity);
        directionalLight.position.set(directional.position.x, directional.position.y, directional.position.z);
        this.scene.add(directionalLight);
    }

    createHoverFrame() {
        // Geometry will be set dynamically, so we start with an empty one.
        const frameGeometry = new THREE.BufferGeometry();
        const frameMaterial = new THREE.LineBasicMaterial({ color: this.config.scene.hover.color, linewidth: 2 });
        const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
        frame.visible = false;
        return frame;
    }

    _onNodeAdded({ node }) {
        this._addElement(node);
    }

    _onEdgeAdded({ edge }) {
        this._addElement(edge);
    }

    _onNodeRemoved({ nodeId }) {
        this._removeElement(nodeId);
    }

    _onEdgeRemoved({ edgeId }) {
        this._removeElement(edgeId);
    }

    _addElement(element) {
        if (this.elements.has(element.id)) {
            console.warn(`Element with ID ${element.id} already exists.`);
            return;
        }

        let object;
        if (element.type === 'edge') {
            object = this._createEdge(element);
        } else {
            object = this.objectFactory.create(element);
        }

        if (object) {
            this.elements.set(element.id, object);
            this.scene.add(object);
        }
    }

    _createEdge(edgeData) {
        const sourceNode = this.elements.get(edgeData.source);
        const targetNode = this.elements.get(edgeData.target);

        if (!sourceNode || !targetNode) {
            console.warn(`Edge ${edgeData.id} cannot be created: source or target node not found yet.`);
            return null;
        }

        const points = [sourceNode.position.clone(), targetNode.position.clone()];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const defaultStyle = this.config.styles.default.edge;
        const color = edgeData.color || defaultStyle.color;
        const dashed = edgeData.dashed !== undefined ? edgeData.dashed : defaultStyle.dashed;

        const material = dashed
            ? new THREE.LineDashedMaterial({ color, dashSize: 0.5, gapSize: 0.2 })
            : new THREE.LineBasicMaterial({ color });

        const line = new THREE.Line(geometry, material);
        if (dashed) {
            line.computeLineDistances();
        }

        line.userData = { ...edgeData, type: 'edge' };
        return line;
    }


    _removeElement(elementId) {
        const object = this.elements.get(elementId);
        if (!object) return;

        this.scene.remove(object);
        this._disposeObject(object);
        this.elements.delete(elementId);
    }

    _disposeObject(object) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(m => m.dispose());
            } else {
                object.material.dispose();
            }
        }
        object.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }

    update(elementId, props) {
        const object = this.elements.get(elementId);
        if (!object) {
            console.warn(`Element with ID ${elementId} not found.`);
            return;
        }

        if (props.position) {
            object.position.set(props.position.x, props.position.y, props.position.z);
            this.updateConnectedEdges(elementId);
        }

        if (props.color && object.material && object.material.color) {
            object.material.color.set(props.color);
        }

        if (props.htmlContent && object instanceof CSS3DObject) {
            object.element.innerHTML = props.htmlContent;
        }
    }

    updateLayout(simulationNodes) {
        // Update node positions from the simulation
        simulationNodes.forEach(nodeData => {
            const nodeObject = this.elements.get(nodeData.id);
            if (nodeObject) {
                nodeObject.position.set(nodeData.x, nodeData.y, nodeData.z);
            }
        });

        // Update edge geometries to reflect new node positions
        this.elements.forEach(element => {
            if (element.userData.type === 'edge') {
                this.updateEdgePosition(element);
            }
        });
    }

    updateEdgePosition(edge) {
        const sourceNode = this.elements.get(edge.userData.source);
        const targetNode = this.elements.get(edge.userData.target);
        if (!sourceNode || !targetNode) return;

        const sourceSphere = new THREE.Sphere();
        new THREE.Box3().setFromObject(sourceNode, true).getBoundingSphere(sourceSphere);
        const sourceCenter = sourceSphere.center;
        const sourceRadius = sourceSphere.radius;

        const targetSphere = new THREE.Sphere();
        new THREE.Box3().setFromObject(targetNode, true).getBoundingSphere(targetSphere);
        const targetCenter = targetSphere.center;
        const targetRadius = targetSphere.radius;

        const dir = new THREE.Vector3().subVectors(targetCenter, sourceCenter);
        const distance = dir.length();
        dir.normalize();

        // If nodes are overlapping or one is inside another, connect centers
        let startPoint = sourceCenter;
        let endPoint = targetCenter;

        // A small epsilon prevents z-fighting if nodes are touching
        if (distance > sourceRadius + targetRadius + 1e-3) {
            startPoint = sourceCenter.clone().add(dir.clone().multiplyScalar(sourceRadius));
            endPoint = targetCenter.clone().sub(dir.clone().multiplyScalar(targetRadius));
        }

        const positions = edge.geometry.attributes.position;
        positions.setXYZ(0, startPoint.x, startPoint.y, startPoint.z);
        positions.setXYZ(1, endPoint.x, endPoint.y, endPoint.z);
        positions.needsUpdate = true;
        if (edge.material.isLineDashedMaterial) {
            edge.computeLineDistances();
        }
    }

    updateConnectedEdges(nodeId) {
        this.elements.forEach(element => {
            if (element.userData.type === 'edge' && (element.userData.source === nodeId || element.userData.target === nodeId)) {
                this.updateEdgePosition(element);
            }
        });
    }

    setHovered(elementId, isHovered) {
        const element = this.elements.get(elementId);

        if (!element || !isHovered) {
            this.hoverFrame.visible = false;
            return;
        }

        const box = new THREE.Box3().setFromObject(element, true);
        const size = box.getSize(new THREE.Vector3());

        // Check if the object has a valid, non-zero size
        if (size.x === 0 && size.y === 0 && size.z === 0) {
            this.hoverFrame.visible = false;
            return;
        }
        const center = box.getCenter(new THREE.Vector3());

        // Dispose of the old geometry to prevent memory leaks
        if (this.hoverFrame.geometry) {
            this.hoverFrame.geometry.dispose();
        }

        // Create a new geometry that matches the bounding box
        const frameGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const frameEdges = new THREE.EdgesGeometry(frameGeometry);

        this.hoverFrame.geometry = frameEdges;
        this.hoverFrame.position.copy(center);
        this.hoverFrame.scale.set(1, 1, 1).multiplyScalar(this.config.scene.hover.scale); // Reset scale before applying
        this.hoverFrame.visible = true;
    }

    destroy() {
        // Unsubscribe from graph events
        this.graphManager.removeEventListener('node:added', this._onNodeAddedHandler);
        this.graphManager.removeEventListener('node:removed',this._onNodeRemovedHandler);
        this.graphManager.removeEventListener('edge:added', this._onEdgeAddedHandler);
        this.graphManager.removeEventListener('edge:removed',this._onEdgeRemovedHandler);

        // Clear scene
        [...this.elements.keys()].forEach(id => this._removeElement(id));
        if (this.hoverFrame) {
            this._disposeObject(this.hoverFrame);
            this.scene.remove(this.hoverFrame);
        }
    }

    clear() {
        [...this.elements.keys()].forEach(id => this._removeElement(id));
    }

    setScope(subgraph) {
        const { fadeDuration, outOfScopeOpacity } = this.config.scope;

        this.elements.forEach((element, id) => {
            const inScope = subgraph.nodes.has(id) || subgraph.edges.has(id);
            const targetOpacity = inScope ? 1.0 : outOfScopeOpacity;
            this._tweenOpacity(element, targetOpacity, fadeDuration);
        });
    }

    resetScope() {
        const { fadeDuration } = this.config.scope;
        this.elements.forEach(element => {
            this._tweenOpacity(element, 1.0, fadeDuration);
        });
    }

    _tweenOpacity(element, targetOpacity, duration) {
        if (element instanceof CSS3DObject) {
            new TWEEN.Tween(element.element.style)
                .to({ opacity: targetOpacity }, duration)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        } else if (element.material) {
            const material = element.material;
            material.transparent = true;
            new TWEEN.Tween(material)
                .to({ opacity: targetOpacity }, duration)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }
    }
}

export default SceneManager;

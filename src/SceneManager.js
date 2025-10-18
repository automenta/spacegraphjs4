import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import ObjectFactory from './ObjectFactory.js';

class SceneManager {
    constructor(scene, eventDispatcher, graphManager) {
        this.scene = scene;
        this.eventDispatcher = eventDispatcher;
        this.graphManager = graphManager;
        this.elements = new Map(); // Visual objects
        this.factory = new ObjectFactory(this.elements, this.eventDispatcher);

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

    createHoverFrame() {
        const frameGeometry = new THREE.BoxGeometry(1, 1, 1);
        const frameEdges = new THREE.EdgesGeometry(frameGeometry);
        const frameMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
        const frame = new THREE.LineSegments(frameEdges, frameMaterial);
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
        const object = this.factory.create(element);
        if (object) {
            this.elements.set(element.id, object);
            this.scene.add(object);
        }
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
        if (object.material) object.material.dispose();
        object.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
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

        if (props.color && object.material) {
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

        const positions = edge.geometry.attributes.position;
        positions.setXYZ(0, sourceNode.position.x, sourceNode.position.y, sourceNode.position.z);
        positions.setXYZ(1, targetNode.position.x, targetNode.position.y, targetNode.position.z);
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

        if (!element) {
            this.hoverFrame.visible = false;
            return;
        }

        if (isHovered) {
            const box = new THREE.Box3().setFromObject(element);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            this.hoverFrame.scale.set(size.x, size.y, size.z).multiplyScalar(1.1);
            this.hoverFrame.position.copy(center);
            this.hoverFrame.visible = true;
        } else {
            this.hoverFrame.visible = false;
        }
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
}

export default SceneManager;
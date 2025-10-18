import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

class SceneManager {
    constructor(scene, eventDispatcher) {
        this.scene = scene;
        this.eventDispatcher = eventDispatcher;
        this.nodes = new Map(); // Use a Map to store nodes by ID
        this.edges = new Map(); // Use a Map to store edges by ID
        this.hoverFrame = this.createHoverFrame();
        this.scene.add(this.hoverFrame);
    }

    createHoverFrame() {
        const frameGeometry = new THREE.BoxGeometry(1, 1, 1);
        const frameEdges = new THREE.EdgesGeometry(frameGeometry);
        const frameMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
        const frame = new THREE.LineSegments(frameEdges, frameMaterial);
        frame.visible = false;
        return frame;
    }

    createNode(element) {
        let object;

        switch (element.type) {
            case 'html': {
                const div = document.createElement('div');
                div.innerHTML = element.htmlContent || '';
                div.style.pointerEvents = 'auto'; // Crucial for allowing clicks

                object = new CSS3DObject(div);
                const scale = 0.01;
                object.scale.set(scale, scale, scale);

                div.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.eventDispatcher.dispatchEvent({ type: 'element:click', id: element.id });
                });
                break;
            }
            case 'sphere': {
                const material = new THREE.MeshBasicMaterial({ color: element.color || 0xffffff });
                const geometry = new THREE.SphereGeometry(element.size || 1, 32, 32);
                object = new THREE.Mesh(geometry, material);
                break;
            }
            case 'box':
            default: {
                const material = new THREE.MeshBasicMaterial({ color: element.color || 0xffffff });
                const geometry = new THREE.BoxGeometry(element.size || 1, element.size || 1, element.size || 1);
                object = new THREE.Mesh(geometry, material);
                break;
            }
        }

        object.position.set(0, 0, 0); // Initialize at origin; layout manager will position it
        object.userData.id = element.id;
        object.userData.type = element.type;
        return object;
    }

    createEdge(edgeData) {
        const sourceNode = this.nodes.get(edgeData.source);
        const targetNode = this.nodes.get(edgeData.target);

        if (!sourceNode || !targetNode) {
            console.warn(`Could not create edge "${edgeData.id}": source or target node not found.`);
            return null;
        }

        const points = [sourceNode.position, targetNode.position];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = edgeData.dashed
            ? new THREE.LineDashedMaterial({
                  color: edgeData.color || 0xffffff,
                  dashSize: 0.5,
                  gapSize: 0.25,
              })
            : new THREE.LineBasicMaterial({ color: edgeData.color || 0xffffff });

        const edgeLine = new THREE.Line(geometry, material);
        if (edgeData.dashed) {
            edgeLine.computeLineDistances();
        }

        edgeLine.userData.id = edgeData.id;
        edgeLine.userData.source = edgeData.source;
        edgeLine.userData.target = edgeData.target;

        return edgeLine;
    }

    add(element) {
        if (element.type === 'edge') {
            this.addEdge(element);
        } else {
            this.addNode(element);
        }
    }

    addNode(nodeData) {
        if (this.nodes.has(nodeData.id)) {
            console.warn(`Node with ID ${nodeData.id} already exists.`);
            return;
        }
        const nodeObject = this.createNode(nodeData);
        this.nodes.set(nodeData.id, nodeObject);
        this.scene.add(nodeObject);
    }

    addEdge(edgeData) {
        if (this.edges.has(edgeData.id)) {
            console.warn(`Edge with ID ${edgeData.id} already exists.`);
            return;
        }
        const edgeObject = this.createEdge(edgeData);
        if (edgeObject) {
            this.edges.set(edgeData.id, edgeObject);
            this.scene.add(edgeObject);
        }
    }

    remove(elementId) {
        if (this.nodes.has(elementId)) {
            this.removeNode(elementId);
        } else if (this.edges.has(elementId)) {
            this.removeEdge(elementId);
        }
    }

    removeNode(nodeId) {
        const object = this.nodes.get(nodeId);
        if (object) {
            this.scene.remove(object);
            if (object.geometry) object.geometry.dispose();
            if (object.material) object.material.dispose();
            object.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.nodes.delete(nodeId);

            // Also remove connected edges
            const edgesToRemove = [];
            this.edges.forEach(edge => {
                if (edge.userData.source === nodeId || edge.userData.target === nodeId) {
                    edgesToRemove.push(edge.userData.id);
                }
            });
            edgesToRemove.forEach(edgeId => this.removeEdge(edgeId));
        }
    }

    removeEdge(edgeId) {
        const edge = this.edges.get(edgeId);
        if (edge) {
            this.scene.remove(edge);
            if (edge.geometry) edge.geometry.dispose();
            if (edge.material) edge.material.dispose();
            this.edges.delete(edgeId);
        }
    }

    update(elementId, props) {
        const object = this.nodes.get(elementId);
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

    updateConnectedEdges(nodeId) {
        this.edges.forEach(edge => {
            if (edge.userData.source === nodeId || edge.userData.target === nodeId) {
                const sourceNode = this.nodes.get(edge.userData.source);
                const targetNode = this.nodes.get(edge.userData.target);
                if (sourceNode && targetNode) {
                    const positions = edge.geometry.attributes.position;
                    positions.setXYZ(0, sourceNode.position.x, sourceNode.position.y, sourceNode.position.z);
                    positions.setXYZ(1, targetNode.position.x, targetNode.position.y, targetNode.position.z);
                    positions.needsUpdate = true;
                    if (edge.material.isLineDashedMaterial) {
                        edge.computeLineDistances();
                    }
                }
            }
        });
    }

    setHovered(elementId, isHovered) {
        const element = this.nodes.get(elementId);

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
        [...this.nodes.keys()].forEach(id => this.removeNode(id));
        [...this.edges.keys()].forEach(id => this.removeEdge(id));

        if (this.hoverFrame) {
            if (this.hoverFrame.geometry) this.hoverFrame.geometry.dispose();
            if (this.hoverFrame.material) this.hoverFrame.material.dispose();
            this.scene.remove(this.hoverFrame);
        }
    }
}

export default SceneManager;
import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

class ObjectFactory {
    constructor(elements, eventDispatcher) {
        this.elements = elements;
        this.eventDispatcher = eventDispatcher;
        this.nodeCreators = this._initializeNodeCreators();
    }

    _initializeNodeCreators() {
        return {
            'html': (element) => {
                const { id, htmlContent = '' } = element;
                const div = document.createElement('div');
                div.innerHTML = htmlContent;
                div.style.pointerEvents = 'auto';
                div.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.eventDispatcher.dispatchEvent({ type: 'element:click', id });
                });
                const object = new CSS3DObject(div);
                const scale = 0.01;
                object.scale.set(scale, scale, scale);
                return object;
            },
            'sphere': (element) => {
                const { color = 0xffffff, size = 1 } = element;
                const geometry = new THREE.SphereGeometry(size, 32, 32);
                const material = new THREE.MeshBasicMaterial({ color });
                return new THREE.Mesh(geometry, material);
            },
            'box': (element) => {
                const { color = 0xffffff, size = 1 } = element;
                const geometry = new THREE.BoxGeometry(size, size, size);
                const material = new THREE.MeshBasicMaterial({ color });
                return new THREE.Mesh(geometry, material);
            },
        };
    }

    create(element) {
        if (element.type === 'edge') {
            return this._createEdge(element);
        }
        return this._createNode(element);
    }

    _createNode(element) {
        const creator = this.nodeCreators[element.type] || this.nodeCreators['box']; // Default to 'box'
        if (!creator) {
            console.warn(`Unknown node type: ${element.type}`);
            return null;
        }
        const object = creator(element);
        object.userData = { id: element.id, type: element.type };
        return object;
    }

    _createEdge(edgeData) {
        const sourceNode = this.elements.get(edgeData.source);
        const targetNode = this.elements.get(edgeData.target);

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
}

export default ObjectFactory;
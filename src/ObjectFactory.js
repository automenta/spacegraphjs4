import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

class ObjectFactory {
    constructor(elements, eventDispatcher) {
        this.elements = elements;
        this.eventDispatcher = eventDispatcher;
    }

    create(element) {
        switch (element.type) {
            case 'edge':
                return this._createEdge(element);
            case 'html':
            case 'sphere':
            case 'box':
                return this._createNode(element);
            default:
                console.warn(`Unknown element type: ${element.type}`);
                return null;
        }
    }

    _createNode(element) {
        const { id, type, color = 0xffffff, size = 1, htmlContent = '' } = element;
        let object, geometry, material;

        switch (type) {
            case 'html': {
                const div = document.createElement('div');
                div.innerHTML = htmlContent;
                div.style.pointerEvents = 'auto';
                div.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.eventDispatcher.dispatchEvent({ type: 'element:click', id });
                });
                object = new CSS3DObject(div);
                const scale = 0.01;
                object.scale.set(scale, scale, scale);
                break;
            }
            case 'sphere':
                geometry = new THREE.SphereGeometry(size, 32, 32);
                material = new THREE.MeshBasicMaterial({ color });
                object = new THREE.Mesh(geometry, material);
                break;
            case 'box':
            default:
                geometry = new THREE.BoxGeometry(size, size, size);
                material = new THREE.MeshBasicMaterial({ color });
                object = new THREE.Mesh(geometry, material);
                break;
        }

        object.userData = { id, type };
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
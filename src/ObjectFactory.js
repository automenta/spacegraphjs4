import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

class ObjectFactory {
    constructor(elements, eventDispatcher, config) {
        this.elements = elements;
        this.eventDispatcher = eventDispatcher;
        this.config = config;

        this.nodeCreators = {
            box: this._createBox,
            sphere: this._createSphere,
            html: this._createHtml,
        };
    }

    create(element) {
        if (element.type === 'edge') {
            return this._createEdge(element);
        }

        const creator = this.nodeCreators[element.type];
        if (!creator) {
            console.warn(`Unknown element type: ${element.type}`);
            return null;
        }

        const object = creator.call(this, element);
        object.userData = { id: element.id, type: element.type };
        return object;
    }

    _createBox(element) {
        const { color, size } = { ...this.config.defaults, ...element };
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshBasicMaterial({ color });
        return new THREE.Mesh(geometry, material);
    }

    _createSphere(element) {
        const { color, size } = { ...this.config.defaults, ...element };
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color });
        return new THREE.Mesh(geometry, material);
    }

    _createHtml(element) {
        const { id, htmlContent } = { ...this.config.defaults, ...element };
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

        const { color, dashed, dashSize, gapSize } = { ...this.config.defaults, ...this.config.edge, ...edgeData };

        const material = dashed
            ? new THREE.LineDashedMaterial({ color, dashSize, gapSize })
            : new THREE.LineBasicMaterial({ color });

        const edgeLine = new THREE.Line(geometry, material);
        if (dashed) {
            edgeLine.computeLineDistances();
        }

        edgeLine.userData = { id: edgeData.id, type: 'edge', source: edgeData.source, target: edgeData.target };

        return edgeLine;
    }
}

export default ObjectFactory;
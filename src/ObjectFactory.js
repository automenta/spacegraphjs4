import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

const nodeCreators = {
    html: (data) => {
        const element = document.createElement('div');
        element.innerHTML = data.htmlContent;
        const object = new CSS3DObject(element);
        object.userData = { id: data.id, type: 'html' };
        return object;
    },
    box: (data) => {
        const geometry = new THREE.BoxGeometry(data.width || 1, data.height || 1, data.depth || 1);
        const material = new THREE.MeshStandardMaterial({ color: data.color || 0x00ff00 });
        const object = new THREE.Mesh(geometry, material);
        object.userData = { id: data.id, type: 'box' };
        return object;
    },
};

class ObjectFactory {
    static create(data) {
        const creator = nodeCreators[data.type];
        if (creator) {
            const object = creator(data);
            object.position.set(0, 0, 0); // Default position
            return object;
        }
        return null;
    }
}

export default ObjectFactory;

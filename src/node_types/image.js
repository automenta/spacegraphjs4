import * as THREE from 'three';
import { createNode } from './createNode.js';

export function createImageNode(element, style) {
    const geometry = new THREE.PlaneGeometry(style.size, style.size);
    const texture = new THREE.TextureLoader().load(element.imageUrl);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    return createNode(element, mesh);
}

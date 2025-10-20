import * as THREE from 'three';
import { createNode } from './createNode.js';

export function createBoxNode(element, style) {
    const geometry = new THREE.BoxGeometry(style.size, style.size, style.size);
    const material = new THREE.MeshStandardMaterial({
        color: style.color,
        transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    return createNode(element, mesh);
}

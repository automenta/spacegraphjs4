import * as THREE from 'three';
import { createNode } from './createNode.js';

export function createSphereNode(element, style) {
    const geometry = new THREE.SphereGeometry(style.size / 2, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: style.color,
        transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    return createNode(element, mesh);
}

import * as THREE from 'three';

export function createSphereNode(data, style) {
    const geometry = new THREE.SphereGeometry(style.size / 2, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: style.color,
        transparent: true,
        opacity: 1,
    });
    const object = new THREE.Mesh(geometry, material);
    object.userData = { id: data.id, type: 'sphere' };
    return object;
}

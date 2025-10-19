import * as THREE from 'three';

export function createBoxNode(data, style) {
    const geometry = new THREE.BoxGeometry(style.size, style.size, style.size);
    const material = new THREE.MeshStandardMaterial({
        color: style.color,
        transparent: true,
        opacity: 1,
    });
    const object = new THREE.Mesh(geometry, material);
    object.userData = { id: data.id, type: 'box' };
    return object;
}

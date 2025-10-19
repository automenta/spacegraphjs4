import * as THREE from 'three';

export function createImageNode(data, style) {
    const geometry = new THREE.PlaneGeometry(style.size, style.size);
    const texture = new THREE.TextureLoader().load(data.imageUrl);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const object = new THREE.Mesh(geometry, material);
    object.userData = { id: data.id, type: 'image' };
    return object;
}

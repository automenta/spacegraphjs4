import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createNode } from './createNode.js';

export function createGltfNode(element, style) {
    const loader = new GLTFLoader();
    const group = new THREE.Object3D();

    loader.load(element.gltfUrl, (gltf) => {
        // Ensure materials are transparent for opacity animations
        gltf.scene.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.transparent = true;
            }
        });
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const scale = style.size / Math.max(size.x, size.y, size.z);
        gltf.scene.scale.set(scale, scale, scale);
        group.add(gltf.scene);
    });

    return createNode(element, group);
}

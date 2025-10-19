import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createGltfNode(data, style) {
    const loader = new GLTFLoader();
    const object = new THREE.Object3D();
    loader.load(data.gltfUrl, (gltf) => {
        gltf.scene.scale.set(style.size, style.size, style.size);
        object.add(gltf.scene);
    });
    object.userData = { id: data.id, type: 'gltf' };
    return object;
}

import * as THREE from 'three';

class SceneManager {
    constructor(scene) {
        this.scene = scene;
    }

    addStaticCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);
    }
}

export default SceneManager;
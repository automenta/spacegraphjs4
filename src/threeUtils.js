// src/threeUtils.js
import * as THREE from 'three';

/**
 * Calculates the camera position to frame a target.
 * @param {THREE.PerspectiveCamera} camera - The camera.
 * @param {THREE.Box3} box - The bounding box of the target.
 * @returns {Object} - { position: THREE.Vector3, target: THREE.Vector3 }
 */
export function calculateCameraPosition(camera, box, padding = 1.2) {
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = sphere.radius;

    const fov = camera.fov * (Math.PI / 180);
    const distance = padding * radius / Math.tan(fov / 2);

    const direction = new THREE.Vector3().subVectors(camera.position, center).normalize();
    const position = center.clone().add(direction.multiplyScalar(distance));

    return { position, target: center };
}

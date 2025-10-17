import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

class CameraManager {
    constructor(camera) {
        this.camera = camera;
        this.history = []; // Stack to store previous camera states
        this.isAnimating = false;
    }

    // Fly the camera to a target element
    flyTo(element) {
        if (this.isAnimating) return;

        // Save current state before flying
        this.history.push({
            position: this.camera.position.clone(),
            target: new THREE.Vector3(0, 0, 0), // Assuming the general focus is the center
        });

        const targetObject = element; // Assuming element is a THREE.Object3D
        const box = new THREE.Box3().setFromObject(targetObject);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Calculate the distance to frame the object
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.2; // Add 20% padding

        const targetPosition = new THREE.Vector3(center.x, center.y, center.z + cameraZ);

        this.animateCamera(targetPosition, center);
    }

    // Go back to the previous camera state
    goBack() {
        if (this.isAnimating || this.history.length === 0) return;

        const prevState = this.history.pop();
        this.animateCamera(prevState.position, prevState.target);
    }

    // Animate camera to a new position and target
    animateCamera(targetPosition, targetLookAt) {
        this.isAnimating = true;

        const currentPosition = this.camera.position.clone();
        // The target to look at should not be animated, but set directly
        const lookAt = targetLookAt;

        new TWEEN.Tween(currentPosition)
            .to(targetPosition, 500) // 500ms animation
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate((pos) => {
                this.camera.position.copy(pos);
                this.camera.lookAt(lookAt);
            })
            .onComplete(() => {
                this.isAnimating = false;
                this.camera.lookAt(lookAt); // Ensure final lookAt is correct
            })
            .start();
    }

    // Update needs to be called in the main animation loop
    update(time) {
        TWEEN.update(time);
    }
}

export default CameraManager;
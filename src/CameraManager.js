import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

class CameraManager {
    constructor(camera, container) {
        this.camera = camera;
        this.container = container;
        this.history = []; // Stack to store previous camera states
        this.isAnimating = false;
        // The point the camera is currently looking at
        this.currentTarget = new THREE.Vector3(0, 0, 0);
    }

    // Fly the camera to a target element
    flyTo(element) {
        if (this.isAnimating) return;

        // Save current state before flying
        this.history.push({
            position: this.camera.position.clone(),
            target: this.currentTarget.clone(),
        });

        const targetObject = element; // Assuming element is a THREE.Object3D
        const box = new THREE.Box3().setFromObject(targetObject);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // For HTML elements, the size might be small in 3D units but large in pixels.
        // A larger padding helps ensure the entire element is visible.
        const isHtml = element.isCSS3DObject;
        const padding = isHtml ? 1.5 : 1.2;
        const fov = this.camera.fov * (Math.PI / 180);
        const aspect = this.container.clientWidth / this.container.clientHeight;

        // Calculate the distance required to fit the object's height within the vertical FOV
        const distanceHeight = (size.y / 2) / Math.tan(fov / 2);

        // Calculate the horizontal FOV
        const hfov = 2 * Math.atan(Math.tan(fov / 2) * aspect);

        // Calculate the distance required to fit the object's width within the horizontal FOV
        const distanceWidth = (size.x / 2) / Math.tan(hfov / 2);

        // Use the larger of the two distances to ensure the entire object is framed
        const distance = padding * Math.max(distanceHeight, distanceWidth);

        const direction = new THREE.Vector3().subVectors(this.camera.position, center).normalize();
        const targetPosition = new THREE.Vector3().addVectors(center, direction.multiplyScalar(distance));

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
        const currentLookAt = this.currentTarget.clone();

        new TWEEN.Tween(currentPosition)
            .to(targetPosition, 500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                this.camera.position.copy(currentPosition);
            })
            .start();

        new TWEEN.Tween(currentLookAt)
            .to(targetLookAt, 500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                this.camera.lookAt(currentLookAt);
                this.currentTarget.copy(currentLookAt);
            })
            .onComplete(() => {
                this.isAnimating = false;
                this.camera.lookAt(targetLookAt);
                this.currentTarget.copy(targetLookAt);
            })
            .start();
    }

    // Update needs to be called in the main animation loop
    update(time) {
        TWEEN.update(time);
    }
}

export default CameraManager;
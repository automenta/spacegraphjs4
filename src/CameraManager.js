import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

class CameraManager {
    constructor(camera, container, config) {
        this.camera = camera;
        this.container = container;
        this.config = config.camera;
        this.history = []; // Stack to store previous camera states
        this.isAnimating = false;
        // The point the camera is currently looking at
        this.currentTarget = new THREE.Vector3(0, 0, 0);
    }

    // Fly the camera to a target element
    flyTo(element) {
        if (this.isAnimating) return;

        this.history.push({
            position: this.camera.position.clone(),
            target: this.currentTarget.clone(),
        });

        const box = new THREE.Box3().setFromObject(element);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const fov = this.camera.fov * (Math.PI / 180);
        const aspect = this.camera.aspect;
        const distanceY = size.y / 2 / Math.tan(fov / 2);
        const distanceX = size.x / 2 / Math.tan(fov / 2 * aspect);
        const distance = (element.isCSS3DObject ? 1.5 : 1.2) * Math.max(distanceX, distanceY);

        const direction = new THREE.Vector3().subVectors(this.camera.position, center).normalize();
        const targetPosition = center.clone().add(direction.multiplyScalar(distance));

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

        const { duration, easing } = this.config.flyTo;
        const easingFunction = TWEEN.Easing[easing.split('.')[0]][easing.split('.')[1]];

        const currentPosition = this.camera.position.clone();
        const currentLookAt = this.currentTarget.clone();

        new TWEEN.Tween(currentPosition)
            .to(targetPosition, duration)
            .easing(easingFunction)
            .onUpdate(() => this.camera.position.copy(currentPosition))
            .start();

        new TWEEN.Tween(currentLookAt)
            .to(targetLookAt, duration)
            .easing(easingFunction)
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
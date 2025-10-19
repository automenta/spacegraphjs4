import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

class CameraManager {
    constructor(config, camera, domElement, controlsManager) {
        this.config = config.camera;
        this.camera = camera;
        this.domElement = domElement;
        this.controlsManager = controlsManager;
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

    // Reset the camera to its initial state
    reset() {
        const { x, y, z } = this.config.initialPosition;
        const initialPosition = new THREE.Vector3(x, y, z);
        const initialTarget = new THREE.Vector3(0, 0, 0);

        this.animateCamera(initialPosition, initialTarget);
        this.history = [];
    }

    // Animate camera to a new position and target
    animateCamera(targetPosition, targetLookAt) {
        this.isAnimating = true;
        this.controlsManager.disable();

        const currentPosition = this.camera.position.clone();
        const currentLookAt = this.currentTarget.clone();

        new TWEEN.Tween(currentPosition)
            .to(targetPosition, this.config.animationDuration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                this.camera.position.copy(currentPosition);
            })
            .start();

        new TWEEN.Tween(currentLookAt)
            .to(targetLookAt, this.config.animationDuration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                this.camera.lookAt(currentLookAt);
                this.currentTarget.copy(currentLookAt);
            })
            .onComplete(() => {
                this.isAnimating = false;
                this.camera.lookAt(targetLookAt);
                this.currentTarget.copy(targetLookAt);
                this.controlsManager.enable();
            })
            .start();
    }

    // Update needs to be called in the main animation loop
    update(time) {
        TWEEN.update(time);
    }

    // Zoom the camera towards a target point
    zoom(target, delta) {
        const direction = new THREE.Vector3().subVectors(target, this.camera.position);
        const distance = direction.length();
        const zoomDistance = distance * this.config.zoomSpeed * delta;

        // Don't zoom past the target
        if (zoomDistance > distance) {
            return;
        }

        direction.normalize();
        this.camera.position.add(direction.multiplyScalar(zoomDistance));

        // Also update the orbit controls target to pivot around the new point
        if (this.controlsManager.orbitControls) {
            this.controlsManager.orbitControls.target.copy(target);
        }
    }
}

export default CameraManager;
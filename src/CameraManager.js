import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class CameraManager {
    constructor(camera, container, config) {
        this.camera = camera;
        this.container = container;
        this.config = config.camera;
        this.history = []; // Stack to store previous camera states
        this.isAnimating = false;
        // The point the camera is currently looking at
        this.currentTarget = new THREE.Vector3(0, 0, 0);

        this.controls = new OrbitControls(this.camera, this.container);
        const controlsConfig = this.config.controls;
        this.controls.enableDamping = controlsConfig.enableDamping;
        this.controls.dampingFactor = controlsConfig.dampingFactor;
        this.controls.screenSpacePanning = controlsConfig.screenSpacePanning;
        this.controls.minDistance = controlsConfig.minDistance;
        this.controls.maxDistance = controlsConfig.maxDistance;
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

    // Zoom towards a specific point
    zoom(delta, targetPosition) {
        if (this.isAnimating) return;

        const zoomTarget = targetPosition || this.controls.target;

        // When zooming towards a specific object, we should update the controls target
        if (targetPosition) {
            this.controls.target.copy(targetPosition);
        }

        const direction = new THREE.Vector3().subVectors(this.camera.position, zoomTarget);
        const distance = direction.length();

        const newDistance = Math.max(
            this.config.controls.minDistance,
            Math.min(this.config.controls.maxDistance, distance + delta)
        );

        if (Math.abs(newDistance - distance) < 0.001) return;

        direction.normalize();
        const newPosition = zoomTarget.clone().add(direction.multiplyScalar(newDistance));

        this.camera.position.copy(newPosition);
    }

    // Animate camera to a new position and target
    animateCamera(targetPosition, targetLookAt) {
        this.isAnimating = true;
        this.controls.enabled = false;

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
                this.controls.enabled = true;
                this.camera.lookAt(targetLookAt);
                this.controls.target.copy(targetLookAt);
                this.currentTarget.copy(targetLookAt);
            })
            .start();
    }

    // Update needs to be called in the main animation loop
    update(time) {
        TWEEN.update(time);
        this.controls.update();
    }
}

export default CameraManager;
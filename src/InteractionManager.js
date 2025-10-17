import * as THREE from 'three';

class InteractionManager {
    constructor(camera, canvas, sceneManager, cameraManager) {
        this.camera = camera;
        this.canvas = canvas;
        this.sceneManager = sceneManager;
        this.cameraManager = cameraManager;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredElementId = null;

        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        this.canvas.addEventListener('click', this.onClick.bind(this), false);
    }

    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / this.canvas.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.canvas.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.sceneManager.getScene().children);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            const elementId = intersectedObject.userData.id;
            if (this.hoveredElementId !== elementId) {
                this.setHovered(elementId, intersectedObject);
            }
        } else {
            if (this.hoveredElementId !== null) {
                this.setHovered(null, null);
            }
        }
    }

    onClick(event) {
        if (this.hoveredElementId) {
            const element = this.sceneManager.elements.get(this.hoveredElementId);
            this.cameraManager.flyTo(element);
        }
    }

    setHovered(elementId, object) {
        // Unhover previous element
        if (this.hoveredElementId) {
            this.sceneManager.setHovered(this.hoveredElementId, false);
        }

        this.hoveredElementId = elementId;

        // Hover new element
        if (this.hoveredElementId) {
            this.sceneManager.setHovered(this.hoveredElementId, true);
        }
    }

    destroy() {
        this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.removeEventListener('click', this.onClick.bind(this));
    }
}

export default InteractionManager;
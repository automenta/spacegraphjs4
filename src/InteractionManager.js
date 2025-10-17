import * as THREE from 'three';

class InteractionManager {
    constructor(camera, canvas, sceneManager, cameraManager, eventDispatcher) {
        this.camera = camera;
        this.canvas = canvas;
        this.sceneManager = sceneManager;
        this.cameraManager = cameraManager;
        this.eventDispatcher = eventDispatcher; // To dispatch events like 'element:click'
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredElementId = null;
        this.focusedElementId = null; // The element the camera is currently focused on

        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);

        this.canvas.addEventListener('mousemove', this.onMouseMove, false);
        this.canvas.addEventListener('click', this.onClick, false);
    }

    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / this.canvas.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.canvas.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Ensure we only intersect with the elements we manage, not the whole scene
        const intersects = this.raycaster.intersectObjects([...this.sceneManager.elements.values()]);

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
            // Dispatch a generic click event with the element's ID
            this.eventDispatcher.dispatchEvent({ type: 'element:click', id: this.hoveredElementId });

            const element = this.sceneManager.elements.get(this.hoveredElementId);
            if (element) {
                if (this.hoveredElementId === this.focusedElementId) {
                    this.cameraManager.goBack();
                    this.focusedElementId = null; // Clear focus
                } else {
                    this.cameraManager.flyTo(element);
                    this.focusedElementId = this.hoveredElementId; // Set new focus
                }
            }
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
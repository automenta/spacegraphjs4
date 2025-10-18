import * as THREE from 'three';

class InteractionManager {
    constructor(camera, canvas, sceneManager, graph) { // graph is the eventDispatcher and public API
        this.camera = camera;
        this.canvas = canvas;
        this.sceneManager = sceneManager;
        this.graph = graph;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredElementId = null;
        this.focusedElementId = null;

        this.onMouseMove = this.onMouseMove.bind(this);
        this.onCanvasClick = this.onCanvasClick.bind(this);

        this.canvas.addEventListener('mousemove', this.onMouseMove, false);
        this.canvas.addEventListener('click', this.onCanvasClick, false);
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
            // IMPORTANT: Ignore 'html' type for hover-framing, as per requirements.
            if (intersectedObject.userData.type === 'html') {
                this.setHovered(null);
                return;
            }

            const elementId = intersectedObject.userData.id;
            if (this.hoveredElementId !== elementId) {
                this.setHovered(elementId);
            }
        } else {
            if (this.hoveredElementId !== null) {
                this.setHovered(null);
            }
        }
    }

    onCanvasClick(event) {
        // This handles clicks on the canvas for geometric objects
        if (this.hoveredElementId) {
            const element = this.sceneManager.elements.get(this.hoveredElementId);
            if (element && element.userData.type !== 'html') {
                // Dispatch a generic click event with the element's ID
                this.graph.dispatchEvent({ type: 'element:click', id: this.hoveredElementId });

                if (this.hoveredElementId === this.focusedElementId) {
                    this.graph.goBack();
                    this.focusedElementId = null; // Clear focus
                } else {
                    this.graph.flyTo(this.hoveredElementId);
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
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('click', this.onCanvasClick);
    }
}

export default InteractionManager;
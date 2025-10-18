import * as THREE from 'three';

class InteractionManager {
    constructor(camera, canvas, sceneManager, graph, config) { // graph is the eventDispatcher and public API
        this.camera = camera;
        this.canvas = canvas;
        this.sceneManager = sceneManager;
        this.graph = graph;
        this.config = config.interactions;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredElementId = null;
        this.focusedElementId = null;

        this.isDragging = false;
        this.dragThreshold = 3;
        this.downPosition = new THREE.Vector2();

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onCanvasClick = this.onCanvasClick.bind(this);

        this.canvas.addEventListener('mousedown', this.onMouseDown, false);
        this.canvas.addEventListener('mouseup', this.onMouseUp, false);
        this.canvas.addEventListener('mousemove', this.onMouseMove, false);
    }

    onMouseDown(event) {
        this.isDragging = false;
        this.downPosition.set(event.clientX, event.clientY);
    }

    onMouseUp(event) {
        if (!this.isDragging) {
            this.onCanvasClick(event);
        }
    }

    onMouseMove(event) {
        if (event.buttons > 0) { // If mouse button is held down
            if (!this.isDragging) { // Only check if not already dragging
                const distance = this.downPosition.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
                if (distance > this.dragThreshold) {
                    this.isDragging = true;
                }
            }
        }

        this.mouse.x = (event.clientX / this.canvas.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.canvas.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([...this.sceneManager.elements.values()]);

        const intersectedObject = intersects.length > 0 ? intersects[0].object : null;
        const isHtml = intersectedObject?.userData.type === 'html';
        const newHoveredId = (intersectedObject && !isHtml) ? intersectedObject.userData.id : null;

        if (this.hoveredElementId !== newHoveredId) {
            this.setHovered(newHoveredId);
        }
    }

    onCanvasClick(event) {
        if (!this.hoveredElementId) {
            if (this.focusedElementId) {
                this.graph.dispatchEvent({ type: 'defocus' });
                this.focusedElementId = null;
            }
            return;
        }

        this.graph.dispatchEvent({ type: 'element:click', id: this.hoveredElementId });

        const isFocused = this.hoveredElementId === this.focusedElementId;
        if (isFocused) {
            this.graph.dispatchEvent({ type: 'defocus' });
            this.focusedElementId = null;
        } else {
            this.focusedElementId = this.hoveredElementId;
            this.graph.dispatchEvent({ type: 'focus', id: this.focusedElementId });
        }
    }

    setHovered(elementId) {
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
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mouseup', this.onMouseUp);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
    }
}

export default InteractionManager;

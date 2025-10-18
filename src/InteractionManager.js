import * as THREE from 'three';

class InteractionManager {
    constructor(camera, domElement, sceneManager, graph) { // graph is the eventDispatcher and public API
        this.camera = camera;
        this.domElement = domElement;
        this.sceneManager = sceneManager;
        this.graph = graph;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredElementId = null;
        this.focusedElementId = null;

        this.onMouseMove = this.onMouseMove.bind(this);
        this.onCanvasClick = this.onCanvasClick.bind(this);

        this.domElement.addEventListener('mousemove', this.onMouseMove, false);
        this.domElement.addEventListener('click', this.onCanvasClick, false);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / this.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.domElement.clientHeight) * 2 + 1;

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
        if (!this.hoveredElementId) return;

        this.graph.dispatchEvent({ type: 'element:click', id: this.hoveredElementId });

        const isFocused = this.hoveredElementId === this.focusedElementId;
        this.focusedElementId = isFocused ? null : this.hoveredElementId;
        isFocused ? this.graph.goBack() : this.graph.flyTo(this.hoveredElementId);
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
        this.domElement.removeEventListener('mousemove', this.onMouseMove);
        this.domElement.removeEventListener('click', this.onCanvasClick);
    }
}

export default InteractionManager;
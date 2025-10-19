import * as THREE from 'three';

class InteractionManager extends THREE.EventDispatcher {
    constructor(config, camera, domElement, sceneManager) {
        super();
        this.config = config;
        this.camera = camera;
        this.domElement = domElement;
        this.sceneManager = sceneManager;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredElementId = null;
        this.lastClickTime = 0;
        this.lastClickedId = null;

        this.isDragging = false;
        this.dragStartMouse = new THREE.Vector2();

        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);

        this._addEventListeners();
    }

    _addEventListeners() {
        this.domElement.addEventListener('mousedown', this._onMouseDown);
        this.domElement.addEventListener('mousemove', this._onMouseMove);
        this.domElement.addEventListener('mouseup', this._onMouseUp);
        this.domElement.addEventListener('mouseleave', () => {
            this._setHovered(null);
        });
    }

    _removeEventListeners() {
        this.domElement.removeEventListener('mousedown', this._onMouseDown);
        this.domElement.removeEventListener('mousemove', this._onMouseMove);
        this.domElement.removeEventListener('mouseup', this._onMouseUp);
    }

    _onMouseDown(event) {
        this.isDragging = false;
        this.dragStartMouse.set(event.clientX, event.clientY);
    }

    _onMouseMove(event) {
        if (!this.isDragging && event.buttons > 0) {
            const distance = this.dragStartMouse.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
            if (distance > this.config.interaction.dragThreshold) {
                this.isDragging = true;
            }
        }

        this.mouse.x = (event.clientX / this.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.domElement.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([...this.sceneManager.elements.values()]);

        const firstIntersected = intersects[0]?.object;
        const isHtml = firstIntersected?.userData.type === 'html';
        const newHoveredId = firstIntersected && !isHtml ? firstIntersected.userData.id : null;

        if (this.hoveredElementId !== newHoveredId) {
            this._setHovered(newHoveredId);
        }
    }

    _onMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            return;
        }

        const currentTime = Date.now();
        const clickedId = this.hoveredElementId;

        if (clickedId &&
            this.lastClickedId === clickedId &&
            (currentTime - this.lastClickTime) < this.config.interaction.doubleClickTimeout) {
            // Double-click detected
            this.dispatchEvent({ type: 'doubleClick', id: clickedId });
            this.lastClickTime = 0;
            this.lastClickedId = null;
        } else {
            // Single-click
            this.dispatchEvent({ type: 'click', id: clickedId });
            this.lastClickTime = currentTime;
            this.lastClickedId = clickedId;
        }
    }

    _setHovered(id) {
        if (this.hoveredElementId === id) return;

        if (this.hoveredElementId) {
            this.sceneManager.setHovered(this.hoveredElementId, false);
            this.dispatchEvent({ type: 'element:unhover', id: this.hoveredElementId });
        }

        this.hoveredElementId = id;

        if (this.hoveredElementId) {
            this.sceneManager.setHovered(this.hoveredElementId, true);
            this.dispatchEvent({ type: 'element:hover', id: this.hoveredElementId });
        }
    }

    destroy() {
        this._removeEventListeners();
    }
}

export default InteractionManager;

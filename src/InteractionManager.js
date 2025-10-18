import * as THREE from 'three';

class InteractionManager extends THREE.EventDispatcher {
    constructor(camera, domElement, sceneManager) {
        super();
        this.camera = camera;
        this.domElement = domElement;
        this.sceneManager = sceneManager;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredElementId = null;
        this.focusedElementId = null;

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
            if (distance > 2) { // Drag threshold
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

        if (this.hoveredElementId) {
            this.dispatchEvent({ type: 'element:click', id: this.hoveredElementId });
            if (this.focusedElementId === this.hoveredElementId) {
                this._defocus();
            } else {
                this._focus(this.hoveredElementId);
            }
        } else if (this.focusedElementId) {
            this._defocus();
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

    _focus(id) {
        if (this.focusedElementId === id) return;
        this.focusedElementId = id;
        this.dispatchEvent({ type: 'focus', id });
    }

    _defocus() {
        const id = this.focusedElementId;
        if (!id) return;
        this.focusedElementId = null;
        this.dispatchEvent({ type: 'defocus', id });
    }

    destroy() {
        this._removeEventListeners();
    }
}

export default InteractionManager;

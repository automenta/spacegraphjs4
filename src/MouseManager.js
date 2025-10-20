// src/MouseManager.js
import * as THREE from 'three';

class MouseManager extends THREE.EventDispatcher {
    static dependencies = ['config', 'renderer'];
    constructor(config, renderer) {
        super();
        this.config = config.interaction;
        this.domElement = renderer.getDomElement();
        this.mouse = new THREE.Vector2(); // Normalized mouse position
        this.isDragging = false;
        this.dragStartMouse = new THREE.Vector2(); // Client coordinates
        this.lastClickTime = 0;

        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);

        this._addEventListeners();
    }

    _addEventListeners() {
        this.domElement.addEventListener('mousedown', this._onMouseDown);
        this.domElement.addEventListener('mousemove', this._onMouseMove);
        this.domElement.addEventListener('mouseup', this._onMouseUp);
        this.domElement.addEventListener('mouseleave', () => this.dispatchEvent({ type: 'mouseleave' }));
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
        this.mouse.x = (event.clientX / this.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.domElement.clientHeight) * 2 + 1;
        this.dispatchEvent({ type: 'mousemove', x: this.mouse.x, y: this.mouse.y });

        if (!this.isDragging && event.buttons > 0) {
            const distance = this.dragStartMouse.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
            if (distance > this.config.dragThreshold) {
                this.isDragging = true;
                this.dispatchEvent({ type: 'dragstart' });
            }
        }
    }

    _onMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.dispatchEvent({ type: 'dragend' });
            return;
        }

        const currentTime = Date.now();
        if ((currentTime - this.lastClickTime) < this.config.doubleClickTimeout) {
            this.dispatchEvent({ type: 'doubleclick' });
            this.lastClickTime = 0;
        } else {
            this.dispatchEvent({ type: 'click' });
            this.lastClickTime = currentTime;
        }
    }

    getMouse() {
        return this.mouse;
    }

    destroy() {
        this._removeEventListeners();
    }
}

export default MouseManager;

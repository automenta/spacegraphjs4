import * as THREE from 'three';

class InteractionManager extends THREE.EventDispatcher {
    static dependencies = ['scene', 'mouse', 'raycast'];
    constructor(sceneManager, mouseManager, raycastManager) {
        super();
        this.sceneManager = sceneManager;
        this.mouseManager = mouseManager;
        this.raycastManager = raycastManager;
        this.lastClickedId = null;

        this._addEventListeners();
    }

    _addEventListeners() {
        this.mouseManager.addEventListener('click', this._onClick.bind(this));
        this.mouseManager.addEventListener('doubleclick', this._onDoubleClick.bind(this));
        this.raycastManager.addEventListener('element:hover', this._onElementHover.bind(this));
        this.raycastManager.addEventListener('element:unhover', this._onElementUnhover.bind(this));
    }

    _removeEventListeners() {
        this.mouseManager.removeEventListener('click', this._onClick.bind(this));
        this.mouseManager.removeEventListener('doubleclick', this._onDoubleClick.bind(this));
        this.raycastManager.removeEventListener('element:hover', this._onElementHover.bind(this));
        this.raycastManager.removeEventListener('element:unhover', this._onElementUnhover.bind(this));
    }

    _onClick() {
        const id = this.raycastManager.getHoveredElementId();
        this.dispatchEvent({ type: 'click', id });
        this.lastClickedId = id;
    }

    _onDoubleClick() {
        const id = this.raycastManager.getHoveredElementId();
        if (id && id === this.lastClickedId) {
            this.dispatchEvent({ type: 'doubleClick', id });
        }
    }

    _onElementHover({ id }) {
        this.sceneManager.setHovered(id, true);
        this.dispatchEvent({ type: 'element:hover', id });
    }

    _onElementUnhover({ id }) {
        this.sceneManager.setHovered(id, false);
        this.dispatchEvent({ type: 'element:unhover', id });
    }

    destroy() {
        this._removeEventListeners();
    }
}

export default InteractionManager;

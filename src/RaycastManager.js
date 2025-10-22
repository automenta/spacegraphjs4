// src/RaycastManager.js
import * as THREE from 'three';

class RaycastManager extends THREE.EventDispatcher {
    static dependencies = ['camera', 'scene', 'mouse'];
    constructor(camera, sceneManager, mouseManager) {
        super();
        this.camera = camera;
        this.sceneManager = sceneManager;
        this.mouseManager = mouseManager;
        this.raycaster = new THREE.Raycaster();
        this.hoveredElementId = null;

        this._onMouseMove = this._onMouseMove.bind(this);
        this.mouseManager.addEventListener('mousemove', this._onMouseMove);
    }

    _onMouseMove({ x, y }) {
        this.raycaster.setFromCamera({ x, y }, this.camera);
        const intersects = this.raycaster.intersectObjects([...this.sceneManager.elements.values()], true);
        const firstIntersected = intersects[0]?.object;
        let newHoveredId = null;

        if (firstIntersected) {
            let current = firstIntersected;
            while (current.parent && !current.userData.id) {
                current = current.parent;
            }
            if (current.userData.type !== 'html') {
                newHoveredId = current.userData.id;
            }
        }

        if (this.hoveredElementId !== newHoveredId) {
            this.setHovered(newHoveredId);
        }
    }

    setHovered(id) {
        if (this.hoveredElementId) {
            this.dispatchEvent({ type: 'element:unhover', id: this.hoveredElementId });
        }
        this.hoveredElementId = id;
        if (this.hoveredElementId) {
            this.dispatchEvent({ type: 'element:hover', id: this.hoveredElementId });
        }
    }

    getHoveredElementId() {
        return this.hoveredElementId;
    }

    raycastDollyTarget(x, y) {
        this.raycaster.setFromCamera({ x, y }, this.camera);
        const intersects = this.raycaster.intersectObjects([...this.sceneManager.elements.values()], true);
        if (intersects.length > 0) {
            return intersects[0].point;
        }

        const target = new THREE.Vector3();
        return this.raycaster.ray.at(10, target); // Project a point 10 units away
    }

    destroy() {
        this.mouseManager.removeEventListener('mousemove', this._onMouseMove);
    }
}

export default RaycastManager;

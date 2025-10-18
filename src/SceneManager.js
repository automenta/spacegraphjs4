import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

class SceneManager {
    constructor(scene, eventDispatcher) {
        this.scene = scene;
        this.eventDispatcher = eventDispatcher;
        this.elements = new Map(); // Use a Map to store elements by ID
        this.hoverFrame = this.createHoverFrame();
        this.scene.add(this.hoverFrame);
    }

    createHoverFrame() {
        const frameGeometry = new THREE.BoxGeometry(1, 1, 1);
        const frameEdges = new THREE.EdgesGeometry(frameGeometry);
        const frameMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
        const frame = new THREE.LineSegments(frameEdges, frameMaterial);
        frame.visible = false;
        return frame;
    }

    createObject(element) {
        let object;

        switch (element.type) {
            case 'html': {
                const div = document.createElement('div');
                div.innerHTML = element.htmlContent || '';
                div.style.pointerEvents = 'auto'; // Crucial for allowing clicks

                object = new CSS3DObject(div);
                const scale = 0.01;
                object.scale.set(scale, scale, scale);

                // Add click listener directly here
                div.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.eventDispatcher.dispatchEvent({ type: 'element:click', id: element.id });
                });
                break;
            }
            case 'sphere': {
                const material = new THREE.MeshBasicMaterial({ color: element.color || 0xffffff });
                const geometry = new THREE.SphereGeometry(element.size || 1, 32, 32);
                object = new THREE.Mesh(geometry, material);
                break;
            }
            case 'box':
            default: {
                const material = new THREE.MeshBasicMaterial({ color: element.color || 0xffffff });
                const geometry = new THREE.BoxGeometry(element.size || 1, element.size || 1, element.size || 1);
                object = new THREE.Mesh(geometry, material);
                break;
            }
        }

        object.position.set(element.position.x, element.position.y, element.position.z);
        object.userData.id = element.id; // Store ID for identification
        object.userData.type = element.type; // Store type for interaction logic
        return object;
    }

    add(element) {
        if (this.elements.has(element.id)) {
            console.warn(`Element with ID ${element.id} already exists. Use update() instead.`);
            return;
        }

        const object = this.createObject(element);
        this.elements.set(element.id, object);
        this.scene.add(object);
    }

    remove(elementId) {
        const object = this.elements.get(elementId);
        if (object) {
            this.scene.remove(object);
            if (object.geometry) object.geometry.dispose();
            if (object.material) object.material.dispose();
            // Also dispose of children's resources
            object.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.elements.delete(elementId);
        }
    }

    update(elementId, props) {
        const object = this.elements.get(elementId);
        if (!object) {
            console.warn(`Element with ID ${elementId} not found.`);
            return;
        }

        if (props.position) {
            object.position.set(props.position.x, props.position.y, props.position.z);
        }

        if (props.color && object.material) {
            object.material.color.set(props.color);
        }

        // Handle content updates for HTML elements
        if (props.htmlContent && object instanceof CSS3DObject) {
            object.element.innerHTML = props.htmlContent;
        }
    }

    setHovered(elementId, isHovered) {
        const element = this.elements.get(elementId);

        if (!element) {
            this.hoverFrame.visible = false;
            return;
        }

        if (isHovered) {
            const box = new THREE.Box3().setFromObject(element);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            this.hoverFrame.scale.set(size.x, size.y, size.z).multiplyScalar(1.1);
            this.hoverFrame.position.copy(center);
            this.hoverFrame.visible = true;
        } else {
            this.hoverFrame.visible = false;
        }
    }

    destroy() {
        // Remove all elements and dispose of their resources
        [...this.elements.keys()].forEach(id => this.remove(id));

        // Clean up the hover frame itself
        if (this.hoverFrame) {
            if (this.hoverFrame.geometry) this.hoverFrame.geometry.dispose();
            if (this.hoverFrame.material) this.hoverFrame.material.dispose();
            this.scene.remove(this.hoverFrame);
        }
    }
}

export default SceneManager;
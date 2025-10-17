import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

class SceneManager {
    constructor(scene) {
        this.scene = scene;
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
        // Create the base geometric mesh
        const material = new THREE.MeshBasicMaterial({ color: element.color || 0xffffff });
        let geometry;
        switch (element.type) {
            case 'sphere':
                geometry = new THREE.SphereGeometry(element.size || 1, 32, 32);
                break;
            case 'box':
            default:
                geometry = new THREE.BoxGeometry(element.size || 1, element.size || 1, element.size || 1);
                break;
        }
        const mesh = new THREE.Mesh(geometry, material);

        // If htmlContent is provided, create a CSS3DObject and attach it to the mesh
        if (element.htmlContent) {
            const div = document.createElement('div');
            div.innerHTML = element.htmlContent;
            // Basic styling for visibility
            div.style.backgroundColor = 'rgba(0,0,0,0.5)';
            div.style.padding = '10px';
            div.style.color = 'white';
            div.style.borderRadius = '5px';

            const htmlObject = new CSS3DObject(div);
            // Position the HTML element slightly in front of the mesh face
            htmlObject.position.z = (element.size || 1) / 2 + 0.01;

            // Scale the HTML object down to an appropriate size for the 3D scene
            const scale = 0.01;
            htmlObject.scale.set(scale, scale, scale);

            mesh.add(htmlObject);
        }

        mesh.position.set(element.position.x, element.position.y, element.position.z);
        mesh.userData.id = element.id; // Store ID for raycasting
        mesh.userData.type = element.type; // Store type for hover logic
        return mesh;
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

        if (props.htmlContent) {
            // Find and update the CSS3DObject child
            const htmlChild = object.children.find(child => child instanceof CSS3DObject);
            if (htmlChild) {
                htmlChild.element.innerHTML = props.htmlContent;
            }
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
}

export default SceneManager;
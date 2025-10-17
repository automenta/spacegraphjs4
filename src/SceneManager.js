import * as THREE from 'three';

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

    // Generic method to create different types of meshes
    createMesh(element) {
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
        mesh.position.set(element.position.x, element.position.y, element.position.z);
        return mesh;
    }

    add(element) {
        if (this.elements.has(element.id)) {
            console.warn(`Element with ID ${element.id} already exists. Use update() instead.`);
            return;
        }

        const mesh = this.createMesh(element);
        mesh.userData.id = element.id; // Store ID for raycasting
        this.elements.set(element.id, mesh);
        this.scene.add(mesh);
    }

    remove(elementId) {
        const mesh = this.elements.get(elementId);
        if (mesh) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.elements.delete(elementId);
        }
    }

    update(elementId, props) {
        const mesh = this.elements.get(elementId);
        if (!mesh) {
            console.warn(`Element with ID ${elementId} not found.`);
            return;
        }

        // Update position
        if (props.position) {
            mesh.position.set(props.position.x, props.position.y, props.position.z);
        }

        // Update color
        if (props.color) {
            mesh.material.color.set(props.color);
        }

        // More properties can be updated here as needed
    }

    setHovered(elementId, isHovered) {
        if (isHovered) {
            const element = this.elements.get(elementId);
            if (element) {
                const box = new THREE.Box3().setFromObject(element);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                this.hoverFrame.scale.set(size.x, size.y, size.z).multiplyScalar(1.1);
                this.hoverFrame.position.copy(center);
                this.hoverFrame.visible = true;
            }
        } else {
            this.hoverFrame.visible = false;
        }
    }
}

export default SceneManager;
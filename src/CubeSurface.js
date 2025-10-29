import { Surface } from './Surface.js';

/**
 * CubeSurface represents a 3D cube surface
 */
export class CubeSurface extends Surface {
    /**
     * Creates a new CubeSurface
     * @param {THREE.Vector3} size - The size of the cube (width, height, depth)
     * @param {number} color - The color of the cube (hex)
     */
    constructor(size = { x: 1, y: 1, z: 1 }, color = 0xffffff) {
        super({ x: size.x, y: size.y });
        this.size = size;
        this.color = color;
        this.mesh = null;
        this.createMesh();
    }

    /**
     * Creates the Three.js mesh for this cube
     */
    createMesh() {
        // Create geometry
        const geometry = new THREE.BoxGeometry(this.size.x, this.size.y, this.size.z);
        
        // Create material
        const material = new THREE.MeshBasicMaterial({ 
            color: this.color
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position the mesh at the center of the bounds
        this.mesh.position.set(this.size.x / 2, this.size.y / 2, this.size.z / 2);
    }

    /**
     * Updates the mesh when properties change
     */
    updateMesh() {
        if (this.mesh) {
            // Remove old mesh from parent if it exists
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
        }
        
        this.createMesh();
    }

    /**
     * Sets the color of the cube
     * @param {number} color - The new color (hex)
     */
    setColor(color) {
        this.color = color;
        if (this.mesh && this.mesh.material) {
            this.mesh.material.color.setHex(color);
        }
    }

    /**
     * Sets the size of the cube
     * @param {THREE.Vector3} size - The new size (width, height, depth)
     */
    setSize(size) {
        this.size = size;
        this.bounds = { x: size.x, y: size.y };
        this.updateMesh();
    }

    /**
     * Renders the cube
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
     * @param {THREE.Scene} scene - The scene to render to
     * @param {THREE.Camera} camera - The camera to render with
     */
    render(renderer, scene, camera) {
        if (!this.visible) return;
        
        // Calculate world transform
        this.calculateWorldTransform();
        
        // Update mesh position based on world position
        if (this.mesh) {
            this.mesh.position.copy(this.worldPosition);
            // Adjust z position to account for depth
            this.mesh.position.z += this.size.z / 2;
            
            // Add to scene if not already added
            if (!this.mesh.parent) {
                scene.add(this.mesh);
            }
        }
        
        // Render children
        for (const child of this.children) {
            child.renderIfVisible(renderer, scene, camera);
        }
    }
}
import { Surface } from './Surface.js';

/**
 * SphereSurface represents a 3D sphere surface
 */
export class SphereSurface extends Surface {
    /**
     * Creates a new SphereSurface
     * @param {number} radius - The radius of the sphere
     * @param {number} color - The color of the sphere (hex)
     * @param {number} widthSegments - Number of horizontal segments
     * @param {number} heightSegments - Number of vertical segments
     */
    constructor(radius = 0.5, color = 0xffffff, widthSegments = 32, heightSegments = 32) {
        super({ x: radius * 2, y: radius * 2 });
        this.radius = radius;
        this.color = color;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
        this.mesh = null;
        this.createMesh();
    }

    /**
     * Creates the Three.js mesh for this sphere
     */
    createMesh() {
        // Create geometry
        const geometry = new THREE.SphereGeometry(
            this.radius, 
            this.widthSegments, 
            this.heightSegments
        );
        
        // Create material
        const material = new THREE.MeshBasicMaterial({ 
            color: this.color
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position the mesh at the center
        this.mesh.position.set(this.radius, this.radius, this.radius);
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
     * Sets the color of the sphere
     * @param {number} color - The new color (hex)
     */
    setColor(color) {
        this.color = color;
        if (this.mesh && this.mesh.material) {
            this.mesh.material.color.setHex(color);
        }
    }

    /**
     * Sets the radius of the sphere
     * @param {number} radius - The new radius
     */
    setRadius(radius) {
        this.radius = radius;
        this.bounds = { x: radius * 2, y: radius * 2 };
        this.updateMesh();
    }

    /**
     * Renders the sphere
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
            this.mesh.position.z += this.radius;
            
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
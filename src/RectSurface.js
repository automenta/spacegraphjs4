import { Surface } from './Surface.js';

/**
 * RectSurface represents a 2D rectangle surface
 */
export class RectSurface extends Surface {
    /**
     * Creates a new RectSurface
     * @param {object} bounds - The bounds of the rectangle { width, height }
     * @param {number} color - The color of the rectangle (hex)
     */
    constructor(bounds = { width: 1, height: 1 }, color = 0xffffff) {
        super(bounds);
        this.color = color;
        this.mesh = null;
        this.isPressed = false;
        this.createMesh();
    }

    /**
     * Creates the Three.js mesh for this rectangle
     */
    createMesh() {
        // Create geometry
        const geometry = new THREE.PlaneGeometry(this.bounds.width, this.bounds.height);
        
        // Create material
        const material = new THREE.MeshBasicMaterial({ 
            color: this.color,
            side: THREE.DoubleSide
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position the mesh at the center of the bounds
        this.mesh.position.set(this.bounds.width / 2, this.bounds.height / 2, 0);
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
     * Sets the color of the rectangle
     * @param {number} color - The new color (hex)
     */
    setColor(color) {
        this.color = color;
        if (this.mesh && this.mesh.material) {
            this.mesh.material.color.setHex(color);
        }
    }

    /**
     * Renders the rectangle
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
    
    /**
     * Handles pointer down events
     * @param {Event} event - The pointer event
     */
    onPointerDown(event) {
        this.isPressed = true;
        // Change color to indicate press
        if (this.mesh && this.mesh.material) {
            this.mesh.material.emissive = new THREE.Color(0x444444);
        }
    }
    
    /**
     * Handles pointer up events
     * @param {Event} event - The pointer event
     */
    onPointerUp(event) {
        this.isPressed = false;
        // Restore original color
        if (this.mesh && this.mesh.material) {
            this.mesh.material.emissive = new THREE.Color(0x000000);
        }
        
        // Dispatch click event if this was a tap
        const clickEvent = new Event('click', {
            x: event.data.x,
            y: event.data.y
        });
        this.dispatchEvent(clickEvent);
    }
    
    /**
     * Handles pointer move events
     * @param {Event} event - The pointer event
     */
    onPointerMove(event) {
        // Handle hover effects if needed
    }
}
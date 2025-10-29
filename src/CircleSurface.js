import { Surface } from './Surface.js';

/**
 * CircleSurface represents a 2D circle surface
 */
export class CircleSurface extends Surface {
    /**
     * Creates a new CircleSurface
     * @param {number} radius - The radius of the circle
     * @param {number} color - The color of the circle (hex)
     * @param {number} segments - The number of segments to approximate the circle
     */
    constructor(radius = 0.5, color = 0xffffff, segments = 32) {
        super({ x: radius * 2, y: radius * 2 });
        this.radius = radius;
        this.color = color;
        this.segments = segments;
        this.mesh = null;
        this.isPressed = false;
        this.createMesh();
    }

    /**
     * Creates the Three.js mesh for this circle
     */
    createMesh() {
        // Create geometry
        const geometry = new THREE.CircleGeometry(this.radius, this.segments);
        
        // Create material
        const material = new THREE.MeshBasicMaterial({ 
            color: this.color,
            side: THREE.DoubleSide
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position the mesh at the center
        this.mesh.position.set(this.radius, this.radius, 0);
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
     * Sets the color of the circle
     * @param {number} color - The new color (hex)
     */
    setColor(color) {
        this.color = color;
        if (this.mesh && this.mesh.material) {
            this.mesh.material.color.setHex(color);
        }
    }

    /**
     * Sets the radius of the circle
     * @param {number} radius - The new radius
     */
    setRadius(radius) {
        this.radius = radius;
        this.bounds = { x: radius * 2, y: radius * 2 };
        this.updateMesh();
    }

    /**
     * Renders the circle
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
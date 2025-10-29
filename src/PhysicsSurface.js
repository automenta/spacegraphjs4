import { Surface } from './Surface.js';
import { VerletParticle, Vec2 } from './physics/VerletPhysics.js';

/**
 * PhysicsSurface is a wrapper for surfaces that provides physics capabilities
 */
export class PhysicsSurface extends Surface {
    /**
     * Creates a new PhysicsSurface
     * @param {Surface} surface - The surface to wrap
     * @param {object} physicsOptions - Physics options
     */
    constructor(surface, physicsOptions = {}) {
        // Use the same bounds as the wrapped surface
        super(surface.bounds);
        
        this.wrappedSurface = surface;
        this.physicsOptions = physicsOptions;
        
        // Copy properties from wrapped surface
        this.position.copy(surface.position);
        this.visible = surface.visible;
        this.clipBounds = surface.clipBounds;
        
        // Physics properties
        this.physicsEnabled = true;
        this.physicsParticle = null;
        this.physicsBinding = physicsOptions.binding || 'center';
        this.physicsMass = physicsOptions.mass || surface.physicsMass || 1.0;
        this.physicsFriction = physicsOptions.friction || surface.physicsFriction || 0.98;
        
        // Create physics particle
        const centerX = this.position.x + this.bounds.x / 2;
        const centerY = this.position.y + this.bounds.y / 2;
        this.physicsParticle = new VerletParticle(centerX, centerY, this.physicsMass);
        this.physicsParticle.friction = this.physicsFriction;
        
        // Transfer children from wrapped surface
        this.children = surface.children;
        for (const child of this.children) {
            child.parent = this;
        }
        
        // Transfer event listeners
        this.eventListeners = surface.eventListeners;
        
        // Transfer other properties as needed
        this.hitTestEnabled = surface.hitTestEnabled;
    }

    /**
     * Starts the surface (attaches to parent)
     * @param {Surface} parent - The parent surface
     */
    start(parent) {
        this.parent = parent;
        if (parent) {
            parent.addChild(this);
        }
    }

    /**
     * Stops the surface (detaches and cleans up)
     */
    stop() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        
        // Stop all children
        for (const child of this.children) {
            child.stop();
        }
    }

    /**
     * Updates the physics surface
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update physics particle position based on surface position if not deleted
        if (this.physicsParticle && !this.physicsParticle.deleted) {
            if (this.physicsBinding === 'center') {
                const centerX = this.position.x + this.bounds.x / 2;
                const centerY = this.position.y + this.bounds.y / 2;
                this.physicsParticle.position.set(centerX, centerY);
                this.physicsParticle.previousPosition.set(centerX, centerY);
            }
        }
        
        // Update wrapped surface if it has an update method
        if (this.wrappedSurface.update) {
            this.wrappedSurface.update(deltaTime);
        }
    }

    /**
     * Renders the physics surface and its wrapped surface
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
     * @param {THREE.Scene} scene - The scene to render to
     * @param {THREE.Camera} camera - The camera to render with
     */
    render(renderer, scene, camera) {
        // Calculate world transform if dirty
        this.calculateWorldTransform();
        
        // Sync wrapped surface position with physics position
        if (this.physicsEnabled && this.physicsParticle && !this.physicsParticle.deleted) {
            if (this.physicsBinding === 'center') {
                this.wrappedSurface.position.x = this.physicsParticle.position.x - this.bounds.x / 2;
                this.wrappedSurface.position.y = this.physicsParticle.position.y - this.bounds.y / 2;
            } else {
                // For nearest edge binding, we would implement more complex logic
                this.wrappedSurface.position.x = this.physicsParticle.position.x - this.bounds.x / 2;
                this.wrappedSurface.position.y = this.physicsParticle.position.y - this.bounds.y / 2;
            }
        } else {
            // Sync with this surface's position
            this.wrappedSurface.position.copy(this.position);
        }
        
        // Render wrapped surface
        this.wrappedSurface.renderIfVisible(renderer, scene, camera);
        
        // Render children
        for (const child of this.children) {
            child.renderIfVisible(renderer, scene, camera);
        }
    }

    /**
     * Gets the world bounds of this surface
     * @returns {object} The world bounds {x, y, width, height}
     */
    getWorldBounds() {
        this.calculateWorldTransform();
        
        // If physics is enabled, use physics particle position
        if (this.physicsEnabled && this.physicsParticle && !this.physicsParticle.deleted) {
            return {
                x: this.physicsParticle.position.x - this.bounds.x / 2,
                y: this.physicsParticle.position.y - this.bounds.y / 2,
                width: this.bounds.x,
                height: this.bounds.y
            };
        }
        
        return {
            x: this.worldPosition.x,
            y: this.worldPosition.y,
            width: this.bounds.x,
            height: this.bounds.y
        };
    }

    /**
     * Checks if a point is within this surface's bounds
     * @param {number} x - X coordinate in world space
     * @param {number} y - Y coordinate in world space
     * @returns {boolean} True if the point is within bounds
     */
    hitTest(x, y) {
        if (!this.hitTestEnabled || !this.visible) return false;
        
        const bounds = this.getWorldBounds();
        return x >= bounds.x && x <= bounds.x + bounds.width &&
               y >= bounds.y && y <= bounds.y + bounds.height;
    }

    /**
     * Sets the physics mass for this surface
     * @param {number} mass - The mass value
     */
    setPhysicsMass(mass) {
        super.setPhysicsMass(mass);
        // Also update the wrapped surface
        this.wrappedSurface.setPhysicsMass(mass);
    }
    
    /**
     * Sets the physics friction for this surface
     * @param {number} friction - The friction value (0-1)
     */
    setPhysicsFriction(friction) {
        super.setPhysicsFriction(friction);
        // Also update the wrapped surface
        this.wrappedSurface.setPhysicsFriction(friction);
    }
    
    /**
     * Applies a force to this surface's physics particle
     * @param {Vec2} force - The force vector to apply
     */
    applyPhysicsForce(force) {
        super.applyPhysicsForce(force);
        // Also apply to the wrapped surface
        this.wrappedSurface.applyPhysicsForce(force);
    }
    
    /**
     * Gets the physics velocity of this surface
     * @returns {Vec2|null} The velocity vector or null if physics disabled
     */
    getPhysicsVelocity() {
        const velocity = super.getPhysicsVelocity();
        if (velocity) return velocity;
        // Try to get from wrapped surface
        return this.wrappedSurface.getPhysicsVelocity();
    }
    
    /**
     * Sets the physics velocity of this surface
     * @param {Vec2} velocity - The velocity vector to set
     */
    setPhysicsVelocity(velocity) {
        super.setPhysicsVelocity(velocity);
        // Also set on the wrapped surface
        this.wrappedSurface.setPhysicsVelocity(velocity);
    }
}
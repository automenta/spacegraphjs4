import { ContainerSurface } from '../ContainerSurface.js';
import { VerletPhysics, VerletParticle, Vec2, SpringConstraint, DistanceConstraint } from '../physics/VerletPhysics.js';

/**
 * PhysicsContainer manages physics-enabled surfaces with automatic physics updates
 */
export class PhysicsContainer extends ContainerSurface {
    /**
     * Creates a new PhysicsContainer
     * @param {THREE.Vector2} bounds - The bounds of the container
     * @param {object} physicsOptions - Physics options
     */
    constructor(bounds = { x: 1, y: 1 }, physicsOptions = {}) {
        super(bounds);
        
        // Physics properties
        this.physicsOptions = {
            iterations: physicsOptions.iterations || 3,
            gravity: physicsOptions.gravity || { x: 0, y: 0 },
            enableCollisions: physicsOptions.enableCollisions !== false, // default true
            ...physicsOptions
        };
        
        // Create physics engine
        this.verletPhysics = new VerletPhysics(this.physicsOptions.iterations);
        this.verletPhysics.setGravity(
            this.physicsOptions.gravity.x || 0, 
            this.physicsOptions.gravity.y || 0
        );
        
        // Set boundaries
        this.verletPhysics.setBounds(0, 0, this.bounds.x, this.bounds.y);
        
        // Enable physics by default
        this.physicsEnabled = true;
    }

    /**
     * Updates the container and its children
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update physics simulation
        if (this.physicsEnabled && this.verletPhysics) {
            this.verletPhysics.update(deltaTime);
            
            // Sync surface positions with physics particles
            for (const [surface, particle] of this.surfaceParticles) {
                if (!particle.deleted) {
                    // Update surface position based on particle position
                    if (surface.physicsBinding === 'center') {
                        surface.position.x = particle.position.x - surface.bounds.x / 2;
                        surface.position.y = particle.position.y - surface.bounds.y / 2;
                    } else {
                        // For nearest edge binding, we would implement more complex logic
                        surface.position.x = particle.position.x - surface.bounds.x / 2;
                        surface.position.y = particle.position.y - surface.bounds.y / 2;
                    }
                    
                    // Mark surface transform as dirty
                    surface.markWorldTransformDirty();
                }
            }
        }
        
        // Update layout
        this.updateLayout(deltaTime);
    }

    /**
     * Sets the gravity for the physics simulation
     * @param {number} x - X component of gravity
     * @param {number} y - Y component of gravity
     */
    setGravity(x, y) {
        if (this.verletPhysics) {
            this.verletPhysics.setGravity(x, y);
        }
        if (this.physicsOptions) {
            this.physicsOptions.gravity = { x, y };
        }
    }

    /**
     * Enables or disables collisions
     * @param {boolean} enabled - Whether collisions are enabled
     */
    setCollisionsEnabled(enabled) {
        if (this.physicsOptions) {
            this.physicsOptions.enableCollisions = enabled;
        }
    }
    
    /**
     * Creates a spring constraint between two surfaces
     * @param {Surface} surfaceA - First surface
     * @param {Surface} surfaceB - Second surface
     * @param {number} restLength - Rest length of spring
     * @param {number} stiffness - Spring stiffness (0-1)
     * @returns {SpringConstraint|null} The created spring constraint
     */
    createSpringConstraint(surfaceA, surfaceB, restLength, stiffness = 0.5) {
        if (!this.physicsEnabled || !this.verletPhysics) return null;
        
        const particleA = this.surfaceParticles.get(surfaceA);
        const particleB = this.surfaceParticles.get(surfaceB);
        
        if (!particleA || !particleB) return null;
        
        const spring = new SpringConstraint(particleA, particleB, restLength, stiffness);
        this.verletPhysics.addConstraint(spring);
        
        return spring;
    }
}
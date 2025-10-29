import { ContainerSurface } from '../ContainerSurface.js';
import { VerletPhysics, VerletParticle, Vec2 } from '../physics/VerletPhysics.js';

/**
 * CollisionAwareContainer prevents overlaps between child surfaces using physics-based collision detection
 */
export class CollisionAwareContainer extends ContainerSurface {
    /**
     * Creates a new CollisionAwareContainer
     * @param {THREE.Vector2} bounds - The bounds of the container
     * @param {object} collisionOptions - Collision options
     */
    constructor(bounds = { x: 1, y: 1 }, collisionOptions = {}) {
        super(bounds);
        
        // Collision properties
        this.collisionOptions = {
            collisionMargin: collisionOptions.collisionMargin || 5,
            collisionResponse: collisionOptions.collisionResponse || 'separate', // 'separate' or 'bounce'
            bounceFactor: collisionOptions.bounceFactor || 0.3,
            enableBoundaryCollision: collisionOptions.enableBoundaryCollision !== false, // default true
            ...collisionOptions
        };
        
        // Create physics engine for collision detection
        this.collisionPhysics = new VerletPhysics(1); // Single iteration for collision detection
        this.collisionPhysics.setGravity(0, 0); // No gravity for collision detection
        
        // Set boundaries
        if (this.collisionOptions.enableBoundaryCollision) {
            this.collisionPhysics.setBounds(0, 0, this.bounds.x, this.bounds.y);
        }
        
        // Collision state
        this.collisionDetectionEnabled = true;
    }

    /**
     * Adds a child surface to this container
     * @param {Surface} child - The child surface to add
     * @param {object} constraints - Layout constraints for this child
     */
    addChild(child, constraints = {}) {
        super.addChild(child, constraints);
        
        // If collision detection is enabled, bind the child
        if (this.collisionDetectionEnabled) {
            this.bindSurfaceForCollision(child);
        }
    }

    /**
     * Removes a child surface from this container
     * @param {Surface} child - The child surface to remove
     */
    removeChild(child) {
        super.removeChild(child);
        
        // Unbind the child from collision detection
        if (this.collisionDetectionEnabled) {
            this.unbindSurfaceFromCollision(child);
        }
    }

    /**
     * Binds a surface for collision detection
     * @param {Surface} surface - The surface to bind
     */
    bindSurfaceForCollision(surface) {
        if (!this.collisionPhysics) return;
        
        // Create particle at surface center with radius based on surface size
        const centerX = surface.position.x + surface.bounds.x / 2;
        const centerY = surface.position.y + surface.bounds.y / 2;
        const radius = Math.max(surface.bounds.x, surface.bounds.y) / 2 + this.collisionOptions.collisionMargin;
        const particle = new VerletParticle(centerX, centerY, 1.0);
        particle.radius = radius;
        
        // Add particle to physics engine
        this.collisionPhysics.addParticle(particle);
        
        // Store mapping
        this.surfaceParticles.set(surface, particle);
        
        return particle;
    }

    /**
     * Unbinds a surface from collision detection
     * @param {Surface} surface - The surface to unbind
     */
    unbindSurfaceFromCollision(surface) {
        if (!this.collisionPhysics) return;
        
        const particle = this.surfaceParticles.get(surface);
        if (particle) {
            // Remove particle from physics engine
            this.collisionPhysics.removeParticle(particle);
            
            // Remove mapping
            this.surfaceParticles.delete(surface);
        }
    }

    /**
     * Updates the container and its children
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Handle collision detection
        if (this.collisionDetectionEnabled && this.collisionPhysics) {
            // Update particle positions to match surface positions
            for (const [surface, particle] of this.surfaceParticles) {
                if (!particle.deleted) {
                    const centerX = surface.position.x + surface.bounds.x / 2;
                    const centerY = surface.position.y + surface.bounds.y / 2;
                    particle.position.set(centerX, centerY);
                    particle.previousPosition.set(centerX, centerY);
                }
            }
            
            // Update collision physics (this will detect and resolve collisions)
            this.collisionPhysics.update(deltaTime);
            
            // Apply collision responses
            for (const [surface, particle] of this.surfaceParticles) {
                if (!particle.deleted) {
                    if (this.collisionOptions.collisionResponse === 'separate') {
                        // Update surface position based on particle position after collision resolution
                        surface.position.x = particle.position.x - surface.bounds.x / 2;
                        surface.position.y = particle.position.y - surface.bounds.y / 2;
                        
                        // Mark surface transform as dirty
                        surface.markWorldTransformDirty();
                    } else if (this.collisionOptions.collisionResponse === 'bounce') {
                        // For bounce response, we would apply forces to surfaces
                        // This is a simplified implementation
                        const velocity = particle.getVelocity();
                        if (velocity.x !== 0 || velocity.y !== 0) {
                            surface.applyPhysicsForce(new Vec2(
                                velocity.x * this.collisionOptions.bounceFactor,
                                velocity.y * this.collisionOptions.bounceFactor
                            ));
                        }
                    }
                }
            }
        }
        
        // Update layout
        this.updateLayout(deltaTime);
    }

    /**
     * Enables or disables collision detection
     * @param {boolean} enabled - Whether collision detection is enabled
     */
    setCollisionDetectionEnabled(enabled) {
        this.collisionDetectionEnabled = enabled;
        
        if (enabled) {
            // Bind all existing children for collision detection
            for (const child of this.children) {
                this.bindSurfaceForCollision(child);
            }
        } else {
            // Unbind all children from collision detection
            for (const child of this.children) {
                this.unbindSurfaceFromCollision(child);
            }
        }
    }

    /**
     * Sets the collision margin
     * @param {number} margin - The collision margin
     */
    setCollisionMargin(margin) {
        this.collisionOptions.collisionMargin = margin;
        
        // Update particle radii
        for (const [surface, particle] of this.surfaceParticles) {
            if (!particle.deleted) {
                const radius = Math.max(surface.bounds.x, surface.bounds.y) / 2 + margin;
                particle.radius = radius;
            }
        }
    }
}
import { ContainerSurface } from '../ContainerSurface.js';
import { VerletPhysics, VerletParticle, SpringConstraint, DistanceConstraint } from '../physics/VerletPhysics.js';

/**
 * ForceDirectedLayoutContainer automatically arranges child surfaces using force-directed layout
 */
export class ForceDirectedLayoutContainer extends ContainerSurface {
    /**
     * Creates a new ForceDirectedLayoutContainer
     * @param {THREE.Vector2} bounds - The bounds of the container
     * @param {object} layoutOptions - Layout options
     */
    constructor(bounds = { x: 1, y: 1 }, layoutOptions = {}) {
        super(bounds);
        
        // Layout properties
        this.layoutOptions = {
            repelStrength: layoutOptions.repelStrength || 0.02,
            attractStrength: layoutOptions.attractStrength || 0.6,
            springLength: layoutOptions.springLength || 100,
            springStrength: layoutOptions.springStrength || 0.5,
            damping: layoutOptions.damping || 0.1,
            iterations: layoutOptions.iterations || 3,
            enableSprings: layoutOptions.enableSprings !== false, // default true
            ...layoutOptions
        };
        
        // Create physics engine for layout
        this.layoutPhysics = new VerletPhysics(this.layoutOptions.iterations);
        this.layoutPhysics.setGravity(0, 0); // No gravity for layout
        
        // Set boundaries
        this.layoutPhysics.setBounds(0, 0, this.bounds.x, this.bounds.y);
        
        // Layout state
        this.layoutEnabled = true;
        this.layoutDirty = true;
        this.layoutConnections = new Map(); // Map of surface connections
    }

    /**
     * Adds a child surface to this container
     * @param {Surface} child - The child surface to add
     * @param {object} constraints - Layout constraints for this child
     */
    addChild(child, constraints = {}) {
        super.addChild(child, constraints);
        
        // If layout is enabled, bind the child to layout physics
        if (this.layoutEnabled) {
            this.bindSurfaceToLayoutPhysics(child);
            this.layoutDirty = true;
        }
    }

    /**
     * Removes a child surface from this container
     * @param {Surface} child - The child surface to remove
     */
    removeChild(child) {
        super.removeChild(child);
        
        // Unbind the child from layout physics
        if (this.layoutEnabled) {
            this.unbindSurfaceFromLayoutPhysics(child);
            this.layoutDirty = true;
        }
    }

    /**
     * Binds a surface to layout physics
     * @param {Surface} surface - The surface to bind
     */
    bindSurfaceToLayoutPhysics(surface) {
        if (!this.layoutPhysics) return;
        
        // Create particle at surface center
        const centerX = surface.position.x + surface.bounds.x / 2;
        const centerY = surface.position.y + surface.bounds.y / 2;
        const particle = new VerletParticle(centerX, centerY, surface.physicsMass || 1.0);
        particle.friction = 1 - (this.layoutOptions.damping || 0.1);
        
        // Add particle to physics engine
        this.layoutPhysics.addParticle(particle);
        
        // Store mapping
        this.surfaceParticles.set(surface, particle);
        
        return particle;
    }

    /**
     * Unbinds a surface from layout physics
     * @param {Surface} surface - The surface to unbind
     */
    unbindSurfaceFromLayoutPhysics(surface) {
        if (!this.layoutPhysics) return;
        
        const particle = this.surfaceParticles.get(surface);
        if (particle) {
            // Remove particle from physics engine
            this.layoutPhysics.removeParticle(particle);
            
            // Remove mapping
            this.surfaceParticles.delete(surface);
        }
    }

    /**
     * Connects two surfaces with a spring constraint
     * @param {Surface} surfaceA - First surface
     * @param {Surface} surfaceB - Second surface
     * @param {number} springLength - Optional spring length (defaults to layout option)
     * @param {number} springStrength - Optional spring strength (defaults to layout option)
     */
    connectSurfaces(surfaceA, surfaceB, springLength = null, springStrength = null) {
        if (!this.layoutEnabled || !this.layoutPhysics) return null;
        
        const particleA = this.surfaceParticles.get(surfaceA);
        const particleB = this.surfaceParticles.get(surfaceB);
        
        if (!particleA || !particleB) return null;
        
        const length = springLength !== null ? springLength : this.layoutOptions.springLength;
        const strength = springStrength !== null ? springStrength : this.layoutOptions.springStrength;
        
        const spring = new SpringConstraint(particleA, particleB, length, strength);
        this.layoutPhysics.addConstraint(spring);
        
        // Store connection
        if (!this.layoutConnections.has(surfaceA)) {
            this.layoutConnections.set(surfaceA, new Set());
        }
        if (!this.layoutConnections.has(surfaceB)) {
            this.layoutConnections.set(surfaceB, new Set());
        }
        this.layoutConnections.get(surfaceA).add(surfaceB);
        this.layoutConnections.get(surfaceB).add(surfaceA);
        
        return spring;
    }

    /**
     * Disconnects two surfaces
     * @param {Surface} surfaceA - First surface
     * @param {Surface} surfaceB - Second surface
     */
    disconnectSurfaces(surfaceA, surfaceB) {
        // Implementation would remove the spring constraint between surfaces
        // For simplicity, we'll just mark layout as dirty
        this.layoutDirty = true;
    }

    /**
     * Updates the layout of child surfaces
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateLayout(deltaTime) {
        if (!this.layoutDirty || !this.layoutEnabled) return;
        
        // Update layout physics
        if (this.layoutPhysics) {
            this.layoutPhysics.update(deltaTime);
            
            // Apply repulsive forces between all particles
            this.applyRepulsiveForces();
            
            // Sync surface positions with physics particles
            for (const [surface, particle] of this.surfaceParticles) {
                if (!particle.deleted) {
                    // Update surface position based on particle position
                    surface.position.x = particle.position.x - surface.bounds.x / 2;
                    surface.position.y = particle.position.y - surface.bounds.y / 2;
                    
                    // Mark surface transform as dirty
                    surface.markWorldTransformDirty();
                }
            }
        }
        
        super.updateLayout(deltaTime);
        this.layoutDirty = false;
    }

    /**
     * Applies repulsive forces between all particles
     */
    applyRepulsiveForces() {
        if (!this.layoutPhysics) return;
        
        const particles = this.layoutPhysics.particles;
        const strength = this.layoutOptions.repelStrength;
        
        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            if (a.deleted) continue;
            
            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                if (b.deleted) continue;
                
                // Calculate distance
                const dx = b.position.x - a.position.x;
                const dy = b.position.y - a.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0 && distance < 200) { // Only apply force within a certain range
                    // Calculate repulsive force (inverse square law)
                    const force = strength / (distance * distance + 1);
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;
                    
                    // Apply forces in opposite directions
                    a.applyForce(new Vec2(-fx, -fy));
                    b.applyForce(new Vec2(fx, fy));
                }
            }
        }
    }

    /**
     * Updates the container and its children
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        this.updateLayout(deltaTime);
    }

    /**
     * Enables or disables the force-directed layout
     * @param {boolean} enabled - Whether layout is enabled
     */
    setLayoutEnabled(enabled) {
        this.layoutEnabled = enabled;
        this.layoutDirty = true;
        
        if (enabled) {
            // Bind all existing children to layout physics
            for (const child of this.children) {
                this.bindSurfaceToLayoutPhysics(child);
            }
        } else {
            // Unbind all children from layout physics
            for (const child of this.children) {
                this.unbindSurfaceFromLayoutPhysics(child);
            }
        }
    }
}
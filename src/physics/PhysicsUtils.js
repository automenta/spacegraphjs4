import { VerletParticle, Vec2, SpringConstraint, DistanceConstraint, AngleConstraint } from './VerletPhysics.js';

/**
 * Utility functions for physics operations
 */

/**
 * Applies a force to a surface
 * @param {Surface} surface - The surface to apply force to
 * @param {number} fx - X component of force
 * @param {number} fy - Y component of force
 */
export function applyForce(surface, fx, fy) {
    if (surface.physicsEnabled && surface.physicsParticle) {
        surface.applyPhysicsForce(new Vec2(fx, fy));
    }
}

/**
 * Applies an impulse to a surface
 * @param {Surface} surface - The surface to apply impulse to
 * @param {number} ix - X component of impulse
 * @param {number} iy - Y component of impulse
 */
export function applyImpulse(surface, ix, iy) {
    if (surface.physicsEnabled && surface.physicsParticle) {
        const velocity = surface.getPhysicsVelocity() || new Vec2(0, 0);
        velocity.x += ix * surface.physicsParticle.invMass;
        velocity.y += iy * surface.physicsParticle.invMass;
        surface.setPhysicsVelocity(velocity);
    }
}

/**
 * Creates a spring constraint between two surfaces
 * @param {ContainerSurface} container - The container managing the surfaces
 * @param {Surface} surfaceA - First surface
 * @param {Surface} surfaceB - Second surface
 * @param {number} restLength - Rest length of spring
 * @param {number} stiffness - Spring stiffness (0-1)
 * @returns {SpringConstraint|null} The created spring constraint
 */
export function createSpringConstraint(container, surfaceA, surfaceB, restLength, stiffness = 0.5) {
    if (!container.physicsEnabled || !container.verletPhysics) return null;
    
    return container.createSpringConstraint(surfaceA, surfaceB, restLength, stiffness);
}

/**
 * Creates a distance constraint between two surfaces
 * @param {ContainerSurface} container - The container managing the surfaces
 * @param {Surface} surfaceA - First surface
 * @param {Surface} surfaceB - Second surface
 * @param {number} distance - Fixed distance between surfaces
 * @returns {DistanceConstraint|null} The created distance constraint
 */
export function createDistanceConstraint(container, surfaceA, surfaceB, distance) {
    if (!container.physicsEnabled || !container.verletPhysics) return null;
    
    return container.createDistanceConstraint(surfaceA, surfaceB, distance);
}

/**
 * Creates an angle constraint between three surfaces
 * @param {ContainerSurface} container - The container managing the surfaces
 * @param {Surface} surfaceA - First surface
 * @param {Surface} surfaceB - Second surface (center)
 * @param {Surface} surfaceC - Third surface
 * @param {number} angle - Fixed angle in radians
 * @returns {AngleConstraint|null} The created angle constraint
 */
export function createAngleConstraint(container, surfaceA, surfaceB, surfaceC, angle) {
    if (!container.physicsEnabled || !container.verletPhysics) return null;
    
    return container.createAngleConstraint(surfaceA, surfaceB, surfaceC, angle);
}

/**
 * Creates a particle chain between two surfaces
 * @param {ContainerSurface} container - The container managing the surfaces
 * @param {Surface} surfaceA - First surface
 * @param {Surface} surfaceB - Last surface
 * @param {number} numParticles - Number of particles in chain
 * @param {number} strength - Strength of springs
 * @returns {Object|null} Object containing particles and springs arrays
 */
export function createParticleChain(container, surfaceA, surfaceB, numParticles, strength = 0.5) {
    if (!container.physicsEnabled || !container.verletPhysics) return null;
    
    const particleA = container.surfaceParticles.get(surfaceA);
    const particleB = container.surfaceParticles.get(surfaceB);
    
    if (!particleA || !particleB) return null;
    
    return container.verletPhysics.addParticleChain(particleA, particleB, numParticles, strength);
}

/**
 * Sets the physics properties of a surface
 * @param {Surface} surface - The surface to configure
 * @param {object} properties - Physics properties to set
 */
export function configurePhysics(surface, properties) {
    if (properties.mass !== undefined) {
        surface.setPhysicsMass(properties.mass);
    }
    
    if (properties.friction !== undefined) {
        surface.setPhysicsFriction(properties.friction);
    }
    
    if (properties.velocity !== undefined) {
        surface.setPhysicsVelocity(new Vec2(properties.velocity.x, properties.velocity.y));
    }
    
    if (properties.enabled !== undefined) {
        surface.setPhysicsEnabled(properties.enabled);
    }
}

/**
 * Gets the physics properties of a surface
 * @param {Surface} surface - The surface to get properties from
 * @returns {object} Physics properties
 */
export function getPhysicsProperties(surface) {
    return {
        enabled: surface.physicsEnabled,
        mass: surface.physicsMass,
        friction: surface.physicsFriction,
        velocity: surface.getPhysicsVelocity(),
        particle: surface.physicsParticle
    };
}

/**
 * Creates a repulsive force between two surfaces
 * @param {Surface} surfaceA - First surface
 * @param {Surface} surfaceB - Second surface
 * @param {number} strength - Strength of repulsion
 * @param {number} minDistance - Minimum distance for repulsion
 */
export function applyRepulsion(surfaceA, surfaceB, strength = 1.0, minDistance = 50) {
    if (!surfaceA.physicsEnabled || !surfaceB.physicsEnabled) return;
    if (!surfaceA.physicsParticle || !surfaceB.physicsParticle) return;
    
    const posA = surfaceA.physicsParticle.position;
    const posB = surfaceB.physicsParticle.position;
    
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0 && distance < minDistance) {
        // Calculate repulsive force (inverse square law)
        const force = strength / (distance * distance + 1);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        // Apply forces in opposite directions
        surfaceA.applyPhysicsForce(new Vec2(-fx, -fy));
        surfaceB.applyPhysicsForce(new Vec2(fx, fy));
    }
}

/**
 * Creates an attractive force between two surfaces
 * @param {Surface} surfaceA - First surface
 * @param {Surface} surfaceB - Second surface
 * @param {number} strength - Strength of attraction
 * @param {number} maxDistance - Maximum distance for attraction
 */
export function applyAttraction(surfaceA, surfaceB, strength = 1.0, maxDistance = 200) {
    if (!surfaceA.physicsEnabled || !surfaceB.physicsEnabled) return;
    if (!surfaceA.physicsParticle || !surfaceB.physicsParticle) return;
    
    const posA = surfaceA.physicsParticle.position;
    const posB = surfaceB.physicsParticle.position;
    
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0 && distance < maxDistance) {
        // Calculate attractive force
        const force = strength * distance / 1000;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        // Apply forces toward each other
        surfaceA.applyPhysicsForce(new Vec2(fx, fy));
        surfaceB.applyPhysicsForce(new Vec2(-fx, -fy));
    }
}
/**
 * Verlet Physics Engine for 2D simulations
 */

/**
 * 2D Vector class for physics calculations
 */
export class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const len = this.length();
        if (len > 0) {
            this.divide(len);
        }
        return this;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    clone() {
        return new Vec2(this.x, this.y);
    }

    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

/**
 * Verlet Particle representing a point mass in the physics simulation
 */
export class VerletParticle {
    constructor(x = 0, y = 0, mass = 1) {
        this.position = new Vec2(x, y);
        this.previousPosition = new Vec2(x, y);
        this.acceleration = new Vec2(0, 0);
        this.mass = mass;
        this.invMass = mass !== 0 ? 1 / mass : 0;
        this.radius = Math.sqrt(mass) * 0.5;
        this.friction = 0.98;
        this.behaviors = [];
        this.constraints = [];
        this.deleted = false;
    }

    /**
     * Updates the particle position using Verlet integration
     * @param {number} deltaTime - Time step for integration
     */
    update(deltaTime) {
        if (this.deleted) return;

        // Apply behaviors
        for (const behavior of this.behaviors) {
            behavior(this);
        }

        // Verlet integration
        const temp = this.position.clone();
        
        // Calculate velocity
        const velocityX = (this.position.x - this.previousPosition.x) * this.friction;
        const velocityY = (this.position.y - this.previousPosition.y) * this.friction;
        
        // Update position using Verlet integration
        this.position.x += velocityX + this.acceleration.x * deltaTime * deltaTime;
        this.position.y += velocityY + this.acceleration.y * deltaTime * deltaTime;
        
        // Update previous position
        this.previousPosition.set(temp.x, temp.y);
        
        // Reset acceleration
        this.acceleration.set(0, 0);
    }

    /**
     * Applies a force to the particle
     * @param {Vec2} force - Force vector to apply
     */
    applyForce(force) {
        if (this.invMass === 0) return;
        this.acceleration.x += force.x * this.invMass;
        this.acceleration.y += force.y * this.invMass;
    }

    /**
     * Adds a behavior function that modifies the particle each update
     * @param {Function} behavior - Behavior function
     */
    addBehavior(behavior) {
        this.behaviors.push(behavior);
    }

    /**
     * Removes a behavior function
     * @param {Function} behavior - Behavior function to remove
     */
    removeBehavior(behavior) {
        const index = this.behaviors.indexOf(behavior);
        if (index !== -1) {
            this.behaviors.splice(index, 1);
        }
    }

    /**
     * Adds a constraint that affects this particle
     * @param {Constraint} constraint - Constraint to add
     */
    addConstraint(constraint) {
        this.constraints.push(constraint);
    }

    /**
     * Removes a constraint
     * @param {Constraint} constraint - Constraint to remove
     */
    removeConstraint(constraint) {
        const index = this.constraints.indexOf(constraint);
        if (index !== -1) {
            this.constraints.splice(index, 1);
        }
    }

    /**
     * Gets the velocity of the particle
     * @returns {Vec2} Velocity vector
     */
    getVelocity() {
        return new Vec2(
            this.position.x - this.previousPosition.x,
            this.position.y - this.previousPosition.y
        );
    }

    /**
     * Sets the velocity of the particle
     * @param {Vec2} velocity - Velocity vector
     */
    setVelocity(velocity) {
        this.previousPosition.x = this.position.x - velocity.x;
        this.previousPosition.y = this.position.y - velocity.y;
    }

    /**
     * Gets the speed of the particle
     * @returns {number} Speed value
     */
    getSpeed() {
        const velocity = this.getVelocity();
        return velocity.length();
    }

    /**
     * Marks the particle for deletion
     */
    delete() {
        this.deleted = true;
    }
}

/**
 * Base class for constraints between particles
 */
export class Constraint {
    constructor() {
        this.particles = [];
    }

    /**
     * Solves the constraint
     * @param {number} deltaTime - Time step
     */
    solve(deltaTime) {
        // To be implemented by subclasses
    }

    /**
     * Adds a particle to this constraint
     * @param {VerletParticle} particle - Particle to add
     */
    addParticle(particle) {
        this.particles.push(particle);
        particle.addConstraint(this);
    }

    /**
     * Removes a particle from this constraint
     * @param {VerletParticle} particle - Particle to remove
     */
    removeParticle(particle) {
        const index = this.particles.indexOf(particle);
        if (index !== -1) {
            this.particles.splice(index, 1);
            particle.removeConstraint(this);
        }
    }
}

/**
 * Spring constraint between two particles
 */
export class SpringConstraint extends Constraint {
    /**
     * Creates a spring constraint between two particles
     * @param {VerletParticle} a - First particle
     * @param {VerletParticle} b - Second particle
     * @param {number} restLength - Rest length of the spring
     * @param {number} stiffness - Spring stiffness (0-1)
     */
    constructor(a, b, restLength, stiffness = 0.5) {
        super();
        this.addParticle(a);
        this.addParticle(b);
        this.restLength = restLength !== undefined ? restLength : a.position.distanceTo(b.position);
        this.stiffness = stiffness;
    }

    /**
     * Solves the spring constraint
     * @param {number} deltaTime - Time step
     */
    solve(deltaTime) {
        const a = this.particles[0];
        const b = this.particles[1];
        
        if (!a || !b || a.deleted || b.deleted) return;
        
        const delta = new Vec2(
            b.position.x - a.position.x,
            b.position.y - a.position.y
        );
        
        const distance = delta.length();
        if (distance === 0) return;
        
        const diff = (distance - this.restLength) / distance;
        const translateX = delta.x * diff * this.stiffness * 0.5;
        const translateY = delta.y * diff * this.stiffness * 0.5;
        
        // Apply corrections based on mass
        const totalInvMass = a.invMass + b.invMass;
        if (totalInvMass === 0) return;
        
        const aFactor = a.invMass / totalInvMass;
        const bFactor = b.invMass / totalInvMass;
        
        a.position.x += translateX * aFactor;
        a.position.y += translateY * aFactor;
        b.position.x -= translateX * bFactor;
        b.position.y -= translateY * bFactor;
    }
}

/**
 * Distance constraint maintaining a fixed distance between two particles
 */
export class DistanceConstraint extends Constraint {
    /**
     * Creates a distance constraint between two particles
     * @param {VerletParticle} a - First particle
     * @param {VerletParticle} b - Second particle
     * @param {number} distance - Fixed distance between particles
     */
    constructor(a, b, distance) {
        super();
        this.addParticle(a);
        this.addParticle(b);
        this.distance = distance !== undefined ? distance : a.position.distanceTo(b.position);
    }

    /**
     * Solves the distance constraint
     * @param {number} deltaTime - Time step
     */
    solve(deltaTime) {
        const a = this.particles[0];
        const b = this.particles[1];
        
        if (!a || !b || a.deleted || b.deleted) return;
        
        const delta = new Vec2(
            b.position.x - a.position.x,
            b.position.y - a.position.y
        );
        
        const distance = delta.length();
        if (distance === 0) return;
        
        const diff = (distance - this.distance) / distance;
        const translateX = delta.x * diff * 0.5;
        const translateY = delta.y * diff * 0.5;
        
        // Apply corrections based on mass
        const totalInvMass = a.invMass + b.invMass;
        if (totalInvMass === 0) return;
        
        const aFactor = a.invMass / totalInvMass;
        const bFactor = b.invMass / totalInvMass;
        
        a.position.x += translateX * aFactor;
        a.position.y += translateY * aFactor;
        b.position.x -= translateX * bFactor;
        b.position.y -= translateY * bFactor;
    }
}

/**
 * Angle constraint maintaining a fixed angle between three particles
 */
export class AngleConstraint extends Constraint {
    /**
     * Creates an angle constraint between three particles
     * @param {VerletParticle} a - First particle
     * @param {VerletParticle} b - Second particle (center)
     * @param {VerletParticle} c - Third particle
     * @param {number} angle - Fixed angle in radians
     */
    constructor(a, b, c, angle) {
        super();
        this.addParticle(a);
        this.addParticle(b);
        this.addParticle(c);
        this.angle = angle;
    }

    /**
     * Solves the angle constraint
     * @param {number} deltaTime - Time step
     */
    solve(deltaTime) {
        const a = this.particles[0];
        const b = this.particles[1];
        const c = this.particles[2];
        
        if (!a || !b || !c || a.deleted || b.deleted || c.deleted) return;
        
        // Calculate vectors from center particle
        const ba = new Vec2(a.position.x - b.position.x, a.position.y - b.position.y);
        const bc = new Vec2(c.position.x - b.position.x, c.position.y - b.position.y);
        
        // Calculate current angle
        const angleBA = Math.atan2(ba.y, ba.x);
        const angleBC = Math.atan2(bc.y, bc.x);
        let currentAngle = angleBC - angleBA;
        
        // Normalize angle to [-π, π]
        while (currentAngle > Math.PI) currentAngle -= 2 * Math.PI;
        while (currentAngle < -Math.PI) currentAngle += 2 * Math.PI;
        
        // Calculate difference
        let diff = this.angle - currentAngle;
        
        // Normalize difference to [-π, π]
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        
        // Apply correction
        if (diff !== 0) {
            const factor = 0.1;
            const angleA = angleBA - diff * factor * 0.5;
            const angleC = angleBC + diff * factor * 0.5;
            
            const lengthBA = ba.length();
            const lengthBC = bc.length();
            
            a.position.x = b.position.x + Math.cos(angleA) * lengthBA;
            a.position.y = b.position.y + Math.sin(angleA) * lengthBA;
            c.position.x = b.position.x + Math.cos(angleC) * lengthBC;
            c.position.y = b.position.y + Math.sin(angleC) * lengthBC;
        }
    }
}

/**
 * Boundary constraint confining particles to a rectangular area
 */
export class BoundaryConstraint extends Constraint {
    /**
     * Creates a boundary constraint
     * @param {number} minX - Minimum X coordinate
     * @param {number} minY - Minimum Y coordinate
     * @param {number} maxX - Maximum X coordinate
     * @param {number} maxY - Maximum Y coordinate
     * @param {number} bounce - Bounce factor (0-1)
     * @param {number} padding - Padding inside boundary
     */
    constructor(minX, minY, maxX, maxY, bounce = 1.0, padding = 0) {
        super();
        this.minX = minX + padding;
        this.minY = minY + padding;
        this.maxX = maxX - padding;
        this.maxY = maxY - padding;
        this.bounce = bounce;
    }

    /**
     * Solves the boundary constraint for a particle
     * @param {VerletParticle} particle - Particle to constrain
     */
    constrainParticle(particle) {
        if (particle.deleted) return;
        
        let constrained = false;
        
        // Constrain X position
        if (particle.position.x < this.minX) {
            particle.position.x = this.minX;
            particle.previousPosition.x = particle.position.x + 
                (particle.position.x - particle.previousPosition.x) * this.bounce;
            constrained = true;
        } else if (particle.position.x > this.maxX) {
            particle.position.x = this.maxX;
            particle.previousPosition.x = particle.position.x + 
                (particle.position.x - particle.previousPosition.x) * this.bounce;
            constrained = true;
        }
        
        // Constrain Y position
        if (particle.position.y < this.minY) {
            particle.position.y = this.minY;
            particle.previousPosition.y = particle.position.y + 
                (particle.position.y - particle.previousPosition.y) * this.bounce;
            constrained = true;
        } else if (particle.position.y > this.maxY) {
            particle.position.y = this.maxY;
            particle.previousPosition.y = particle.position.y + 
                (particle.position.y - particle.previousPosition.y) * this.bounce;
            constrained = true;
        }
        
        return constrained;
    }

    /**
     * Solves the boundary constraint for all particles
     * @param {number} deltaTime - Time step
     */
    solve(deltaTime) {
        for (const particle of this.particles) {
            this.constrainParticle(particle);
        }
    }
}

/**
 * Collision detection and response system
 */
export class CollisionSystem {
    /**
     * Checks for collisions between particles and resolves them
     * @param {VerletParticle[]} particles - Array of particles to check
     * @param {number} deltaTime - Time step
     */
    static resolveCollisions(particles, deltaTime) {
        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            if (a.deleted) continue;
            
            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                if (b.deleted) continue;
                
                const dx = b.position.x - a.position.x;
                const dy = b.position.y - a.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Sum of radii
                const minDistance = a.radius + b.radius;
                
                if (distance < minDistance && distance > 0) {
                    // Collision detected
                    const overlap = minDistance - distance;
                    const separationX = (dx / distance) * overlap * 0.5;
                    const separationY = (dy / distance) * overlap * 0.5;
                    
                    // Apply separation based on mass
                    const totalInvMass = a.invMass + b.invMass;
                    if (totalInvMass === 0) continue;
                    
                    const aFactor = a.invMass / totalInvMass;
                    const bFactor = b.invMass / totalInvMass;
                    
                    a.position.x -= separationX * aFactor;
                    a.position.y -= separationY * aFactor;
                    b.position.x += separationX * bFactor;
                    b.position.y += separationY * bFactor;
                }
            }
        }
    }
}

/**
 * Main Verlet Physics engine
 */
export class VerletPhysics {
    /**
     * Creates a new Verlet physics engine
     * @param {number} iterations - Number of constraint solving iterations per step
     */
    constructor(iterations = 3) {
        this.particles = [];
        this.constraints = [];
        this.iterations = iterations;
        this.gravity = new Vec2(0, 0);
        this.bounds = null;
        this.collisionSystem = CollisionSystem;
    }

    /**
     * Sets the gravity force
     * @param {number} x - X component of gravity
     * @param {number} y - Y component of gravity
     */
    setGravity(x, y) {
        this.gravity.set(x, y);
    }

    /**
     * Sets the boundary constraints
     * @param {number} minX - Minimum X coordinate
     * @param {number} minY - Minimum Y coordinate
     * @param {number} maxX - Maximum X coordinate
     * @param {number} maxY - Maximum Y coordinate
     */
    setBounds(minX, minY, maxX, maxY) {
        if (!this.bounds) {
            this.bounds = new BoundaryConstraint(minX, minY, maxX, maxY);
            this.addConstraint(this.bounds);
        } else {
            this.bounds.minX = minX;
            this.bounds.minY = minY;
            this.bounds.maxX = maxX;
            this.bounds.maxY = maxY;
        }
    }

    /**
     * Adds a particle to the physics simulation
     * @param {VerletParticle} particle - Particle to add
     */
    addParticle(particle) {
        this.particles.push(particle);
        if (this.bounds) {
            this.bounds.addParticle(particle);
        }
        return particle;
    }

    /**
     * Removes a particle from the physics simulation
     * @param {VerletParticle} particle - Particle to remove
     */
    removeParticle(particle) {
        const index = this.particles.indexOf(particle);
        if (index !== -1) {
            this.particles.splice(index, 1);
            if (this.bounds) {
                this.bounds.removeParticle(particle);
            }
        }
    }

    /**
     * Adds a constraint to the physics simulation
     * @param {Constraint} constraint - Constraint to add
     */
    addConstraint(constraint) {
        this.constraints.push(constraint);
    }

    /**
     * Removes a constraint from the physics simulation
     * @param {Constraint} constraint - Constraint to remove
     */
    removeConstraint(constraint) {
        const index = this.constraints.indexOf(constraint);
        if (index !== -1) {
            this.constraints.splice(index, 1);
        }
    }

    /**
     * Updates the physics simulation
     * @param {number} deltaTime - Time step
     */
    update(deltaTime) {
        // Apply gravity to all particles
        if (this.gravity.x !== 0 || this.gravity.y !== 0) {
            for (const particle of this.particles) {
                if (!particle.deleted && particle.invMass > 0) {
                    particle.applyForce(
                        new Vec2(
                            this.gravity.x * particle.mass,
                            this.gravity.y * particle.mass
                        )
                    );
                }
            }
        }

        // Update all particles
        for (const particle of this.particles) {
            particle.update(deltaTime);
        }

        // Solve constraints multiple times for stability
        for (let i = 0; i < this.iterations; i++) {
            for (const constraint of this.constraints) {
                constraint.solve(deltaTime);
            }
        }

        // Resolve collisions
        this.collisionSystem.resolveCollisions(this.particles, deltaTime);

        // Remove deleted particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (this.particles[i].deleted) {
                this.removeParticle(this.particles[i]);
            }
        }
    }

    /**
     * Creates a particle chain between two points
     * @param {VerletParticle} a - First particle
     * @param {VerletParticle} b - Last particle
     * @param {number} num - Number of particles in chain
     * @param {number} strength - Strength of springs
     * @returns {Object} Object containing particles and springs arrays
     */
    addParticleChain(a, b, num, strength = 0.5) {
        if (num <= 0) return { particles: [], springs: [] };

        const particles = [];
        const springs = [];
        
        // Add first particle if not already in system
        if (!this.particles.includes(a)) {
            this.addParticle(a);
            particles.push(a);
        }
        
        let prev = a;
        const chainLength = a.position.distanceTo(b.position);
        const linkLength = chainLength / (num + 1);
        
        // Create intermediate particles
        for (let i = 0; i < num; i++) {
            const t = (i + 1) / (num + 1);
            const px = a.position.x + (b.position.x - a.position.x) * t;
            const py = a.position.y + (b.position.y - a.position.y) * t;
            
            const particle = new VerletParticle(px, py);
            this.addParticle(particle);
            particles.push(particle);
            
            const spring = new SpringConstraint(prev, particle, linkLength, strength);
            this.addConstraint(spring);
            springs.push(spring);
            
            prev = particle;
        }
        
        // Connect to last particle
        const spring = new SpringConstraint(prev, b, linkLength, strength);
        this.addConstraint(spring);
        springs.push(spring);
        
        // Add last particle if not already in system
        if (!this.particles.includes(b)) {
            this.addParticle(b);
            particles.push(b);
        }
        
        return { particles, springs };
    }
}
import { VerletPhysics, VerletParticle, Vec2, SpringConstraint } from './VerletPhysics.js';

/**
 * Simple test to verify physics system functionality
 */
function testPhysicsSystem() {
    console.log("Testing Verlet Physics System...");
    
    // Create physics engine
    const physics = new VerletPhysics();
    
    // Create particles
    const particleA = new VerletParticle(0, 0, 1);
    const particleB = new VerletParticle(2, 0, 1);
    
    // Add particles to physics
    physics.addParticle(particleA);
    physics.addParticle(particleB);
    
    // Create spring constraint
    const spring = new SpringConstraint(particleA, particleB, 1, 0.5);
    physics.addConstraint(spring);
    
    // Apply force to first particle
    particleA.applyForce(new Vec2(10, 0));
    
    // Update physics
    physics.update(0.016);
    
    console.log("Particle A position:", particleA.position);
    console.log("Particle B position:", particleB.position);
    
    // Test particle chain
    const particleC = new VerletParticle(4, 0, 1);
    const chain = physics.addParticleChain(particleB, particleC, 3, 0.5);
    
    console.log("Chain particles:", chain.particles.length);
    console.log("Chain springs:", chain.springs.length);
    
    console.log("Physics system test completed.");
}

// Run test
testPhysicsSystem();
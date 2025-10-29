import * as THREE from 'three';
import { VerletParticle } from '../src/physics/VerletPhysics.js';
import { IntegrationTests } from '../demo/integration-tests.js';

// Make THREE and VerletParticle globally available for the tests
window.THREE = THREE;
window.VerletParticle = VerletParticle;

new IntegrationTests();

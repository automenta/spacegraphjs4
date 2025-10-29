import { Surface } from './Surface.js';
import { ContainerSurface } from './ContainerSurface.js';
import { RectSurface } from './RectSurface.js';
import { CircleSurface } from './CircleSurface.js';
import { TextSurface } from './TextSurface.js';
import { Event } from './Event.js';
import { Layer } from './Layer.js';

// Import physics components
import { PhysicsSurface } from './PhysicsSurface.js';
import { PhysicsContainer } from './containers/PhysicsContainer.js';
import { ForceDirectedLayoutContainer } from './containers/ForceDirectedLayoutContainer.js';
import { CollisionAwareContainer } from './containers/CollisionAwareContainer.js';

// Import physics utilities
import { applyForce, applyImpulse, createSpringConstraint, applyRepulsion, applyAttraction } from './physics/PhysicsUtils.js';

// Physics demo application class
class PhysicsDemoApp {
    constructor() {
        // Create container for canvas
        this.container = document.getElementById('canvas-container');
        
        // Demo state
        this.currentDemo = 'spring'; // 'spring', 'collision', 'force'
        this.gravityEnabled = false;
        
        // Initialize Three.js renderer
        this.initRenderer();
        
        // Create layer system
        this.layer = new Layer();
        
        // Create a basic scene graph
        this.createScene();
        
        // Setup UI controls
        this.setupControls();
        
        // Start animation loop
        this.animate();
    }

    /**
     * Initializes the Three.js WebGL renderer
     */
    initRenderer() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x111111, 1);
        
        // Add canvas to DOM
        this.container.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    /**
     * Sets up UI controls
     */
    setupControls() {
        // Demo selection buttons
        document.getElementById('springDemo').addEventListener('click', () => {
            this.currentDemo = 'spring';
            this.createScene();
        });
        
        document.getElementById('collisionDemo').addEventListener('click', () => {
            this.currentDemo = 'collision';
            this.createScene();
        });
        
        document.getElementById('forceDemo').addEventListener('click', () => {
            this.currentDemo = 'force';
            this.createScene();
        });
        
        // Global controls
        document.getElementById('gravityOn').addEventListener('click', () => {
            this.gravityEnabled = true;
            if (this.physicsContainer) {
                this.physicsContainer.setGravity(0, 0.5);
            }
        });
        
        document.getElementById('gravityOff').addEventListener('click', () => {
            this.gravityEnabled = false;
            if (this.physicsContainer) {
                this.physicsContainer.setGravity(0, 0);
            }
        });
        
        document.getElementById('reset').addEventListener('click', () => {
            this.createScene();
        });
        
        // Force application buttons
        document.getElementById('repel').addEventListener('click', () => {
            this.applyRepulsionToRandomSurfaces();
        });
        
        document.getElementById('attract').addEventListener('click', () => {
            this.applyAttractionToRandomSurfaces();
        });
    }

    /**
     * Creates a basic scene graph based on current demo
     */
    createScene() {
        // Clear existing scene
        if (this.rootSurface) {
            this.rootSurface.stop();
        }
        
        // Create a container surface as root
        const rootSurface = new ContainerSurface({ x: 20, y: 15 });
        
        // Set as root surface in layer
        this.layer.setRootSurface(rootSurface);
        
        // Create title
        const title = new TextSurface(`Physics Demo: ${this.currentDemo.charAt(0).toUpperCase() + this.currentDemo.slice(1)}`, {
            font: 'Arial',
            fontSize: 24,
            color: '#ffffff'
        });
        title.position.set(10, 14, 0);
        rootSurface.addChild(title);
        
        // Create demo-specific scene
        switch (this.currentDemo) {
            case 'spring':
                this.createSpringDemo(rootSurface);
                break;
            case 'collision':
                this.createCollisionDemo(rootSurface);
                break;
            case 'force':
                this.createForceDirectedDemo(rootSurface);
                break;
        }
        
        // Store root surface for later use
        this.rootSurface = rootSurface;
    }

    /**
     * Creates the spring demo scene
     */
    createSpringDemo(rootSurface) {
        // Create physics container
        const physicsContainer = new PhysicsContainer({ x: 18, y: 12 });
        physicsContainer.position.set(1, 1, 0);
        rootSurface.addChild(physicsContainer);
        this.physicsContainer = physicsContainer;
        
        // Set gravity based on current setting
        if (this.gravityEnabled) {
            physicsContainer.setGravity(0, 0.5);
        }
        
        // Create connected rectangles
        const rects = [];
        for (let i = 0; i < 5; i++) {
            const rect = new RectSurface({ x: 1, y: 1 }, 0xff0000 + i * 0x333333);
            rect.position.set(5 + i * 2, 6, 0);
            physicsContainer.addChild(rect);
            rects.push(rect);
        }
        
        // Connect rectangles with springs
        for (let i = 0; i < rects.length - 1; i++) {
            physicsContainer.createSpringConstraint(rects[i], rects[i + 1], 2, 0.3);
        }
        
        // Make first and last rectangles draggable
        rects[0].addEventListener('pointerdown', (event) => {
            rects[0].isDragging = true;
        });
        
        rects[0].addEventListener('pointermove', (event) => {
            if (rects[0].isDragging) {
                // Apply force to follow mouse
                if (rects[0].physicsParticle) {
                    const targetX = event.data.x - physicsContainer.worldPosition.x;
                    const targetY = event.data.y - physicsContainer.worldPosition.y;
                    const dx = targetX - rects[0].physicsParticle.position.x;
                    const dy = targetY - rects[0].physicsParticle.position.y;
                    rects[0].applyPhysicsForce(new Vec2(dx * 0.5, dy * 0.5));
                }
            }
        });
        
        rects[0].addEventListener('pointerup', (event) => {
            rects[0].isDragging = false;
        });
        
        rects[rects.length - 1].addEventListener('pointerdown', (event) => {
            rects[rects.length - 1].isDragging = true;
        });
        
        rects[rects.length - 1].addEventListener('pointermove', (event) => {
            if (rects[rects.length - 1].isDragging) {
                // Apply force to follow mouse
                if (rects[rects.length - 1].physicsParticle) {
                    const targetX = event.data.x - physicsContainer.worldPosition.x;
                    const targetY = event.data.y - physicsContainer.worldPosition.y;
                    const dx = targetX - rects[rects.length - 1].physicsParticle.position.x;
                    const dy = targetY - rects[rects.length - 1].physicsParticle.position.y;
                    rects[rects.length - 1].applyPhysicsForce(new Vec2(dx * 0.5, dy * 0.5));
                }
            }
        });
        
        rects[rects.length - 1].addEventListener('pointerup', (event) => {
            rects[rects.length - 1].isDragging = false;
        });
    }

    /**
     * Creates the collision demo scene
     */
    createCollisionDemo(rootSurface) {
        // Create collision-aware container
        const collisionContainer = new CollisionAwareContainer({ x: 18, y: 12 });
        collisionContainer.position.set(1, 1, 0);
        rootSurface.addChild(collisionContainer);
        this.physicsContainer = collisionContainer;
        
        // Create circles that will collide
        const circles = [];
        for (let i = 0; i < 8; i++) {
            const circle = new CircleSurface(0.5, 0x00ff00 + i * 0x222222);
            circle.position.set(3 + (i % 4) * 3, 2 + Math.floor(i / 4) * 3, 0);
            collisionContainer.addChild(circle);
            circles.push(circle);
            
            // Enable physics for each circle
            circle.setPhysicsEnabled(true);
        }
        
        // Add some initial velocities to circles
        for (let i = 0; i < circles.length; i++) {
            const angle = (i / circles.length) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            circles[i].setPhysicsVelocity(new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed));
        }
    }

    /**
     * Creates the force-directed layout demo scene
     */
    createForceDirectedDemo(rootSurface) {
        // Create force-directed layout container
        const forceContainer = new ForceDirectedLayoutContainer({ x: 18, y: 12 });
        forceContainer.position.set(1, 1, 0);
        rootSurface.addChild(forceContainer);
        this.physicsContainer = forceContainer;
        
        // Create connected nodes
        const nodes = [];
        for (let i = 0; i < 6; i++) {
            const node = new CircleSurface(0.4, 0x0000ff + i * 0x333333);
            node.position.set(5 + (i % 3) * 3, 3 + Math.floor(i / 3) * 3, 0);
            forceContainer.addChild(node);
            nodes.push(node);
        }
        
        // Connect some nodes
        forceContainer.connectSurfaces(nodes[0], nodes[1]);
        forceContainer.connectSurfaces(nodes[1], nodes[2]);
        forceContainer.connectSurfaces(nodes[2], nodes[3]);
        forceContainer.connectSurfaces(nodes[3], nodes[4]);
        forceContainer.connectSurfaces(nodes[4], nodes[5]);
        forceContainer.connectSurfaces(nodes[0], nodes[3]);
        forceContainer.connectSurfaces(nodes[1], nodes[4]);
    }

    /**
     * Applies repulsion to random surfaces
     */
    applyRepulsionToRandomSurfaces() {
        if (!this.physicsContainer || !this.physicsContainer.children || this.physicsContainer.children.length < 2) return;
        
        const children = this.physicsContainer.children;
        if (children.length < 2) return;
        
        const surfaceA = children[Math.floor(Math.random() * children.length)];
        const surfaceB = children[Math.floor(Math.random() * children.length)];
        
        if (surfaceA !== surfaceB) {
            applyRepulsion(surfaceA, surfaceB, 5.0, 100);
        }
    }

    /**
     * Applies attraction to random surfaces
     */
    applyAttractionToRandomSurfaces() {
        if (!this.physicsContainer || !this.physicsContainer.children || this.physicsContainer.children.length < 2) return;
        
        const children = this.physicsContainer.children;
        if (children.length < 2) return;
        
        const surfaceA = children[Math.floor(Math.random() * children.length)];
        const surfaceB = children[Math.floor(Math.random() * children.length)];
        
        if (surfaceA !== surfaceB) {
            applyAttraction(surfaceA, surfaceB, 5.0, 200);
        }
    }

    /**
     * Handles window resize events
     */
    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.layer.resize(window.innerWidth, window.innerHeight);
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update and render
        this.layer.update(0.016); // Assuming 60fps (16ms per frame)
        this.layer.render(this.renderer);
        
        // Attach input listeners after first render
        if (!this.inputListenersAttached) {
            this.layer.attachInputListeners(this.renderer);
            this.inputListenersAttached = true;
        }
    }
}

// Initialize the application when the page loads
window.addEventListener('load', () => {
    new PhysicsDemoApp();
});
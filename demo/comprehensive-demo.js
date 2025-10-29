import { Surface } from '../src/Surface.js';
import { ContainerSurface } from '../src/ContainerSurface.js';
import { RectSurface } from '../src/RectSurface.js';
import { CircleSurface } from '../src/CircleSurface.js';
import { TextSurface } from '../src/TextSurface.js';
import { CubeSurface } from '../src/CubeSurface.js';
import { SphereSurface } from '../src/SphereSurface.js';
import { CameraSystem } from '../src/CameraSystem.js';
import { Layer } from '../src/Layer.js';

// Import layout containers
import { BorderLayout } from '../src/layout/BorderLayout.js';
import { GridLayout } from '../src/layout/GridLayout.js';
import { FlexLayout } from '../src/layout/FlexLayout.js';

// Import UI components
import { Button } from '../src/components/Button.js';
import { Slider } from '../src/components/Slider.js';
import { TextInput } from '../src/components/TextInput.js';
import { ScrollableContainer } from '../src/components/ScrollableContainer.js';

// Import physics components
import { PhysicsSurface } from '../src/PhysicsSurface.js';
import { PhysicsContainer } from '../src/containers/PhysicsContainer.js';
import { ForceDirectedLayoutContainer } from '../src/containers/ForceDirectedLayoutContainer.js';
import { CollisionAwareContainer } from '../src/containers/CollisionAwareContainer.js';

// Import physics utilities
import { applyForce, applyImpulse, createSpringConstraint, applyRepulsion, applyAttraction } from '../src/physics/PhysicsUtils.js';
import { Vec2, SpringConstraint, DistanceConstraint } from '../src/physics/VerletPhysics.js';

// Import layout utilities
import { LayoutUtils } from '../src/layout/LayoutUtils.js';

// Demo application class
class ComprehensiveDemoApp {
    constructor() {
        // Create container for canvas
        this.container = document.getElementById('canvas-container');
        
        // Demo state
        this.currentDemo = 'mixed'; // 'layout', 'physics', 'mixed', 'performance'
        this.gravityEnabled = true;
        this.debugBoundingBoxes = false;
        this.debugPhysics = false;
        this.performanceMonitorVisible = true;
        this.boundingBoxHelper = null;
        this.physicsDebugHelper = null;
        
        // Performance monitoring
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.physicsUpdateTime = 0;
        this.renderTime = 0;
        this.surfaceCreationTime = 0;
        this.surfaceDestructionTime = 0;
        
        // Scene elements
        this.demoSurfaces = [];
        this.uiComponents = [];
        this.physicsSurfaces = [];
        
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
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
        
        // Setup input handlers
        this.setupInputHandlers();
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
        
        // Setup raycasting for mouse interactions
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    /**
     * Sets up UI controls
     */
    setupControls() {
        // Demo selection buttons
        document.getElementById('layoutDemoBtn').addEventListener('click', () => {
            this.currentDemo = 'layout';
            this.createScene();
        });
        
        document.getElementById('physicsDemoBtn').addEventListener('click', () => {
            this.currentDemo = 'physics';
            this.createScene();
        });
        
        document.getElementById('mixedDemoBtn').addEventListener('click', () => {
            this.currentDemo = 'mixed';
            this.createScene();
        });
        
        document.getElementById('performanceDemoBtn').addEventListener('click', () => {
            this.currentDemo = 'performance';
            this.createScene();
        });
        
        // Camera controls
        document.getElementById('cameraModeSelect').addEventListener('change', (event) => {
            if (event.target.value === 'perspective') {
                this.layer.cameraSystem.usePerspective();
            } else {
                this.layer.cameraSystem.useOrthographic();
            }
            this.updateDebugInfo();
        });
        
        document.getElementById('resetCameraBtn').addEventListener('click', () => {
            this.layer.cameraSystem.transitionTo(
                new THREE.Vector3(0, 0, 5),
                new THREE.Vector3(0, 0, 0),
                5,
                1000
            );
        });
        
        document.getElementById('fitViewBtn').addEventListener('click', () => {
            if (this.rootSurface) {
                const allSurfaces = [];
                this.collectSurfaces(this.rootSurface, allSurfaces);
                this.layer.fitToView(allSurfaces, 1000);
            }
        });
        
        // Physics settings
        document.getElementById('gravitySlider').addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            if (this.physicsContainer) {
                this.physicsContainer.setGravity(0, value);
            }
        });
        
        document.getElementById('iterationsSlider').addEventListener('input', (event) => {
            const value = parseInt(event.target.value);
            if (this.physicsContainer) {
                // In a real implementation, this would adjust physics iteration count
                console.log('Physics iterations set to:', value);
            }
        });
        
        document.getElementById('toggleGravityBtn').addEventListener('click', () => {
            this.gravityEnabled = !this.gravityEnabled;
            if (this.physicsContainer) {
                this.physicsContainer.setGravity(0, this.gravityEnabled ? 0.5 : 0);
            }
        });
        
        document.getElementById('resetPhysicsBtn').addEventListener('click', () => {
            this.createScene();
        });
        
        // Scene controls
        document.getElementById('addSurfaceBtn').addEventListener('click', () => {
            this.addRandomSurface();
        });
        
        document.getElementById('removeSurfaceBtn').addEventListener('click', () => {
            this.removeRandomSurface();
        });
        
        document.getElementById('clearSceneBtn').addEventListener('click', () => {
            this.createScene();
        });
        
        document.getElementById('randomizeBtn').addEventListener('click', () => {
            this.randomizeScene();
        });
        
        // UI components
        document.getElementById('showButtonsBtn').addEventListener('click', () => {
            this.showUIComponents('buttons');
        });
        
        document.getElementById('hideButtonsBtn').addEventListener('click', () => {
            this.hideUIComponents('buttons');
        });
        
        document.getElementById('showSlidersBtn').addEventListener('click', () => {
            this.showUIComponents('sliders');
        });
        
        document.getElementById('hideSlidersBtn').addEventListener('click', () => {
            this.hideUIComponents('sliders');
        });
        
        // Debug options
        document.getElementById('boundingBoxesCheckbox').addEventListener('change', (event) => {
            this.debugBoundingBoxes = event.target.checked;
            this.toggleBoundingBoxes();
        });
        
        document.getElementById('physicsDebugCheckbox').addEventListener('change', (event) => {
            this.debugPhysics = event.target.checked;
            this.togglePhysicsDebug();
        });
        
        document.getElementById('togglePerfMonitorBtn').addEventListener('click', () => {
            this.performanceMonitorVisible = !this.performanceMonitorVisible;
            document.getElementById('performance-monitor').style.display = 
                this.performanceMonitorVisible ? 'block' : 'none';
        });
    }

    /**
     * Collects all surfaces in the hierarchy
     * @param {Surface} surface - The surface to start from
     * @param {Array} surfaces - Array to collect surfaces in
     */
    collectSurfaces(surface, surfaces) {
        surfaces.push(surface);
        for (const child of surface.children) {
            this.collectSurfaces(child, surfaces);
        }
    }

    /**
     * Creates a basic scene graph based on current demo
     */
    createScene() {
        // Clear existing scene
        if (this.rootSurface) {
            this.rootSurface.stop();
        }
        
        // Reset arrays
        this.demoSurfaces = [];
        this.uiComponents = [];
        this.physicsSurfaces = [];
        
        // Create a container surface as root
        const rootSurface = new ContainerSurface({ x: 30, y: 20 });
        
        // Set as root surface in layer
        this.layer.setRootSurface(rootSurface);
        
        // Create demo-specific scene
        switch (this.currentDemo) {
            case 'layout':
                this.createLayoutDemo(rootSurface);
                break;
            case 'physics':
                this.createPhysicsDemo(rootSurface);
                break;
            case 'mixed':
                this.createMixedDemo(rootSurface);
                break;
            case 'performance':
                this.createPerformanceDemo(rootSurface);
                break;
        }
        
        // Store root surface for later use
        this.rootSurface = rootSurface;
        
        // Update debug info
        this.updateDebugInfo();
    }

    /**
     * Creates the layout demo scene
     */
    createLayoutDemo(rootSurface) {
        // Create title
        const title = new TextSurface(`Layout Demo`, {
            font: 'Arial',
            fontSize: 28,
            color: '#ffffff'
        });
        title.position.set(15, 18, 0);
        rootSurface.addChild(title);
        
        // Create a BorderLayout container
        const borderLayoutContainer = new BorderLayout({ x: 8, y: 6 });
        borderLayoutContainer.position.set(1, 1, 0);
        rootSurface.addChild(borderLayoutContainer);
        
        // Add components to border regions
        const northPanel = new RectSurface({ x: 8, y: 1 }, 0xff4444);
        const northText = new TextSurface("North", { font: 'Arial', fontSize: 14, color: '#ffffff' });
        northText.position.set(4, 0.5, 0);
        northPanel.addChild(northText);
        borderLayoutContainer.add(northPanel, 'north');
        
        const southPanel = new RectSurface({ x: 8, y: 1 }, 0x44ff44);
        const southText = new TextSurface("South", { font: 'Arial', fontSize: 14, color: '#000000' });
        southText.position.set(4, 0.5, 0);
        southPanel.addChild(southText);
        borderLayoutContainer.add(southPanel, 'south');
        
        const westPanel = new RectSurface({ x: 1.5, y: 4 }, 0x4444ff);
        const westText = new TextSurface("W", { font: 'Arial', fontSize: 14, color: '#ffffff' });
        westText.position.set(0.75, 2, 0);
        westPanel.addChild(westText);
        borderLayoutContainer.add(westPanel, 'west');
        
        const eastPanel = new RectSurface({ x: 1.5, y: 4 }, 0xff44ff);
        const eastText = new TextSurface("E", { font: 'Arial', fontSize: 14, color: '#ffffff' });
        eastText.position.set(0.75, 2, 0);
        eastPanel.addChild(eastText);
        borderLayoutContainer.add(eastPanel, 'east');
        
        const centerPanel = new RectSurface({ x: 5, y: 4 }, 0xffff44);
        const centerText = new TextSurface("Center", { font: 'Arial', fontSize: 16, color: '#000000' });
        centerText.position.set(2.5, 2, 0);
        centerPanel.addChild(centerText);
        borderLayoutContainer.add(centerPanel, 'center');
        
        // Create a GridLayout container
        const gridLayoutContainer = new GridLayout({ x: 6, y: 6 }, 3, 3);
        gridLayoutContainer.position.set(10, 1, 0);
        gridLayoutContainer.setSpacing(0.5, 0.5);
        rootSurface.addChild(gridLayoutContainer);
        
        // Add colored rectangles to grid cells
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff, 0x888888, 0x444444];
        for (let i = 0; i < 9; i++) {
            const cell = new RectSurface({ x: 1.5, y: 1.5 }, colors[i]);
            const cellText = new TextSurface(`${i+1}`, { font: 'Arial', fontSize: 16, color: '#ffffff' });
            cellText.position.set(0.75, 0.75, 0);
            cell.addChild(cellText);
            gridLayoutContainer.addChild(cell);
        }
        
        // Create a FlexLayout container
        const flexLayoutContainer = new FlexLayout({ x: 6, y: 4 });
        flexLayoutContainer.position.set(17, 1, 0);
        flexLayoutContainer.setFlexOptions({
            direction: 'row',
            justifyContent: 'space-around',
            alignItems: 'center'
        });
        rootSurface.addChild(flexLayoutContainer);
        
        // Add buttons to flex container
        const flexButton1 = new Button("Btn 1", { x: 1.5, y: 1 }, 0xff6666);
        const flexButton2 = new Button("Btn 2", { x: 1.5, y: 1 }, 0x66ff66);
        const flexButton3 = new Button("Btn 3", { x: 1.5, y: 1 }, 0x6666ff);
        
        flexLayoutContainer.addChild(flexButton1);
        flexLayoutContainer.addChild(flexButton2);
        flexLayoutContainer.addChild(flexButton3);
        
        // Add event listeners to flex buttons
        flexButton1.addEventListener('click', (event) => {
            console.log('Flex Button 1 clicked');
        });
        
        flexButton2.addEventListener('click', (event) => {
            console.log('Flex Button 2 clicked');
        });
        
        flexButton3.addEventListener('click', (event) => {
            console.log('Flex Button 3 clicked');
        });
        
        // Create UI components
        this.createUIComponents(rootSurface);
        
        // Store demo surfaces
        this.demoSurfaces.push(borderLayoutContainer, gridLayoutContainer, flexLayoutContainer);
    }

    /**
     * Creates the physics demo scene
     */
    createPhysicsDemo(rootSurface) {
        // Create title
        const title = new TextSurface(`Physics Demo`, {
            font: 'Arial',
            fontSize: 28,
            color: '#ffffff'
        });
        title.position.set(15, 18, 0);
        rootSurface.addChild(title);
        
        // Create physics container
        const physicsContainer = new PhysicsContainer({ x: 28, y: 16 });
        physicsContainer.position.set(1, 1, 0);
        rootSurface.addChild(physicsContainer);
        this.physicsContainer = physicsContainer;
        
        // Set gravity
        physicsContainer.setGravity(0, 0.5);
        
        // Create connected rectangles
        const rects = [];
        for (let i = 0; i < 5; i++) {
            const rect = new RectSurface({ x: 1.5, y: 1.5 }, 0xff0000 + i * 0x333333);
            rect.position.set(5 + i * 2, 8, 0);
            physicsContainer.addChild(rect);
            rects.push(rect);
            this.physicsSurfaces.push(rect);
        }
        
        // Connect rectangles with springs
        for (let i = 0; i < rects.length - 1; i++) {
            physicsContainer.createSpringConstraint(rects[i], rects[i + 1], 2, 0.3);
        }
        
        // Create circles that will collide
        const circles = [];
        for (let i = 0; i < 8; i++) {
            const circle = new CircleSurface(0.7, 0x00ff00 + i * 0x222222);
            circle.position.set(3 + (i % 4) * 3, 3 + Math.floor(i / 4) * 3, 0);
            physicsContainer.addChild(circle);
            circles.push(circle);
            this.physicsSurfaces.push(circle);
            
            // Enable physics for each circle
            circle.setPhysicsEnabled(true);
        }
        
        // Add some initial velocities to circles
        for (let i = 0; i < circles.length; i++) {
            const angle = (i / circles.length) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            circles[i].setPhysicsVelocity(new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed));
        }
        
        // Create force-directed layout container
        const forceContainer = new ForceDirectedLayoutContainer({ x: 8, y: 6 });
        forceContainer.position.set(18, 1, 0);
        rootSurface.addChild(forceContainer);
        
        // Create connected nodes
        const nodes = [];
        for (let i = 0; i < 6; i++) {
            const node = new CircleSurface(0.4, 0x0000ff + i * 0x333333);
            node.position.set(2 + (i % 3) * 2, 2 + Math.floor(i / 3) * 2, 0);
            forceContainer.addChild(node);
            nodes.push(node);
            this.physicsSurfaces.push(node);
        }
        
        // Connect some nodes
        forceContainer.connectSurfaces(nodes[0], nodes[1]);
        forceContainer.connectSurfaces(nodes[1], nodes[2]);
        forceContainer.connectSurfaces(nodes[2], nodes[3]);
        forceContainer.connectSurfaces(nodes[3], nodes[4]);
        forceContainer.connectSurfaces(nodes[4], nodes[5]);
        forceContainer.connectSurfaces(nodes[0], nodes[3]);
        forceContainer.connectSurfaces(nodes[1], nodes[4]);
        
        // Store demo surfaces
        this.demoSurfaces.push(physicsContainer, forceContainer);
    }

    /**
     * Creates the mixed demo scene
     */
    createMixedDemo(rootSurface) {
        // Create title
        const title = new TextSurface(`Mixed Demo`, {
            font: 'Arial',
            fontSize: 28,
            color: '#ffffff'
        });
        title.position.set(15, 18, 0);
        rootSurface.addChild(title);
        
        // Create a 2D rectangle surface
        const rect = new RectSurface({ x: 2, y: 1.5 }, 0xff0000);
        rect.position.set(2, 2, 0);
        rootSurface.addChild(rect);
        this.demoSurfaces.push(rect);
        
        // Create a 2D circle surface
        const circle = new CircleSurface(1, 0x00ff00);
        circle.position.set(6, 2, 0);
        rootSurface.addChild(circle);
        this.demoSurfaces.push(circle);
        
        // Create a text surface
        const text = new TextSurface("Hello SpaceGraph!", {
            font: 'Arial',
            fontSize: 20,
            color: '#ffffff'
        });
        text.position.set(10, 2, 0);
        rootSurface.addChild(text);
        this.demoSurfaces.push(text);
        
        // Create a 3D cube surface
        const cube = new CubeSurface({ x: 1.5, y: 1.5, z: 1.5 }, 0x0000ff);
        cube.position.set(15, 2, 0);
        rootSurface.addChild(cube);
        this.demoSurfaces.push(cube);
        
        // Create a 3D sphere surface
        const sphere = new SphereSurface(1, 0xffff00);
        sphere.position.set(19, 2, 0);
        rootSurface.addChild(sphere);
        this.demoSurfaces.push(sphere);
        
        // Create layout containers
        this.createLayoutDemo(rootSurface);
        
        // Create physics elements
        const physicsContainer = new PhysicsContainer({ x: 12, y: 8 });
        physicsContainer.position.set(1, 9, 0);
        rootSurface.addChild(physicsContainer);
        this.physicsContainer = physicsContainer;
        
        // Set gravity
        physicsContainer.setGravity(0, 0.3);
        
        // Create physics surfaces
        const physRect = new RectSurface({ x: 1.5, y: 1.5 }, 0xff8800);
        physRect.position.set(2, 12, 0);
        physicsContainer.addChild(physRect);
        this.physicsSurfaces.push(physRect);
        
        const physCircle = new CircleSurface(0.8, 0x8800ff);
        physCircle.position.set(6, 12, 0);
        physicsContainer.addChild(physCircle);
        this.physicsSurfaces.push(physCircle);
        
        // Store demo surfaces
        this.demoSurfaces.push(physicsContainer);
    }

    /**
     * Creates the performance demo scene
     */
    createPerformanceDemo(rootSurface) {
        // Create title
        const title = new TextSurface(`Performance Demo`, {
            font: 'Arial',
            fontSize: 28,
            color: '#ffffff'
        });
        title.position.set(15, 18, 0);
        rootSurface.addChild(title);
        
        // Create many surfaces to test performance
        const gridSize = 20;
        const spacing = 1.2;
        
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const x = 2 + i * spacing;
                const y = 2 + j * spacing;
                
                // Alternate between different surface types
                if ((i + j) % 4 === 0) {
                    const rect = new RectSurface({ x: 1, y: 1 }, 0xff0000 + (i * j * 100) % 0xffffff);
                    rect.position.set(x, y, 0);
                    rootSurface.addChild(rect);
                    this.demoSurfaces.push(rect);
                } else if ((i + j) % 4 === 1) {
                    const circle = new CircleSurface(0.5, 0x00ff00 + (i * j * 100) % 0xffffff);
                    circle.position.set(x, y, 0);
                    rootSurface.addChild(circle);
                    this.demoSurfaces.push(circle);
                } else if ((i + j) % 4 === 2) {
                    const cube = new CubeSurface({ x: 1, y: 1, z: 1 }, 0x0000ff + (i * j * 100) % 0xffffff);
                    cube.position.set(x, y, 0);
                    rootSurface.addChild(cube);
                    this.demoSurfaces.push(cube);
                } else {
                    const sphere = new SphereSurface(0.5, 0xffff00 + (i * j * 100) % 0xffffff);
                    sphere.position.set(x, y, 0);
                    rootSurface.addChild(sphere);
                    this.demoSurfaces.push(sphere);
                }
            }
        }
        
        // Add some text labels
        for (let i = 0; i < 5; i++) {
            const text = new TextSurface(`Performance Test ${i+1}`, {
                font: 'Arial',
                fontSize: 12,
                color: '#ffffff'
            });
            text.position.set(2 + i * 5, 1, 0);
            rootSurface.addChild(text);
            this.demoSurfaces.push(text);
        }
    }

    /**
     * Creates UI components
     */
    createUIComponents(rootSurface) {
        // Create a Slider
        const slider = new Slider({ x: 6, y: 1 }, 0, 100, 50);
        slider.position.set(1, 8, 0);
        rootSurface.addChild(slider);
        this.uiComponents.push(slider);
        
        // Add event listener to slider
        slider.addEventListener('change', (event) => {
            console.log('Slider value changed:', event.data.value);
        });
        
        // Create a TextInput
        const textInput = new TextInput("Enter text...", { x: 6, y: 1.5 });
        textInput.position.set(8, 8, 0);
        rootSurface.addChild(textInput);
        this.uiComponents.push(textInput);
        
        // Add event listener to text input
        textInput.addEventListener('input', (event) => {
            console.log('Text input value changed:', event.data.value);
        });
        
        // Create a ScrollableContainer
        const scrollableContainer = new ScrollableContainer({ x: 6, y: 5 });
        scrollableContainer.position.set(15, 7, 0);
        rootSurface.addChild(scrollableContainer);
        this.uiComponents.push(scrollableContainer);
        
        // Add many items to the scrollable container
        for (let i = 0; i < 20; i++) {
            const item = new RectSurface({ x: 5.5, y: 0.4 }, 0x444444 + i * 0x050505);
            item.position.set(0, i * 0.5, 0);
            const itemText = new TextSurface(`Item ${i+1}`, {
                font: 'Arial',
                fontSize: 12,
                color: '#ffffff'
            });
            itemText.position.set(0.2, 0.2, 0);
            item.addChild(itemText);
            scrollableContainer.addChild(item);
        }
        
        // Set content size for scrollable container
        scrollableContainer.setContentSize({ x: 6, y: 10 });
    }

    /**
     * Shows UI components of a specific type
     */
    showUIComponents(type) {
        // In a real implementation, we would show/hide specific UI components
        console.log(`Showing ${type} components`);
    }

    /**
     * Hides UI components of a specific type
     */
    hideUIComponents(type) {
        // In a real implementation, we would show/hide specific UI components
        console.log(`Hiding ${type} components`);
    }

    /**
     * Adds a random surface to the scene
     */
    addRandomSurface() {
        if (!this.rootSurface) return;
        
        const startTime = performance.now();
        
        const types = ['rect', 'circle', 'text', 'cube', 'sphere'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let surface;
        const x = Math.random() * 20;
        const y = Math.random() * 15;
        
        switch (type) {
            case 'rect':
                surface = new RectSurface({ x: 1 + Math.random() * 2, y: 1 + Math.random() * 2 },
                                         Math.random() * 0xffffff);
                break;
            case 'circle':
                surface = new CircleSurface(0.5 + Math.random(), Math.random() * 0xffffff);
                break;
            case 'text':
                surface = new TextSurface("New Text", {
                    font: 'Arial',
                    fontSize: 12 + Math.floor(Math.random() * 12),
                    color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
                });
                break;
            case 'cube':
                surface = new CubeSurface({ x: 1, y: 1, z: 1 }, Math.random() * 0xffffff);
                break;
            case 'sphere':
                surface = new SphereSurface(0.5 + Math.random(), Math.random() * 0xffffff);
                break;
        }
        
        if (surface) {
            surface.position.set(x, y, 0);
            this.rootSurface.addChild(surface);
            this.demoSurfaces.push(surface);
            this.updateDebugInfo();
        }
        
        const endTime = performance.now();
        this.surfaceCreationTime = endTime - startTime;
    }

    /**
     * Removes a random surface from the scene
     */
    removeRandomSurface() {
        if (this.demoSurfaces.length > 0) {
            const index = Math.floor(Math.random() * this.demoSurfaces.length);
            const surface = this.demoSurfaces[index];
            
            if (surface.parent) {
                surface.parent.removeChild(surface);
                this.demoSurfaces.splice(index, 1);
                this.updateDebugInfo();
            }
        }
    }

    /**
     * Randomizes the scene
     */
    randomizeScene() {
        // Change colors of existing surfaces
        for (const surface of this.demoSurfaces) {
            if (surface.setColor) {
                surface.setColor(Math.random() * 0xffffff);
            }
        }
        
        // Move some surfaces randomly
        for (const surface of this.demoSurfaces) {
            if (Math.random() > 0.7) {
                surface.position.x = Math.random() * 25;
                surface.position.y = Math.random() * 15;
            }
        }
    }

    /**
     * Updates debug information display
     */
    updateDebugInfo() {
        // Update camera mode
        const cameraMode = this.layer.cameraSystem.activeCamera === this.layer.cameraSystem.perspectiveCamera ? 
                          'Perspective' : 'Orthographic';
        document.getElementById('camera-mode').textContent = cameraMode;
        
        // Update surface count
        const allSurfaces = [];
        if (this.rootSurface) {
            this.collectSurfaces(this.rootSurface, allSurfaces);
        }
        document.getElementById('surface-count').textContent = allSurfaces.length;
        
        // Update particle count
        let particleCount = 0;
        if (this.physicsContainer && this.physicsContainer.verletPhysics) {
            particleCount = this.physicsContainer.verletPhysics.particles.length;
        }
        document.getElementById('particle-count').textContent = particleCount;
    }

    /**
     * Handles window resize events
     */
    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.layer.resize(window.innerWidth, window.innerHeight);
    }

    /**
     * Starts performance monitoring
     */
    startPerformanceMonitoring() {
        // Update memory usage if available
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
                const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
                document.getElementById('memory-usage').textContent = `${usedMB}/${totalMB} MB`;
            }, 1000);
        }
    }

    /**
     * Updates performance counters
     */
    updatePerformanceCounters() {
        const now = performance.now();
        const delta = now - this.lastTime;
        
        this.frameCount++;
        
        // Update FPS counter every second
        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            document.getElementById('fps-counter').textContent = this.fps;
            this.frameCount = 0;
            this.lastTime = now;
        }
        
        // Update render time
        document.getElementById('render-time').textContent = this.renderTime.toFixed(2);
        
        // Update physics time
        document.getElementById('physics-time').textContent = this.physicsUpdateTime.toFixed(2);
        
        // Update surface creation/destruction time
        document.getElementById('surface-creation-time').textContent = this.surfaceCreationTime.toFixed(2);
        document.getElementById('surface-destruction-time').textContent = this.surfaceDestructionTime.toFixed(2);
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const startTime = performance.now();
        
        // Update and render
        this.layer.update(0.016); // Assuming 60fps (16ms per frame)
        
        const updateTime = performance.now();
        
        this.layer.render(this.renderer);
        
        const endTime = performance.now();
        
        this.renderTime = endTime - updateTime;
        this.physicsUpdateTime = updateTime - startTime;
        
        // Update performance counters
        this.updatePerformanceCounters();
        
        // Update debug info periodically
        if (this.frameCount % 30 === 0) {
            this.updateDebugInfo();
        }
        
        // Attach input listeners after first render
        if (!this.inputListenersAttached) {
            this.layer.attachInputListeners(this.renderer);
            this.inputListenersAttached = true;
        }
        
        // Update bounding box helpers if enabled
        if (this.debugBoundingBoxes) {
            const allSurfaces = [];
            if (this.rootSurface) {
                this.collectSurfaces(this.rootSurface, allSurfaces);
                
                for (const surface of allSurfaces) {
                    if (surface.boundingBoxHelper) {
                        surface.boundingBoxHelper.update();
                    }
                }
            }
        }
        
        // Update physics debug visualization if enabled
        this.updatePhysicsDebugVisualization();
    }
    
    /**
     * Sets up input handlers for mouse/touch interactions
     */
    setupInputHandlers() {
        const canvas = this.renderer.domElement;
        
        // Mouse move handler for raycasting
        canvas.addEventListener('mousemove', (event) => {
            // Calculate mouse position in normalized device coordinates
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        });
        
        // Click handler for selecting surfaces
        canvas.addEventListener('click', (event) => {
            this.handleSurfaceClick();
        });
    }
    
    /**
     * Handles surface click events using raycasting
     */
    handleSurfaceClick() {
        if (!this.rootSurface) return;
        
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.layer.cameraSystem.activeCamera);
        
        // Create an array of all surfaces for intersection testing
        const allSurfaces = [];
        this.collectSurfaces(this.rootSurface, allSurfaces);
        
        // Filter surfaces that have 3D objects
        const objects = allSurfaces
            .filter(surface => surface.mesh || surface.object3D)
            .map(surface => surface.mesh || surface.object3D);
        
        // Find intersections
        const intersects = this.raycaster.intersectObjects(objects, true);
        
        if (intersects.length > 0) {
            console.log('Clicked on surface:', intersects[0].object);
            // In a real implementation, we would handle the click event on the surface
        }
    }
    
    /**
     * Toggles bounding box visualization
     */
    toggleBoundingBoxes() {
        if (!this.rootSurface) return;
        
        if (this.debugBoundingBoxes) {
            // Create bounding box helpers for all surfaces
            const allSurfaces = [];
            this.collectSurfaces(this.rootSurface, allSurfaces);
            
            for (const surface of allSurfaces) {
                if (surface.mesh || surface.object3D) {
                    const object = surface.mesh || surface.object3D;
                    const boxHelper = new THREE.BoxHelper(object, 0xffff00);
                    this.layer.scene.add(boxHelper);
                    surface.boundingBoxHelper = boxHelper;
                }
            }
        } else {
            // Remove bounding box helpers
            const allSurfaces = [];
            this.collectSurfaces(this.rootSurface, allSurfaces);
            
            for (const surface of allSurfaces) {
                if (surface.boundingBoxHelper) {
                    this.layer.scene.remove(surface.boundingBoxHelper);
                    surface.boundingBoxHelper = null;
                }
            }
        }
    }
    
    /**
     * Toggles physics debug visualization
     */
    togglePhysicsDebug() {
        if (!this.physicsContainer || !this.physicsContainer.verletPhysics) return;
        
        if (this.debugPhysics) {
            // Create debug visualization for physics particles
            this.createPhysicsDebugVisualization();
        } else {
            // Remove physics debug visualization
            this.removePhysicsDebugVisualization();
        }
    }
    
    /**
     * Creates debug visualization for physics particles
     */
    createPhysicsDebugVisualization() {
        if (!this.physicsContainer || !this.physicsContainer.verletPhysics) return;
        
        // Remove existing debug visualization
        this.removePhysicsDebugVisualization();
        
        // Create debug spheres for each particle
        this.physicsDebugObjects = [];
        const particles = this.physicsContainer.verletPhysics.particles;
        
        for (const particle of particles) {
            if (particle.deleted) continue;
            
            const geometry = new THREE.SphereGeometry(0.1, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const sphere = new THREE.Mesh(geometry, material);
            
            sphere.position.set(particle.position.x, particle.position.y, 0.1);
            this.layer.scene.add(sphere);
            this.physicsDebugObjects.push(sphere);
        }
        
        // Create debug lines for constraints
        this.physicsDebugLines = [];
        const constraints = this.physicsContainer.verletPhysics.constraints;
        
        for (const constraint of constraints) {
            if (constraint instanceof SpringConstraint || constraint instanceof DistanceConstraint) {
                if (constraint.particles.length >= 2) {
                    const a = constraint.particles[0];
                    const b = constraint.particles[1];
                    
                    if (a && b && !a.deleted && !b.deleted) {
                        const points = [
                            new THREE.Vector3(a.position.x, a.position.y, 0.1),
                            new THREE.Vector3(b.position.x, b.position.y, 0.1)
                        ];
                        
                        const geometry = new THREE.BufferGeometry().setFromPoints(points);
                        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
                        const line = new THREE.Line(geometry, material);
                        
                        this.layer.scene.add(line);
                        this.physicsDebugLines.push(line);
                    }
                }
            }
        }
    }
    
    /**
     * Removes physics debug visualization
     */
    removePhysicsDebugVisualization() {
        if (this.physicsDebugObjects) {
            for (const obj of this.physicsDebugObjects) {
                this.layer.scene.remove(obj);
            }
            this.physicsDebugObjects = [];
        }
        
        if (this.physicsDebugLines) {
            for (const line of this.physicsDebugLines) {
                this.layer.scene.remove(line);
            }
            this.physicsDebugLines = [];
        }
    }
    
    /**
     * Updates physics debug visualization
     */
    updatePhysicsDebugVisualization() {
        if (!this.debugPhysics || !this.physicsContainer || !this.physicsContainer.verletPhysics) return;
        
        const particles = this.physicsContainer.verletPhysics.particles;
        
        // Update particle positions
        if (this.physicsDebugObjects) {
            for (let i = 0; i < this.physicsDebugObjects.length && i < particles.length; i++) {
                const particle = particles[i];
                const obj = this.physicsDebugObjects[i];
                
                if (particle && obj && !particle.deleted) {
                    obj.position.set(particle.position.x, particle.position.y, 0.1);
                }
            }
        }
        
        // Update constraint lines
        if (this.physicsDebugLines) {
            const constraints = this.physicsContainer.verletPhysics.constraints;
            for (let i = 0; i < this.physicsDebugLines.length && i < constraints.length; i++) {
                const constraint = constraints[i];
                const line = this.physicsDebugLines[i];
                
                if (constraint && line &&
                    (constraint instanceof SpringConstraint || constraint instanceof DistanceConstraint) &&
                    constraint.particles.length >= 2) {
                    const a = constraint.particles[0];
                    const b = constraint.particles[1];
                    
                    if (a && b && !a.deleted && !b.deleted) {
                        const positions = line.geometry.attributes.position.array;
                        positions[0] = a.position.x;
                        positions[1] = a.position.y;
                        positions[2] = 0.1;
                        positions[3] = b.position.x;
                        positions[4] = b.position.y;
                        positions[5] = 0.1;
                        line.geometry.attributes.position.needsUpdate = true;
                    }
                }
            }
        }
    }
}

// Initialize the application when the page loads
window.addEventListener('load', () => {
    new ComprehensiveDemoApp();
});
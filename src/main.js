import { Surface } from './Surface.js';
import { ContainerSurface } from './ContainerSurface.js';
import { RectSurface } from './RectSurface.js';
import { CircleSurface } from './CircleSurface.js';
import { TextSurface } from './TextSurface.js';
import { CubeSurface } from './CubeSurface.js';
import { SphereSurface } from './SphereSurface.js';
import { Event } from './Event.js';
import { CameraSystem } from './CameraSystem.js';
import { Layer } from './Layer.js';

// Import new layout containers
import { BorderLayout } from './layout/BorderLayout.js';
import { GridLayout } from './layout/GridLayout.js';
import { FlexLayout } from './layout/FlexLayout.js';

// Import new UI components
import { Button } from './components/Button.js';
import { Slider } from './components/Slider.js';
import { TextInput } from './components/TextInput.js';
import { ScrollableContainer } from './components/ScrollableContainer.js';

// Import layout utilities
import { LayoutUtils } from './layout/LayoutUtils.js';

// Main application class
class SpaceGraphApp {
    constructor() {
        console.log("Creating DemoApp");
        // Create container for canvas
        this.container = document.getElementById('canvas-container');
        
        // Initialize Three.js renderer
        this.initRenderer();
        
        // Create a basic scene graph
        this.createScene();
        
        // Start animation loop
        this.animate();
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
     * Initializes the Three.js WebGL renderer
     */
    initRenderer() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 1);
        
        // Add canvas to DOM
        this.container.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    /**
     * Creates a basic scene graph
     */
    createScene() {
        // Create a container surface as root
        const rootSurface = new ContainerSurface({ x: 20, y: 15 });
        
        // Create layer system
        this.layer = new Layer(rootSurface);
        
        // Create a 2D rectangle surface
        const rect = new RectSurface({ x: 2, y: 1 }, 0xff0000);
        rect.position.set(0, 0, 0);
        rootSurface.addChild(rect);
        
        // Create a 2D circle surface
        const circle = new CircleSurface(0.5, 0x00ff00);
        circle.position.set(3, 0, 0);
        rootSurface.addChild(circle);
        
        // Create a text surface
        const text = new TextSurface("Hello SpaceGraph!", {
            font: 'Arial',
            fontSize: 20,
            color: '#ffffff'
        });
        text.position.set(0, 2, 0);
        rootSurface.addChild(text);
        
        // Create a 3D cube surface
        const cube = new CubeSurface({ x: 1, y: 1, z: 1 }, 0x0000ff);
        cube.position.set(5, 0, 0);
        rootSurface.addChild(cube);
        
        // Create a 3D sphere surface
        const sphere = new SphereSurface(0.5, 0xffff00);
        sphere.position.set(7, 0, 0);
        rootSurface.addChild(sphere);
        
        // Create a container for nested surfaces
        const container = new ContainerSurface({ x: 3, y: 3 });
        container.position.set(0, 4, 0);
        rootSurface.addChild(container);
        
        // Add nested surfaces to the container
        const nestedRect = new RectSurface({ x: 1, y: 1 }, 0xff00ff);
        nestedRect.position.set(0, 0, 0);
        container.addChild(nestedRect);
        
        const nestedCircle = new CircleSurface(0.3, 0x00ffff);
        nestedCircle.position.set(1.5, 1, 0);
        container.addChild(nestedCircle);
        
        // Add event listeners to demonstrate event propagation
        rootSurface.addEventListener('click', (event) => {
            console.log('Root surface clicked');
        });
        
        rect.addEventListener('pointerdown', (event) => {
            console.log('Rectangle pointer down');
        });
        
        rect.addEventListener('pointerup', (event) => {
            console.log('Rectangle pointer up');
        });
        
        rect.addEventListener('pointermove', (event) => {
            console.log('Rectangle pointer move');
        });
        
        rect.addEventListener('click', (event) => {
            console.log('Rectangle clicked');
            // Focus camera on this rectangle when clicked
            this.layer.focusOnSurface(rect, 1000);
        });
        
        circle.addEventListener('pointerdown', (event) => {
            console.log('Circle pointer down');
        });
        
        circle.addEventListener('pointerup', (event) => {
            console.log('Circle pointer up');
        });
        
        circle.addEventListener('pointermove', (event) => {
            console.log('Circle pointer move');
        });
        
        circle.addEventListener('click', (event) => {
            console.log('Circle clicked');
            // Fit view to show all surfaces when circle is clicked
            const allSurfaces = [];
            this.collectSurfaces(rootSurface, allSurfaces);
            this.layer.fitToView(allSurfaces, 1000);
        });
        
        // Example of dispatching an event
        // const clickEvent = new Event('click', { x: 0, y: 0 });
        // rect.dispatchEvent(clickEvent);
        
        // Store root surface for later use
        this.rootSurface = rootSurface;
        
        // Add a button to test bounds updates
        const updateButton = new RectSurface({ x: 2, y: 0.5 }, 0x888888);
        updateButton.position.set(5, 4, 0);
        rootSurface.addChild(updateButton);
        
        // Add text to the button
        const buttonText = new TextSurface("Update Bounds", {
            font: 'Arial',
            fontSize: 16,
            color: '#000000'
        });
        buttonText.position.set(5.2, 4.1, 0);
        rootSurface.addChild(buttonText);
        
        // Add click handler to update button
        updateButton.addEventListener('pointerdown', (event) => {
            console.log('Update button pointer down');
        });
        
        updateButton.addEventListener('pointerup', (event) => {
            console.log('Update button pointer up');
        });
        
        updateButton.addEventListener('pointermove', (event) => {
            console.log('Update button pointer move');
        });
        
        updateButton.addEventListener('click', (event) => {
            console.log('Update button clicked');
            // Change the bounds of the rectangle
            rect.setBounds({ x: Math.random() * 3 + 1, y: Math.random() + 0.5 });
            // Change the color of the rectangle
            rect.setColor(Math.random() * 0xFFFFFF);
        });
        
        // Add a button to switch to perspective camera
        const perspectiveButton = new RectSurface({ x: 2, y: 0.5 }, 0x8888ff);
        perspectiveButton.position.set(5, 3, 0);
        rootSurface.addChild(perspectiveButton);
        
        // Add text to the perspective button
        const perspectiveButtonText = new TextSurface("Perspective", {
            font: 'Arial',
            fontSize: 16,
            color: '#000000'
        });
        perspectiveButtonText.position.set(5.2, 3.1, 0);
        rootSurface.addChild(perspectiveButtonText);
        
        // Add click handler to perspective button
        perspectiveButton.addEventListener('click', (event) => {
            console.log('Perspective button clicked');
            this.layer.cameraSystem.usePerspective();
        });
        
        // Add a button to switch to orthographic camera
        const orthoButton = new RectSurface({ x: 2, y: 0.5 }, 0x88ff88);
        orthoButton.position.set(5, 2, 0);
        rootSurface.addChild(orthoButton);
        
        // Add text to the orthographic button
        const orthoButtonText = new TextSurface("Orthographic", {
            font: 'Arial',
            fontSize: 16,
            color: '#000000'
        });
        orthoButtonText.position.set(5.2, 2.1, 0);
        rootSurface.addChild(orthoButtonText);
        
        // Add click handler to orthographic button
        orthoButton.addEventListener('click', (event) => {
            console.log('Orthographic button clicked');
            this.layer.cameraSystem.useOrthographic();
        });
        
        // === NEW LAYOUT SYSTEM DEMONSTRATION ===
        
        // Create a BorderLayout container
        const borderLayoutContainer = new BorderLayout({ x: 6, y: 4 });
        borderLayoutContainer.position.set(10, 0, 0);
        rootSurface.addChild(borderLayoutContainer);
        
        // Add components to border regions
        const northPanel = new RectSurface({ x: 6, y: 0.5 }, 0xffcccc);
        const northText = new TextSurface("North", { font: 'Arial', fontSize: 14, color: '#000000' });
        northText.position.set(3, 0.25, 0);
        northPanel.addChild(northText);
        borderLayoutContainer.add(northPanel, 'north');
        
        const southPanel = new RectSurface({ x: 6, y: 0.5 }, 0xccffcc);
        const southText = new TextSurface("South", { font: 'Arial', fontSize: 14, color: '#000000' });
        southText.position.set(3, 0.25, 0);
        southPanel.addChild(southText);
        borderLayoutContainer.add(southPanel, 'south');
        
        const westPanel = new RectSurface({ x: 1, y: 3 }, 0xccccff);
        const westText = new TextSurface("W", { font: 'Arial', fontSize: 14, color: '#000000' });
        westText.position.set(0.5, 1.5, 0);
        westPanel.addChild(westText);
        borderLayoutContainer.add(westPanel, 'west');
        
        const eastPanel = new RectSurface({ x: 1, y: 3 }, 0xffccff);
        const eastText = new TextSurface("E", { font: 'Arial', fontSize: 14, color: '#000000' });
        eastText.position.set(0.5, 1.5, 0);
        eastPanel.addChild(eastText);
        borderLayoutContainer.add(eastPanel, 'east');
        
        const centerPanel = new RectSurface({ x: 4, y: 3 }, 0xffffcc);
        const centerText = new TextSurface("Center", { font: 'Arial', fontSize: 16, color: '#000000' });
        centerText.position.set(2, 1.5, 0);
        centerPanel.addChild(centerText);
        borderLayoutContainer.add(centerPanel, 'center');
        
        // Create a GridLayout container
        const gridLayoutContainer = new GridLayout({ x: 5, y: 4 }, 3, 3);
        gridLayoutContainer.position.set(10, 5, 0);
        gridLayoutContainer.setSpacing(2, 2);
        rootSurface.addChild(gridLayoutContainer);
        
        // Add colored rectangles to grid cells
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff, 0x888888, 0x444444];
        for (let i = 0; i < 9; i++) {
            const cell = new RectSurface({ x: 1, y: 1 }, colors[i]);
            gridLayoutContainer.addChild(cell);
        }
        
        // Create a FlexLayout container
        const flexLayoutContainer = new FlexLayout({ x: 5, y: 3 });
        flexLayoutContainer.position.set(16, 0, 0);
        flexLayoutContainer.setFlexOptions({
            direction: 'row',
            justifyContent: 'space-around',
            alignItems: 'center'
        });
        rootSurface.addChild(flexLayoutContainer);
        
        // Add buttons to flex container
        const flexButton1 = new Button("Btn 1", { x: 1, y: 0.5 }, 0xff6666);
        const flexButton2 = new Button("Btn 2", { x: 1, y: 0.5 }, 0x66ff66);
        const flexButton3 = new Button("Btn 3", { x: 1, y: 0.5 }, 0x6666ff);
        
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
        
        // Create a Slider
        const slider = new Slider({ x: 4, y: 0.5 }, 0, 100, 50);
        slider.position.set(16, 4, 0);
        rootSurface.addChild(slider);
        
        // Add event listener to slider
        slider.addEventListener('change', (event) => {
            console.log('Slider value changed:', event.data.value);
        });
        
        // Create a TextInput
        const textInput = new TextInput("Enter text...", { x: 4, y: 0.5 });
        textInput.position.set(16, 5, 0);
        rootSurface.addChild(textInput);
        
        // Add event listener to text input
        textInput.addEventListener('input', (event) => {
            console.log('Text input value changed:', event.data.value);
        });
        
        // Create a ScrollableContainer
        const scrollableContainer = new ScrollableContainer({ x: 4, y: 3 });
        scrollableContainer.position.set(16, 6, 0);
        rootSurface.addChild(scrollableContainer);
        
        // Add many items to the scrollable container
        for (let i = 0; i < 20; i++) {
            const item = new RectSurface({ x: 3.5, y: 0.3 }, 0x444444 + i * 0x050505);
            item.position.set(0, i * 0.4, 0);
            const itemText = new TextSurface(`Item ${i+1}`, {
                font: 'Arial',
                fontSize: 12,
                color: '#ffffff'
            });
            itemText.position.set(0.2, 0.15, 0);
            item.addChild(itemText);
            scrollableContainer.addChild(item);
        }
        
        // Set content size for scrollable container
        scrollableContainer.setContentSize({ x: 4, y: 8 });
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
    new SpaceGraphApp();
});

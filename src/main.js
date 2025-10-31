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

import { Stage } from './Stage.js';

// Main application entry point
function main() {
    console.log("Creating DemoApp");

    // Create the stage
    const stage = new Stage();
    document.getElementById('canvas-container').appendChild(stage.renderer.domElement);

    // Create a basic scene graph
    createScene(stage);
    
    // Start animation loop
    function animate() {
        requestAnimationFrame(animate);
        stage.render();
    }
    animate();
}

/**
 * Collects all surfaces in the hierarchy
 * @param {Surface} surface - The surface to start from
 * @param {Array} surfaces - Array to collect surfaces in
 */
function collectSurfaces(surface, surfaces) {
    surfaces.push(surface);
    for (const child of surface.children) {
        collectSurfaces(child, surfaces);
    }
}

/**
 * Creates a basic scene graph
 * @param {Stage} stage - The stage to add surfaces to
 */
function createScene(stage) {
    // In the new architecture, the Stage is the root surface.
    const rootSurface = stage;

    // Create a 2D rectangle surface
    const rect = new RectSurface({ x: 0, y: 0, width: 200, height: 100 }, 0xff0000);
    rootSurface.addChild(rect);

    // Create a 2D circle surface
    const circle = new CircleSurface(50, 0x00ff00);
    circle.bounds = { x: 300, y: 0, width: 100, height: 100 };
    rootSurface.addChild(circle);

    // Create a text surface
    const text = new TextSurface("Hello SpaceGraph!", {
        font: 'Arial',
        fontSize: 20,
        color: '#ffffff'
    });
    text.bounds = { x: 0, y: 200, width: 200, height: 20 };
    rootSurface.addChild(text);

    // Create a 3D cube surface
    const cube = new CubeSurface({ x: 100, y: 100, z: 100 }, 0x0000ff);
    cube.bounds = { x: 500, y: 0, width: 100, height: 100 };
    rootSurface.addChild(cube);

    // Create a 3D sphere surface
    const sphere = new SphereSurface(50, 0xffff00);
    sphere.bounds = { x: 700, y: 0, width: 100, height: 100 };
    rootSurface.addChild(sphere);

    // Create a container for nested surfaces
    const container = new ContainerSurface({ x: 0, y: 400, width: 300, height: 300 });
    rootSurface.addChild(container);

    // Add nested surfaces to the container
    const nestedRect = new RectSurface({ x: 0, y: 0, width: 100, height: 100 }, 0xff00ff);
    container.addChild(nestedRect);

    const nestedCircle = new CircleSurface(30, 0x00ffff);
    nestedCircle.bounds = { x: 150, y: 100, width: 60, height: 60 };
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
        // TODO: Re-implement camera controls
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
        // TODO: Re-implement camera controls
    });

    // Add a button to test bounds updates
    const updateButton = new RectSurface({ x: 500, y: 400, width: 200, height: 50 }, 0x888888);
    rootSurface.addChild(updateButton);

    // Add text to the button
    const buttonText = new TextSurface("Update Bounds", {
        font: 'Arial',
        fontSize: 16,
        color: '#000000'
    });
    buttonText.bounds = { x: 520, y: 410, width: 160, height: 20 };
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
        rect.setBounds({ x: Math.random() * 300 + 100, y: Math.random() * 100 + 50, width: 200, height: 100 });
        // TODO: Re-implement setColor
        // rect.setColor(Math.random() * 0xFFFFFF);
    });

    // Add a button to switch to perspective camera
    const perspectiveButton = new RectSurface({ x: 500, y: 300, width: 200, height: 50 }, 0x8888ff);
    rootSurface.addChild(perspectiveButton);

    // Add text to the perspective button
    const perspectiveButtonText = new TextSurface("Perspective", {
        font: 'Arial',
        fontSize: 16,
        color: '#000000'
    });
    perspectiveButtonText.bounds = { x: 520, y: 310, width: 160, height: 20 };
    rootSurface.addChild(perspectiveButtonText);

    // Add click handler to perspective button
    perspectiveButton.addEventListener('click', (event) => {
        console.log('Perspective button clicked');
        // TODO: Re-implement camera controls
    });

    // Add a button to switch to orthographic camera
    const orthoButton = new RectSurface({ x: 500, y: 200, width: 200, height: 50 }, 0x88ff88);
    rootSurface.addChild(orthoButton);

    // Add text to the orthographic button
    const orthoButtonText = new TextSurface("Orthographic", {
        font: 'Arial',
        fontSize: 16,
        color: '#000000'
    });
    orthoButtonText.bounds = { x: 520, y: 210, width: 160, height: 20 };
    rootSurface.addChild(orthoButtonText);

    // Add click handler to orthographic button
    orthoButton.addEventListener('click', (event) => {
        console.log('Orthographic button clicked');
        // TODO: Re-implement camera controls
    });

    // === NEW LAYOUT SYSTEM DEMONSTRATION ===

    // Create a BorderLayout container
    const borderLayoutContainer = new BorderLayout({ x: 1000, y: 0, width: 600, height: 400 });
    rootSurface.addChild(borderLayoutContainer);

    // Add components to border regions
    const northPanel = new RectSurface({ width: 600, height: 50 }, 0xffcccc);
    const northText = new TextSurface("North", { font: 'Arial', fontSize: 14, color: '#000000' });
    northText.bounds = { x: 300, y: 25, width: 50, height: 14 };
    northPanel.addChild(northText);
    borderLayoutContainer.add(northPanel, 'north');

    const southPanel = new RectSurface({ width: 600, height: 50 }, 0xccffcc);
    const southText = new TextSurface("South", { font: 'Arial', fontSize: 14, color: '#000000' });
    southText.bounds = { x: 300, y: 25, width: 50, height: 14 };
    southPanel.addChild(southText);
    borderLayoutContainer.add(southPanel, 'south');

    const westPanel = new RectSurface({ width: 100, height: 300 }, 0xccccff);
    const westText = new TextSurface("W", { font: 'Arial', fontSize: 14, color: '#000000' });
    westText.bounds = { x: 50, y: 150, width: 10, height: 14 };
    westPanel.addChild(westText);
    borderLayoutContainer.add(westPanel, 'west');

    const eastPanel = new RectSurface({ width: 100, height: 300 }, 0xffccff);
    const eastText = new TextSurface("E", { font: 'Arial', fontSize: 14, color: '#000000' });
    eastText.bounds = { x: 50, y: 150, width: 10, height: 14 };
    eastPanel.addChild(eastText);
    borderLayoutContainer.add(eastPanel, 'east');

    const centerPanel = new RectSurface({ width: 400, height: 300 }, 0xffffcc);
    const centerText = new TextSurface("Center", { font: 'Arial', fontSize: 16, color: '#000000' });
    centerText.bounds = { x: 200, y: 150, width: 50, height: 16 };
    centerPanel.addChild(centerText);
    borderLayoutContainer.add(centerPanel, 'center');

    // Create a GridLayout container
    const gridLayoutContainer = new GridLayout({ x: 1000, y: 500, width: 500, height: 400 }, 3, 3);
    gridLayoutContainer.setSpacing(20, 20);
    rootSurface.addChild(gridLayoutContainer);

    // Add colored rectangles to grid cells
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff, 0x888888, 0x444444];
    for (let i = 0; i < 9; i++) {
        const cell = new RectSurface({ width: 100, height: 100 }, colors[i]);
        gridLayoutContainer.addChild(cell);
    }

    // Create a FlexLayout container
    const flexLayoutContainer = new FlexLayout({ x: 1600, y: 0, width: 500, height: 300 });
    flexLayoutContainer.setFlexOptions({
        direction: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    });
    rootSurface.addChild(flexLayoutContainer);

    // Add buttons to flex container
    const flexButton1 = new Button("Btn 1", { width: 100, height: 50 }, 0xff6666);
    const flexButton2 = new Button("Btn 2", { width: 100, height: 50 }, 0x66ff66);
    const flexButton3 = new Button("Btn 3", { width: 100, height: 50 }, 0x6666ff);

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
    const slider = new Slider({ x: 1600, y: 400, width: 400, height: 50 }, 0, 100, 50);
    rootSurface.addChild(slider);

    // Add event listener to slider
    slider.addEventListener('change', (event) => {
        console.log('Slider value changed:', event.data.value);
    });

    // Create a TextInput
    const textInput = new TextInput("Enter text...", { x: 1600, y: 500, width: 400, height: 50 });
    rootSurface.addChild(textInput);

    // Add event listener to text input
    textInput.addEventListener('input', (event) => {
        console.log('Text input value changed:', event.data.value);
    });

    // Create a ScrollableContainer
    const scrollableContainer = new ScrollableContainer({ x: 1600, y: 600, width: 400, height: 300 });
    rootSurface.addChild(scrollableContainer);

    // Add many items to the scrollable container
    for (let i = 0; i < 20; i++) {
        const item = new RectSurface({ width: 350, height: 30 }, 0x444444 + i * 0x050505);
        item.bounds = { x: 0, y: i * 40, width: 350, height: 30 };
        const itemText = new TextSurface(`Item ${i+1}`, {
            font: 'Arial',
            fontSize: 12,
            color: '#ffffff'
        });
        itemText.bounds = { x: 20, y: 15, width: 100, height: 12 };
        item.addChild(itemText);
        scrollableContainer.addChild(item);
    }

    // Set content size for scrollable container
    scrollableContainer.setContentSize({ width: 400, height: 800 });
}

// Initialize the application when the page loads
window.addEventListener('load', main);

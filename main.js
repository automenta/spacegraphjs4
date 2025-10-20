import SpaceGraph from './src/SpaceGraph.js';
import DemoManager from './src/DemoManager.js';
import UIManager from './src/UIManager.js';

// Import Demos
import CoreConcepts from './demos/CoreConcepts.js';
import Interaction from './demos/Interaction.js';
import { fullDemo } from './demos/_DemoData.js';
import { kitchenSink } from './demos/KitchenSink.js';
import { GeometricAccuracy } from './demos/GeometricAccuracy.js';
import { DynamicControls } from './demos/DynamicControls.js';

const container = document.getElementById('spacegraph-container');

// Create the SpaceGraph instance without initial elements
const graph = new SpaceGraph({
    container,
    backgroundColor: 0x111111,
    bloom: {
        enabled: true,
        strength: 0.8,
        radius: 0.5,
        threshold: 0.1
    },
    controls: {
        orbit: {
            enabled: true
        },
        autoZoom: {
            enabled: true
        }
    }
});

// Create and initialize the DemoManager
const demoManager = new DemoManager(graph);

// Register demos
demoManager.register('Dynamic Controls', DynamicControls);
demoManager.register('Kitchen Sink', kitchenSink);
demoManager.register('Full Demo', fullDemo);
demoManager.register('Core Concepts', CoreConcepts);
demoManager.register('Interaction', Interaction);
demoManager.register('Geometric Accuracy', GeometricAccuracy);

// Load the initial demo
demoManager.load('Full Demo').then(() => {
    // Initialize the UIManager after the first demo is loaded
    const uiManager = new UIManager(demoManager, graph);
    window.uiManager = uiManager;
});


// Expose the graph class and instance to the window for easy debugging and testing
window.SpaceGraph = SpaceGraph;
window.graph = graph;
window.demoManager = demoManager;

// Test the event listener
graph.on('element:click', (event) => {
    console.log(`Element clicked: ${event.id}`);
});

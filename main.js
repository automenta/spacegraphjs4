import SpaceGraph from './src/SpaceGraph.js';
import DemoManager from './src/DemoManager.js';

// Import Demos
import CoreConcepts from './demos/CoreConcepts.js';
import Interaction from './demos/Interaction.js';
import { fullDemo } from './demos/_DemoData.js';

const demos = {
    'Full Demo': fullDemo,
    'Core Concepts': CoreConcepts,
    'Interaction': Interaction,
};

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
        orbit: true,
        autoZoom: true
    }
});

// Create and initialize the DemoManager
const demoManager = new DemoManager(graph, demos);
demoManager.load('Full Demo');


// Expose the graph class and instance to the window for easy debugging and testing
window.SpaceGraph = SpaceGraph;
window.graph = graph;
window.demoManager = demoManager;

// Test the event listener
graph.on('element:click', (event) => {
    console.log(`Element clicked: ${event.id}`);
});

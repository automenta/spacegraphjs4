import SpaceGraph from './src/SpaceGraph.js';

const container = document.getElementById('spacegraph-container');

// Initial elements
const initialElements = [
    { id: 'node1', type: 'box', position: { x: -4, y: 2, z: 0 }, color: 0x00ff00, size: 1, htmlContent: 'Node 1' },
    { id: 'node2', type: 'sphere', position: { x: 4, y: -2, z: 0 }, color: 0xff00ff, size: 1.5 },
    { id: 'node3', type: 'box', position: { x: 0, y: 0, z: -4 }, color: 0x0000ff, size: 0.8, htmlContent: 'Node 3: A Box' },
    { id: 'node4', type: 'sphere', position: { x: 2, y: 3, z: 2 }, color: 0xffff00, size: 1.2 },
];

// Create the SpaceGraph instance
const graph = new SpaceGraph(container, { elements: initialElements });

// Expose the graph class and instance to the window for easy debugging and testing
window.SpaceGraph = SpaceGraph;
window.graph = graph;

// Test the event listener
graph.on('element:click', (event) => {
    console.log(`Element clicked: ${event.id}`);
});
import SpaceGraph from './src/SpaceGraph.js';

const container = document.getElementById('spacegraph-container');

// Initial elements
const initialElements = [
    { id: 'node1', type: 'box', position: { x: -2, y: 0, z: 0 }, color: 0x00ff00 },
    { id: 'node2', type: 'sphere', position: { x: 2, y: 0, z: 0 }, color: 0xff00ff },
];

// Create the SpaceGraph instance
const graph = new SpaceGraph(container, { elements: initialElements });

// Expose the graph instance to the window for easy debugging
window.graph = graph;

// UI for testing the API
document.getElementById('add-node').addEventListener('click', () => {
    const id = `node${Date.now()}`;
    graph.add({
        id,
        type: 'box',
        position: {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 4,
            z: (Math.random() - 0.5) * 4,
        },
        color: Math.random() * 0xffffff,
    });
    console.log(`Added node: ${id}`);
});

document.getElementById('remove-node').addEventListener('click', () => {
    const idToRemove = prompt('Enter the ID of the node to remove (e.g., node1):');
    if (idToRemove) {
        graph.remove(idToRemove);
        console.log(`Removed node: ${idToRemove}`);
    }
});

document.getElementById('update-node').addEventListener('click', () => {
    const idToUpdate = prompt('Enter the ID of the node to update (e.g., node2):');
    if (idToUpdate) {
        graph.update(idToUpdate, { color: 0xff0000 }); // Change color to red
        console.log(`Updated node: ${idToUpdate}`);
    }
});
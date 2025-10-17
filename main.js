import SpaceGraph from '/src/SpaceGraph.js';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('spacegraph-container');
    if (container) {
        new SpaceGraph(container);
    } else {
        console.error('Container element #spacegraph-container not found.');
    }
});
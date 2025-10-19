// demos/Interaction.js

export default {
    name: 'Interaction',
    description: 'This demo highlights the interactive features of the graph, such as camera controls, focus/defocus, and the "Scope" functionality (double-click a node).',
    elements: [
        // Nodes
        { id: 'interaction-root', type: 'sphere', size: 15, color: 0xff8800, label: 'Interaction' },
        { id: 'node-1', label: 'Node 1', position: { x: 150, y: 0, z: 0 } },
        { id: 'node-2', label: 'Node 2', position: { x: -150, y: 0, z: 0 } },
        { id: 'node-1a', label: 'Sub-node 1a', size: 6, position: { x: 250, y: 50, z: 0 } },
        { id: 'node-1b', label: 'Sub-node 1b', size: 6, position: { x: 250, y: -50, z: 0 } },
        { id: 'node-2a', label: 'Sub-node 2a', size: 6, position: { x: -250, y: 50, z: 0 } },
        { id: 'node-2b', label: 'Sub-node 2b', size: 6, position: { x: -250, y: -50, z: 0 } },
        { id: 'node-3', label: 'Isolated Node', position: { x: 0, y: 200, z: 0 } },

        // Edges
        { id: 'edge-i1', source: 'interaction-root', target: 'node-1' },
        { id: 'edge-i2', source: 'interaction-root', target: 'node-2' },
        { id: 'edge-i3', source: 'node-1', target: 'node-1a' },
        { id: 'edge-i4', source: 'node-1', target: 'node-1b' },
        { id: 'edge-i5', source: 'node-2', target: 'node-2a' },
        { id: 'edge-i6', source: 'node-2', target: 'node-2b' },
    ],
};

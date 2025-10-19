// demos/CoreConcepts.js

export default {
    name: 'Core Concepts',
    description: 'This demo showcases the fundamental building blocks of SpaceGraph.js, including different node types (3D shapes, HTML content) and basic edge connections.',
    elements: [
        // Nodes
        { id: 'concepts-root', type: 'box', size: 12, color: 0x00ffff, label: 'Core Concepts' },
        { id: 'html-node', type: 'html', htmlContent: '<div class="widget"><h3>HTML Node</h3><p>Embed any HTML content.</p></div>', position: { x: 100, y: 0, z: 0 } },
        { id: 'sphere-node', type: 'sphere', size: 8, color: 0xff00ff, label: 'Sphere Node', position: { x: -100, y: 50, z: 0 } },
        { id: 'box-node', type: 'box', size: 10, color: 0xffff00, label: 'Box Node', position: { x: -100, y: -50, z: 0 } },
        { id: 'data-driven', type: 'html', htmlContent: '<div class="widget"><h3>Data-Driven</h3><p>Nodes can be styled based on their data properties.</p></div>', position: { x: 0, y: 150, z: 0 } },

        // Edges
        { id: 'edge-1', source: 'concepts-root', target: 'html-node' },
        { id: 'edge-2', source: 'concepts-root', target: 'sphere-node', dashed: true },
        { id: 'edge-3', source: 'concepts-root', target: 'box-node', color: 0x00ff00 },
        { id: 'edge-4', source: 'concepts-root', target: 'data-driven' },
    ],
};

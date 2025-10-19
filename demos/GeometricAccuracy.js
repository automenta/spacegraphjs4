export const GeometricAccuracy = {
    name: 'Geometric Accuracy',
    description: 'A demo to verify the geometric accuracy and readability of items, and to test camera behavior.',
    elements: [
        // A central sphere
        { id: 'center-sphere', type: 'sphere', size: 20, color: '#ff0000', position: { x: 0, y: 0, z: 0 } },

        // Four boxes surrounding the central sphere
        { id: 'box-1', type: 'box', size: 10, color: '#00ff00', position: { x: 50, y: 0, z: 0 } },
        { id: 'box-2', type: 'box', size: 10, color: '#0000ff', position: { x: -50, y: 0, z: 0 } },
        { id: 'box-3', type: 'box', size: 10, color: '#ffff00', position: { x: 0, y: 50, z: 0 } },
        { id: 'box-4', type: 'box', size: 10, color: '#00ffff', position: { x: 0, y: -50, z: 0 } },

        // Edges connecting the boxes to the central sphere
        { id: 'edge-1', source: 'center-sphere', target: 'box-1', type: 'edge' },
        { id: 'edge-2', source: 'center-sphere', target: 'box-2', type: 'edge' },
        { id: 'edge-3', source: 'center-sphere', target: 'box-3', type: 'edge' },
        { id: 'edge-4', source: 'center-sphere', target: 'box-4', type: 'edge' },
    ],
};

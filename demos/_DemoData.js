// demos/_DemoData.js

// This file can be used to store shared data, complex nodes,
// or utility functions for generating demo graphs.

export const fullDemo = {
    name: 'Full Demo',
    description: 'This is the original demonstration graph showcasing a variety of node types, edge styles, and interactions available in SpaceGraph.js.',
    elements: [
        // Nodes
        {
            id: 'full-demo',
            type: 'html',
            htmlContent: `
                <div class="widget text-panel" style="width: 350px; pointer-events: auto;">
                    <h3>Full Demo</h3>
                    <h4>Core Node Types Demo</h4>
                    <p>This is the original demonstration graph showcasing a variety of node types, edge styles, and interactions available in SpaceGraph.js.</p>
                    <ul>
                        <li>HTML Content Nodes (NoteNode)</li>
                        <li>3D Shape Nodes (Box, Sphere)</li>
                        <li>GLTF Model Loading</li>
                        <li>Image & Video Nodes</li>
                        <li>IFrame Embedding</li>
                        <li>Grouped Nodes</li>
                        <li>Various edge styles (curved, straight, dashed, gradient, arrows)</li>
                        <li>Node interactivity (sliders, buttons within HTML nodes)</li>
                    </ul>
                </div>
            `
        },
        {
            id: 'features',
            type: 'html',
            htmlContent: `
                <div class="widget" style="width: 200px; pointer-events: auto;">
                    <h3>Features ✨</h3>
                    <p>&bull; HTML & 3D Nodes</p>
                    <p>&bull; Node</p>
                </div>
            `
        },
        {
            id: 'style',
            type: 'html',
            htmlContent: `
                <div class="widget" style="padding: 0; background-color: transparent; pointer-events: auto;">
                    <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop" style="width: 300px; border-radius: 12px;">
                    <h3 style="position: absolute; bottom: 10px; left: 20px; margin: 0; color: white; text-shadow: 2px 2px 4px #000;">Style</h3>
                </div>
            `
        },
        {
            id: 'technology',
            type: 'html',
            htmlContent: `
                <div class="widget" style="width: 180px; pointer-events: auto;">
                    <h3>Technology</h3>
                </div>
            `
        },
        {
            id: 'interactive',
            type: 'html',
            htmlContent: `
                <div class="widget form-widget" style="width: 220px; pointer-events: auto;">
                    <h3>Interactive</h3>
                    <label for="slider">Slider: 50</label>
                    <input type="range" id="slider" min="0" max="100" value="50">
                </div>
            `
        },
        {
            id: 'data-source',
            type: 'html',
            htmlContent: `
                <div class="widget" style="width: 150px; text-align: center; pointer-events: auto;">
                     <p>Data Source</p>
                     <p style="font-size: 24px; color: #00ffff; margin: 0;">API</p>
                </div>
            `
        },
         {
            id: 'another-node',
            type: 'html',
            htmlContent: `
                <div class="widget" style="width: 200px; pointer-events: auto;">
                    <h3>Another Node</h3>
                    <p>More details here.</p>
                </div>
            `
        },

        // Edges
        { id: 'edge-1', source: 'style', target: 'features', type: 'edge' },
        { id: 'edge-2', source: 'style', target: 'technology', type: 'edge', dashed: true, color: 0x00ff00 },
        { id: 'edge-3', source: 'style', target: 'interactive', type: 'edge', color: 0xff00ff },
        { id: 'edge-4', source: 'full-demo', target: 'style', type: 'edge', color: 0xff00ff },
        { id: 'edge-5', source: 'features', target: 'data-source', type: 'edge' },
        { id: 'edge-6', source: 'technology', target: 'another-node', type: 'edge', dashed: true, color: 0xffff00 },
    ],
};

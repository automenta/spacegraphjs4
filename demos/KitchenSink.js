// demos/KitchenSink.js

export const kitchenSink = {
    name: 'Kitchen Sink',
    description: 'A comprehensive demo showcasing all available node and edge types.',
    elements: [
        // Nodes
        {
            id: 'kitchen-sink-root',
            type: 'html',
            htmlContent: `
                <div class="widget text-panel" style="width: 350px; pointer-events: auto;">
                    <h3>Kitchen Sink Demo</h3>
                    <p>This demo showcases the full range of features in SpaceGraph.js.</p>
                    <ul>
                        <li><b>Node Types:</b> HTML, Box, Sphere, Sprite, Image, Video, GLTF</li>
                        <li><b>Edge Styles:</b> Dashed, Colored</li>
                    </ul>
                </div>
            `
        },
        { id: 'box-node', type: 'box', color: 0xff0000, size: 20 },
        { id: 'sphere-node', type: 'sphere', color: 0x00ff00, size: 20 },
        { id: 'sprite-node', type: 'sprite', imageUrl: 'https://threejs.org/examples/textures/sprites/disc.png', color: 0x0000ff, size: 30 },
        { id: 'image-node', type: 'image', imageUrl: 'https://threejs.org/examples/textures/uv_grid_opengl.jpg', size: 50 },
        { id: 'video-node', type: 'video', videoUrl: 'https://threejs.org/examples/textures/sintel.mp4', size: 50 },
        { id: 'gltf-node', type: 'gltf', gltfUrl: 'https://threejs.org/examples/models/gltf/Duck/glTF/Duck.gltf', size: 20 },
        {
            id: 'html-node-1',
            type: 'html',
            htmlContent: `
                <div class="widget profile-card" style="pointer-events: auto;">
                    <img src="https://i.pravatar.cc/80?u=1" alt="Avatar">
                    <div class="name">Jane Doe</div>
                    <div class="title">Software Engineer</div>
                </div>
            `
        },
        {
            id: 'html-node-2',
            type: 'html',
            htmlContent: `
                <div class="widget form-widget" style="width: 220px; pointer-events: auto;">
                    <h3>Interactive Form</h3>
                    <label for="slider-ks">Value: 75</label>
                    <input type="range" id="slider-ks" min="0" max="100" value="75">
                    <button>Submit</button>
                </div>
            `
        },

        // Edges
        { id: 'edge-1', source: 'kitchen-sink-root', target: 'box-node', type: 'edge' },
        { id: 'edge-2', source: 'kitchen-sink-root', target: 'sphere-node', type: 'edge' },
        { id: 'edge-3', source: 'kitchen-sink-root', target: 'sprite-node', type: 'edge' },
        { id: 'edge-4', source: 'kitchen-sink-root', target: 'image-node', type: 'edge' },
        { id: 'edge-5', source: 'kitchen-sink-root', target: 'video-node', type: 'edge' },
        { id: 'edge-6', source: 'kitchen-sink-root', target: 'gltf-node', type: 'edge' },
        { id: 'edge-7', source: 'kitchen-sink-root', target: 'html-node-1', type: 'edge' },
        { id: 'edge-8', source: 'kitchen-sink-root', target: 'html-node-2', type: 'edge' },
        { id: 'edge-9', source: 'box-node', target: 'sphere-node', type: 'edge', dashed: true, color: 0xffff00 },
        { id: 'edge-10', source: 'image-node', target: 'video-node', type: 'edge', color: 0xff00ff },
        { id: 'edge-11', source: 'html-node-1', target: 'html-node-2', type: 'edge', dashed: true, color: 0x00ffff },
    ],
};

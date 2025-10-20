// demos/DynamicControls.js

export const DynamicControls = {
    name: 'Dynamic Controls',
    description: 'A demonstration of the dynamic, programmatic control over the SpaceGraph API.',
    elements: [
        {
            id: 'root-node',
            type: 'html',
            htmlContent: `
                <div class="widget text-panel" style="width: 350px;">
                    <h3>Dynamic Controls</h3>
                    <p>This demo showcases how to programmatically control various features of the SpaceGraph engine at runtime.</p>
                    <p>Use the controls in the settings panel to manipulate the scene.</p>
                </div>
            `
        },
        { id: 'target-node', type: 'sphere', color: 0x00ffff, size: 20 },
        { id: 'edge-1', source: 'root-node', target: 'target-node', type: 'edge' },
    ],
    config: {
        fisheye: {
            enabled: false,
            ui: {
                label: 'Fisheye Effect',
                type: 'toggle',
                manager: 'fisheye',
                key: 'fisheye',
                setter: 'setEnabled',
                getter: 'isEnabled',
            },
        },
        renderer: {
            bloom: {
                enabled: true,
                ui: {
                    label: 'Bloom Effect',
                    type: 'toggle',
                    manager: 'renderer',
                    key: 'bloom',
                    setter: 'setBloom',
                    getter: 'isBloomEnabled',
                },
            },
        },
        controls: {
            orbit: {
                enabled: true,
                ui: {
                    label: 'Orbit Controls',
                    type: 'toggle',
                    manager: 'controls',
                    key: 'orbit',
                    setter: 'setOrbitControls',
                    getter: 'isOrbitControlsEnabled',
                },
            },
            autoZoom: {
                enabled: true,
                ui: {
                    label: 'AutoZoom',
                    type: 'toggle',
                    manager: 'controls',
                    key: 'autoZoom',
                    setter: 'setAutoZoom',
                    getter: 'isAutoZoomEnabled',
                },
            },
        },
        camera: {
            flyToTarget: {
                ui: {
                    label: 'Fly to "Target" Node',
                    type: 'button',
                    action: 'flyToTarget',
                },
            },
            zoomToScene: {
                ui: {
                    label: 'Zoom to Full Scene',
                    type: 'button',
                    action: 'zoomToScene',
                },
            },
        },
    },
    actions: {
        flyToTarget: (graph) => graph.flyTo('target-node'),
        zoomToScene: (graph) => graph.flyTo(),
    }
};

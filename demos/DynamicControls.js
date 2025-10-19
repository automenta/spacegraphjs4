// demos/DynamicControls.js

// This function will be called by the UIManager to create the controls for this demo.
const createDynamicControls = (graph) => {
    const controlsContainer = document.getElementById('settings-panel');
    controlsContainer.innerHTML = ''; // Clear existing controls

    const controlsConfig = [
        {
            type: 'toggle',
            label: 'Fisheye Effect',
            initialState: graph.fisheyeManager.isEnabled(),
            action: (value) => graph.setFisheye(value),
        },
        {
            type: 'toggle',
            label: 'Bloom Effect',
            initialState: graph.renderer.bloomPass.enabled,
            action: (value) => graph.setBloom(value),
        },
        {
            type: 'toggle',
            label: 'Orbit Controls',
            initialState: graph.controlsManager.orbitControls.enabled,
            action: (value) => graph.setOrbitControls(value),
            condition: () => graph.controlsManager.orbitControls,
        },
        {
            type: 'toggle',
            label: 'AutoZoom',
            initialState: graph.controlsManager.autoZoomEnabled,
            action: (value) => graph.setAutoZoom(value),
        },
        {
            type: 'button',
            label: 'Fly to "Target" Node',
            action: () => graph.flyTo('target-node'),
        },
        {
            type: 'button',
            label: 'Zoom to Full Scene',
            action: () => graph.flyTo(),
        }
    ];

    controlsConfig.forEach(config => {
        // Conditional rendering of the control
        if (config.condition && !config.condition()) {
            return;
        }

        if (config.type === 'toggle') {
            const label = document.createElement('label');
            label.className = 'toggle-switch';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = config.initialState;
            input.addEventListener('change', (event) => config.action(event.target.checked));

            const slider = document.createElement('span');
            slider.className = 'slider';

            label.appendChild(input);
            label.appendChild(slider);
            label.appendChild(document.createTextNode(` ${config.label}`));

            controlsContainer.appendChild(label);
            controlsContainer.appendChild(document.createElement('br'));
        } else if (config.type === 'button') {
            const button = document.createElement('button');
            button.textContent = config.label;
            button.addEventListener('click', () => config.action());
            controlsContainer.appendChild(button);
            controlsContainer.appendChild(document.createElement('br'));
        }
    });
};


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
    postLoad: (graph) => {
        createDynamicControls(graph);
    },
};

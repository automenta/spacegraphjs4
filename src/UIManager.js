// src/UIManager.js

class UIManager {
    constructor(demoManager, graph) {
        this.demoManager = demoManager;
        this.graph = graph;
        this.dom = {
            demoList: document.getElementById('demo-list'),
            demoTitle: document.getElementById('demo-title'),
            demoDescription: document.getElementById('demo-description'),
        };

        if (!this.dom.demoList || !this.dom.demoTitle || !this.dom.demoDescription) {
            console.error('UI elements not found in the DOM.');
            return;
        }

        this.init();
    }

    init() {
        this.populateDemoList();
        this.addEventListeners();
        this.updateDemoInfo(this.demoManager.activeDemo);
        this.createSettings();
    }

    populateDemoList() {
        Object.keys(this.demoManager.demos).forEach(demoName => {
            const li = document.createElement('li');
            li.textContent = demoName;
            li.dataset.demoName = demoName;
            if (this.demoManager.activeDemo && this.demoManager.activeDemo.name === demoName) {
                li.classList.add('active');
            }
            this.dom.demoList.appendChild(li);
        });
    }

    addEventListeners() {
        this.dom.demoList.addEventListener('click', async (event) => {
            if (event.target.tagName === 'LI') {
                const demoName = event.target.dataset.demoName;
                await this.demoManager.load(demoName);
            }
        });

        window.addEventListener('demo:loaded', ({ detail: demo }) => {
            this.updateDemoInfo(demo);
            this.updateActiveListItem(demo.name);
        });
    }

    updateDemoInfo(demo) {
        if (demo) {
            this.dom.demoTitle.textContent = demo.name;
            this.dom.demoDescription.textContent = demo.description;
        }
    }

    updateActiveListItem(activeDemoName) {
        this.dom.demoList.querySelectorAll('li').forEach(li => {
            li.classList.toggle('active', li.dataset.demoName === activeDemoName);
        });
    }

    createToggle(labelText, isChecked, onChange) {
        const container = document.getElementById('settings-panel');

        const label = document.createElement('label');
        label.className = 'toggle-switch';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = isChecked;
        input.addEventListener('change', (event) => onChange(event.target.checked));

        const slider = document.createElement('span');
        slider.className = 'slider';

        label.appendChild(input);
        label.appendChild(slider);
        label.appendChild(document.createTextNode(` ${labelText}`));

        container.appendChild(label);
        container.appendChild(document.createElement('br')); // For spacing
    }

    createSettings() {
        // Fisheye Toggle
        this.createToggle(
            'Fisheye Effect',
            this.graph.fisheyeManager.isEnabled(),
            (isChecked) => {
                this.graph.setFisheye(isChecked);
            }
        );

        // Bloom Toggle
        this.createToggle(
            'Bloom Effect',
            this.graph.renderer.bloomPass.enabled,
            (isChecked) => {
                this.graph.setBloom(isChecked);
            }
        );

        // Orbit Controls Toggle
        this.createToggle(
            'Orbit Controls',
            this.graph.controlsManager.orbitControls.enabled,
            (isChecked) => {
                this.graph.setOrbitControls(isChecked);
            }
        );

        // AutoZoom Toggle
        this.createToggle(
            'AutoZoom',
            this.graph.controlsManager.autoZoomEnabled,
            (isChecked) => {
                this.graph.setAutoZoom(isChecked);
            }
        );
    }
}

export default UIManager;

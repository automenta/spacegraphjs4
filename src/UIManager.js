// src/UIManager.js

class UIManager {
    constructor(demoManager, graph) {
        this.demoManager = demoManager;
        this.graph = graph;
        this.dom = {
            demoList: document.getElementById('demo-list'),
            demoTitle: document.getElementById('demo-title'),
            demoDescription: document.getElementById('demo-description'),
            settingsPanel: document.getElementById('settings-panel'),
        };

        if (Object.values(this.dom).some(el => !el)) {
            console.error('UI elements not found in the DOM.');
            return;
        }

        this.init();
    }

    init() {
        this.populateDemoList();
        this.addEventListeners();
        this.updateDemoInfo(this.demoManager.activeDemo);
        this.recreateSettings(this.demoManager.activeDemo);
    }

    populateDemoList() {
        Object.keys(this.demoManager.demos).forEach(demoName => {
            const li = document.createElement('li');
            li.textContent = demoName;
            li.dataset.demoName = demoName;
            if (this.demoManager.activeDemo?.name === demoName) {
                li.classList.add('active');
            }
            this.dom.demoList.appendChild(li);
        });
    }

    addEventListeners() {
        this.dom.demoList.addEventListener('click', async (event) => {
            if (event.target.tagName === 'LI') {
                await this.demoManager.load(event.target.dataset.demoName);
            }
        });

        window.addEventListener('demo:loaded', ({ detail: demo }) => {
            this.updateDemoInfo(demo);
            this.updateActiveListItem(demo.name);
            this.recreateSettings(demo);
        });
    }

    updateDemoInfo(demo) {
        if (!demo) return;
        this.dom.demoTitle.textContent = demo.name;
        this.dom.demoDescription.textContent = demo.description;
    }

    updateActiveListItem(activeDemoName) {
        this.dom.demoList.querySelectorAll('li').forEach(li => {
            li.classList.toggle('active', li.dataset.demoName === activeDemoName);
        });
    }

    recreateSettings(demo) {
        this.dom.settingsPanel.innerHTML = '';
        if (demo?.postLoad) {
            demo.postLoad(this.graph);
        } else {
            this.createSettingsFromConfig(this.graph.config);
        }
    }

    createSettingsFromConfig(config) {
        for (const key in config) {
            if (typeof config[key] === 'object' && config[key] !== null) {
                if (config[key].ui) {
                    this.createToggle(config[key].ui);
                } else {
                    this.createSettingsFromConfig(config[key]);
                }
            }
        }
    }

    createToggle({ label, type, setter, getter }) {
        if (type !== 'toggle') return;

        const isChecked = this.graph[getter] ? this.graph[getter]() : false;
        const onChange = (isChecked) => this.graph[setter] && this.graph[setter](isChecked);

        const labelEl = document.createElement('label');
        labelEl.className = 'toggle-switch';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = isChecked;
        input.addEventListener('change', (event) => onChange(event.target.checked));

        const slider = document.createElement('span');
        slider.className = 'slider';

        labelEl.appendChild(input);
        labelEl.appendChild(slider);
        labelEl.appendChild(document.createTextNode(` ${label}`));

        this.dom.settingsPanel.appendChild(labelEl);
        this.dom.settingsPanel.appendChild(document.createElement('br'));
    }
}

export default UIManager;

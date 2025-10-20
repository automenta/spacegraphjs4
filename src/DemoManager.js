// src/DemoManager.js

class DemoManager {
    constructor(graph) {
        this.graph = graph;
        this.demos = {};
        this.activeDemo = null;
    }

    register(name, demoData) {
        this.demos[name] = { ...demoData, name };
    }

    async load(demoName) {
        const demo = this.demos[demoName];
        if (!demo) {
            console.error(`Demo "${demoName}" not found.`);
            return;
        }

        this.graph.clear();

        if (demo.config) {
            this.graph.loadConfig(demo.config);
        }

        let elements;
        if (typeof demo.elements === 'function') {
            elements = await demo.elements();
        } else {
            elements = demo.elements;
        }

        this.graph.load(elements);
        this.graph.flyTo(); // Auto-zoom to the new scene
        this.activeDemo = demo;

        // Dispatch an event to notify the UI of the change
        window.dispatchEvent(new CustomEvent('demo:loaded', { detail: demo }));
    }
}

export default DemoManager;

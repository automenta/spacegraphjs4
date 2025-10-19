// src/DemoManager.js

class DemoManager {
    constructor(graph, demos) {
        this.graph = graph;
        this.demos = demos;
        this.activeDemo = null;
    }

    load(demoName) {
        const demo = this.demos[demoName];
        if (!demo) {
            console.error(`Demo "${demoName}" not found.`);
            return;
        }

        this.graph.clear();
        this.graph.load(demo.elements);
        this.activeDemo = demo;

        // Dispatch an event to notify the UI of the change
        window.dispatchEvent(new CustomEvent('demo:loaded', { detail: demo }));
    }
}

export default DemoManager;

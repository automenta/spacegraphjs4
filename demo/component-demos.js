import { Layer } from '../src/Layer.js';
import { ContainerSurface } from '../src/ContainerSurface.js';
import { Button } from '../src/components/Button.js';
import { Slider } from '../src/components/Slider.js';
import { TextInput } from '../src/components/TextInput.js';
import { ScrollableContainer } from '../src/components/ScrollableContainer.js';
import { TextSurface } from '../src/TextSurface.js';
import { RectSurface } from '../src/RectSurface.js';

class ComponentDemosApp {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.initRenderer();
        this.layer = new Layer();
        this.createScene();
        this.animate();
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x111111, 1);
        this.container.appendChild(this.renderer.domElement);
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    createScene() {
        const rootSurface = new ContainerSurface({ width: 30, height: 20 });
        this.layer.setRootSurface(rootSurface);

        const title = new TextSurface('Component Demos', { fontSize: 28, color: '#fff' });
        title.position.set(15, 18, 0);
        rootSurface.addChild(title);

        // Button Demo
        const button = new Button('Click Me', { width: 4, height: 1.5 });
        button.position.set(2, 2, 0);
        button.addEventListener('click', () => console.log('Button clicked!'));
        rootSurface.addChild(button);

        // Slider Demo
        const slider = new Slider({ width: 8, height: 1 }, 0, 100, 50);
        slider.position.set(8, 2, 0);
        slider.addEventListener('change', (e) => console.log(`Slider value: ${e.data.value}`));
        rootSurface.addChild(slider);

        // TextInput Demo
        const textInput = new TextInput('Edit me...', { width: 8, height: 1.5 });
        textInput.position.set(18, 2, 0);
        textInput.addEventListener('input', (e) => console.log(`TextInput value: ${e.data.value}`));
        rootSurface.addChild(textInput);

        // ScrollableContainer Demo
        const scrollable = new ScrollableContainer({ width: 8, height: 6 });
        scrollable.position.set(2, 5, 0);
        for (let i = 0; i < 20; i++) {
            const item = new RectSurface({ width: 7.5, height: 0.8 }, 0x333333);
            const itemText = new TextSurface(`Item ${i + 1}`, { fontSize: 14, color: '#fff' });
            itemText.position.set(0.2, 0.2, 0);
            item.addChild(itemText);
            scrollable.addChild(item);
        }
        scrollable.setContentSize({ width: 8, height: 18 });
        rootSurface.addChild(scrollable);
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.layer.resize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.layer.update(0.016);
        this.layer.render(this.renderer);
    }
}

window.addEventListener('load', () => new ComponentDemosApp());

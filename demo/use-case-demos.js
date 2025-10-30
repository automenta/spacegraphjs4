import { Layer } from '../src/Layer.js';
import { ContainerSurface } from '../src/ContainerSurface.js';
import { Button } from '../src/components/Button.js';
import { Slider } from '../src/components/Slider.js';
import { TextInput } from '../src/components/TextInput.js';
import { TextSurface } from '../src/TextSurface.js';
import { RectSurface } from '../src/RectSurface.js';
import { FlexLayout } from '../src/layout/FlexLayout.js';

class UseCaseDemosApp {
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

        const title = new TextSurface('Use-Case Demo: Settings Panel', { fontSize: 28, color: '#fff' });
        title.position.set(15, 18, 0);
        rootSurface.addChild(title);

        // Settings Panel
        const panel = new FlexLayout({ width: 12, height: 10 }, { direction: 'column', alignItems: 'stretch' });
        panel.position.set(9, 4, 0);
        panel.padding = { top: 1, right: 1, bottom: 1, left: 1 };
        panel.spacing = 0.5;
        rootSurface.addChild(panel);

        const panelBg = new RectSurface({ width: 12, height: 10 }, 0x222222);
        panel.addChild(panelBg);

        const header = new TextSurface('Settings', { fontSize: 20, color: '#fff' });
        panel.add(header);

        // Graphics Settings
        const graphicsLabel = new TextSurface('Graphics Quality', { fontSize: 16, color: '#ccc' });
        panel.add(graphicsLabel);

        const graphicsSlider = new Slider({ width: 10, height: 0.8 }, 0, 100, 75);
        panel.add(graphicsSlider);

        // Player Name
        const nameLabel = new TextSurface('Player Name', { fontSize: 16, color: '#ccc' });
        panel.add(nameLabel);

        const nameInput = new TextInput('Enter your name', { width: 10, height: 1.2 });
        panel.add(nameInput);

        // Buttons
        const buttonContainer = new FlexLayout({ width: 10, height: 1.5 }, { direction: 'row', justifyContent: 'flex-end' });
        panel.add(buttonContainer);

        const applyButton = new Button('Apply', { width: 3, height: 1.2 });
        buttonContainer.add(applyButton);

        const cancelButton = new Button('Cancel', { width: 3, height: 1.2 }, 0x888888);
        buttonContainer.add(cancelButton);
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

window.addEventListener('load', () => new UseCaseDemosApp());


import { Stage } from '../src/Stage.js';
import { Button } from '../src/components/Button.js';
import { Label } from '../src/components/Label.js';
import { ToggleButton } from '../src/components/ToggleButton.js';
import { IconToggleButton } from '../src/components/IconToggleButton.js';

window.addEventListener('load', () => {
    // Create the stage
    const stage = new Stage();
    stage.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(stage.renderer.domElement);

    // Add a button
    const button = new Button("Click Me", { width: 4, height: 1.5 }, 0x4a86e8);
    button.position.set(-5, 2, 0);
    stage.addChild(button);

    // Add a label
    const label = new Label("This is a label", { width: 4, height: 1.5 });
    label.position.set(0, 2, 0);
    stage.addChild(label);

    // Add a toggle button
    const toggleButton = new ToggleButton("Toggle Me", { width: 4, height: 1.5 });
    toggleButton.position.set(5, 2, 0);
    stage.addChild(toggleButton);

    // Add an icon toggle button
    const drawPowerIcon = (ctx, width, height, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width * 0.1;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, width * 0.3, Math.PI * 0.8, Math.PI * 2.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(width / 2, height * 0.2);
        ctx.lineTo(width / 2, height * 0.5);
        ctx.stroke();
    };
    const iconToggleButton = new IconToggleButton(drawPowerIcon, { width: 1.5, height: 1.5 });
    iconToggleButton.position.set(0, -2, 0);
    stage.addChild(iconToggleButton);

    // Add event listeners
    button.addEventListener('click', () => console.log('Button clicked!'));
    toggleButton.addEventListener('change', (event) => console.log(`ToggleButton toggled: ${event.data.toggled}`));
    iconToggleButton.addEventListener('change', (event) => console.log(`IconToggleButton toggled: ${event.data.toggled}`));

    // Render the scene
    function animate() {
        requestAnimationFrame(animate);
        stage.render();
    }
    animate();
});

import { Stage } from '../src/Stage.js';
import { Panel } from '../src/components/Panel.js';
import { Label } from '../src/components/Label.js';
import { Checkbox } from '../src/components/Checkbox.js';
import { Window } from '../src/components/Window.js';

// Create the stage
const stage = new Stage();
document.body.appendChild(stage.renderer.domElement);

// Create a window
const win = new Window('New Components Demo');
win.position.set(50, 50, 0);
stage.addChild(win);

// Create a panel inside the window
const panel = new Panel();
panel.position.set(10, 40, 0);
win.addChild(panel);

// Create a label
const label = new Label('Hello, world!', { fontSize: 20 });
label.position.set(10, 10, 0);
panel.addChild(label);

// Create a checkbox
const checkbox = new Checkbox();
checkbox.position.set(10, 40, 0);
panel.addChild(checkbox);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    stage.render();
}

animate();

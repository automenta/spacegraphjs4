import { ContainerSurface } from '../ContainerSurface.js';
import { TextSurface } from '../TextSurface.js';

/**
 * A simple statistics HUD that displays the current FPS.
 */
export class Stats extends ContainerSurface {
    /**
     * Creates a new Stats HUD.
     */
    constructor() {
        super();
        this.textSurface = new TextSurface('FPS: 0', {
            font: 'Arial',
            fontSize: 20,
            color: '#ffffff'
        });
        this.addChild(this.textSurface);

        this.frames = 0;
        this.lastTime = performance.now();
    }

    /**
     * Updates the FPS counter.
     */
    update() {
        this.frames++;
        const time = performance.now();

        if (time >= this.lastTime + 1000) {
            const fps = (this.frames * 1000) / (time - this.lastTime);
            this.textSurface.setText(`FPS: ${fps.toFixed(1)}`);
            this.lastTime = time;
            this.frames = 0;
        }
    }
}

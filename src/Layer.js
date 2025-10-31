import { AbstractLayer } from './AbstractLayer.js';
import { OrthoSurfaceGraph } from './OrthoSurfaceGraph.js';
import { Event } from './Event.js';

/**
 * A layer that manages an orthographic scene graph of surfaces.
 * This is analogous to the OrthoSurfaceGraph.java class, but it also handles the input and camera.
 */
export class Layer extends AbstractLayer {
    /**
     * Creates a new Layer.
     * @param {Surface} content - The root surface of the scene graph.
     */
    constructor(content) {
        super();
        this.orthoSurfaceGraph = new OrthoSurfaceGraph(content, this);
    }

    /**
     * Updates the layer and its scene graph.
     * @param {number} deltaTime - Time since last update in seconds.
     */
    update(deltaTime) {
        super.update(deltaTime);
        this.orthoSurfaceGraph.root.update(deltaTime);
    }

    /**
     * Renders the layer.
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer.
     */
    render(renderer) {
        super.render(renderer);
        this.orthoSurfaceGraph.render(renderer, performance.now(), 0.016);
    }

    /**
     * Handles pointer down events.
     * @param {PointerEvent} event - The pointer event.
     */
    onPointerDown(event) {
        super.onPointerDown(event);

        const targetSurface = this.orthoSurfaceGraph.findSurfaceAt(event.clientX, event.clientY);
        if (targetSurface) {
            // Right-click to zoom
            if (event.button === 2) {
                this.focusOnSurface(targetSurface, 500);
                return; // Prevent further processing
            }

            const inputEvent = new Event('pointerdown', {
                x: event.clientX,
                y: event.clientY,
                button: event.button,
                buttons: event.buttons,
                pointerId: event.pointerId
            });
            targetSurface.dispatchEvent(inputEvent);
        }
    }

    /**
     * Handles pointer up events.
     * @param {PointerEvent} event - The pointer event.
     */
    onPointerUp(event) {
        super.onPointerUp(event);

        const targetSurface = this.orthoSurfaceGraph.findSurfaceAt(event.clientX, event.clientY);
        if (targetSurface) {
            const inputEvent = new Event('pointerup', {
                x: event.clientX,
                y: event.clientY,
                button: event.button,
                buttons: event.buttons,
                pointerId: event.pointerId
            });
            targetSurface.dispatchEvent(inputEvent);
        }
    }

    /**
     * Handles pointer move events.
     * @param {PointerEvent} event - The pointer event.
     */
    onPointerMove(event) {
        super.onPointerMove(event);

        const targetSurface = this.orthoSurfaceGraph.findSurfaceAt(event.clientX, event.clientY);
        if (targetSurface) {
            const inputEvent = new Event('pointermove', {
                x: event.clientX,
                y: event.clientY,
                button: event.button,
                buttons: event.buttons,
                pointerId: event.pointerId
            });
            targetSurface.dispatchEvent(inputEvent);
        }
    }

    /**
     * Handles resize events.
     * @param {number} width - The new width.
     * @param {number} height - The new height.
     */
    resize(width, height) {
        super.resize(width, height);
        this.orthoSurfaceGraph.resize(width, height);
    }
}

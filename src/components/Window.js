import { Panel } from './Panel.js';
import { Label } from './Label.js';
import { RectSurface } from '../RectSurface.js';

/**
 * A Window component that can be dragged, resized, and can contain other components.
 */
export class Window extends Panel {
    /**
     * Creates a new Window.
     * @param {string} title - The title of the window.
     * @param {object} bounds - The bounds of the window { width, height }.
     */
    constructor(title = 'Window', bounds = { width: 300, height: 200 }) {
        super(bounds, 0xd0d0d0);

        this.title = title;
        this.dragging = false;
        this.dragStart = { x: 0, y: 0 };

        // Create the title bar
        this.titleBar = new RectSurface({ width: bounds.width, height: 30 }, 0xaaaaaa);
        this.addChild(this.titleBar);

        // Create the title label
        this.titleLabel = new Label(this.title, { bounds: { width: bounds.width, height: 30 }});
        this.titleLabel.position.set(10, 5, 0);
        this.titleBar.addChild(this.titleLabel);

        // Pre-bind event handlers
        this.boundOnDrag = this.onDrag.bind(this);
        this.boundOnDragEnd = this.onDragEnd.bind(this);

        // Add event listeners for dragging
        this.titleBar.addEventListener('pointerdown', this.onDragStart.bind(this));
    }

    onDragStart(event) {
        this.dragging = true;
        this.dragStart.x = event.data.x - this.position.x;
        this.dragStart.y = event.data.y - this.position.y;

        // Add listeners to the parent to capture events globally
        if (this.parent) {
            this.parent.addEventListener('pointermove', this.boundOnDrag);
            this.parent.addEventListener('pointerup', this.boundOnDragEnd);
        }
        event.stopPropagation();
    }

    onDrag(event) {
        if (this.dragging) {
            this.position.x = event.data.x - this.dragStart.x;
            this.position.y = event.data.y - this.dragStart.y;
            this.markWorldTransformDirty();
        }
    }

    onDragEnd(event) {
        this.dragging = false;

        // Remove global listeners
        if (this.parent) {
            this.parent.removeEventListener('pointermove', this.boundOnDrag);
            this.parent.removeEventListener('pointerup', this.boundOnDragEnd);
        }
    }
}

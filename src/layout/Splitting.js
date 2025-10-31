import { ContainerSurface } from '../ContainerSurface.js';
import { Surface } from '../Surface.js';

/**
 * Splitting creates a resizable split-pane layout.
 */
export class Splitting extends ContainerSurface {
    constructor(bounds, orientation = 'horizontal', splitPosition = 0.5) {
        super(bounds);
        this.orientation = orientation; // 'horizontal' or 'vertical'
        this.splitPosition = splitPosition; // 0.0 to 1.0

        this.pane1 = null;
        this.pane2 = null;

        this.handle = new Surface({ width: 10, height: 10 });
        this.handle.hitTestEnabled = true;
        super.addChild(this.handle); // Add handle directly to avoid our override

        this.isDragging = false;

        this.handle.addEventListener('pointerdown', () => {
            this.isDragging = true;
        });

        // Note: For robust dragging, we should listen for pointermove and pointerup
        // on a larger surface (like the stage or window) to handle cases where the
        // pointer moves faster than the handle or outside the window.
        // This basic implementation listens on the handle itself.
        this.handle.addEventListener('pointermove', (event) => {
            if (this.isDragging && event.data) {
                this.calculateWorldTransform(); // Ensure worldPosition is up to date
                if (this.orientation === 'horizontal') {
                    const localX = event.data.x - this.worldPosition.x;
                    this.splitPosition = localX / this.bounds.width;
                } else {
                    const localY = event.data.y - this.worldPosition.y;
                    this.splitPosition = localY / this.bounds.height;
                }
                this.splitPosition = Math.max(0, Math.min(1, this.splitPosition));
                this.markLayoutDirty();
            }
        });

        this.handle.addEventListener('pointerup', () => {
            this.isDragging = false;
        });
        this.handle.addEventListener('pointerleave', () => {
             this.isDragging = false;
        });
    }

    /**
     * Adds a child surface. Splitting layout only supports two children.
     * @param {Surface} child The child to add.
     */
    addChild(child) {
        if (!this.pane1) {
            this.pane1 = child;
        } else if (!this.pane2) {
            this.pane2 = child;
        } else {
            console.warn('Splitting layout can only have two children panes.');
            return;
        }
        super.addChild(child);
    }

    updateLayout() {
        if (!this.layoutDirty) return;

        const child1 = this.pane1;
        const child2 = this.pane2;

        if (!child1 || !child2) {
            this.layoutDirty = false;
            return;
        }

        if (this.orientation === 'horizontal') {
            const split = this.bounds.width * this.splitPosition;
            const handleWidth = this.handle.bounds.width;

            child1.setBounds({ width: split - handleWidth / 2, height: this.bounds.height });
            child1.position.set(0, 0, 0);

            child2.setBounds({ width: this.bounds.width - split - handleWidth / 2, height: this.bounds.height });
            child2.position.set(split + handleWidth / 2, 0, 0);

            this.handle.setBounds({ width: handleWidth, height: this.bounds.height });
            this.handle.position.set(split - handleWidth / 2, 0, 0);

        } else {
            const split = this.bounds.height * this.splitPosition;
            const handleHeight = this.handle.bounds.height;

            child1.setBounds({ width: this.bounds.width, height: split - handleHeight / 2 });
            child1.position.set(0, 0, 0);

            child2.setBounds({ width: this.bounds.width, height: this.bounds.height - split - handleHeight / 2 });
            child2.position.set(0, split + handleHeight / 2, 0);

            this.handle.setBounds({ width: this.bounds.width, height: handleHeight });
            this.handle.position.set(0, split - handleHeight / 2, 0);
        }

        this.layoutDirty = false;
    }
}

import { Fingering } from '../Fingering.js';

/**
 * Drag gesture recognizer
 */
export class DragRecognizer extends Fingering {
    /**
     * Creates a new DragRecognizer
     * @param {Layer} layer - The layer to search for targets
     * @param {number} minDistance - Minimum distance to qualify as drag in pixels (default: 5)
     * @param {number} maxFingers - Maximum number of fingers for this gesture (default: 1)
     */
    constructor(layer, minDistance = 5, maxFingers = 1) {
        super('drag');
        this.layer = layer;
        this.minDistance = minDistance;
        this.maxFingers = maxFingers;
        this.dragStarted = false;
        this.targetSurface = null;
    }

    /**
     * Handles a finger down event
     * @param {Finger} finger - The finger that went down
     * @returns {boolean} True if this gesture recognizer should capture the finger
     */
    onFingerDown(finger) {
        if (this.fingers.length < this.maxFingers) {
            // Find target surface
            if (this.layer.rootSurface) {
                this.targetSurface = this.layer.rootSurface.findSurfaceAt(finger.x, finger.y);
            }
            return true;
        }
        return false;
    }

    /**
     * Handles a finger move event
     * @param {Finger} finger - The finger that moved
     */
    onFingerMove(finger) {
        // Check if we should start dragging
        if (!this.dragStarted && finger.dragging(this.minDistance)) {
            this.dragStarted = true;
            this.fireDragStartEvent(finger);
        }
        
        // If dragging, fire drag move event
        if (this.dragStarted) {
            this.fireDragMoveEvent(finger);
        }
    }

    /**
     * Handles a finger up event
     * @param {Finger} finger - The finger that went up
     */
    onFingerUp(finger) {
        // If we were dragging, fire drag end event
        if (this.dragStarted) {
            this.fireDragEndEvent(finger);
        }
        this.dragStarted = false;
        this.targetSurface = null;
    }

    /**
     * Fires a drag start event
     * @param {Finger} finger - The finger that started dragging
     */
    fireDragStartEvent(finger) {
        if (this.targetSurface) {
            const event = new Event('dragstart', {
                x: finger.x,
                y: finger.y,
                dx: finger.dx,
                dy: finger.dy,
                start_x: finger.start_x,
                start_y: finger.start_y
            });
            this.targetSurface.dispatchEvent(event);
        }
    }

    /**
     * Fires a drag move event
     * @param {Finger} finger - The finger that moved
     */
    fireDragMoveEvent(finger) {
        if (this.targetSurface) {
            const event = new Event('drag', {
                x: finger.x,
                y: finger.y,
                dx: finger.dx,
                dy: finger.dy,
                start_x: finger.start_x,
                start_y: finger.start_y
            });
            this.targetSurface.dispatchEvent(event);
        }
    }

    /**
     * Fires a drag end event
     * @param {Finger} finger - The finger that ended dragging
     */
    fireDragEndEvent(finger) {
        if (this.targetSurface) {
            const event = new Event('dragend', {
                x: finger.x,
                y: finger.y,
                dx: finger.dx,
                dy: finger.dy,
                start_x: finger.start_x,
                start_y: finger.start_y
            });
            this.targetSurface.dispatchEvent(event);
        }
    }

    /**
     * Checks if this gesture recognizer should activate based on current finger states
     * @returns {boolean} True if the gesture should activate
     */
    shouldActivate() {
        // Activate when we have fingers and at least one is dragging
        return this.fingers.length > 0 && 
               this.fingers.some(finger => finger.dragging(this.minDistance));
    }

    /**
     * Resets this gesture recognizer
     */
    reset() {
        super.reset();
        this.dragStarted = false;
    }
}
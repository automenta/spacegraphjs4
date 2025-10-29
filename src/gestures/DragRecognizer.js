import { Fingering } from '../Fingering.js';

/**
 * Drag gesture recognizer
 */
export class DragRecognizer extends Fingering {
    /**
     * Creates a new DragRecognizer
     * @param {number} minDistance - Minimum distance to qualify as drag in pixels (default: 5)
     * @param {number} maxFingers - Maximum number of fingers for this gesture (default: 1)
     */
    constructor(minDistance = 5, maxFingers = 1) {
        super('drag');
        this.minDistance = minDistance;
        this.maxFingers = maxFingers;
        this.dragStarted = false;
    }

    /**
     * Handles a finger down event
     * @param {Finger} finger - The finger that went down
     * @returns {boolean} True if this gesture recognizer should capture the finger
     */
    onFingerDown(finger) {
        // Only capture if we haven't exceeded max fingers
        return this.fingers.length < this.maxFingers;
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
    }

    /**
     * Fires a drag start event
     * @param {Finger} finger - The finger that started dragging
     */
    fireDragStartEvent(finger) {
        // This would typically dispatch an event to the target surface
        console.log('Drag start detected');
    }

    /**
     * Fires a drag move event
     * @param {Finger} finger - The finger that moved
     */
    fireDragMoveEvent(finger) {
        // This would typically dispatch an event to the target surface
        console.log('Drag move detected');
    }

    /**
     * Fires a drag end event
     * @param {Finger} finger - The finger that ended dragging
     */
    fireDragEndEvent(finger) {
        // This would typically dispatch an event to the target surface
        console.log('Drag end detected');
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
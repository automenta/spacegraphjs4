import { Fingering } from '../Fingering.js';

/**
 * Pinch gesture recognizer for zooming
 */
export class PinchRecognizer extends Fingering {
    /**
     * Creates a new PinchRecognizer
     * @param {number} minDistance - Minimum distance change to qualify as pinch in pixels (default: 2)
     */
    constructor(minDistance = 2) {
        super('pinch');
        this.minDistance = minDistance;
        this.initialDistance = 0;
        this.lastDistance = 0;
        this.pinchStarted = false;
    }

    /**
     * Handles a finger down event
     * @param {Finger} finger - The finger that went down
     * @returns {boolean} True if this gesture recognizer should capture the finger
     */
    onFingerDown(finger) {
        // Only capture if we have less than 2 fingers (need exactly 2 for pinch)
        return this.fingers.length < 2;
    }

    /**
     * Handles a finger move event
     * @param {Finger} finger - The finger that moved
     */
    onFingerMove(finger) {
        // Need exactly 2 fingers for pinch
        if (this.fingers.length === 2) {
            const finger1 = this.fingers[0];
            const finger2 = this.fingers[1];
            
            // Calculate current distance between fingers
            const currentDistance = Math.sqrt(
                Math.pow(finger2.position.x - finger1.position.x, 2) +
                Math.pow(finger2.position.y - finger1.position.y, 2)
            );
            
            // Initialize initial distance on first move
            if (!this.pinchStarted) {
                this.initialDistance = currentDistance;
                this.lastDistance = currentDistance;
                this.pinchStarted = true;
                this.firePinchStartEvent(currentDistance);
            } else {
                // Check if distance has changed significantly
                const distanceChange = Math.abs(currentDistance - this.lastDistance);
                if (distanceChange >= this.minDistance) {
                    const scale = currentDistance / this.initialDistance;
                    this.firePinchMoveEvent(currentDistance, scale);
                    this.lastDistance = currentDistance;
                }
            }
        }
    }

    /**
     * Handles a finger up event
     * @param {Finger} finger - The finger that went up
     */
    onFingerUp(finger) {
        // If we were pinching, fire pinch end event
        if (this.pinchStarted && this.fingers.length === 2) {
            const finger1 = this.fingers[0];
            const finger2 = this.fingers[1];
            
            const finalDistance = Math.sqrt(
                Math.pow(finger2.position.x - finger1.position.x, 2) +
                Math.pow(finger2.position.y - finger1.position.y, 2)
            );
            
            const scale = finalDistance / this.initialDistance;
            this.firePinchEndEvent(finalDistance, scale);
        }
        
        this.pinchStarted = false;
        this.initialDistance = 0;
        this.lastDistance = 0;
    }

    /**
     * Fires a pinch start event
     * @param {number} distance - Initial distance between fingers
     */
    firePinchStartEvent(distance) {
        // This would typically dispatch an event to the target surface
        console.log('Pinch start detected, initial distance:', distance);
    }

    /**
     * Fires a pinch move event
     * @param {number} distance - Current distance between fingers
     * @param {number} scale - Scale factor relative to initial distance
     */
    firePinchMoveEvent(distance, scale) {
        // This would typically dispatch an event to the target surface
        console.log('Pinch move detected, distance:', distance, 'scale:', scale);
    }

    /**
     * Fires a pinch end event
     * @param {number} distance - Final distance between fingers
     * @param {number} scale - Scale factor relative to initial distance
     */
    firePinchEndEvent(distance, scale) {
        // This would typically dispatch an event to the target surface
        console.log('Pinch end detected, final distance:', distance, 'scale:', scale);
    }

    /**
     * Checks if this gesture recognizer should activate based on current finger states
     * @returns {boolean} True if the gesture should activate
     */
    shouldActivate() {
        // Activate when we have exactly 2 fingers
        return this.fingers.length === 2;
    }

    /**
     * Resets this gesture recognizer
     */
    reset() {
        super.reset();
        this.initialDistance = 0;
        this.lastDistance = 0;
        this.pinchStarted = false;
    }
}
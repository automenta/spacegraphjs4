import { Fingering } from '../Fingering.js';

/**
 * Camera pan gesture recognizer
 */
export class CameraPanRecognizer extends Fingering {
    /**
     * Creates a new CameraPanRecognizer
     * @param {object} cameraSystem - The camera system to control
     * @param {number} minDistance - Minimum distance to qualify as drag in pixels (default: 5)
     */
    constructor(cameraSystem, minDistance = 5) {
        super('camera-pan');
        this.cameraSystem = cameraSystem;
        this.minDistance = minDistance;
        this.lastPosition = { x: 0, y: 0 };
    }

    /**
     * Handles a finger down event
     * @param {Finger} finger - The finger that went down
     * @returns {boolean} True if this gesture recognizer should capture the finger
     */
    onFingerDown(finger) {
        // Only capture if we have exactly one finger and it's the middle button or right button
        if (this.fingers.length === 0 && (finger.pressed(1) || finger.pressed(2))) {
            this.lastPosition.x = finger.position.x;
            this.lastPosition.y = finger.position.y;
            return true;
        }
        return false;
    }

    /**
     * Handles a finger move event
     * @param {Finger} finger - The finger that moved
     */
    onFingerMove(finger) {
        // Check if we should start panning
        if (!this.active && finger.dragging(this.minDistance)) {
            this.activate();
        }
        
        // If active, apply pan
        if (this.active) {
            const deltaX = finger.position.x - this.lastPosition.x;
            const deltaY = finger.position.y - this.lastPosition.y;
            
            // Apply pan to camera system (invert Y for natural pan)
            this.cameraSystem.pan(deltaX, -deltaY);
            
            // Update last position
            this.lastPosition.x = finger.position.x;
            this.lastPosition.y = finger.position.y;
        }
    }

    /**
     * Handles a finger up event
     * @param {Finger} finger - The finger that went up
     */
    onFingerUp(finger) {
        // Deactivate when finger is released
        if (this.active) {
            this.deactivate();
        }
    }

    /**
     * Checks if this gesture recognizer should activate based on current finger states
     * @returns {boolean} True if the gesture should activate
     */
    shouldActivate() {
        // Activate when we have exactly one finger that is dragging
        return this.fingers.length === 1 && 
               this.fingers[0].dragging(this.minDistance) &&
               (this.fingers[0].pressed(1) || this.fingers[0].pressed(2));
    }

    /**
     * Called when the gesture starts
     */
    onStart() {
        // Store initial position
        if (this.fingers.length > 0) {
            const finger = this.fingers[0];
            this.lastPosition.x = finger.position.x;
            this.lastPosition.y = finger.position.y;
        }
    }

    /**
     * Called when the gesture ends
     */
    onEnd() {
        // Reset last position
        this.lastPosition.x = 0;
        this.lastPosition.y = 0;
    }
}
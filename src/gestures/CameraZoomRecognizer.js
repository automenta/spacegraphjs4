import { Fingering } from '../Fingering.js';

/**
 * Camera zoom gesture recognizer
 */
export class CameraZoomRecognizer extends Fingering {
    /**
     * Creates a new CameraZoomRecognizer
     * @param {object} cameraSystem - The camera system to control
     * @param {number} minDistance - Minimum distance change to qualify as zoom in pixels (default: 2)
     */
    constructor(cameraSystem, minDistance = 2) {
        super('camera-zoom');
        this.cameraSystem = cameraSystem;
        this.minDistance = minDistance;
        this.initialDistance = 0;
        this.lastDistance = 0;
    }

    /**
     * Handles a finger down event
     * @param {Finger} finger - The finger that went down
     * @returns {boolean} True if this gesture recognizer should capture the finger
     */
    onFingerDown(finger) {
        // Only capture if we have less than 2 fingers (need exactly 2 for pinch zoom)
        return this.fingers.length < 2;
    }

    /**
     * Handles a finger move event
     * @param {Finger} finger - The finger that moved
     */
    onFingerMove(finger) {
        // Need exactly 2 fingers for zoom
        if (this.fingers.length === 2) {
            const finger1 = this.fingers[0];
            const finger2 = this.fingers[1];
            
            // Calculate current distance between fingers
            const currentDistance = Math.sqrt(
                Math.pow(finger2.position.x - finger1.position.x, 2) +
                Math.pow(finger2.position.y - finger1.position.y, 2)
            );
            
            // Initialize initial distance on first move
            if (this.initialDistance === 0) {
                this.initialDistance = currentDistance;
                this.lastDistance = currentDistance;
            } else {
                // Check if distance has changed significantly
                const distanceChange = Math.abs(currentDistance - this.lastDistance);
                if (distanceChange >= this.minDistance) {
                    const delta = currentDistance - this.lastDistance;
                    // Apply zoom to camera system (scale factor for zoom sensitivity)
                    this.cameraSystem.zoom(-delta * 0.01);
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
        // Reset distances when fingers are released
        this.initialDistance = 0;
        this.lastDistance = 0;
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
    }
}
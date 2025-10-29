import { Fingering } from '../Fingering.js';

/**
 * Tap/Click gesture recognizer
 */
export class TapRecognizer extends Fingering {
    /**
     * Creates a new TapRecognizer
     * @param {number} maxDuration - Maximum duration for a tap in milliseconds (default: 200)
     * @param {number} maxDistance - Maximum distance for a tap in pixels (default: 5)
     * @param {number} maxFingers - Maximum number of fingers for this gesture (default: 1)
     */
    constructor(maxDuration = 200, maxDistance = 5, maxFingers = 1) {
        super('tap');
        this.maxDuration = maxDuration;
        this.maxDistance = maxDistance;
        this.maxFingers = maxFingers;
        this.tapCount = 0;
        this.lastTapTime = 0;
        this.doubleTapTimeout = 300; // Time between taps for double tap
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
     * Handles a finger up event
     * @param {Finger} finger - The finger that went up
     */
    onFingerUp(finger) {
        // Check if this qualifies as a tap
        if (finger.clicked(this.maxDuration, this.maxDistance)) {
            this.tapCount++;
            
            // Check for double tap
            const now = Date.now();
            const isDoubleTap = (now - this.lastTapTime) < this.doubleTapTimeout && this.tapCount >= 2;
            
            // Fire tap event
            this.fireTapEvent(finger, this.tapCount, isDoubleTap);
            
            this.lastTapTime = now;
            
            // Reset tap count after a delay
            setTimeout(() => {
                this.tapCount = 0;
            }, this.doubleTapTimeout);
        }
    }

    /**
     * Fires a tap event
     * @param {Finger} finger - The finger that tapped
     * @param {number} count - Number of taps
     * @param {boolean} isDoubleTap - Whether this is a double tap
     */
    fireTapEvent(finger, count, isDoubleTap) {
        // This would typically dispatch an event to the target surface
        // For now, we'll just log it
        console.log(`Tap detected: ${count} taps, double tap: ${isDoubleTap}`);
    }

    /**
     * Checks if this gesture recognizer should activate based on current finger states
     * @returns {boolean} True if the gesture should activate
     */
    shouldActivate() {
        // Activate immediately when first finger goes down
        return this.fingers.length > 0;
    }

    /**
     * Resets this gesture recognizer
     */
    reset() {
        super.reset();
        this.tapCount = 0;
        this.lastTapTime = 0;
    }
}
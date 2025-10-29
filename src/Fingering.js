/**
 * Base class for gesture recognizers
 */
export class Fingering {
    /**
     * Creates a new Fingering
     * @param {string} name - Name of the gesture recognizer
     */
    constructor(name) {
        this.name = name;
        this.active = false;
        this.fingers = []; // Fingers involved in this gesture
        this.startTime = 0;
        this.endTime = 0;
    }

    /**
     * Adds a finger to this gesture recognizer
     * @param {Finger} finger - The finger to add
     */
    addFinger(finger) {
        if (!this.fingers.includes(finger)) {
            this.fingers.push(finger);
            if (this.fingers.length === 1) {
                this.startTime = Date.now();
            }
        }
    }

    /**
     * Removes a finger from this gesture recognizer
     * @param {Finger} finger - The finger to remove
     */
    removeFinger(finger) {
        const index = this.fingers.indexOf(finger);
        if (index !== -1) {
            this.fingers.splice(index, 1);
            if (this.fingers.length === 0) {
                this.endTime = Date.now();
            }
        }
    }

    /**
     * Gets the primary finger (first finger added)
     * @returns {Finger|null} The primary finger or null if none
     */
    getPrimaryFinger() {
        return this.fingers.length > 0 ? this.fingers[0] : null;
    }

    /**
     * Gets the number of fingers in this gesture
     * @returns {number} Number of fingers
     */
    getFingerCount() {
        return this.fingers.length;
    }

    /**
     * Activates this gesture recognizer
     */
    activate() {
        this.active = true;
        this.onStart();
    }

    /**
     * Deactivates this gesture recognizer
     */
    deactivate() {
        this.active = false;
        this.onEnd();
    }

    /**
     * Updates this gesture recognizer
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (this.active) {
            this.onUpdate(deltaTime);
        }
    }

    /**
     * Handles a finger down event
     * @param {Finger} finger - The finger that went down
     * @returns {boolean} True if this gesture recognizer should capture the finger
     */
    onFingerDown(finger) {
        // Override in subclasses
        return false;
    }

    /**
     * Handles a finger up event
     * @param {Finger} finger - The finger that went up
     */
    onFingerUp(finger) {
        // Override in subclasses
    }

    /**
     * Handles a finger move event
     * @param {Finger} finger - The finger that moved
     */
    onFingerMove(finger) {
        // Override in subclasses
    }

    /**
     * Called when the gesture starts
     */
    onStart() {
        // Override in subclasses
    }

    /**
     * Called when the gesture updates
     * @param {number} deltaTime - Time since last update in seconds
     */
    onUpdate(deltaTime) {
        // Override in subclasses
    }

    /**
     * Called when the gesture ends
     */
    onEnd() {
        // Override in subclasses
    }

    /**
     * Resets this gesture recognizer
     */
    reset() {
        this.active = false;
        this.fingers = [];
        this.startTime = 0;
        this.endTime = 0;
    }

    /**
     * Checks if this gesture recognizer should activate based on current finger states
     * @returns {boolean} True if the gesture should activate
     */
    shouldActivate() {
        // Override in subclasses
        return false;
    }

    /**
     * Gets the duration of the gesture in milliseconds
     * @returns {number} Duration in milliseconds
     */
    getDuration() {
        if (this.startTime === 0) return 0;
        return (this.endTime || Date.now()) - this.startTime;
    }
}
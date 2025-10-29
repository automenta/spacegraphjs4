/**
 * Finger class that abstracts pointer interactions across different input devices
 */
export class Finger {
    /**
     * Creates a new Finger
     * @param {number} id - Unique identifier for this finger
     * @param {number} x - Initial x coordinate
     * @param {number} y - Initial y coordinate
     */
    constructor(id, x = 0, y = 0) {
        this.id = id;
        this.position = { x, y };
        this.previousPosition = { x, y };
        this.startPosition = { x, y };
        this.buttons = 0; // Bitmask for buttons (1=primary, 2=secondary, 4=auxiliary)
        this.fingering = null; // Current interaction state/gesture recognizer
        this.down = false; // Is the finger currently down?
        this.timestamp = Date.now(); // Last update timestamp
        this.pressTimestamp = 0; // Timestamp when finger went down
        this.velocity = { x: 0, y: 0 }; // Movement velocity
    }

    /**
     * Updates the finger position
     * @param {number} x - New x coordinate
     * @param {number} y - New y coordinate
     */
    updatePosition(x, y) {
        this.previousPosition.x = this.position.x;
        this.previousPosition.y = this.position.y;
        this.position.x = x;
        this.position.y = y;
        
        // Calculate velocity (pixels per millisecond)
        const deltaTime = Date.now() - this.timestamp;
        if (deltaTime > 0) {
            this.velocity.x = (this.position.x - this.previousPosition.x) / deltaTime;
            this.velocity.y = (this.position.y - this.previousPosition.y) / deltaTime;
        }
        
        this.timestamp = Date.now();
    }

    /**
     * Sets the button state
     * @param {number} buttons - Button bitmask
     */
    setButtons(buttons) {
        this.buttons = buttons;
    }

    /**
     * Checks if a specific button is pressed
     * @param {number} button - Button to check (0=primary, 1=secondary, 2=auxiliary)
     * @returns {boolean} True if the button is pressed
     */
    pressed(button = 0) {
        return (this.buttons & (1 << button)) !== 0;
    }

    /**
     * Checks if the finger is currently down
     * @returns {boolean} True if the finger is down
     */
    isDown() {
        return this.down;
    }

    /**
     * Sets the finger down state
     * @param {boolean} down - Down state
     */
    setDown(down) {
        if (down && !this.down) {
            // Finger is going down
            this.pressTimestamp = Date.now();
            this.startPosition.x = this.position.x;
            this.startPosition.y = this.position.y;
        }
        this.down = down;
    }

    /**
     * Checks if this is a click/tap (short press and release)
     * @param {number} maxDuration - Maximum duration for a click in milliseconds (default: 200)
     * @param {number} maxDistance - Maximum distance for a click in pixels (default: 5)
     * @returns {boolean} True if this is a click
     */
    clicked(maxDuration = 200, maxDistance = 5) {
        if (!this.down && this.pressTimestamp > 0) {
            const duration = Date.now() - this.pressTimestamp;
            const distance = Math.sqrt(
                Math.pow(this.position.x - this.startPosition.x, 2) +
                Math.pow(this.position.y - this.startPosition.y, 2)
            );
            
            return duration <= maxDuration && distance <= maxDistance;
        }
        return false;
    }

    /**
     * Checks if this is a drag (movement while down)
     * @param {number} minDistance - Minimum distance to qualify as drag in pixels (default: 5)
     * @returns {boolean} True if this is a drag
     */
    dragging(minDistance = 5) {
        if (this.down && this.pressTimestamp > 0) {
            const distance = Math.sqrt(
                Math.pow(this.position.x - this.startPosition.x, 2) +
                Math.pow(this.position.y - this.startPosition.y, 2)
            );
            
            return distance >= minDistance;
        }
        return false;
    }

    /**
     * Gets the distance moved from the start position
     * @returns {number} Distance in pixels
     */
    getDistanceFromStart() {
        return Math.sqrt(
            Math.pow(this.position.x - this.startPosition.x, 2) +
            Math.pow(this.position.y - this.startPosition.y, 2)
        );
    }

    /**
     * Gets the delta movement from the previous position
     * @returns {object} Delta movement {x, y}
     */
    getDelta() {
        return {
            x: this.position.x - this.previousPosition.x,
            y: this.position.y - this.previousPosition.y
        };
    }

    /**
     * Normalizes coordinates from screen space to a specific surface space
     * @param {Surface} surface - The surface to normalize to
     * @param {number} screenWidth - Screen width
     * @param {number} screenHeight - Screen height
     * @returns {object} Normalized coordinates {x, y}
     */
    getNormalizedPosition(surface, screenWidth, screenHeight) {
        // Convert screen coordinates to normalized device coordinates (-1 to 1)
        const ndcX = (this.position.x / screenWidth) * 2 - 1;
        const ndcY = -(this.position.y / screenHeight) * 2 + 1; // Flip Y axis
        
        // Transform to surface local coordinates
        const worldBounds = surface.getWorldBounds();
        const localX = ((ndcX + 1) / 2) * screenWidth - worldBounds.x;
        const localY = ((ndcY + 1) / 2) * screenHeight - worldBounds.y;
        
        return { x: localX, y: localY };
    }
}
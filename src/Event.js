/**
 * Simple event class for the scene graph
 */
export class Event {
    /**
     * Creates a new Event
     * @param {string} type - The type of event
     * @param {object} data - Additional data for the event
     */
    constructor(type, data = {}) {
        this.type = type;
        this.data = data;
        this.target = null;
        this.currentTarget = null;
        this.stopPropagation = false;
        this.cancelBubble = false;
    }

    /**
     * Stops the propagation of the event
     */
    stopPropagation() {
        this.stopPropagation = true;
    }

    /**
     * Prevents the default action of the event
     */
    preventDefault() {
        this.defaultPrevented = true;
    }
}

import { TextSurface } from '../TextSurface.js';

/**
 * A simple text label component.
 */
export class Label extends TextSurface {
    /**
     * Creates a new Label.
     * @param {string} text - The text to display.
     * @param {object} bounds - The bounds of the label.
     * @param {number} color - The color of the text.
     */
    constructor(text, bounds, color = 0x000000) {
        super(text, bounds, color);
    }
}

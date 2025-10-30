import { TextSurface } from '../TextSurface.js';

/**
 * A Label component for displaying text.
 * It extends TextSurface to provide a more component-oriented interface.
 */
export class Label extends TextSurface {
    /**
     * Creates a new Label.
     * @param {string} text - The text to display.
     * @param {object} options - Text options (font, fontSize, color, etc.).
     */
    constructor(text = '', options = {}) {
        // Provide default bounds if not specified, but allow override.
        const bounds = options.bounds || { width: 100, height: 20 };
        super(text, bounds, options);
    }
}

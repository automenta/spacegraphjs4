import { RectSurface } from '../RectSurface.js';

/**
 * A Panel component that serves as a basic container for other UI elements.
 * It is a RectSurface that can contain other surfaces.
 */
export class Panel extends RectSurface {
    /**
     * Creates a new Panel.
     * @param {object} bounds - The bounds of the panel { width, height }.
     * @param {number} color - The background color of the panel (hex).
     */
    constructor(bounds = { width: 200, height: 150 }, color = 0xeeeeee) {
        super(bounds, color);
    }
}

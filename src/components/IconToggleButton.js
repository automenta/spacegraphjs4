
import { ToggleButton } from './ToggleButton.js';
import { ImageSurface } from '../ImageSurface.js';

/**
 * An icon-based toggle button.
 */
export class IconToggleButton extends ToggleButton {
    /**
     * Creates a new IconToggleButton.
     * @param {function} drawIcon - A function that draws the icon on a 2D canvas context.
     * @param {object} bounds - The bounds of the button { width, height }.
     * @param {boolean} initialValue - The initial toggled state.
     */
    constructor(drawIcon, bounds = { width: 32, height: 32 }, initialValue = false) {
        super('', bounds, initialValue); // No label, just the icon

        // Remove the text surface from the original button
        if (this.textSurface) {
            this.removeChild(this.textSurface);
            this.textSurface = null;
        }

        const width = bounds.width || bounds.x;
        const height = bounds.height || bounds.y;

        // Create a canvas to draw the icon on
        this.iconCanvas = document.createElement('canvas');
        this.iconCanvas.width = width * 2; // Use a higher resolution for crispness
        this.iconCanvas.height = height * 2;
        this.iconContext = this.iconCanvas.getContext('2d');
        this.drawIcon = drawIcon;

        // Create and add the icon
        this.iconSurface = new ImageSurface(this.iconCanvas, bounds);
        this.addChild(this.iconSurface);

        this.updateIconVisuals();
    }

    /**
     * Updates the icon's visual state based on the button's state.
     */
    updateIconVisuals() {
        // Clear the canvas
        this.iconContext.clearRect(0, 0, this.iconCanvas.width, this.iconCanvas.height);

        // Set the color based on the toggle state
        const color = this.toggled ? '#00ff00' : '#aaaaaa';

        // Draw the icon
        this.drawIcon(this.iconContext, this.iconCanvas.width, this.iconCanvas.height, color);

        // Update the texture
        this.iconSurface.setImage(this.iconCanvas);
    }

    /**
     * Override onToggle to update the icon's appearance.
     */
    onToggle(event) {
        super.onToggle(event);
        this.updateIconVisuals();
    }
}

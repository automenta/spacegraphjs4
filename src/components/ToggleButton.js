
import { Button } from './Button.js';
import { Event } from '../Event.js';

/**
 * ToggleButton component with on/off state
 */
export class ToggleButton extends Button {
    /**
     * Creates a new ToggleButton
     * @param {string} label - The button label
     * @param {object} bounds - The bounds of the button {width, height}
     * @param {boolean} initialValue - The initial toggled state
     */
    constructor(label = 'ToggleButton', bounds = { width: 120, height: 30 }, initialValue = false) {
        super(label, bounds);

        this.toggled = initialValue;
        this.toggledColor = 0x00ff00; // Green when toggled
        this.originalColor = this.color;
        this.updateColor();

        // Override the click handler from the parent class
        this.removeEventListener('pointerup', this.onPointerUp.bind(this));
        this.addEventListener('pointerup', this.onToggle.bind(this));
    }

    /**
     * Toggles the button state
     */
    onToggle(event) {
        if (this.disabled) return;

        this.toggled = !this.toggled;
        this.updateColor();

        const changeEvent = new Event('change', {
            toggled: this.toggled
        });
        this.dispatchEvent(changeEvent);

        if (event) {
            event.stopPropagation = true;
        }
    }

    /**
     * Sets the toggled state
     * @param {boolean} toggled - The new toggled state
     */
    setToggled(toggled) {
        if (this.toggled !== toggled) {
            this.toggled = toggled;
            this.updateColor();
        }
    }

    /**
     * Updates the button color based on the toggled state
     */
    updateColor() {
        if (this.pressed) {
            this.setColor(this.pressedColor);
        } else if (this.toggled) {
            this.setColor(this.toggledColor);
        } else {
            this.setColor(this.originalColor);
        }
    }

    onPointerDown(event) {
        super.onPointerDown(event);
        this.updateColor();
    }

    onPointerLeave(event) {
        super.onPointerLeave(event);
        this.updateColor();
    }
}

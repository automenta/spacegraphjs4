import { RectSurface } from '../RectSurface.js';
import { Event } from '../Event.js';

/**
 * A Checkbox component that can be checked and unchecked.
 */
export class Checkbox extends RectSurface {
    /**
     * Creates a new Checkbox.
     * @param {object} bounds - The bounds of the checkbox { width, height }.
     * @param {boolean} checked - The initial checked state.
     */
    constructor(bounds = { width: 20, height: 20 }, checked = false) {
        super(bounds, 0xffffff);
        this.strokeColor = 0x000000;
        this.checkColor = 0x333333;
        this.checked = checked;

        // Create the checkmark
        this.checkMark = new RectSurface({ width: bounds.width * 0.6, height: bounds.height * 0.6 }, this.checkColor);
        this.checkMark.visible = this.checked;
        this.addChild(this.checkMark);
        this.checkMark.position.set(bounds.width * 0.2, bounds.height * 0.2, 0);

        this.addEventListener('click', this.toggle.bind(this));
    }

    /**
     * Toggles the checked state of the checkbox.
     */
    toggle() {
        this.setChecked(!this.checked);
    }

    /**
     * Sets the checked state of the checkbox.
     * @param {boolean} checked - The new checked state.
     */
    setChecked(checked) {
        this.checked = checked;
        this.checkMark.visible = this.checked;
        this.dispatchEvent(new Event('change', { checked: this.checked }));
    }
}

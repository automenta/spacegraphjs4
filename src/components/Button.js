
import { RectSurface } from '../RectSurface.js';
import { TextSurface } from '../TextSurface.js';
import { Event } from '../Event.js';

/**
 * Button component with press/release states and click events
 */
export class Button extends RectSurface {
    /**
     * Creates a new Button
     * @param {string} label - The button label
     * @param {object} bounds - The bounds of the button {width, height}
     * @param {number} color - The button color (hex)
     */
    constructor(label = 'Button', bounds = { width: 100, height: 30 }, color = 0x4a86e8) {
        super({ width: bounds.width, height: bounds.height }, color);
        this.label = label;
        this.pressedColor = 0x3a76d8;
        this.disabledColor = 0xcccccc;
        this.textColor = '#ffffff';
        this.disabled = false;
        this.pressed = false;
        
        // Create text surface for the label
        this.textSurface = new TextSurface(label, {
            font: 'Arial',
            fontSize: 14,
            color: this.textColor,
            textAlign: 'center',
            verticalAlign: 'middle'
        });
        
        // Position text in the center of the button
        this.textSurface.position.x = bounds.width / 2;
        this.textSurface.position.y = bounds.height / 2;
        this.addChild(this.textSurface);
        
        // Add event listeners
        this.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.addEventListener('pointerup', this.onPointerUp.bind(this));
        this.addEventListener('pointerleave', this.onPointerLeave.bind(this));
    }

    /**
     * Sets the button label
     * @param {string} label - The new label
     */
    setLabel(label) {
        this.label = label;
        this.textSurface.setText(label);
    }

    /**
     * Sets the button disabled state
     * @param {boolean} disabled - Whether the button is disabled
     */
    setDisabled(disabled) {
        this.disabled = disabled;
        if (disabled) {
            this.setColor(this.disabledColor);
        } else {
            this.setColor(this.originalColor || this.color);
        }
    }

    /**
     * Handles pointer down events
     * @param {Event} event - The pointer event
     */
    onPointerDown(event) {
        if (this.disabled) return;
        
        this.pressed = true;
        if (this.originalColor === undefined) {
            this.originalColor = this.color;
        }
        this.setColor(this.pressedColor);
        
        // Prevent event propagation
        event.stopPropagation = true;
    }

    /**
     * Handles pointer up events
     * @param {Event} event - The pointer event
     */
    onPointerUp(event) {
        if (this.disabled) return;
        
        this.pressed = false;
        this.setColor(this.originalColor || this.color);
        
        // Dispatch click event
        const clickEvent = new Event('click', {
            x: event.data.x,
            y: event.data.y
        });
        this.dispatchEvent(clickEvent);
        
        // Prevent event propagation
        event.stopPropagation = true;
    }

    /**
     * Handles pointer leave events
     * @param {Event} event - The pointer event
     */
    onPointerLeave(event) {
        if (this.disabled || !this.pressed) return;
        
        this.pressed = false;
        this.setColor(this.originalColor || this.color);
        
        // Prevent event propagation
        event.stopPropagation = true;
    }
}

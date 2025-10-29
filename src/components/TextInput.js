import { RectSurface } from '../RectSurface.js';
import { TextSurface } from '../TextSurface.js';

/**
 * Text input field with basic editing capabilities
 */
export class TextInput extends RectSurface {
    /**
     * Creates a new TextInput
     * @param {string} placeholder - Placeholder text
     * @param {object} bounds - The bounds of the input {x, y}
     */
    constructor(placeholder = 'Enter text...', bounds = { x: 200, y: 30 }) {
        super(bounds, 0xffffff); // White background
        this.placeholder = placeholder;
        this.text = '';
        this.focused = false;
        this.cursorPosition = 0;
        this.cursorVisible = true;
        this.cursorBlinkTimer = 0;
        
        // Create text surface for the input text
        this.textSurface = new TextSurface(this.text || this.placeholder, {
            font: 'Arial',
            fontSize: 14,
            color: this.text ? '#000000' : '#888888', // Gray for placeholder
            align: 'left'
        });
        
        // Position text with some padding
        this.textSurface.position.x = 5;
        this.textSurface.position.y = bounds.y / 2;
        this.addChild(this.textSurface);
        
        // Create cursor
        this.cursor = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 20),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        this.cursor.position.set(5, bounds.y / 2, 1);
        this.cursor.visible = false;
        
        // Add event listeners
        this.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.addEventListener('focus', this.onFocus.bind(this));
        this.addEventListener('blur', this.onBlur.bind(this));
    }

    /**
     * Handles pointer down events
     * @param {Event} event - The pointer event
     */
    onPointerDown(event) {
        // Focus this input
        this.focus();
        
        // Prevent event propagation
        event.stopPropagation = true;
    }

    /**
     * Focuses this input field
     */
    focus() {
        if (this.focused) return;
        
        this.focused = true;
        this.setBorderColor(0x4a86e8); // Blue border when focused
        
        // Show cursor
        this.cursor.visible = true;
        this.cursorPosition = this.text.length;
        this.updateCursor();
        
        // Dispatch focus event
        const focusEvent = new Event('focus');
        this.dispatchEvent(focusEvent);
    }

    /**
     * Blurs this input field
     */
    blur() {
        if (!this.focused) return;
        
        this.focused = false;
        this.setBorderColor(0x000000); // Black border when not focused
        
        // Hide cursor
        this.cursor.visible = false;
        
        // Dispatch blur event
        const blurEvent = new Event('blur');
        this.dispatchEvent(blurEvent);
    }

    /**
     * Sets the border color
     * @param {number} color - The border color (hex)
     */
    setBorderColor(color) {
        // In a real implementation, we would modify the border
        // For now, we'll just change the background slightly
        if (this.focused) {
            this.setColor(0xf0f8ff); // Light blue when focused
        } else {
            this.setColor(0xffffff); // White when not focused
        }
    }

    /**
     * Updates the cursor position
     */
    updateCursor() {
        if (!this.focused) return;
        
        // Calculate cursor position based on text
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `${this.textSurface.fontSize}px ${this.textSurface.font}`;
        const textWidth = ctx.measureText(this.text.substring(0, this.cursorPosition)).width;
        
        this.cursor.position.x = 5 + textWidth;
        this.cursor.position.y = this.bounds.y / 2;
    }

    /**
     * Inserts text at the cursor position
     * @param {string} text - The text to insert
     */
    insertText(text) {
        if (!this.focused) return;
        
        this.text = this.text.substring(0, this.cursorPosition) + 
                   text + 
                   this.text.substring(this.cursorPosition);
        this.cursorPosition += text.length;
        
        // Update display
        this.textSurface.setText(this.text);
        this.textSurface.setColor('#000000'); // Black text
        this.updateCursor();
        
        // Dispatch input event
        const inputEvent = new Event('input', { value: this.text });
        this.dispatchEvent(inputEvent);
    }

    /**
     * Deletes text at the cursor position
     */
    deleteText() {
        if (!this.focused || this.cursorPosition === 0) return;
        
        this.text = this.text.substring(0, this.cursorPosition - 1) + 
                   this.text.substring(this.cursorPosition);
        this.cursorPosition--;
        
        // Update display
        this.textSurface.setText(this.text || this.placeholder);
        this.textSurface.setColor(this.text ? '#000000' : '#888888');
        this.updateCursor();
        
        // Dispatch input event
        const inputEvent = new Event('input', { value: this.text });
        this.dispatchEvent(inputEvent);
    }

    /**
     * Gets the current text value
     * @returns {string} The current text
     */
    getValue() {
        return this.text;
    }

    /**
     * Sets the text value
     * @param {string} text - The new text
     */
    setValue(text) {
        this.text = text;
        this.cursorPosition = text.length;
        
        // Update display
        this.textSurface.setText(text || this.placeholder);
        this.textSurface.setColor(text ? '#000000' : '#888888');
        this.updateCursor();
    }

    /**
     * Handles focus event
     * @param {Event} event - The focus event
     */
    onFocus(event) {
        this.focus();
    }

    /**
     * Handles blur event
     * @param {Event} event - The blur event
     */
    onBlur(event) {
        this.blur();
    }

    /**
     * Updates the input field
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Handle cursor blinking
        if (this.focused) {
            this.cursorBlinkTimer += deltaTime;
            if (this.cursorBlinkTimer > 0.5) { // Blink every 0.5 seconds
                this.cursor.visible = !this.cursor.visible;
                this.cursorBlinkTimer = 0;
            }
        }
    }

    /**
     * Renders the text input
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
     * @param {THREE.Scene} scene - The scene to render to
     * @param {THREE.Camera} camera - The camera to render with
     */
    render(renderer, scene, camera) {
        if (!this.visible) return;
        
        // Calculate world transform
        this.calculateWorldTransform();
        
        // Update mesh position based on world position
        if (this.mesh) {
            this.mesh.position.copy(this.worldPosition);
            this.mesh.position.x += this.bounds.x / 2;
            this.mesh.position.y += this.bounds.y / 2;
            // Add to scene if not already added
            if (!this.mesh.parent) {
                scene.add(this.mesh);
            }
        }
        
        // Update cursor position
        this.cursor.position.copy(this.worldPosition);
        this.updateCursor();
        
        // Add cursor to scene if not already added and visible
        if (this.cursor.visible && !this.cursor.parent) {
            scene.add(this.cursor);
        }
        
        // Render children
        for (const child of this.children) {
            child.renderIfVisible(renderer, scene, camera);
        }
    }
}
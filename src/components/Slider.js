import { Surface } from '../Surface.js';

/**
 * Slider component with draggable handle and value reporting
 */
export class Slider extends Surface {
    /**
     * Creates a new Slider
     * @param {object} bounds - The bounds of the slider {x, y}
     * @param {number} minValue - Minimum value
     * @param {number} maxValue - Maximum value
     * @param {number} initialValue - Initial value
     */
    constructor(bounds = { x: 200, y: 20 }, minValue = 0, maxValue = 100, initialValue = 50) {
        super(bounds);
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.value = initialValue;
        this.dragging = false;
        
        // Create track
        this.track = new THREE.Mesh(
            new THREE.PlaneGeometry(bounds.x, 4),
            new THREE.MeshBasicMaterial({ color: 0xaaaaaa })
        );
        this.track.position.set(bounds.x / 2, bounds.y / 2, 0);
        
        // Create handle
        this.handle = new THREE.Mesh(
            new THREE.SphereGeometry(8, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x4a86e8 })
        );
        this.updateHandlePosition();
        
        // Add event listeners
        this.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.addEventListener('pointermove', this.onPointerMove.bind(this));
        this.addEventListener('pointerup', this.onPointerUp.bind(this));
    }

    /**
     * Updates the handle position based on the current value
     */
    updateHandlePosition() {
        const ratio = (this.value - this.minValue) / (this.maxValue - this.minValue);
        const trackLength = this.bounds.x - 16; // Account for handle radius
        this.handle.position.set(
            8 + ratio * trackLength, // 8 is handle radius
            this.bounds.y / 2,
            1 // Slightly above track
        );
    }

    /**
     * Sets the slider value
     * @param {number} value - The new value
     */
    setValue(value) {
        this.value = Math.max(this.minValue, Math.min(this.maxValue, value));
        this.updateHandlePosition();
        
        // Dispatch change event
        const changeEvent = new Event('change', { value: this.value });
        this.dispatchEvent(changeEvent);
    }

    /**
     * Gets the slider value
     * @returns {number} The current value
     */
    getValue() {
        return this.value;
    }

    /**
     * Handles pointer down events
     * @param {Event} event - The pointer event
     */
    onPointerDown(event) {
        this.dragging = true;
        this.handle.material.color.setHex(0x3a76d8); // Darker color when pressed
        
        // Update value based on click position
        this.updateValueFromPosition(event.data.x);
        
        // Prevent event propagation
        event.stopPropagation = true;
    }

    /**
     * Handles pointer move events
     * @param {Event} event - The pointer event
     */
    onPointerMove(event) {
        if (!this.dragging) return;
        
        // Update value based on drag position
        this.updateValueFromPosition(event.data.x);
        
        // Prevent event propagation
        event.stopPropagation = true;
    }

    /**
     * Handles pointer up events
     * @param {Event} event - The pointer event
     */
    onPointerUp(event) {
        this.dragging = false;
        this.handle.material.color.setHex(0x4a86e8); // Original color
        
        // Prevent event propagation
        event.stopPropagation = true;
    }

    /**
     * Updates the slider value based on pointer position
     * @param {number} x - The x position in local coordinates
     */
    updateValueFromPosition(x) {
        // Convert position to value ratio
        const trackLength = this.bounds.x - 16; // Account for handle radius
        const ratio = Math.max(0, Math.min(1, (x - 8) / trackLength));
        const newValue = this.minValue + ratio * (this.maxValue - this.minValue);
        this.setValue(newValue);
    }

    /**
     * Renders the slider
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
     * @param {THREE.Scene} scene - The scene to render to
     * @param {THREE.Camera} camera - The camera to render with
     */
    render(renderer, scene, camera) {
        if (!this.visible) return;
        
        // Calculate world transform
        this.calculateWorldTransform();
        
        // Update mesh positions based on world position
        this.track.position.copy(this.worldPosition);
        this.track.position.x += this.bounds.x / 2;
        this.track.position.y += this.bounds.y / 2;
        
        this.handle.position.copy(this.worldPosition);
        this.handle.position.x += this.handle.position.x;
        this.handle.position.y += this.bounds.y / 2;
        
        // Add to scene if not already added
        if (!this.track.parent) {
            scene.add(this.track);
        }
        if (!this.handle.parent) {
            scene.add(this.handle);
        }
        
        // Render children
        for (const child of this.children) {
            child.renderIfVisible(renderer, scene, camera);
        }
    }
}
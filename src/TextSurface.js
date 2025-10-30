import { Surface } from './Surface.js';

/**
 * TextSurface represents a 2D text surface
 */
export class TextSurface extends Surface {
    /**
     * Creates a new TextSurface
     * @param {string} text - The text to display
     * @param {object} options - Text options
     * @param {string} options.font - The font family
     * @param {number} options.fontSize - The font size
     * @param {string} options.color - The text color
     * @param {string} options.align - The text alignment ('left', 'center', 'right')
     * @param {boolean} options.scaleToFit - Whether to scale the text to fit the bounds
     */
    constructor(text = '', bounds = { width: 1, height: 1 }, options = {}) {
        super(bounds);
        this.text = text;
        this.font = options.font || 'Arial';
        this.fontSize = options.fontSize || 16;
        this.color = options.color || '#ffffff';
        this.align = options.align || 'left';
        this.scaleToFit = options.scaleToFit || false;
        this.mesh = null;
        this.canvas = null;
        this.texture = null;
        this.updateText();
    }

    /**
     * Updates the text and regenerates the texture
     */
    updateText() {
        // Remove old mesh if it exists
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        
        // Create canvas for text rendering
        this.canvas = document.createElement('canvas');
        const ctx = this.canvas.getContext('2d');
        
        // High resolution for crisp text
        const resolution = 2;
        this.canvas.width = this.bounds.width * resolution;
        this.canvas.height = this.bounds.height * resolution;
        
        // Set font and measure text
        let fontSize = this.fontSize;
        if (this.scaleToFit) {
            // Adjust font size to fit the bounds
            fontSize = this.adjustFontSize(ctx, this.text, this.bounds.width * resolution, this.bounds.height * resolution);
        }
        
        // Clear and style canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = `${fontSize}px ${this.font}`;
        ctx.fillStyle = this.color;
        ctx.textAlign = this.align;
        
        // Draw text
        const x = this.align === 'right' ? this.canvas.width : this.align === 'center' ? this.canvas.width / 2 : 0;
        const y = this.canvas.height / 2 + fontSize / 2; // Center vertically
        ctx.fillText(this.text, x, y);
        
        // Create texture
        if (this.texture) {
            this.texture.dispose();
        }
        this.texture = new THREE.CanvasTexture(this.canvas);
        
        // Create material and geometry
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const geometry = new THREE.PlaneGeometry(this.canvas.width, this.canvas.height);
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Scale the mesh to fit the bounds
        this.mesh.scale.set(this.bounds.width / this.canvas.width, this.bounds.height / this.canvas.height, 1);

        // Position the mesh
        this.mesh.position.set(this.bounds.width / 2, this.bounds.height / 2, 0);
    }

    /**
     * Adjusts font size to fit text within given dimensions
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {string} text - The text to fit
     * @param {number} maxWidth - The maximum width
     * @param {number} maxHeight - The maximum height
     * @returns {number} The adjusted font size
     */
    adjustFontSize(ctx, text, maxWidth, maxHeight) {
        let fontSize = this.fontSize;

        // Decrease font size until it fits
        while (fontSize > 0) {
            ctx.font = `${fontSize}px ${this.font}`;
            const metrics = ctx.measureText(text);
            if (metrics.width <= maxWidth && fontSize * 1.2 <= maxHeight) {
                break;
            }
            fontSize -= 1;
        }

        return fontSize;
    }

    /**
     * Sets the text
     * @param {string} text - The new text
     */
    setText(text) {
        this.text = text;
        this.updateText();
    }

    /**
     * Sets the font size
     * @param {number} fontSize - The new font size
     */
    setFontSize(fontSize) {
        this.fontSize = fontSize;
        this.updateText();
    }

    /**
     * Sets the text color
     * @param {string} color - The new color
     */
    setColor(color) {
        this.color = color;
        this.updateText();
    }

    /**
     * Renders the text
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
            // Add to scene if not already added
            if (!this.mesh.parent) {
                scene.add(this.mesh);
            }
        }
        
        // Render children
        for (const child of this.children) {
            child.renderIfVisible(renderer, scene, camera);
        }
    }
}
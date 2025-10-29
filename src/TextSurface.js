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
     */
    constructor(text = '', options = {}) {
        super({ x: 1, y: 1 }); // Bounds will be updated based on text
        this.text = text;
        this.font = options.font || 'Arial';
        this.fontSize = options.fontSize || 16;
        this.color = options.color || '#ffffff';
        this.align = options.align || 'left';
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
        
        // Set font and measure text
        ctx.font = `${this.fontSize}px ${this.font}`;
        const metrics = ctx.measureText(this.text);
        const width = metrics.width;
        const height = this.fontSize * 1.2; // Approximate height
        
        // Update bounds
        this.bounds = { x: width, y: height };
        
        // Set canvas dimensions
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Clear and style canvas
        ctx.clearRect(0, 0, width, height);
        ctx.font = `${this.fontSize}px ${this.font}`;
        ctx.fillStyle = this.color;
        ctx.textAlign = this.align;
        
        // Draw text
        const x = this.align === 'right' ? width : this.align === 'center' ? width / 2 : 0;
        ctx.fillText(this.text, x, height - (height - this.fontSize) / 2);
        
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
        
        const geometry = new THREE.PlaneGeometry(width, height);
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position the mesh
        this.mesh.position.set(width / 2, height / 2, 0);
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
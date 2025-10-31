
import { RectSurface } from './RectSurface.js';
import * as THREE from '../../node_modules/three/build/three.module.js';

/**
 * A surface that displays an image.
 */
export class ImageSurface extends RectSurface {
    /**
     * Creates a new ImageSurface.
     * @param {string} imageUrl - The URL of the image to display.
     * @param {object} bounds - The bounds of the surface { x, y }.
     */
    constructor(imageUrl, bounds = { x: 32, y: 32 }) {
        // Initialize with a transparent color, as the texture will provide the visuals.
        super(bounds, 0xffffff);
        this.material.transparent = true;
        this.material.opacity = 0; // Start fully transparent

        this.textureLoader = new THREE.TextureLoader();
        this.setImage(imageUrl);
    }

    /**
     * Sets the image for the surface.
     * @param {string} imageUrl - The URL of the image to display.
     */
    setImage(imageUrl) {
        if (imageUrl instanceof HTMLCanvasElement) {
            this.material.map = new THREE.CanvasTexture(imageUrl);
            this.material.opacity = 1;
            this.material.needsUpdate = true;
        } else {
            this.textureLoader.load(
                imageUrl,
                (texture) => {
                    // The image has been successfully loaded
                    this.material.map = texture;
                    this.material.opacity = 1;
                    this.material.needsUpdate = true;
                },
                undefined, // onProgress callback not implemented
                (error) => {
                    // An error occurred while loading the image
                    console.error('An error happened while loading the texture.', error);
                }
            );
        }
    }
}

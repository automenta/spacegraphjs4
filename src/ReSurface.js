import * as THREE from 'three';

/**
 * Surface rendering context, equivalent to Java's ReSurface.
 * This class manages the rendering state, including the camera, viewport,
 * and transformation stack, to correctly render the hierarchy of surfaces.
 */
export class ReSurface {
    /**
     * Creates a new ReSurface
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
     * @param {THREE.Scene} scene - The scene to render to
     * @param {THREE.OrthographicCamera} camera - The camera
     */
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.stack = []; // Stack for saving camera/transform states

        // Time and frame metrics
        this.frameDT = 0; // Delta time in seconds
        this.frameNS = 0; // Current frame timestamp in nanoseconds

        // Pixel dimensions of the viewport
        this.pw = 1;
        this.ph = 1;

        // Viewport bounds in world coordinates
        this.x1 = 0;
        this.y1 = 0;
        this.x2 = 1;
        this.y2 = 1;
        this.w = 1;
        this.h = 1;

        // Scale factor from world units to pixels
        this.scaleX = 1;
        this.scaleY = 1;

        // Minimum visible size in pixels. Surfaces smaller than this won't be rendered.
        this.minVisibilityPixelPct = 1.0;
    }

    /**
     * Starts a new rendering frame.
     * @param {number} pw - Pixel width of the rendering surface.
     * @param {number} ph - Pixel height of the rendering surface.
     * @param {number} timeNS - The current time in nanoseconds.
     * @param {number} dtS - The delta time since the last frame in seconds.
     */
    start(pw, ph, timeNS, dtS) {
        this.pw = pw;
        this.ph = ph;
        this.frameNS = timeNS;
        this.frameDT = dtS;

        // Reset the camera to an orthographic view that matches the viewport dimensions
        this.camera.left = 0;
        this.camera.right = pw;
        this.camera.top = ph;
        this.camera.bottom = 0;
        this.camera.near = -1000;
        this.camera.far = 1000;
        this.camera.position.set(pw / 2, ph / 2, 0);
        this.camera.zoom = 1;
        this.camera.updateProjectionMatrix();

        // Set the initial world view
        this.set(pw / 2, ph / 2, 1, 1);

        return this;
    }

    /**
     * Sets the current view transform (camera position and zoom).
     * @param {number} cx - Center X of the view in world coordinates.
     * @param {number} cy - Center Y of the view in world coordinates.
     * @param {number} sx - Scale factor on the X axis.
     * @param {number} sy - Scale factor on the Y axis.
     */
    set(cx, cy, sx, sy) {
        this.scaleX = sx;
        this.scaleY = sy;

        this.w = this.pw / sx;
        this.h = this.ph / sy;

        this.x1 = cx - this.w / 2;
        this.x2 = cx + this.w / 2;
        this.y1 = cy - this.h / 2;
        this.y2 = cy + this.h / 2;

        // Update the THREE.js camera to reflect this view
        this.camera.position.set(cx, cy, this.camera.position.z);
        this.camera.zoom = sx; // Assuming uniform scaling for simplicity for now
        this.camera.updateProjectionMatrix();

        return this;
    }

    /**
     * Pushes the current view state onto the stack and sets a new, relative view.
     * @param {object} newView - The new view parameters { cx, cy, sx, sy }.
     */
    push(newView) {
        const currentView = {
            x1: this.x1, y1: this.y1, x2: this.x2, y2: this.y2,
            w: this.w, h: this.h,
            scaleX: this.scaleX, scaleY: this.scaleY,
            cx: (this.x1 + this.x2) / 2,
            cy: (this.y1 + this.y2) / 2
        };
        this.stack.push(currentView);

        // The new view is relative to the old one.
        // We scale the new view's scale by the current scale,
        // and transform the new center by the current view.
        const newScaleX = currentView.scaleX * newView.sx;
        const newScaleY = currentView.scaleY * newView.sy;

        // To transform the center, we first find its position relative to the current view's top-left,
        // scale that, and then add it to the current view's top-left.
        // This is a simplification; a full matrix transformation would be more robust.
        const newCX = currentView.x1 + newView.cx * currentView.w;
        const newCY = currentView.y1 + newView.cy * currentView.h;

        this.set(newCX, newCY, newScaleX, newScaleY);
    }

    /**
     * Pops the view state from the stack, restoring the previous view.
     */
    pop() {
        if (this.stack.length > 0) {
            const oldView = this.stack.pop();
            this.set(oldView.cx, oldView.cy, oldView.scaleX, oldView.scaleY);
        }
    }

    /**
     * Checks if a surface's bounds intersects with the current view.
     * @param {object} bounds - The bounds of the surface { x, y, width, height }.
     * @returns {boolean} True if the bounds are visible.
     */
    isVisible(bounds) {
        // Simple AABB intersection test
        return (
            bounds.x < this.x2 &&
            bounds.x + bounds.width > this.x1 &&
            bounds.y < this.y2 &&
            bounds.y + bounds.height > this.y1
        );
    }

    /**
     * Checks if a surface is large enough on screen to be rendered.
     * @param {object} bounds - The bounds of the surface { x, y, width, height }.
     * @returns {boolean} True if the projected pixel size is large enough.
     */
    isVisiblePixels(bounds) {
        const widthPixels = bounds.width * this.scaleX;
        const heightPixels = bounds.height * this.scaleY;
        return widthPixels >= this.minVisibilityPixelPct && heightPixels >= this.minVisibilityPixelPct;
    }
}

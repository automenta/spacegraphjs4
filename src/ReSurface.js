/**
 * A class responsible for rendering a scene graph of surfaces.
 * This is analogous to the ReSurface.java class.
 */
export class ReSurface {
    /**
     * Renders the given surface and its children.
     * @param {Surface} surface - The surface to render.
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer.
     * @param {number} startNS - The start time in nanoseconds.
     * @param {number} dtS - The delta time in seconds.
     */
    render(surface, renderer, startNS, dtS) {
        if (surface.visible) {
            surface.render(renderer);

            for (const child of surface.children) {
                this.render(child, renderer, startNS, dtS);
            }
        }
    }
}

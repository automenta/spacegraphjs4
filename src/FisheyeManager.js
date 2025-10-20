// src/FisheyeManager.js

import * as THREE from 'three';

/**
 * Manages the fisheye lens distortion effect.
 * This effect distorts the positions of nodes in the scene to create a fisheye lens view,
 * magnifying the center of the view and compressing the periphery.
 */
class FisheyeManager {
    constructor(config, camera, sceneManager) {
        this.config = config.fisheye || { enabled: false };
        this.camera = camera;
        this.sceneManager = sceneManager;
        this.originalPositions = new Map();
        // The effect is now disabled by default until enable() is called.
        this.config.enabled = false;
    }

    /**
     * Checks if the fisheye effect is enabled.
     * @returns {boolean}
     */
    isEnabled() {
        return this.config.enabled;
    }

    /**
     * Enables or disables the fisheye effect.
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        if (!enabled) {
            this.restorePositions();
        }
    }

    /**
     * Called on each frame to apply the fisheye distortion.
     * If the effect is disabled, it restores the original positions of the nodes.
     */
    update() {
        if (!this.isEnabled()) {
            this.restorePositions();
            return;
        }

        const center = new THREE.Vector3(0, 0, 0); // The center of the fisheye effect
        const strength = this.config.strength || 2.0; // How strong the distortion is
        const radius = this.config.radius || 500; // The radius of the fisheye effect

        this.sceneManager.elements.forEach((element, id) => {
            // Store the original position of the node if we haven't already
            if (!this.originalPositions.has(id)) {
                this.originalPositions.set(id, element.position.clone());
            }

            const originalPosition = this.originalPositions.get(id);
            const dx = originalPosition.x - center.x;
            const dy = originalPosition.y - center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If the node is within the radius of the effect, apply the distortion
            if (distance < radius) {
                const angle = Math.atan2(dy, dx);
                const r = distance / radius;
                const newDistance = Math.pow(r, strength) * radius;

                element.position.x = center.x + newDistance * Math.cos(angle);
                element.position.y = center.y + newDistance * Math.sin(angle);
            } else {
                // If the node is outside the radius, restore its original position
                element.position.copy(originalPosition);
            }
        });
    }

    /**
     * Restores the original positions of all nodes.
     * This is called when the fisheye effect is disabled or the manager is destroyed.
     */
    restorePositions() {
        if (this.originalPositions.size > 0) {
            this.sceneManager.elements.forEach((element, id) => {
                if (this.originalPositions.has(id)) {
                    element.position.copy(this.originalPositions.get(id));
                }
            });
            this.originalPositions.clear();
        }
    }

    /**
     * Cleans up the manager by restoring the original positions of the nodes.
     */
    destroy() {
        this.restorePositions();
    }
}

export default FisheyeManager;

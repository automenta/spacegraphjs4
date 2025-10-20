// src/node_types/createNode.js
import * as THREE from 'three';

/**
 * Base function for creating a node object.
 * Applies common properties like position, scale, and user data.
 * @param {object} element - The element data from the graph.
 * @param {THREE.Object3D} object - The Three.js object representing the node.
 * @returns {THREE.Object3D} The configured Three.js object.
 */
export function createNode(element, object) {
    object.userData = { ...element };

    // Set a default position. LayoutManager will override this.
    object.position.set(0, 0, 0);

    if (element.scale) {
        if (typeof element.scale === 'number') {
            object.scale.set(element.scale, element.scale, element.scale);
        } else {
            object.scale.set(element.scale.x, element.scale.y, element.scale.z);
        }
    }

    return object;
}

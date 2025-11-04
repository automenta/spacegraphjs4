import { MutableListContainer } from './MutableListContainer.js';

/**
 * A container that stacks its children on top of each other.
 * This is analogous to the Stacking.java class.
 */
export class Stacking extends MutableListContainer {
    constructor(children = []) {
        super(children);
    }

    /**
     * Lays out the children by setting their positions to the container's bounds.
     * @param {number} dtS - The delta time in seconds.
     */
    doLayout(dtS) {
        for (const child of this.children) {
            child.bounds = { ...this.bounds };
        }
    }
}

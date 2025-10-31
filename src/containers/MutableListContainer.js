import { ContainerSurface } from './ContainerSurface.js';

/**
 * A container that holds a mutable list of children.
 * This is analogous to the MutableListContainer.java class.
 */
export class MutableListContainer extends ContainerSurface {
    constructor(children = []) {
        super();
        this.children = [];
        if (children.length > 0) {
            this.set(children);
        }
    }

    /**
     * Adds a child to the container.
     * @param {Surface} child - The child to add.
     */
    addChild(child) {
        this.children.push(child);
        child.parent = this;
        this.needsLayout = true;
    }

    /**
     * Removes a child from the container.
     * @param {Surface} child - The child to remove.
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            this.needsLayout = true;
        }
    }

    /**
     * Sets the children of the container.
     * @param {Surface[]} children - The new children.
     */
    set(children) {
        this.clear();
        for (const child of children) {
            this.addChild(child);
        }
    }

    /**
     * Clears all children from the container.
     */
    clear() {
        for (const child of this.children) {
            child.parent = null;
        }
        this.children = [];
        this.needsLayout = true;
    }

    /**
     * Returns true if the container has no children.
     * @returns {boolean} - True if the container is empty, false otherwise.
     */
    isEmpty() {
        return this.children.length === 0;
    }

    /**
     * Lays out the children of the container.
     * This method should be overridden by subclasses.
     * @param {number} dtS - The delta time in seconds.
     */
    doLayout(dtS) {
        // To be implemented by subclasses
    }

    /**
     * Updates the container and its children.
     * @param {number} dtS - The delta time in seconds.
     */
    update(dtS) {
        if (this.needsLayout) {
            this.doLayout(dtS);
            this.needsLayout = false;
        }

        for (const child of this.children) {
            child.update(dtS);
        }
    }
}

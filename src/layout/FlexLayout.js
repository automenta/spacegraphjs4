import { ContainerSurface } from '../ContainerSurface.js';

/**
 * FlexLayout implements a flexible box layout similar to CSS Flexbox
 */
export class FlexLayout extends ContainerSurface {
    /**
     * Creates a new FlexLayout container
     * @param {object} bounds - The bounds of the container { width, height }
     * @param {object} options - Layout options
     */
    constructor(bounds = { width: 1, height: 1 }, options = {}) {
        super(bounds);
        this.layoutType = 'flex';
        this.layoutOptions = {
            direction: options.direction || 'row', // 'row' or 'column'
            justifyContent: options.justifyContent || 'flex-start', // 'flex-start', 'center', 'flex-end', 'space-between', 'space-around'
            alignItems: options.alignItems || 'stretch', // 'flex-start', 'center', 'flex-end', 'stretch'
            wrap: options.wrap || 'nowrap', // 'nowrap', 'wrap'
            ...options
        };
    }

    /**
     * Sets flex layout options
     * @param {object} options - Layout options
     */
    setFlexOptions(options) {
        this.layoutOptions = { ...this.layoutOptions, ...options };
        this.markLayoutDirty();
    }

    /**
     * Adds a child with flex properties
     * @param {Surface} child - The child surface to add
     * @param {object} flexProps - Flex properties for this child
     */
    add(child, flexProps = {}) {
        super.addChild(child, { flex: flexProps });
    }

    /**
     * Applies flex layout to children
     */
    applyFlexLayout() {
        // Use the flex layout implementation from ContainerSurface
        super.applyFlexLayout();
    }

    /**
     * Updates the layout of child surfaces
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateLayout(deltaTime) {
        if (!this.layoutDirty) return;

        this.applyFlexLayout();
        this.layoutDirty = false;
        
        // Update children layouts
        for (const child of this.children) {
            if (child instanceof ContainerSurface) {
                child.updateLayout(deltaTime);
            }
        }
    }
}
import { ContainerSurface } from '../ContainerSurface.js';

/**
 * BorderLayout arranges children in five regions: North, South, East, West, and Center
 */
export class BorderLayout extends ContainerSurface {
    /**
     * Creates a new BorderLayout container
     * @param {object} bounds - The bounds of the container { width, height }
     */
    constructor(bounds = { width: 1, height: 1 }) {
        super(bounds);
        this.layoutType = 'border';
        this.regionPadding = 5; // Default padding between regions
    }

    /**
     * Adds a child to a specific region
     * @param {Surface} child - The child surface to add
     * @param {string} region - The region ('north', 'south', 'east', 'west', 'center')
     */
    add(child, region) {
        super.addChild(child, { region: region.toLowerCase() });
    }

    /**
     * Applies border layout to children
     */
    applyBorderLayout() {
        const paddingLeft = this.padding.left;
        const paddingRight = this.padding.right;
        const paddingTop = this.padding.top;
        const paddingBottom = this.padding.bottom;
        
        const availableWidth = this.bounds.width - paddingLeft - paddingRight;
        const availableHeight = this.bounds.height - paddingTop - paddingBottom;
        
        let northHeight = 0;
        let southHeight = 0;
        let westWidth = 0;
        let eastWidth = 0;
        
        // First pass: Calculate sizes of border regions
        for (const child of this.children) {
            const constraints = child.layoutConstraints || {};
            const region = constraints.region;
            
            if (!region) continue;
            
            switch (region) {
                case 'north':
                    northHeight = child.bounds.height || northHeight;
                    break;
                case 'south':
                    southHeight = child.bounds.height || southHeight;
                    break;
                case 'west':
                    westWidth = child.bounds.width || westWidth;
                    break;
                case 'east':
                    eastWidth = child.bounds.width || eastWidth;
                    break;
            }
        }
        
        // Second pass: Position children
        for (const child of this.children) {
            const constraints = child.layoutConstraints || {};
            const region = constraints.region;
            
            if (!region) continue;
            
            switch (region) {
                case 'north':
                    child.position.x = paddingLeft;
                    child.position.y = paddingTop;
                    // Set width to available width
                    if (child.setBounds) {
                        child.setBounds({ width: availableWidth, height: northHeight });
                    }
                    break;
                case 'south':
                    child.position.x = paddingLeft;
                    child.position.y = paddingTop + availableHeight - southHeight;
                    // Set width to available width
                    if (child.setBounds) {
                        child.setBounds({ width: availableWidth, height: southHeight });
                    }
                    break;
                case 'west':
                    child.position.x = paddingLeft;
                    child.position.y = paddingTop + northHeight;
                    // Set height to available height minus borders
                    if (child.setBounds) {
                        child.setBounds({ 
                            width: westWidth,
                            height: availableHeight - northHeight - southHeight
                        });
                    }
                    break;
                case 'east':
                    child.position.x = paddingLeft + availableWidth - eastWidth;
                    child.position.y = paddingTop + northHeight;
                    // Set height to available height minus borders
                    if (child.setBounds) {
                        child.setBounds({ 
                            width: eastWidth,
                            height: availableHeight - northHeight - southHeight
                        });
                    }
                    break;
                case 'center':
                    child.position.x = paddingLeft + westWidth + this.regionPadding;
                    child.position.y = paddingTop + northHeight + this.regionPadding;
                    // Set size to remaining space
                    if (child.setBounds) {
                        child.setBounds({ 
                            width: availableWidth - westWidth - eastWidth - 2 * this.regionPadding,
                            height: availableHeight - northHeight - southHeight - 2 * this.regionPadding
                        });
                    }
                    break;
            }
        }
    }

    /**
     * Updates the layout of child surfaces
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateLayout(deltaTime) {
        if (!this.layoutDirty) return;

        this.applyBorderLayout();
        this.layoutDirty = false;
        
        // Update children layouts
        for (const child of this.children) {
            if (child instanceof ContainerSurface) {
                child.updateLayout(deltaTime);
            }
        }
    }
}
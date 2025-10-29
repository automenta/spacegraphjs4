/**
 * Layout utility functions for calculating preferred sizes, alignment, and spacing
 */
export class LayoutUtils {
    /**
     * Calculates the preferred size of a surface based on its content
     * @param {Surface} surface - The surface to calculate size for
     * @returns {object} The preferred size {x, y}
     */
    static calculatePreferredSize(surface) {
        // For simple surfaces, return their current bounds
        if (surface.bounds) {
            return { ...surface.bounds };
        }
        
        // For container surfaces, calculate based on children
        if (surface.children && surface.children.length > 0) {
            let maxWidth = 0;
            let maxHeight = 0;
            
            for (const child of surface.children) {
                const childSize = this.calculatePreferredSize(child);
                maxWidth = Math.max(maxWidth, child.position.x + childSize.x);
                maxHeight = Math.max(maxHeight, child.position.y + childSize.y);
            }
            
            return { x: maxWidth, y: maxHeight };
        }
        
        // Default size
        return { x: 100, y: 100 };
    }

    /**
     * Centers a surface within a container
     * @param {Surface} surface - The surface to center
     * @param {object} containerBounds - The container bounds {x, y}
     */
    static center(surface, containerBounds) {
        if (!surface.setBounds) return;
        
        const surfaceSize = this.calculatePreferredSize(surface);
        surface.position.x = (containerBounds.x - surfaceSize.x) / 2;
        surface.position.y = (containerBounds.y - surfaceSize.y) / 2;
    }

    /**
     * Aligns a surface to the left within a container
     * @param {Surface} surface - The surface to align
     * @param {object} containerBounds - The container bounds {x, y}
     * @param {number} padding - Padding from the left edge
     */
    static alignLeft(surface, containerBounds, padding = 0) {
        surface.position.x = padding;
    }

    /**
     * Aligns a surface to the right within a container
     * @param {Surface} surface - The surface to align
     * @param {object} containerBounds - The container bounds {x, y}
     * @param {number} padding - Padding from the right edge
     */
    static alignRight(surface, containerBounds, padding = 0) {
        const surfaceSize = this.calculatePreferredSize(surface);
        surface.position.x = containerBounds.x - surfaceSize.x - padding;
    }

    /**
     * Aligns a surface to the top within a container
     * @param {Surface} surface - The surface to align
     * @param {object} containerBounds - The container bounds {x, y}
     * @param {number} padding - Padding from the top edge
     */
    static alignTop(surface, containerBounds, padding = 0) {
        surface.position.y = padding;
    }

    /**
     * Aligns a surface to the bottom within a container
     * @param {Surface} surface - The surface to align
     * @param {object} containerBounds - The container bounds {x, y}
     * @param {number} padding - Padding from the bottom edge
     */
    static alignBottom(surface, containerBounds, padding = 0) {
        const surfaceSize = this.calculatePreferredSize(surface);
        surface.position.y = containerBounds.y - surfaceSize.y - padding;
    }

    /**
     * Distributes surfaces evenly along the x-axis
     * @param {Surface[]} surfaces - The surfaces to distribute
     * @param {object} containerBounds - The container bounds {x, y}
     * @param {number} spacing - Spacing between surfaces
     */
    static distributeHorizontally(surfaces, containerBounds, spacing = 0) {
        if (surfaces.length === 0) return;
        
        // Calculate total width of all surfaces
        let totalWidth = 0;
        const surfaceSizes = [];
        
        for (const surface of surfaces) {
            const size = this.calculatePreferredSize(surface);
            surfaceSizes.push(size);
            totalWidth += size.x;
        }
        
        // Add spacing
        totalWidth += (surfaces.length - 1) * spacing;
        
        // Calculate starting position to center the group
        let currentX = (containerBounds.x - totalWidth) / 2;
        
        // Position each surface
        for (let i = 0; i < surfaces.length; i++) {
            surfaces[i].position.x = currentX;
            currentX += surfaceSizes[i].x + spacing;
        }
    }

    /**
     * Distributes surfaces evenly along the y-axis
     * @param {Surface[]} surfaces - The surfaces to distribute
     * @param {object} containerBounds - The container bounds {x, y}
     * @param {number} spacing - Spacing between surfaces
     */
    static distributeVertically(surfaces, containerBounds, spacing = 0) {
        if (surfaces.length === 0) return;
        
        // Calculate total height of all surfaces
        let totalHeight = 0;
        const surfaceSizes = [];
        
        for (const surface of surfaces) {
            const size = this.calculatePreferredSize(surface);
            surfaceSizes.push(size);
            totalHeight += size.y;
        }
        
        // Add spacing
        totalHeight += (surfaces.length - 1) * spacing;
        
        // Calculate starting position to center the group
        let currentY = (containerBounds.y - totalHeight) / 2;
        
        // Position each surface
        for (let i = 0; i < surfaces.length; i++) {
            surfaces[i].position.y = currentY;
            currentY += surfaceSizes[i].y + spacing;
        }
    }

    /**
     * Applies padding to a container's bounds
     * @param {object} bounds - The original bounds {x, y}
     * @param {object} padding - The padding {top, right, bottom, left}
     * @returns {object} The padded bounds {x, y, width, height}
     */
    static applyPadding(bounds, padding) {
        return {
            x: padding.left,
            y: padding.top,
            width: bounds.x - padding.left - padding.right,
            height: bounds.y - padding.top - padding.bottom
        };
    }

    /**
     * Creates uniform spacing between surfaces
     * @param {Surface[]} surfaces - The surfaces to space
     * @param {number} spacing - The spacing amount
     * @param {string} direction - The direction ('horizontal' or 'vertical')
     */
    static applySpacing(surfaces, spacing, direction = 'horizontal') {
        if (surfaces.length <= 1) return;
        
        for (let i = 1; i < surfaces.length; i++) {
            const prevSurface = surfaces[i - 1];
            const currentSurface = surfaces[i];
            const prevSize = this.calculatePreferredSize(prevSurface);
            
            if (direction === 'horizontal') {
                currentSurface.position.x = prevSurface.position.x + prevSize.x + spacing;
            } else {
                currentSurface.position.y = prevSurface.position.y + prevSize.y + spacing;
            }
        }
    }
}
import { ContainerSurface } from '../ContainerSurface.js';

/**
 * GridLayout arranges children in a grid with rows and columns
 */
export class GridLayout extends ContainerSurface {
    /**
     * Creates a new GridLayout container
     * @param {object} bounds - The bounds of the container {x, y}
     * @param {number} rows - Number of rows
     * @param {number} cols - Number of columns
     */
    constructor(bounds = { x: 1, y: 1 }, rows = 1, cols = 1) {
        super(bounds);
        this.layoutType = 'grid';
        this.rows = rows;
        this.cols = cols;
        this.rowSpacing = 5; // Default spacing between rows
        this.colSpacing = 5; // Default spacing between columns
    }

    /**
     * Sets the grid dimensions
     * @param {number} rows - Number of rows
     * @param {number} cols - Number of columns
     */
    setGridDimensions(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.markLayoutDirty();
    }

    /**
     * Sets the spacing between grid cells
     * @param {number} rowSpacing - Spacing between rows
     * @param {number} colSpacing - Spacing between columns
     */
    setSpacing(rowSpacing, colSpacing) {
        this.rowSpacing = rowSpacing;
        this.colSpacing = colSpacing;
        this.markLayoutDirty();
    }

    /**
     * Applies grid layout to children
     */
    applyGridLayout() {
        const paddingLeft = this.padding.left;
        const paddingRight = this.padding.right;
        const paddingTop = this.padding.top;
        const paddingBottom = this.padding.bottom;
        
        const availableWidth = this.bounds.x - paddingLeft - paddingRight;
        const availableHeight = this.bounds.y - paddingTop - paddingBottom;
        
        // Calculate cell dimensions
        const cellWidth = (availableWidth - (this.cols - 1) * this.colSpacing) / this.cols;
        const cellHeight = (availableHeight - (this.rows - 1) * this.rowSpacing) / this.rows;
        
        // Position children in grid
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            const row = Math.floor(i / this.cols);
            const col = i % this.cols;
            
            // Check if we're within grid bounds
            if (row >= this.rows) break;
            
            // Position child
            child.position.x = paddingLeft + col * (cellWidth + this.colSpacing);
            child.position.y = paddingTop + row * (cellHeight + this.rowSpacing);
            
            // Set child bounds to cell size
            if (child.setBounds) {
                child.setBounds({ x: cellWidth, y: cellHeight });
            }
        }
    }

    /**
     * Updates the layout of child surfaces
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateLayout(deltaTime) {
        if (!this.layoutDirty) return;

        this.applyGridLayout();
        this.layoutDirty = false;
        
        // Update children layouts
        for (const child of this.children) {
            if (child instanceof ContainerSurface) {
                child.updateLayout(deltaTime);
            }
        }
    }
}
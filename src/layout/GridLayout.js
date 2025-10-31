import { ContainerSurface } from '../ContainerSurface.js';

/**
 * GridLayout arranges children in a grid with customizable rows and columns.
 */
export class GridLayout extends ContainerSurface {
    constructor(bounds, rows = 1, cols = 1) {
        super(bounds);
        this.rows = rows;
        this.cols = cols;
        this.spacing = { row: 0, col: 0 };
    }

    setSpacing(rowSpacing, colSpacing) {
        this.spacing = { row: rowSpacing, col: colSpacing };
        this.markLayoutDirty();
    }

    updateLayout() {
        if (!this.layoutDirty) return;

        const cellWidth = (this.bounds.width - (this.cols - 1) * this.spacing.col) / this.cols;
        const cellHeight = (this.bounds.height - (this.rows - 1) * this.spacing.row) / this.rows;

        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            const row = Math.floor(i / this.cols);
            const col = i % this.cols;

            child.position.x = col * (cellWidth + this.spacing.col);
            child.position.y = row * (cellHeight + this.spacing.row);
            child.setBounds({ width: cellWidth, height: cellHeight });
        }

        this.layoutDirty = false;
    }
}

import { ContainerSurface } from '../ContainerSurface.js';

/**
 * BorderLayout arranges children in five regions: North, South, East, West, and Center.
 */
export class BorderLayout extends ContainerSurface {
    constructor(bounds) {
        super(bounds);
        this.regions = {
            north: null,
            south: null,
            east: null,
            west: null,
            center: null,
        };
    }

    /**
     * Adds a child surface to a specific region.
     * @param {Surface} child - The child surface to add.
     * @param {string} region - The region to add the child to ('north', 'south', 'east', 'west', 'center').
     */
    add(child, region) {
        if (this.regions[region]) {
            // Remove the existing child from the region
            this.removeChild(this.regions[region]);
        }
        this.regions[region] = child;
        this.addChild(child);
        this.markLayoutDirty();
    }

    updateLayout() {
        if (!this.layoutDirty) return;

        const { north, south, east, west, center } = this.regions;
        let top = 0;
        let bottom = this.bounds.height;
        let left = 0;
        let right = this.bounds.width;

        if (north) {
            north.position.x = 0;
            north.position.y = 0;
            north.setBounds({ width: this.bounds.width, height: north.bounds.height });
            top += north.bounds.height;
        }

        if (south) {
            south.position.x = 0;
            south.position.y = this.bounds.height - south.bounds.height;
            south.setBounds({ width: this.bounds.width, height: south.bounds.height });
            bottom -= south.bounds.height;
        }

        if (west) {
            west.position.x = 0;
            west.position.y = top;
            west.setBounds({ width: west.bounds.width, height: bottom - top });
            left += west.bounds.width;
        }

        if (east) {
            east.position.x = this.bounds.width - east.bounds.width;
            east.position.y = top;
            east.setBounds({ width: east.bounds.width, height: bottom - top });
            right -= east.bounds.width;
        }

        if (center) {
            center.position.x = left;
            center.position.y = top;
            center.setBounds({ width: right - left, height: bottom - top });
        }

        this.layoutDirty = false;
    }
}

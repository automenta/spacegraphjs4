import { ContainerSurface } from '../ContainerSurface.js';

/**
 * Scrollable container for large content
 */
export class ScrollableContainer extends ContainerSurface {
    /**
     * Creates a new ScrollableContainer
     * @param {object} bounds - The bounds of the container {x, y}
     */
    constructor(bounds = { x: 200, y: 200 }) {
        super(bounds);
        this.contentBounds = { x: bounds.x, y: bounds.y }; // Size of content
        this.scrollX = 0; // Horizontal scroll position
        this.scrollY = 0; // Vertical scroll position
        this.dragging = false;
        this.lastDragPosition = { x: 0, y: 0 };
        
        // Create scrollbars
        this.showScrollbars = true;
        this.scrollbarSize = 10;
        this.verticalScrollbar = null;
        this.horizontalScrollbar = null;
        
        this.createScrollbars();
        
        // Add event listeners
        this.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.addEventListener('pointermove', this.onPointerMove.bind(this));
        this.addEventListener('pointerup', this.onPointerUp.bind(this));
        this.addEventListener('wheel', this.onWheel.bind(this));
    }

    /**
     * Creates scrollbar visuals
     */
    createScrollbars() {
        // Create vertical scrollbar
        this.verticalScrollbar = new THREE.Mesh(
            new THREE.PlaneGeometry(this.scrollbarSize, 50),
            new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.7 })
        );
        this.verticalScrollbar.position.set(
            this.bounds.x - this.scrollbarSize / 2,
            this.bounds.y / 2,
            1
        );
        this.verticalScrollbar.visible = false;
        
        // Create horizontal scrollbar
        this.horizontalScrollbar = new THREE.Mesh(
            new THREE.PlaneGeometry(50, this.scrollbarSize),
            new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.7 })
        );
        this.horizontalScrollbar.position.set(
            this.bounds.x / 2,
            this.scrollbarSize / 2,
            1
        );
        this.horizontalScrollbar.visible = false;
    }

    /**
     * Sets the content size
     * @param {object} size - The content size {x, y}
     */
    setContentSize(size) {
        this.contentBounds = { ...size };
        this.updateScrollbars();
    }

    /**
     * Updates scrollbar positions and visibility
     */
    updateScrollbars() {
        if (!this.showScrollbars) return;
        
        // Update vertical scrollbar
        const verticalOverflow = this.contentBounds.y - this.bounds.y;
        if (verticalOverflow > 0) {
            const scrollbarHeight = Math.max(20, (this.bounds.y / this.contentBounds.y) * this.bounds.y);
            const scrollbarRatio = this.scrollY / verticalOverflow;
            const scrollbarY = this.bounds.y - (scrollbarRatio * (this.bounds.y - scrollbarHeight)) - scrollbarHeight / 2;
            
            this.verticalScrollbar.scale.y = scrollbarHeight / 50;
            this.verticalScrollbar.position.y = scrollbarY;
            this.verticalScrollbar.visible = true;
        } else {
            this.verticalScrollbar.visible = false;
        }
        
        // Update horizontal scrollbar
        const horizontalOverflow = this.contentBounds.x - this.bounds.x;
        if (horizontalOverflow > 0) {
            const scrollbarWidth = Math.max(20, (this.bounds.x / this.contentBounds.x) * this.bounds.x);
            const scrollbarRatio = this.scrollX / horizontalOverflow;
            const scrollbarX = scrollbarRatio * (this.bounds.x - scrollbarWidth) + scrollbarWidth / 2;
            
            this.horizontalScrollbar.scale.x = scrollbarWidth / 50;
            this.horizontalScrollbar.position.x = scrollbarX;
            this.horizontalScrollbar.visible = true;
        } else {
            this.horizontalScrollbar.visible = false;
        }
    }

    /**
     * Scrolls to a specific position
     * @param {number} x - Horizontal scroll position
     * @param {number} y - Vertical scroll position
     */
    scrollTo(x, y) {
        const maxX = Math.max(0, this.contentBounds.x - this.bounds.x);
        const maxY = Math.max(0, this.contentBounds.y - this.bounds.y);
        
        this.scrollX = Math.max(0, Math.min(maxX, x));
        this.scrollY = Math.max(0, Math.min(maxY, y));
        
        // Update children positions
        for (const child of this.children) {
            child.position.x = child.originalPosition ? child.originalPosition.x - this.scrollX : -this.scrollX;
            child.position.y = child.originalPosition ? child.originalPosition.y - this.scrollY : -this.scrollY;
        }
        
        this.updateScrollbars();
    }

    /**
     * Scrolls by a relative amount
     * @param {number} deltaX - Horizontal scroll delta
     * @param {number} deltaY - Vertical scroll delta
     */
    scrollBy(deltaX, deltaY) {
        this.scrollTo(this.scrollX + deltaX, this.scrollY + deltaY);
    }

    /**
     * Handles pointer down events
     * @param {Event} event - The pointer event
     */
    onPointerDown(event) {
        this.dragging = true;
        this.lastDragPosition.x = event.data.x;
        this.lastDragPosition.y = event.data.y;
        
        // Prevent event propagation
        event.stopPropagation = true;
    }

    /**
     * Handles pointer move events
     * @param {Event} event - The pointer event
     */
    onPointerMove(event) {
        if (!this.dragging) return;
        
        const deltaX = event.data.x - this.lastDragPosition.x;
        const deltaY = event.data.y - this.lastDragPosition.y;
        
        this.scrollBy(-deltaX, -deltaY);
        
        this.lastDragPosition.x = event.data.x;
        this.lastDragPosition.y = event.data.y;
        
        // Prevent event propagation
        event.stopPropagation = true;
    }

    /**
     * Handles pointer up events
     * @param {Event} event - The pointer event
     */
    onPointerUp(event) {
        this.dragging = false;
        
        // Prevent event propagation
        event.stopPropagation = true;
    }

    /**
     * Handles wheel events for scrolling
     * @param {Event} event - The wheel event
     */
    onWheel(event) {
        const delta = event.data.deltaY * 20; // Scale factor for scroll speed
        this.scrollBy(0, delta);
        
        // Prevent event propagation
        event.stopPropagation = true;
    }

    /**
     * Adds a child surface to this container
     * @param {Surface} child - The child surface to add
     * @param {object} constraints - Layout constraints for this child
     */
    addChild(child, constraints = {}) {
        // Store original position
        child.originalPosition = { ...child.position };
        
        super.addChild(child, constraints);
        
        // Apply current scroll offset
        child.position.x = child.originalPosition.x - this.scrollX;
        child.position.y = child.originalPosition.y - this.scrollY;
    }

    /**
     * Updates the container and its children
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update scrollbars
        this.updateScrollbars();
        
        // Update children
        super.update(deltaTime);
    }

    /**
     * Renders the scrollable container
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
     * @param {THREE.Scene} scene - The scene to render to
     * @param {THREE.Camera} camera - The camera to render with
     */
    render(renderer, scene, camera) {
        if (!this.visible) return;
        
        // Calculate world transform
        this.calculateWorldTransform();
        
        // Add scrollbars to scene if visible
        if (this.verticalScrollbar.visible && !this.verticalScrollbar.parent) {
            scene.add(this.verticalScrollbar);
        }
        if (this.horizontalScrollbar.visible && !this.horizontalScrollbar.parent) {
            scene.add(this.horizontalScrollbar);
        }
        
        // Update scrollbar positions
        if (this.verticalScrollbar.parent) {
            this.verticalScrollbar.position.copy(this.worldPosition);
            this.verticalScrollbar.position.x += this.bounds.x - this.scrollbarSize / 2;
            this.verticalScrollbar.position.y += this.verticalScrollbar.position.y;
        }
        if (this.horizontalScrollbar.parent) {
            this.horizontalScrollbar.position.copy(this.worldPosition);
            this.horizontalScrollbar.position.x += this.horizontalScrollbar.position.x;
            this.horizontalScrollbar.position.y += this.scrollbarSize / 2;
        }
        
        // Render children with clipping
        for (const child of this.children) {
            // Simple clipping - only render if within bounds
            const childBounds = child.getWorldBounds();
            if (childBounds.x + childBounds.width > this.worldPosition.x &&
                childBounds.x < this.worldPosition.x + this.bounds.x &&
                childBounds.y + childBounds.height > this.worldPosition.y &&
                childBounds.y < this.worldPosition.y + this.bounds.y) {
                child.renderIfVisible(renderer, scene, camera);
            }
        }
    }
}
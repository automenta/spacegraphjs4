import { Surface } from './Surface.js';
import { VerletPhysics, VerletParticle, Vec2, SpringConstraint, DistanceConstraint, AngleConstraint } from './physics/VerletPhysics.js';

/**
 * ContainerSurface manages child surfaces with layout capabilities
 */
export class ContainerSurface extends Surface {
    /**
     * Creates a new ContainerSurface
     * @param {object} bounds - The bounds of the surface { width, height }
     */
    constructor(bounds = { width: 1, height: 1 }) {
        super(bounds);
        this.layoutDirty = true;
        this.layoutType = 'absolute'; // 'absolute', 'relative', 'flex'
        this.layoutOptions = {}; // Options for the current layout type
        this.padding = { top: 0, right: 0, bottom: 0, left: 0 };
        this.spacing = 0; // Default spacing between children
        
        // Physics properties
        this.physicsEnabled = false;
        this.verletPhysics = null;
        this.surfaceParticles = new Map(); // Map of surfaces to physics particles
        this.physicsConstraints = []; // Custom constraints for this container
    }

    /**
     * Adds a child surface to this container with optional layout constraints
     * @param {Surface} child - The child surface to add
     * @param {object} constraints - Layout constraints for this child
     */
    addChild(child, constraints = {}) {
        this.children.push(child);
        child.parent = this;
        child.layoutConstraints = constraints;
        this.markLayoutDirty();
        
        // If physics is enabled, bind the child to a physics particle
        if (this.physicsEnabled && this.verletPhysics) {
            this.bindSurfaceToPhysics(child);
        }
    }

    /**
     * Removes a child surface from this container
     * @param {Surface} child - The child surface to remove
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            this.markLayoutDirty();
            
            // If physics is enabled, unbind the child from physics
            if (this.physicsEnabled && this.verletPhysics) {
                this.unbindSurfaceFromPhysics(child);
            }
        }
    }

    /**
     * Marks the layout as dirty, requiring recalculation
     */
    markLayoutDirty() {
        this.layoutDirty = true;
        // Propagate to parent if exists
        if (this.parent) {
            this.parent.markLayoutDirty();
        }
    }

    /**
     * Updates the bounds of this container
     * @param {object} newBounds - The new bounds { width, height }
     */
    setBounds(newBounds) {
        super.setBounds(newBounds);
        this.markLayoutDirty();
        
        // Update physics boundaries if enabled
        if (this.physicsEnabled && this.verletPhysics && this.verletPhysics.bounds) {
            this.verletPhysics.setBounds(0, 0, newBounds.width, newBounds.height);
        }
    }

    /**
     * Enables physics for this container
     * @param {boolean} enabled - Whether physics is enabled
     * @param {object} options - Physics options
     */
    setPhysicsEnabled(enabled, options = {}) {
        this.physicsEnabled = enabled;
        
        if (enabled) {
            // Create physics engine if not exists
            if (!this.verletPhysics) {
                this.verletPhysics = new VerletPhysics(options.iterations || 3);
                
                // Set gravity if specified
                if (options.gravity) {
                    this.verletPhysics.setGravity(options.gravity.x || 0, options.gravity.y || 0);
                }
                
                // Set boundaries
                this.verletPhysics.setBounds(0, 0, this.bounds.width, this.bounds.height);
            }
            
            // Bind all existing children to physics
            for (const child of this.children) {
                this.bindSurfaceToPhysics(child);
            }
        } else {
            // Unbind all children from physics
            for (const child of this.children) {
                this.unbindSurfaceFromPhysics(child);
            }
            
            this.verletPhysics = null;
            this.surfaceParticles.clear();
            this.physicsConstraints = [];
        }
    }

    /**
     * Binds a surface to a physics particle
     * @param {Surface} surface - The surface to bind
     * @param {VerletParticle} particle - Optional particle to bind to
     */
    bindSurfaceToPhysics(surface, particle = null) {
        if (!this.physicsEnabled || !this.verletPhysics) return;
        
        // If no particle provided, create one at the surface's center
        if (!particle) {
            const centerX = surface.position.x + surface.bounds.width / 2;
            const centerY = surface.position.y + surface.bounds.height / 2;
            particle = new VerletParticle(centerX, centerY, surface.physicsMass || 1.0);
            particle.friction = surface.physicsFriction || 0.98;
        }
        
        // Add particle to physics engine
        this.verletPhysics.addParticle(particle);
        
        // Store mapping
        this.surfaceParticles.set(surface, particle);
        
        // Enable physics on the surface
        surface.setPhysicsEnabled(true, particle);
        
        return particle;
    }

    /**
     * Unbinds a surface from physics
     * @param {Surface} surface - The surface to unbind
     */
    unbindSurfaceFromPhysics(surface) {
        if (!this.physicsEnabled || !this.verletPhysics) return;
        
        const particle = this.surfaceParticles.get(surface);
        if (particle) {
            // Remove particle from physics engine
            this.verletPhysics.removeParticle(particle);
            
            // Remove mapping
            this.surfaceParticles.delete(surface);
            
            // Disable physics on the surface
            surface.setPhysicsEnabled(false);
        }
    }

    /**
     * Creates a spring constraint between two surfaces
     * @param {Surface} surfaceA - First surface
     * @param {Surface} surfaceB - Second surface
     * @param {number} restLength - Rest length of spring
     * @param {number} stiffness - Spring stiffness (0-1)
     * @returns {SpringConstraint} The created spring constraint
     */
    createSpringConstraint(surfaceA, surfaceB, restLength, stiffness = 0.5) {
        if (!this.physicsEnabled || !this.verletPhysics) return null;
        
        const particleA = this.surfaceParticles.get(surfaceA);
        const particleB = this.surfaceParticles.get(surfaceB);
        
        if (!particleA || !particleB) return null;
        
        const constraint = new SpringConstraint(particleA, particleB, restLength, stiffness);
        this.verletPhysics.addConstraint(constraint);
        this.physicsConstraints.push(constraint);
        
        return constraint;
    }

    /**
     * Creates a distance constraint between two surfaces
     * @param {Surface} surfaceA - First surface
     * @param {Surface} surfaceB - Second surface
     * @param {number} distance - Fixed distance between surfaces
     * @returns {DistanceConstraint} The created distance constraint
     */
    createDistanceConstraint(surfaceA, surfaceB, distance) {
        if (!this.physicsEnabled || !this.verletPhysics) return null;
        
        const particleA = this.surfaceParticles.get(surfaceA);
        const particleB = this.surfaceParticles.get(surfaceB);
        
        if (!particleA || !particleB) return null;
        
        const constraint = new DistanceConstraint(particleA, particleB, distance);
        this.verletPhysics.addConstraint(constraint);
        this.physicsConstraints.push(constraint);
        
        return constraint;
    }

    /**
     * Creates an angle constraint between three surfaces
     * @param {Surface} surfaceA - First surface
     * @param {Surface} surfaceB - Second surface (center)
     * @param {Surface} surfaceC - Third surface
     * @param {number} angle - Fixed angle in radians
     * @returns {AngleConstraint} The created angle constraint
     */
    createAngleConstraint(surfaceA, surfaceB, surfaceC, angle) {
        if (!this.physicsEnabled || !this.verletPhysics) return null;
        
        const particleA = this.surfaceParticles.get(surfaceA);
        const particleB = this.surfaceParticles.get(surfaceB);
        const particleC = this.surfaceParticles.get(surfaceC);
        
        if (!particleA || !particleB || !particleC) return null;
        
        const constraint = new AngleConstraint(particleA, particleB, particleC, angle);
        this.verletPhysics.addConstraint(constraint);
        this.physicsConstraints.push(constraint);
        
        return constraint;
    }

    /**
     * Applies a force to a surface
     * @param {Surface} surface - The surface to apply force to
     * @param {Vec2} force - The force vector
     */
    applyForceToSurface(surface, force) {
        if (!this.physicsEnabled) return;
        
        const particle = this.surfaceParticles.get(surface);
        if (particle) {
            particle.applyForce(force);
        }
    }

    /**
     * Updates the layout of child surfaces
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateLayout(deltaTime) {
        if (!this.layoutDirty) return;

        switch (this.layoutType) {
            case 'absolute':
                // Children are positioned absolutely, no layout changes needed
                break;
            case 'relative':
                this.applyRelativeLayout();
                break;
            case 'flex':
                this.applyFlexLayout();
                break;
        }

        this.layoutDirty = false;
        
        // Update children layouts
        for (const child of this.children) {
            if (child instanceof ContainerSurface) {
                child.updateLayout(deltaTime);
            }
        }
    }

    /**
     * Applies relative layout to children
     */
    applyRelativeLayout() {
        // In relative layout, children maintain their relative positions
        // based on their local bounds within the container
        for (const child of this.children) {
            // Ensure child position is within container bounds
            child.position.x = Math.max(0, Math.min(this.bounds.width - (child.bounds.width || 0), child.position.x));
            child.position.y = Math.max(0, Math.min(this.bounds.height - (child.bounds.height || 0), child.position.y));
        }
    }

    /**
     * Applies flex layout to children
     */
    applyFlexLayout() {
        // Apply flex layout based on flex direction
        const direction = this.layoutOptions.direction || 'row';
        const justifyContent = this.layoutOptions.justifyContent || 'flex-start';
        const alignItems = this.layoutOptions.alignItems || 'stretch';
        const wrap = this.layoutOptions.wrap || 'nowrap';
        
        if (direction === 'row') {
            this.applyFlexRowLayout(justifyContent, alignItems, wrap);
        } else {
            this.applyFlexColumnLayout(justifyContent, alignItems, wrap);
        }
    }
    
    /**
     * Applies flex row layout to children
     * @param {string} justifyContent - Justification option
     * @param {string} alignItems - Alignment option
     * @param {string} wrap - Wrap option
     */
    applyFlexRowLayout(justifyContent, alignItems, wrap) {
        const paddingLeft = this.padding.left;
        const paddingRight = this.padding.right;
        const paddingTop = this.padding.top;
        const paddingBottom = this.padding.bottom;
        const availableWidth = this.bounds.width - paddingLeft - paddingRight;
        const availableHeight = this.bounds.height - paddingTop - paddingBottom;
        
        let currentX = paddingLeft;
        let currentY = paddingTop;
        let lineHeight = 0;
        
        for (const child of this.children) {
            const childWidth = child.bounds.width || 0;
            const childHeight = child.bounds.height || 0;
            
            // Handle wrapping
            if (wrap === 'wrap' && currentX + childWidth > availableWidth && currentX > paddingLeft) {
                // Move to next line
                currentX = paddingLeft;
                currentY += lineHeight + this.spacing;
                lineHeight = 0;
            }
            
            // Position child
            child.position.x = currentX;
            child.position.y = currentY;
            
            // Apply alignment
            switch (alignItems) {
                case 'flex-start':
                    // Already at top
                    break;
                case 'center':
                    child.position.y = currentY + (availableHeight - childHeight) / 2;
                    break;
                case 'flex-end':
                    child.position.y = currentY + availableHeight - childHeight;
                    break;
                case 'stretch':
                    child.position.y = currentY;
                    // In a real implementation, we would resize the child
                    break;
            }
            
            currentX += childWidth + this.spacing;
            lineHeight = Math.max(lineHeight, childHeight);
        }
        
        // Apply justification for single line
        if (wrap === 'nowrap' && justifyContent !== 'flex-start') {
            this.applyJustifyContent(justifyContent, availableWidth, currentX - this.spacing);
        }
    }
    
    /**
     * Applies flex column layout to children
     * @param {string} justifyContent - Justification option
     * @param {string} alignItems - Alignment option
     * @param {string} wrap - Wrap option
     */
    applyFlexColumnLayout(justifyContent, alignItems, wrap) {
        const paddingLeft = this.padding.left;
        const paddingRight = this.padding.right;
        const paddingTop = this.padding.top;
        const paddingBottom = this.padding.bottom;
        const availableWidth = this.bounds.width - paddingLeft - paddingRight;
        const availableHeight = this.bounds.height - paddingTop - paddingBottom;
        
        let currentX = paddingLeft;
        let currentY = paddingTop;
        let lineWidth = 0;
        
        for (const child of this.children) {
            const childWidth = child.bounds.width || 0;
            const childHeight = child.bounds.height || 0;
            
            // Handle wrapping (column wrap)
            if (wrap === 'wrap' && currentY + childHeight > availableHeight && currentY > paddingTop) {
                // Move to next column
                currentY = paddingTop;
                currentX += lineWidth + this.spacing;
                lineWidth = 0;
            }
            
            // Position child
            child.position.x = currentX;
            child.position.y = currentY;
            
            // Apply alignment
            switch (alignItems) {
                case 'flex-start':
                    // Already at left
                    break;
                case 'center':
                    child.position.x = currentX + (availableWidth - childWidth) / 2;
                    break;
                case 'flex-end':
                    child.position.x = currentX + availableWidth - childWidth;
                    break;
                case 'stretch':
                    child.position.x = currentX;
                    // In a real implementation, we would resize the child
                    break;
            }
            
            currentY += childHeight + this.spacing;
            lineWidth = Math.max(lineWidth, childWidth);
        }
        
        // Apply justification for single column
        if (wrap === 'nowrap' && justifyContent !== 'flex-start') {
            this.applyJustifyContentVertical(justifyContent, availableHeight, currentY - this.spacing);
        }
    }
    
    /**
     * Applies horizontal justification to children
     * @param {string} justifyContent - Justification option
     * @param {number} availableWidth - Available width
     * @param {number} contentWidth - Actual content width
     */
    applyJustifyContent(justifyContent, availableWidth, contentWidth) {
        const excessSpace = availableWidth - contentWidth;
        if (excessSpace <= 0) return;
        
        let offset = 0;
        switch (justifyContent) {
            case 'center':
                offset = excessSpace / 2;
                break;
            case 'flex-end':
                offset = excessSpace;
                break;
            case 'space-between':
                // Distribute space between children
                if (this.children.length > 1) {
                    const gap = excessSpace / (this.children.length - 1);
                    for (let i = 1; i < this.children.length; i++) {
                        this.children[i].position.x += i * gap;
                    }
                }
                return;
            case 'space-around':
                // Distribute space around children
                const gap = excessSpace / (this.children.length * 2);
                for (let i = 0; i < this.children.length; i++) {
                    this.children[i].position.x += (i * 2 + 1) * gap;
                }
                return;
        }
        
        // Apply offset to all children
        for (const child of this.children) {
            child.position.x += offset;
        }
    }
    
    /**
     * Applies vertical justification to children
     * @param {string} justifyContent - Justification option
     * @param {number} availableHeight - Available height
     * @param {number} contentHeight - Actual content height
     */
    applyJustifyContentVertical(justifyContent, availableHeight, contentHeight) {
        const excessSpace = availableHeight - contentHeight;
        if (excessSpace <= 0) return;
        
        let offset = 0;
        switch (justifyContent) {
            case 'center':
                offset = excessSpace / 2;
                break;
            case 'flex-end':
                offset = excessSpace;
                break;
            case 'space-between':
                // Distribute space between children
                if (this.children.length > 1) {
                    const gap = excessSpace / (this.children.length - 1);
                    for (let i = 1; i < this.children.length; i++) {
                        this.children[i].position.y += i * gap;
                    }
                }
                return;
            case 'space-around':
                // Distribute space around children
                const gap = excessSpace / (this.children.length * 2);
                for (let i = 0; i < this.children.length; i++) {
                    this.children[i].position.y += (i * 2 + 1) * gap;
                }
                return;
        }
        
        // Apply offset to all children
        for (const child of this.children) {
            child.position.y += offset;
        }
    }

    /**
     * Applies vertical box layout to children
     */
    applyVBoxLayout() {
        let totalHeight = 0;
        const fixedChildren = [];
        const flexibleChildren = [];

        // Separate fixed and flexible children
        for (const child of this.children) {
            if (child.bounds.height > 0) {
                fixedChildren.push(child);
                totalHeight += child.bounds.height;
            } else {
                flexibleChildren.push(child);
            }
        }

        // Calculate space for flexible children
        const remainingSpace = Math.max(0, this.bounds.height - totalHeight);
        const flexibleHeight = flexibleChildren.length > 0 ? remainingSpace / flexibleChildren.length : 0;

        // Position children
        let currentY = 0;
        for (const child of this.children) {
            child.position.x = 0;
            child.position.y = currentY;
            
            const childHeight = child.bounds.height > 0 ? child.bounds.height : flexibleHeight;
            currentY += childHeight;
        }
    }

    /**
     * Updates the container and its children
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update physics if enabled
        if (this.physicsEnabled && this.verletPhysics) {
            // Update physics simulation
            this.verletPhysics.update(deltaTime);
            
            // Sync surface positions with physics particles
            for (const [surface, particle] of this.surfaceParticles) {
                if (!particle.deleted) {
                    // Update surface position based on particle position
                    if (surface.physicsBinding === 'center') {
                        surface.position.x = particle.position.x - surface.bounds.width / 2;
                        surface.position.y = particle.position.y - surface.bounds.height / 2;
                    } else {
                        // For nearest edge binding, we would implement more complex logic
                        surface.position.x = particle.position.x - surface.bounds.width / 2;
                        surface.position.y = particle.position.y - surface.bounds.height / 2;
                    }
                    
                    // Mark surface transform as dirty
                    surface.markWorldTransformDirty();
                }
            }
        }
        
        this.updateLayout(deltaTime);
    }

    /**
     * Renders the container and its children
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
     * @param {THREE.Scene} scene - The scene to render to
     * @param {THREE.Camera} camera - The camera to render with
     */
    render(resurface) {
        // Render children
        for (const child of this.children) {
            child.renderIfVisible(resurface);
        }
    }
}
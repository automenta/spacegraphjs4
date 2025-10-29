/**
 * Base class for all surfaces in the scene graph
 */
export class Surface {
    /**
     * Creates a new Surface
     * @param {THREE.Vector2} bounds - The bounds of the surface (width, height)
     */
    constructor(bounds = { x: 1, y: 1 }) {
        this.bounds = bounds;
        this.parent = null;
        this.children = [];
        this.visible = true;
        this.clipBounds = true;
        this.position = new THREE.Vector3(0, 0, 0);
        this.worldPosition = new THREE.Vector3(0, 0, 0);
        this.worldTransformDirty = true;
        this.boundsDirty = true;
        this.eventListeners = {};
        this.hitTestEnabled = true; // Whether this surface can receive pointer events
        
        // Physics properties
        this.physicsEnabled = false;
        this.physicsParticle = null;
        this.physicsBinding = 'center'; // 'center', 'nearestEdge'
        this.physicsMass = 1.0;
        this.physicsFriction = 0.98;
    }

    /**
     * Adds a child surface to this surface
     * @param {Surface} child - The child surface to add
     */
    addChild(child) {
        this.children.push(child);
        child.parent = this;
        child.markWorldTransformDirty();
    }

    /**
     * Removes a child surface from this surface
     * @param {Surface} child - The child surface to remove
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            child.markWorldTransformDirty();
        }
    }

    /**
     * Marks the world transform as dirty, requiring recalculation
     */
    markWorldTransformDirty() {
        this.worldTransformDirty = true;
        // Propagate to children
        for (const child of this.children) {
            child.markWorldTransformDirty();
        }
    }

    /**
     * Marks the bounds as dirty and propagates to parent
     */
    markBoundsDirty() {
        // Mark this surface's bounds as dirty
        this.boundsDirty = true;
        
        // Propagate to parent if exists
        if (this.parent) {
            this.parent.markBoundsDirty();
        }
    }

    /**
     * Updates the bounds of this surface
     * @param {object} newBounds - The new bounds {x, y}
     */
    setBounds(newBounds) {
        this.bounds = newBounds;
        this.markBoundsDirty();
        this.markWorldTransformDirty();
        
        // Update physics particle if enabled
        if (this.physicsEnabled && this.physicsParticle) {
            this.physicsParticle.mass = this.physicsMass;
            this.physicsParticle.radius = Math.sqrt(this.physicsMass) * 0.5;
        }
    }

    /**
     * Calculates the world transform for this surface
     */
    calculateWorldTransform() {
        if (!this.worldTransformDirty) return;

        if (this.parent) {
            // Inherit parent's transform
            this.worldPosition = this.parent.worldPosition.clone().add(this.position);
        } else {
            // No parent, world position is local position
            this.worldPosition = this.position.clone();
        }

        this.worldTransformDirty = false;
    }

    /**
     * Starts the surface (attaches to parent)
     * @param {Surface} parent - The parent surface
     */
    start(parent) {
        this.parent = parent;
        if (parent) {
            parent.addChild(this);
        }
        // Additional initialization logic can be added here
    }

    /**
     * Stops the surface (detaches and cleans up)
     */
    stop() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        // Cleanup logic can be added here
        // Stop all children
        for (const child of this.children) {
            child.stop();
        }
    }

    /**
     * Adds an event listener to this surface
     * @param {string} eventType - The type of event to listen for
     * @param {function} callback - The callback function to execute when the event occurs
     */
    addEventListener(eventType, callback) {
        if (!this.eventListeners[eventType]) {
            this.eventListeners[eventType] = [];
        }
        this.eventListeners[eventType].push(callback);
    }

    /**
     * Removes an event listener from this surface
     * @param {string} eventType - The type of event to remove
     * @param {function} callback - The callback function to remove
     */
    removeEventListener(eventType, callback) {
        if (!this.eventListeners[eventType]) return;
        
        const index = this.eventListeners[eventType].indexOf(callback);
        if (index !== -1) {
            this.eventListeners[eventType].splice(index, 1);
        }
    }

    /**
     * Dispatches an event to this surface and propagates it up the hierarchy
     * @param {object} event - The event to dispatch
     */
    dispatchEvent(event) {
        // Set the target of the event
        if (!event.target) {
            event.target = this;
        }
        
        // Set the current target
        event.currentTarget = this;
        
        // Call listeners for this event type
        if (this.eventListeners[event.type]) {
            for (const listener of this.eventListeners[event.type]) {
                listener.call(this, event);
            }
        }
        
        // Propagate event to parent if not stopped
        if (this.parent && !event.stopPropagation) {
            this.parent.dispatchEvent(event);
        }
    }

    /**
     * Handles an event at this surface and propagates it down the hierarchy
     * @param {object} event - The event to handle
     */
    handleEvent(event) {
        // Set the target of the event
        if (!event.target) {
            event.target = this;
        }
        
        // Handle event at this level
        if (this.eventListeners[event.type]) {
            for (const listener of this.eventListeners[event.type]) {
                listener.call(this, event);
                // Stop if event was stopped
                if (event.stopPropagation) {
                    return;
                }
            }
        }
        
        // Propagate event to children
        for (const child of this.children) {
            child.handleEvent(event);
            // Stop if event was stopped
            if (event.stopPropagation) {
                return;
            }
        }
    }

    /**
     * Renders the surface if visible
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
     * @param {THREE.Scene} scene - The scene to render to
     * @param {THREE.Camera} camera - The camera to render with
     */
    renderIfVisible(renderer, scene, camera) {
        if (this.visible) {
            this.render(renderer, scene, camera);
        }
    }

    /**
     * Renders the surface (abstract method to be implemented by subclasses)
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
     * @param {THREE.Scene} scene - The scene to render to
     * @param {THREE.Camera} camera - The camera to render with
     */
    render(renderer, scene, camera) {
        // Calculate world transform if dirty
        this.calculateWorldTransform();
        
        // Abstract method - to be implemented by subclasses
        // Render children
        for (const child of this.children) {
            child.renderIfVisible(renderer, scene, camera);
        }
    }

    /**
     * Gets the world bounds of this surface
     * @returns {object} The world bounds {x, y, width, height}
     */
    getWorldBounds() {
        this.calculateWorldTransform();
        return {
            x: this.worldPosition.x,
            y: this.worldPosition.y,
            width: this.bounds.x,
            height: this.bounds.y
        };
    }

    /**
     * Checks if a point is within this surface's bounds
     * @param {number} x - X coordinate in world space
     * @param {number} y - Y coordinate in world space
     * @returns {boolean} True if the point is within bounds
     */
    hitTest(x, y) {
        if (!this.hitTestEnabled || !this.visible) return false;
        
        const bounds = this.getWorldBounds();
        return x >= bounds.x && x <= bounds.x + bounds.width &&
               y >= bounds.y && y <= bounds.y + bounds.height;
    }

    /**
     * Finds the surface at the given coordinates
     * @param {number} x - X coordinate in world space
     * @param {number} y - Y coordinate in world space
     * @returns {Surface|null} The surface at the coordinates or null if none
     */
    findSurfaceAt(x, y) {
        // First check if this surface is hit
        if (!this.hitTest(x, y)) return null;
        
        // Check children from front to back (reverse order)
        for (let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i];
            const hitChild = child.findSurfaceAt(x, y);
            if (hitChild) return hitChild;
        }
        
        // If no children were hit, this surface is the target
        return this;
    }

    /**
     * Checks if this surface is visible within the given camera view
     * @param {THREE.Camera} camera - The camera to check against
     * @returns {boolean} True if visible, false otherwise
     */
    isVisible(camera) {
        if (!this.visible) return false;
        
        // For now, a simple check - in a real implementation,
        // this would do frustum culling
        return true;
    }
    
    /**
     * Enables physics for this surface
     * @param {boolean} enabled - Whether physics is enabled
     * @param {VerletParticle} particle - Optional physics particle to bind to
     * @param {string} binding - Binding type ('center' or 'nearestEdge')
     */
    setPhysicsEnabled(enabled, particle = null, binding = 'center') {
        this.physicsEnabled = enabled;
        this.physicsBinding = binding;
        
        if (enabled) {
            // If no particle provided, create one
            if (!particle) {
                const centerX = this.worldPosition.x + this.bounds.x / 2;
                const centerY = this.worldPosition.y + this.bounds.y / 2;
                particle = new VerletParticle(centerX, centerY, this.physicsMass);
                particle.friction = this.physicsFriction;
            }
            this.physicsParticle = particle;
        } else {
            this.physicsParticle = null;
        }
    }
    
    /**
     * Sets the physics mass for this surface
     * @param {number} mass - The mass value
     */
    setPhysicsMass(mass) {
        this.physicsMass = mass;
        if (this.physicsParticle) {
            this.physicsParticle.mass = mass;
            this.physicsParticle.invMass = mass !== 0 ? 1 / mass : 0;
            this.physicsParticle.radius = Math.sqrt(mass) * 0.5;
        }
    }
    
    /**
     * Sets the physics friction for this surface
     * @param {number} friction - The friction value (0-1)
     */
    setPhysicsFriction(friction) {
        this.physicsFriction = friction;
        if (this.physicsParticle) {
            this.physicsParticle.friction = friction;
        }
    }
    
    /**
     * Applies a force to this surface's physics particle
     * @param {Vec2} force - The force vector to apply
     */
    applyPhysicsForce(force) {
        if (this.physicsEnabled && this.physicsParticle) {
            this.physicsParticle.applyForce(force);
        }
    }
    
    /**
     * Gets the physics velocity of this surface
     * @returns {Vec2|null} The velocity vector or null if physics disabled
     */
    getPhysicsVelocity() {
        if (this.physicsEnabled && this.physicsParticle) {
            return this.physicsParticle.getVelocity();
        }
        return null;
    }
    
    /**
     * Sets the physics velocity of this surface
     * @param {Vec2} velocity - The velocity vector to set
     */
    setPhysicsVelocity(velocity) {
        if (this.physicsEnabled && this.physicsParticle) {
            this.physicsParticle.setVelocity(velocity);
        }
    }
}
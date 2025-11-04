import * as THREE from 'three';

/**
 * Unified camera system that handles both 2D orthographic and 3D perspective views
 * Enhanced with smooth navigation controls for both 2D and 3D spaces
 */
export class CameraSystem {
    /**
    * Creates a new CameraSystem
    * @param {object} THREE - The THREE.js object.
     * @param {object} options - Configuration options
     */
    constructor(three, options = {}) {
        // Configuration options with defaults
        this.config = {
            // Movement speeds
            panSpeed: options.panSpeed || 1.0,
            rotateSpeed: options.rotateSpeed || 1.0,
            zoomSpeed: options.zoomSpeed || 1.0,
            
            // Boundary constraints
            enableBoundaryConstraints: options.enableBoundaryConstraints !== false,
            minZoom: options.minZoom || 0.1,
            maxZoom: options.maxZoom || 100,
            minDistance: options.minDistance || 0.1,
            maxDistance: options.maxDistance || 1000,
            
            // Animation settings
            enableSmoothing: options.enableSmoothing !== false,
            dampingFactor: options.dampingFactor || 0.1,
            animationDuration: options.animationDuration || 500, // ms
            
            // Sensitivity settings
            orbitSensitivity: options.orbitSensitivity || 1.0,
            panSensitivity: options.panSensitivity || 1.0,
            zoomSensitivity: options.zoomSensitivity || 1.0
        };

        // 3D Perspective Camera
        this.perspectiveCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.perspectiveCamera.position.set(0, 0, 5);
        this.perspectiveCamera.lookAt(0, 0, 0);

        // 2D Orthographic Camera
        this.orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
        this.orthographicCamera.position.set(0, 0, 5);
        this.orthographicCamera.lookAt(0, 0, 0);

        // Current active camera
        this.activeCamera = this.perspectiveCamera;

        // Camera controls properties
        this.target = new THREE.Vector3(0, 0, 0);
        this.radius = 5;
        
        // Boundary constraints
        this.boundaryBox = options.boundaryBox || {
            min: new THREE.Vector3(-Infinity, -Infinity, -Infinity),
            max: new THREE.Vector3(Infinity, Infinity, Infinity)
        };

        // Animation properties
        this.isAnimating = false;
        this.animationDuration = 0;
        this.animationElapsedTime = 0;
        this.animationStartValues = {};
        this.animationEndValues = {};
        this.animationEasingFunction = this.easeInOutQuad;
        
        // Current state for smoothing
        this.currentTarget = this.target.clone();
        this.currentPosition = this.activeCamera.position.clone();
        this.currentRadius = this.radius;
        
        // Desired state for interpolation
        this.desiredTarget = this.target.clone();
        this.desiredPosition = this.activeCamera.position.clone();
        this.desiredRadius = this.radius;
        
        // Orbit controls state
        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();
        this.scale = 1.0;
        this.panOffset = new THREE.Vector3();
        
        // Viewport size
        this.viewportWidth = 1;
        this.viewportHeight = 1;
    }

    /**
     * Updates the camera aspect ratio
     * @param {number} width - The width of the viewport
     * @param {number} height - The height of the viewport
     */
    updateAspect(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
        const aspect = width / height;
        
        // Update perspective camera
        this.perspectiveCamera.aspect = aspect;
        this.perspectiveCamera.updateProjectionMatrix();
        
        // Update orthographic camera
        const frustumSize = 5;
        this.orthographicCamera.left = -frustumSize * aspect;
        this.orthographicCamera.right = frustumSize * aspect;
        this.orthographicCamera.top = frustumSize;
        this.orthographicCamera.bottom = -frustumSize;
        this.orthographicCamera.updateProjectionMatrix();
    }

    /**
     * Switches to perspective camera
     */
    usePerspective() {
        if (this.activeCamera !== this.perspectiveCamera) {
            // Transfer position and target from orthographic to perspective
            this.perspectiveCamera.position.copy(this.activeCamera.position);
            this.perspectiveCamera.lookAt(this.target);
            this.activeCamera = this.perspectiveCamera;
        }
    }

    /**
     * Switches to orthographic camera
     */
    useOrthographic() {
        if (this.activeCamera !== this.orthographicCamera) {
            // Transfer position and target from perspective to orthographic
            this.orthographicCamera.position.copy(this.activeCamera.position);
            this.orthographicCamera.lookAt(this.target);
            this.activeCamera = this.orthographicCamera;
        }
    }

    /**
     * Orbits the camera around the target
     * @param {number} deltaX - The change in X angle (degrees)
     * @param {number} deltaY - The change in Y angle (degrees)
     */
    orbit(deltaX, deltaY) {
        if (this.activeCamera === this.perspectiveCamera) {
            // Convert delta angles to radians and apply sensitivity
            const radDeltaX = deltaX * Math.PI / 180 * this.config.orbitSensitivity;
            const radDeltaY = deltaY * Math.PI / 180 * this.config.orbitSensitivity;
            
            // Get spherical coordinates
            this.spherical.setFromVector3(this.activeCamera.position.clone().sub(this.target));
            
            // Apply rotation
            this.spherical.theta -= radDeltaX;
            this.spherical.phi += radDeltaY;
            
            // Restrict phi to be between EPS and PI-EPS
            this.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.spherical.phi));
            
            // Update position
            this.spherical.makeSafe();
            this.desiredPosition.setFromSpherical(this.spherical).add(this.target);
        } else {
            // For 2D, we don't rotate, but we might want to implement tilt later
            // For now, we'll just ignore rotation in orthographic mode
        }
    }

    /**
     * Zooms the camera
     * @param {number} delta - The zoom delta
     */
    zoom(delta) {
        const zoomAmount = delta * this.config.zoomSensitivity;
        
        if (this.activeCamera === this.perspectiveCamera) {
            // For perspective camera, move closer or further from target
            this.scale *= Math.pow(0.95, zoomAmount);
        } else {
            // For orthographic camera, adjust frustum size
            const frustumSize = (this.orthographicCamera.right - this.orthographicCamera.left) / 2;
            const newFrustumSize = Math.max(
                this.config.minZoom, 
                Math.min(this.config.maxZoom, frustumSize * Math.pow(0.95, zoomAmount))
            );
            
            const aspect = (this.orthographicCamera.right - this.orthographicCamera.left) / 
                          (this.orthographicCamera.top - this.orthographicCamera.bottom);
            
            this.orthographicCamera.left = -newFrustumSize * aspect;
            this.orthographicCamera.right = newFrustumSize * aspect;
            this.orthographicCamera.top = newFrustumSize;
            this.orthographicCamera.bottom = -newFrustumSize;
            this.orthographicCamera.updateProjectionMatrix();
        }
    }

    /**
     * Pans the camera
     * @param {number} deltaX - The change in X position
     * @param {number} deltaY - The change in Y position
     */
    pan(deltaX, deltaY) {
        // Apply sensitivity
        deltaX *= this.config.panSensitivity;
        deltaY *= this.config.panSensitivity;
        
        if (this.activeCamera === this.perspectiveCamera) {
            // Calculate pan vector in world space
            const right = new THREE.Vector3();
            const up = new THREE.Vector3();
            
            this.activeCamera.matrix.extractBasis(right, up, new THREE.Vector3());
            right.multiplyScalar(deltaX * 0.01 * this.radius);
            up.multiplyScalar(deltaY * 0.01 * this.radius);
            
            const panVector = right.add(up);
            
            // Apply pan to camera and target
            this.desiredPosition.sub(panVector);
            this.desiredTarget.sub(panVector);
        } else {
            // For orthographic camera, pan in screen space
            const aspect = this.viewportWidth / this.viewportHeight;
            const frustumHeight = (this.orthographicCamera.top - this.orthographicCamera.bottom);
            const frustumWidth = frustumHeight * aspect;
            
            // Convert pixel delta to world units
            const worldDeltaX = deltaX * frustumWidth / this.viewportWidth;
            const worldDeltaY = deltaY * frustumHeight / this.viewportHeight;
            
            // Apply pan
            this.desiredPosition.x -= worldDeltaX;
            this.desiredPosition.y += worldDeltaY;
            this.desiredTarget.x -= worldDeltaX;
            this.desiredTarget.y += worldDeltaY;
            
            // Apply boundary constraints if enabled
            if (this.config.enableBoundaryConstraints) {
                this.applyBoundaryConstraints();
            }
        }
    }

    /**
     * Applies boundary constraints to camera position
     */
    applyBoundaryConstraints() {
        if (!this.config.enableBoundaryConstraints) return;
        
        // Constrain target position
        this.desiredTarget.x = Math.max(
            this.boundaryBox.min.x, 
            Math.min(this.boundaryBox.max.x, this.desiredTarget.x)
        );
        this.desiredTarget.y = Math.max(
            this.boundaryBox.min.y, 
            Math.min(this.boundaryBox.max.y, this.desiredTarget.y)
        );
        this.desiredTarget.z = Math.max(
            this.boundaryBox.min.z, 
            Math.min(this.boundaryBox.max.z, this.desiredTarget.z)
        );
        
        // Constrain camera position based on target
        if (this.activeCamera === this.perspectiveCamera) {
            // For perspective, constrain based on radius and target
            const direction = this.desiredPosition.clone().sub(this.desiredTarget);
            const distance = direction.length();
            
            if (distance < this.config.minDistance) {
                direction.normalize().multiplyScalar(this.config.minDistance);
                this.desiredPosition.copy(this.desiredTarget).add(direction);
            } else if (distance > this.config.maxDistance) {
                direction.normalize().multiplyScalar(this.config.maxDistance);
                this.desiredPosition.copy(this.desiredTarget).add(direction);
            }
        } else {
            // For orthographic, constrain camera position directly
            this.desiredPosition.x = Math.max(
                this.boundaryBox.min.x, 
                Math.min(this.boundaryBox.max.x, this.desiredPosition.x)
            );
            this.desiredPosition.y = Math.max(
                this.boundaryBox.min.y, 
                Math.min(this.boundaryBox.max.y, this.desiredPosition.y)
            );
        }
    }

    /**
     * Updates the camera system
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Handle animations
        if (this.isAnimating) {
            this.updateAnimation(deltaTime);
            // During animation, the eased progress already provides smoothing.
            // We directly set the current state to the desired animated state.
            this.currentPosition.copy(this.desiredPosition);
            this.currentTarget.copy(this.desiredTarget);
            this.currentRadius = this.desiredRadius;
        }
        // Handle user input smoothing only when not animating.
        else if (this.config.enableSmoothing) {
            this.updateSmoothInterpolation(deltaTime);
        } else {
            // Direct assignment if smoothing is disabled and not animating.
            this.currentPosition.copy(this.desiredPosition);
            this.currentTarget.copy(this.desiredTarget);
            this.currentRadius = this.desiredRadius;
        }

        // Apply transformations to active camera
        this.activeCamera.position.copy(this.currentPosition);
        this.activeCamera.lookAt(this.currentTarget);

        // Apply scale for perspective camera
        if (this.activeCamera === this.perspectiveCamera && this.scale !== 1) {
            this.radius *= this.scale;
            this.desiredPosition.sub(this.currentTarget).multiplyScalar(this.scale).add(this.currentTarget);
            this.scale = 1;
        }
    }

    /**
     * Updates smooth interpolation
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateSmoothInterpolation(deltaTime) {
        // Calculate damping factor based on time
        const damping = 1 - Math.exp(-this.config.dampingFactor * deltaTime * 60);
        
        // Interpolate position
        this.currentPosition.lerp(this.desiredPosition, damping);
        
        // Interpolate target
        this.currentTarget.lerp(this.desiredTarget, damping);
        
        // Interpolate radius
        this.currentRadius = THREE.MathUtils.lerp(this.currentRadius, this.desiredRadius, damping);
    }

    /**
     * Updates animation
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateAnimation(deltaTime) {
        this.animationElapsedTime += deltaTime * 1000; // Convert deltaTime to ms
        const progress = Math.min(this.animationElapsedTime / this.animationDuration, 1.0);
        const easedProgress = this.animationEasingFunction(progress);
        
        // Interpolate all animated properties
        this.desiredPosition.lerpVectors(
            this.animationStartValues.position, 
            this.animationEndValues.position, 
            easedProgress
        );
        
        this.desiredTarget.lerpVectors(
            this.animationStartValues.target, 
            this.animationEndValues.target, 
            easedProgress
        );
        
        this.desiredRadius = THREE.MathUtils.lerp(
            this.animationStartValues.radius, 
            this.animationEndValues.radius, 
            easedProgress
        );
        
        // Finish animation if complete
        if (progress >= 1.0) {
            this.isAnimating = false;
            this.desiredPosition.copy(this.animationEndValues.position);
            this.desiredTarget.copy(this.animationEndValues.target);
            this.desiredRadius = this.animationEndValues.radius;
        }
    }

    /**
     * Starts a camera transition animation
     * @param {object} targetPosition - Target camera position
     * @param {object} targetTarget - Target look-at point
     * @param {number} targetRadius - Target radius (for orbit controls)
     * @param {number} duration - Animation duration in milliseconds
     * @param {function} easingFunction - Easing function for animation
     */
    transitionTo(targetPosition, targetTarget, targetRadius, duration, easingFunction) {
        // Cancel any existing animation
        this.isAnimating = false;
        
        // Set up new animation
        this.animationElapsedTime = 0;
        this.animationDuration = duration || this.config.animationDuration;
        this.animationEasingFunction = easingFunction || this.easeInOutQuad;
        
        // Store start values
        this.animationStartValues = {
            position: this.desiredPosition.clone(),
            target: this.desiredTarget.clone(),
            radius: this.desiredRadius
        };
        
        // Store end values
        this.animationEndValues = {
            position: new THREE.Vector3().copy(targetPosition),
            target: new THREE.Vector3().copy(targetTarget),
            radius: targetRadius
        };
        
        this.isAnimating = true;
    }

    /**
     * Focuses the camera on a specific surface
     * @param {Surface} surface - The surface to focus on
     * @param {number} duration - Optional animation duration
     */
    focusOnSurface(surface, duration) {
        if (!surface) return;
        
        // Get the world bounds of the surface
        const bounds = surface.getWorldBounds();
        const center = new THREE.Vector3(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
            0
        );
        
        if (this.activeCamera === this.perspectiveCamera) {
            // For 3D, position camera to look at the surface from a reasonable distance
            const distance = Math.max(bounds.width, bounds.height) * 2;
            const targetPosition = new THREE.Vector3(
                center.x,
                center.y,
                center.z + distance
            );
            
            this.transitionTo(targetPosition, center, distance, duration);
        } else {
            // For 2D, center the view on the surface
            const targetPosition = new THREE.Vector3(
                center.x,
                center.y,
                this.desiredPosition.z
            );
            
            // Adjust zoom to fit the surface
            const aspect = this.viewportWidth / this.viewportHeight;
            const horizontalFit = bounds.width / 2;
            const verticalFit = bounds.height / 2 * aspect;
            const fitSize = Math.max(horizontalFit, verticalFit) * 1.2; // Add some padding
            
            // Update orthographic camera to fit
            this.orthographicCamera.left = center.x - fitSize * aspect;
            this.orthographicCamera.right = center.x + fitSize * aspect;
            this.orthographicCamera.top = center.y + fitSize;
            this.orthographicCamera.bottom = center.y - fitSize;
            this.orthographicCamera.updateProjectionMatrix();
            
            this.transitionTo(targetPosition, center, this.desiredRadius, duration);
        }
    }

    /**
     * Fits the view to show all surfaces
     * @param {Array<Surface>} surfaces - Array of surfaces to fit in view
     * @param {number} duration - Optional animation duration
     */
    fitToView(surfaces, duration) {
        if (!surfaces || surfaces.length === 0) return;
        
        // Calculate bounding box of all surfaces
        const bbox = new THREE.Box3();
        for (const surface of surfaces) {
            const bounds = surface.getWorldBounds();
            const min = new THREE.Vector3(bounds.x, bounds.y, 0);
            const max = new THREE.Vector3(bounds.x + bounds.width, bounds.y + bounds.height, 0);
            bbox.expandByPoint(min);
            bbox.expandByPoint(max);
        }
        
        const center = bbox.getCenter(new THREE.Vector3());
        
        if (this.activeCamera === this.perspectiveCamera) {
            // For 3D, calculate bounding sphere and position camera accordingly
            const sphere = bbox.getBoundingSphere(new THREE.Sphere());
            const distance = sphere.radius / Math.tan(THREE.MathUtils.degToRad(this.perspectiveCamera.fov) / 2) * 1.5;
            
            const targetPosition = new THREE.Vector3(
                center.x,
                center.y,
                center.z + distance
            );
            
            this.transitionTo(targetPosition, center, distance, duration);
        } else {
            // For 2D, adjust orthographic camera to fit all surfaces
            const size = bbox.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y) * 1.2; // Add padding
            
            const aspect = this.viewportWidth / this.viewportHeight;
            const halfWidth = maxSize * aspect / 2;
            const halfHeight = maxSize / 2;
            
            this.orthographicCamera.left = center.x - halfWidth;
            this.orthographicCamera.right = center.x + halfWidth;
            this.orthographicCamera.top = center.y + halfHeight;
            this.orthographicCamera.bottom = center.y - halfHeight;
            this.orthographicCamera.updateProjectionMatrix();
            
            const targetPosition = new THREE.Vector3(
                center.x,
                center.y,
                this.desiredPosition.z
            );
            
            this.transitionTo(targetPosition, center, this.desiredRadius, duration);
        }
    }

    /**
     * Converts screen coordinates to world coordinates
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     * @returns {THREE.Vector3} World coordinates
     */
    screenToWorld(x, y) {
        // Normalize screen coordinates to NDC (-1 to 1)
        const ndcX = (x / this.viewportWidth) * 2 - 1;
        const ndcY = -(y / this.viewportHeight) * 2 + 1;
        
        // Create a ray from the camera through the point
        const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
        vector.unproject(this.activeCamera);
        
        // For orthographic, we can directly calculate the position
        if (this.activeCamera === this.orthographicCamera) {
            return vector;
        }
        
        // For perspective, we need to intersect with a plane at target depth
        const dir = vector.sub(this.activeCamera.position).normalize();
        const distance = (this.currentTarget.z - this.activeCamera.position.z) / dir.z;
        return this.activeCamera.position.clone().add(dir.multiplyScalar(distance));
    }

    /**
     * Converts world coordinates to screen coordinates
     * @param {THREE.Vector3} worldPos - World position
     * @returns {THREE.Vector3} Screen coordinates
     */
    worldToScreen(worldPos) {
        const vector = worldPos.clone();
        vector.project(this.activeCamera);
        
        return new THREE.Vector3(
            (vector.x + 1) * this.viewportWidth / 2,
            (-vector.y + 1) * this.viewportHeight / 2,
            vector.z
        );
    }

    /**
     * Calculates the camera frustum for visibility checks
     * @returns {THREE.Frustum} The camera frustum
     */
    getFrustum() {
        const frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
                this.activeCamera.projectionMatrix, 
                this.activeCamera.matrixWorldInverse
            )
        );
        return frustum;
    }

    /**
     * Checks if a point is visible in the current camera view
     * @param {THREE.Vector3} point - Point to check
     * @returns {boolean} True if visible
     */
    isPointVisible(point) {
        const frustum = this.getFrustum();
        return frustum.containsPoint(point);
    }

    /**
     * Quadratic easing function
     * @param {number} t - Progress (0 to 1)
     * @returns {number} Eased progress
     */
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Cubic easing function
     * @param {number} t - Progress (0 to 1)
     * @returns {number} Eased progress
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    /**
     * Exponential easing function
     * @param {number} t - Progress (0 to 1)
     * @returns {number} Eased progress
     */
    easeInOutExpo(t) {
        return t === 0 || t === 1 ? t : t < 0.5 ? 
            Math.pow(2, 20 * t - 10) / 2 : 
            (2 - Math.pow(2, -20 * t + 10)) / 2;
    }

    gluLookAt(eyex, eyey, eyez, centerx, centery, centerz, upx, upy, upz) {
        this.activeCamera.position.set(eyex, eyey, eyez);
        this.activeCamera.lookAt(centerx, centery, centerz);
        this.activeCamera.up.set(upx, upy, upz);
    }
}
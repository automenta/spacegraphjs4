import { Finger } from './Finger.js';
import { TapRecognizer } from './gestures/TapRecognizer.js';
import { DragRecognizer } from './gestures/DragRecognizer.js';
import { PinchRecognizer } from './gestures/PinchRecognizer.js';
import { CameraOrbitRecognizer } from './gestures/CameraOrbitRecognizer.js';
import { CameraPanRecognizer } from './gestures/CameraPanRecognizer.js';
import { CameraZoomRecognizer } from './gestures/CameraZoomRecognizer.js';
import { Event } from './Event.js';
import { CameraSystem } from './CameraSystem.js';

/**
 * Layer management system similar to the Java version
 */
export class Layer {
    /**
     * Creates a new Layer
     */
    constructor() {
        // Root surface for this layer
        this.rootSurface = null;
        
        // Camera system for this layer
        this.cameraSystem = new CameraSystem({
            panSpeed: 1.0,
            rotateSpeed: 1.0,
            zoomSpeed: 1.0,
            enableBoundaryConstraints: true,
            minZoom: 0.1,
            maxZoom: 100,
            minDistance: 0.1,
            maxDistance: 1000,
            enableSmoothing: true,
            dampingFactor: 0.1,
            animationDuration: 500,
            orbitSensitivity: 1.0,
            panSensitivity: 1.0,
            zoomSensitivity: 1.0
        });
        
        // Scene for Three.js rendering
        this.scene = new THREE.Scene();
        
        // Input handling
        this.fingers = new Map(); // Map of active fingers by pointer ID
        this.gestureRecognizers = [
            new TapRecognizer(),
            new DragRecognizer(),
            new PinchRecognizer(),
            new CameraOrbitRecognizer(this.cameraSystem),
            new CameraPanRecognizer(this.cameraSystem),
            new CameraZoomRecognizer(this.cameraSystem)
        ];
        
        // Camera control flags
        this.cameraControlsEnabled = true;
        
        // Pointer event handlers
        this.pointerDownHandler = this.onPointerDown.bind(this);
        this.pointerUpHandler = this.onPointerUp.bind(this);
        this.pointerMoveHandler = this.onPointerMove.bind(this);
        this.pointerLeaveHandler = this.onPointerLeave.bind(this);
        this.wheelHandler = this.onWheel.bind(this);
    }

    /**
     * Sets the root surface for this layer
     * @param {Surface} surface - The root surface
     */
    setRootSurface(surface) {
        this.rootSurface = surface;
        
        // Attach event listeners to the renderer's DOM element
        // This will be done in the render method when we have access to the renderer
    }

    /**
     * Updates the layer
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update camera system
        this.cameraSystem.update(deltaTime);
        
        // Update root surface
        if (this.rootSurface) {
            // Update the root surface and its hierarchy
            if (this.rootSurface.update) {
                this.rootSurface.update(deltaTime);
            }
        }
    }

    /**
     * Renders the layer
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
     */
    render(renderer) {
        // Update camera aspect ratio if needed
        const canvas = renderer.domElement;
        this.cameraSystem.updateAspect(canvas.width, canvas.height);
        
        // Render root surface
        if (this.rootSurface) {
            this.rootSurface.renderIfVisible(renderer, this.scene, this.cameraSystem.activeCamera);
        }
        
        // Render the Three.js scene
        renderer.render(this.scene, this.cameraSystem.activeCamera);
    }

    /**
     * Attaches pointer event listeners to the renderer's DOM element
     * @param {THREE.WebGLRenderer} renderer - The WebGL renderer
     */
    attachInputListeners(renderer) {
        const canvas = renderer.domElement;
        canvas.addEventListener('pointerdown', this.pointerDownHandler, false);
        canvas.addEventListener('pointerup', this.pointerUpHandler, false);
        canvas.addEventListener('pointermove', this.pointerMoveHandler, false);
        canvas.addEventListener('pointerleave', this.pointerLeaveHandler, false);
        canvas.addEventListener('pointercancel', this.pointerLeaveHandler, false);
        canvas.addEventListener('wheel', this.wheelHandler, false);
    }

    /**
     * Handles pointer down events
     * @param {PointerEvent} event - The pointer event
     */
    onPointerDown(event) {
        event.preventDefault();
        
        // Create or update finger
        let finger = this.fingers.get(event.pointerId);
        if (!finger) {
            finger = new Finger(event.pointerId, event.clientX, event.clientY);
            this.fingers.set(event.pointerId, finger);
        }
        
        finger.updatePosition(event.clientX, event.clientY);
        finger.setButtons(event.buttons);
        finger.setDown(true);
        
        // Notify gesture recognizers
        for (const recognizer of this.gestureRecognizers) {
            if (recognizer.onFingerDown(finger)) {
                recognizer.addFinger(finger);
                if (recognizer.shouldActivate()) {
                    recognizer.activate();
                }
            }
        }
        
        // Find target surface and dispatch event
        if (this.rootSurface) {
            const targetSurface = this.rootSurface.findSurfaceAt(event.clientX, event.clientY);
            if (targetSurface) {
                const inputEvent = new Event('pointerdown', {
                    x: event.clientX,
                    y: event.clientY,
                    button: event.button,
                    buttons: event.buttons,
                    pointerId: event.pointerId
                });
                targetSurface.dispatchEvent(inputEvent);
            }
        }
    }

    /**
     * Handles pointer up events
     * @param {PointerEvent} event - The pointer event
     */
    onPointerUp(event) {
        event.preventDefault();
        
        // Get existing finger
        const finger = this.fingers.get(event.pointerId);
        if (!finger) return;
        
        finger.updatePosition(event.clientX, event.clientY);
        finger.setButtons(event.buttons);
        finger.setDown(false);
        
        // Notify gesture recognizers
        for (const recognizer of this.gestureRecognizers) {
            if (recognizer.fingers.includes(finger)) {
                recognizer.onFingerUp(finger);
                recognizer.removeFinger(finger);
                
                // Check if gesture should deactivate
                if (recognizer.active && recognizer.fingers.length === 0) {
                    recognizer.deactivate();
                }
            }
        }
        
        // Find target surface and dispatch event
        if (this.rootSurface) {
            const targetSurface = this.rootSurface.findSurfaceAt(event.clientX, event.clientY);
            if (targetSurface) {
                const inputEvent = new Event('pointerup', {
                    x: event.clientX,
                    y: event.clientY,
                    button: event.button,
                    buttons: event.buttons,
                    pointerId: event.pointerId
                });
                targetSurface.dispatchEvent(inputEvent);
            }
        }
        
        // Remove finger if all buttons are released
        if (event.buttons === 0) {
            this.fingers.delete(event.pointerId);
        }
    }

    /**
     * Handles pointer move events
     * @param {PointerEvent} event - The pointer event
     */
    onPointerMove(event) {
        event.preventDefault();
        
        // Get existing finger or create a new one if needed
        let finger = this.fingers.get(event.pointerId);
        if (!finger && event.buttons !== 0) {
            finger = new Finger(event.pointerId, event.clientX, event.clientY);
            this.fingers.set(event.pointerId, finger);
        }
        
        if (finger) {
            finger.updatePosition(event.clientX, event.clientY);
            finger.setButtons(event.buttons);
            
            // Notify gesture recognizers
            for (const recognizer of this.gestureRecognizers) {
                if (recognizer.fingers.includes(finger)) {
                    recognizer.onFingerMove(finger);
                }
            }
            
            // Find target surface and dispatch event
            if (this.rootSurface) {
                const targetSurface = this.rootSurface.findSurfaceAt(event.clientX, event.clientY);
                if (targetSurface) {
                    const inputEvent = new Event('pointermove', {
                        x: event.clientX,
                        y: event.clientY,
                        button: event.button,
                        buttons: event.buttons,
                        pointerId: event.pointerId
                    });
                    targetSurface.dispatchEvent(inputEvent);
                }
            }
        }
    }

    /**
     * Handles pointer leave/cancel events
     * @param {PointerEvent} event - The pointer event
     */
    onPointerLeave(event) {
        event.preventDefault();
        
        // Get existing finger
        const finger = this.fingers.get(event.pointerId);
        if (!finger) return;
        
        // Notify gesture recognizers
        for (const recognizer of this.gestureRecognizers) {
            if (recognizer.fingers.includes(finger)) {
                recognizer.onFingerUp(finger); // Treat as finger up
                recognizer.removeFinger(finger);
                
                // Check if gesture should deactivate
                if (recognizer.active && recognizer.fingers.length === 0) {
                    recognizer.deactivate();
                }
            }
        }
        
        // Remove finger
        this.fingers.delete(event.pointerId);
    }

    /**
     * Handles wheel events for zooming
     * @param {WheelEvent} event - The wheel event
     */
    onWheel(event) {
        event.preventDefault();
        
        if (this.cameraControlsEnabled) {
            // Zoom camera based on wheel delta
            const delta = event.deltaY > 0 ? 1 : -1;
            this.cameraSystem.zoom(delta);
        }
    }

    /**
     * Handles resize events
     * @param {number} width - The new width
     * @param {number} height - The new height
     */
    resize(width, height) {
        this.cameraSystem.updateAspect(width, height);
    }
    
    /**
     * Enables or disables camera controls
     * @param {boolean} enabled - Whether camera controls are enabled
     */
    setCameraControlsEnabled(enabled) {
        this.cameraControlsEnabled = enabled;
    }
    
    /**
     * Focuses the camera on a specific surface
     * @param {Surface} surface - The surface to focus on
     * @param {number} duration - Optional animation duration in ms
     */
    focusOnSurface(surface, duration) {
        this.cameraSystem.focusOnSurface(surface, duration);
    }
    
    /**
     * Fits the view to show all surfaces
     * @param {Array<Surface>} surfaces - Array of surfaces to fit in view
     * @param {number} duration - Optional animation duration in ms
     */
    fitToView(surfaces, duration) {
        this.cameraSystem.fitToView(surfaces, duration);
    }
}
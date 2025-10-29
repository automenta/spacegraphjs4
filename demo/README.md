# SpaceGraph JavaScript/WebGL Engine Demo

This directory contains a comprehensive demonstration of the SpaceGraph engine capabilities, showcasing the integration of 2D and 3D elements, physics simulation, gesture recognition, and advanced UI components.

## Demo Files

- `comprehensive-demo.html` - Main demonstration application
- `comprehensive-demo.js` - JavaScript implementation for the demo
- `integration-tests.html` - Integration tests runner
- `integration-tests.js` - Integration tests implementation
- `physics-demo.html` - Physics demonstration (legacy)
- `index.html` - Entry point redirecting to comprehensive demo

## Features Demonstrated

### 1. Unified Scene with 2D and 3D Elements
The demo combines both 2D and 3D surfaces in a single scene:
- 2D surfaces: Rectangles, circles, text elements
- 3D surfaces: Cubes, spheres
- Mixed scenes showing seamless integration

### 2. Physics Simulation
Physics-inspired layouts with dynamic behaviors:
- Verlet physics engine implementation
- Spring constraints between surfaces
- Gravity effects and collision detection
- Interactive physics manipulation

### 3. Input Handling with Gesture Recognition
Advanced input handling system:
- Tap gestures for selection and activation
- Drag gestures for moving surfaces
- Pinch gestures for scaling
- Multi-touch support

### 4. Camera Controls
Flexible camera system for navigation:
- Orbit controls for 3D exploration
- Pan controls for 2D navigation
- Zoom controls for detailed inspection
- Smooth camera transitions

### 5. UI Components and Layouts
Various UI components and layout mechanisms:
- Buttons, sliders, text inputs
- Scrollable containers
- Border, grid, and flex layouts
- Responsive design principles

### 6. Performance Monitoring
Built-in performance monitoring utilities:
- Real-time FPS counter
- Physics update timing display
- Memory usage monitoring
- Debug visualization tools

## Running the Demo

1. Open `comprehensive-demo.html` in a modern web browser
2. Use the control panel on the right to toggle features
3. Interact with surfaces using mouse/touch gestures
4. Switch between different demo modes using the mode selector

## Interaction Guide

### Mouse Controls
- **Left Click + Drag**: Rotate camera (3D) or pan view (2D)
- **Right Click + Drag**: Pan camera
- **Scroll Wheel**: Zoom in/out
- **Double Click**: Reset camera view

### Touch Gestures
- **Single Finger Drag**: Rotate camera (3D) or pan view (2D)
- **Two Finger Drag**: Pan camera
- **Pinch**: Zoom in/out
- **Tap**: Select surfaces

### Keyboard Shortcuts
- **R**: Reset camera view
- **P**: Toggle physics simulation
- **D**: Toggle debug visualization
- **1-4**: Switch between demo modes

## Performance Considerations

1. **Optimization Tips**:
   - Reduce the number of active physics objects for better performance
   - Disable debug visualization in production
   - Use simpler geometries for large numbers of objects
   - Limit the physics iteration count for faster simulation

2. **Browser Compatibility**:
   - Requires WebGL support
   - Works best in Chrome, Firefox, and Edge
   - Mobile browsers supported with touch gestures

## Troubleshooting

### Common Issues
1. **Black screen**: Ensure WebGL is enabled in your browser
2. **Poor performance**: Reduce physics objects or disable debug visualization
3. **Controls not responding**: Check browser console for errors
4. **Layout issues**: Refresh the page to reset the layout system

### Console Output
Check the browser's developer console for:
- Performance metrics
- Error messages
- Debug information
- Physics simulation status

## Integration Tests

Run `integration-tests.html` to verify that all components work together correctly:
- Input handler integration
- Physics simulation with interactions
- Camera transitions during physics updates
- Dynamic layout updates

## Architecture Overview

The SpaceGraph engine follows a modular architecture:
- **Surface System**: Base classes for all visual elements
- **Layout Containers**: BorderLayout, GridLayout, FlexLayout
- **Physics Engine**: Verlet physics with constraints
- **Input System**: Gesture recognition and event handling
- **Rendering**: Three.js powered WebGL renderer
- **UI Components**: Buttons, sliders, text inputs

For more details, see the main project documentation in `spacegraphjs4_architecture_spec.md`.
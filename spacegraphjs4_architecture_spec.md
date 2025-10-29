# SpaceGraph JavaScript/WebGL Architecture Specification

## Overview

This document outlines the technical specification for translating the SpaceGraph Java project into a unified 2D/3D JavaScript/WebGL engine. The analysis reveals a sophisticated scene graph system with layered rendering, physics-inspired layouts, and comprehensive input handling that can be effectively ported to modern web technologies.

## Core Architecture Components

### 1. Scene Graph Hierarchy and Node Structure

#### Surface Hierarchy
- **Base Surface Class**: Abstract planar subspace with rectangular bounds, visibility, and parent-child relationships
- **Container Surfaces**: Branch nodes managing child layout and rendering order
- **Leaf Surfaces**: Concrete renderable elements (widgets, shapes, etc.)

#### Key Surface Properties
- **Bounds**: RectF defining position and dimensions
- **Parent/Child Relationships**: Hierarchical composition with automatic lifecycle management
- **Visibility**: Cascading visibility with clipping bounds
- **Z-Index**: Implicit rendering order through tree traversal

#### JavaScript Implementation
```javascript
class Surface {
  constructor(bounds = new RectF(0, 0, 1, 1)) {
    this.bounds = bounds;
    this.parent = null;
    this.children = [];
    this.visible = true;
    this.clipBounds = true;
  }

  // Lifecycle methods
  start(parent) { /* attach to parent */ }
  stop() { /* detach and cleanup */ }

  // Rendering
  render(renderer) { /* abstract */ }
  renderIfVisible(renderer) {
    if (this.isVisible(renderer)) {
      this.render(renderer);
    }
  }
}
```

### 2. Rendering Pipeline and Layer Management

#### Layer System Architecture
- **AbstractLayer**: Base class with camera controls, input handling, and rendering context
- **OrthoSurfaceGraph**: 2D orthographic layer managing surface hierarchies
- **Window Management**: JoglWindow provides hardware abstraction and event loop

#### Rendering Stages
1. **Volume Rendering**: 3D perspective rendering with camera transforms
2. **Orthographic Rendering**: 2D overlay rendering with surface hierarchies
3. **Post-Processing**: Stencil operations, blending, depth testing

#### JavaScript WebGL Pipeline
```javascript
class Layer {
  constructor() {
    this.camera = {
      position: new Vector3(0, 0, 5),
      forward: new Vector3(0, 0, -1),
      up: new Vector3(0, 1, 0)
    };
    this.fingers = [];
  }

  render(deltaTime, gl) {
    this.updateCamera(gl);
    this.renderVolume(deltaTime, gl);
    this.renderOrtho(deltaTime, gl);
  }
}
```

### 3. Input Handling System for Mouse/Touch Interactions

#### Finger Abstraction
- **Finger Class**: Unified input abstraction for mouse, touch, and other pointing devices
- **Fingering States**: State machine managing exclusive input capture (dragging, clicking, etc.)
- **Multi-Modal Input**: Support for multiple simultaneous input sources

#### Input Processing Pipeline
1. **Hardware Events**: Mouse, touch, keyboard events
2. **Finger Creation/Update**: Convert events to Finger objects
3. **Surface Propagation**: Traverse surface hierarchy for input handling
4. **State Management**: Track press/release/drag states

#### JavaScript Input System
```javascript
class Finger {
  constructor(buttons = 1) {
    this.position = { x: 0, y: 0 };
    this.buttons = new Array(buttons).fill(false);
    this.fingering = null; // current interaction state
  }

  // State queries
  pressed(button = 0) { return this.buttons[button]; }
  clicked(button = 0) { /* click detection */ }
  dragging(button = 0) { /* drag detection */ }
}
```

### 4. Camera Control Mechanisms for 2D/3D Navigation

#### Camera System
- **3D Camera**: Position, forward, up vectors with perspective projection
- **2D Camera**: Orthographic projection with zoom and pan
- **Animated Controls**: Smooth interpolation for camera movements

#### Control Mechanisms
- **Mouse Orbit**: Rotate camera around target point
- **Zoom**: Field-of-view adjustment and orthographic scaling
- **Pan**: Translation in camera plane
- **Key Controls**: WASD-style movement with configurable speeds

#### JavaScript Camera Implementation
```javascript
class Camera {
  constructor() {
    this.position = new Vector3(0, 0, 5);
    this.target = new Vector3(0, 0, 0);
    this.up = new Vector3(0, 1, 0);
    this.fov = 45;
    this.near = 0.1;
    this.far = 1000;
  }

  // Control methods
  orbit(deltaX, deltaY, radius) { /* mouse orbit */ }
  zoom(delta) { /* zoom in/out */ }
  pan(deltaX, deltaY) { /* pan camera */ }
}
```

### 5. Core Surface Hierarchy and Container System

#### Container Types
- **Stacking**: Simple overlay container
- **Gridding**: Grid-based layout
- **Splitting**: Resizable split-pane layouts
- **Springing**: Constraint-based auto-layout (incomplete in Java version)

#### Layout Management
- **Lazy Layout**: Asynchronous layout updates triggered by bounds changes
- **Recursive Layout**: Parent containers manage child positioning
- **Constraint System**: Physics-inspired layout constraints

#### JavaScript Container System
```javascript
class ContainerSurface extends Surface {
  constructor() {
    super();
    this.children = [];
    this.needsLayout = false;
  }

  add(child) {
    this.children.push(child);
    child.parent = this;
    this.layout();
  }

  doLayout(deltaTime) {
    // Abstract layout implementation
  }
}
```

### 6. Physics-Inspired Behaviors for Dynamic Layouts

#### Verlet Physics Integration
- **VerletSurface**: Physics simulation container for dynamic layouts
- **Particle Systems**: Mass-spring systems for surface positioning
- **Constraints**: Boundary constraints and spring connections
- **Behaviors**: Gravity, attraction, repulsion forces

#### Dynamic Layout Features
- **Surface Binding**: Connect UI elements to physics particles
- **Chain Systems**: Linked particle chains for complex layouts
- **Real-time Simulation**: Continuous physics updates

#### JavaScript Physics Implementation
```javascript
class VerletSurface extends ContainerSurface {
  constructor() {
    super();
    this.physics = new VerletPhysics2D();
    this.particles = new Map(); // Surface -> Particle mapping
  }

  bind(surface, binding = VerletSurfaceBinding.Center) {
    const particle = new VerletParticle2D(surface.cx, surface.cy);
    // Bind surface position to particle
    this.particles.set(surface, particle);
    this.physics.addParticle(particle);
  }
}
```

### 7. Technology Choices for WebGL Framework

#### Framework Recommendation: Three.js + Custom Scene Graph

**Primary Choice: Three.js**
- **Pros**:
  - Mature, battle-tested WebGL framework
  - Comprehensive 3D math utilities
  - Active community and extensive documentation
  - Built-in camera controls and lighting
  - Efficient rendering pipeline
  - WebXR support for VR/AR

- **Cons**:
  - Additional abstraction layer
  - Learning curve for advanced features
  - Bundle size considerations

**Alternative: Raw WebGL**
- **Pros**:
  - Maximum performance and control
  - Minimal bundle size
  - Direct hardware access
- **Cons**:
  - Significantly higher development complexity
  - Manual matrix math and shader management
  - Increased maintenance burden

**Recommendation**: Three.js provides the best balance of performance, features, and maintainability for this project. The custom scene graph layer can be built on top of Three.js's Object3D hierarchy.

#### Additional Libraries
- **Physics**: cannon-es or ammo.js for 3D physics
- **Input**: Pointer Events API with custom gesture recognition
- **Math**: gl-matrix for high-performance vector/matrix operations

### 8. Overall Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Window                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                JoglWindow (WebGL Canvas)               │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │                Layer System                        │ │ │
│  │  │  ┌─────────────────────────────────────────────────┐ │ │ │
│  │  │  │            AbstractLayer                        │ │ │ │
│  │  │  │  ┌─────────────┐  ┌─────────────────────────────┐ │ │ │ │
│  │  │  │  │  3D Volume  │  │  OrthoSurfaceGraph (2D)     │ │ │ │ │
│  │  │  │  │  Rendering  │  │  ┌─────────────────────────┐ │ │ │ │ │
│  │  │  │  │             │  │  │     Surface Hierarchy   │ │ │ │ │ │
│  │  │  │  │             │  │  │  ┌─────────────────────┐ │ │ │ │ │ │
│  │  │  │  │             │  │  │  │   ContainerSurface  │ │ │ │ │ │ │
│  │  │  │  │             │  │  │  │  ┌─────────────────┐ │ │ │ │ │ │ │
│  │  │  │  │             │  │  │  │  │  Stacking      │ │ │ │ │ │ │ │
│  │  │  │  │             │  │  │  │  │  Gridding      │ │ │ │ │ │ │ │
│  │  │  │  │             │  │  │  │  │  Splitting     │ │ │ │ │ │ │ │
│  │  │  │  │             │  │  │  │  │  VerletSurface │ │ │ │ │ │ │ │
│  │  │  │  │             │  │  │  │  └─────────────────┘ │ │ │ │ │ │ │
│  │  │  │  │             │  │  │  │     Leaf Surfaces    │ │ │ │ │ │ │
│  │  │  │  │             │  │  │  └─────────────────────┘ │ │ │ │ │ │
│  │  │  │  │             │  │  └─────────────────────────┘ │ │ │ │ │
│  │  │  │  └─────────────┘  └─────────────────────────────┘ │ │ │ │
│  │  │  └─────────────────────────────────────────────────┘ │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  Input System: Fingers -> Surface Hierarchy -> Events    │ │
│  │  Camera System: 3D Camera + 2D Ortho Controls            │ │
│  │  Physics System: Verlet Integration for Dynamic Layouts  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Roadmap

### Phase 1: Core Infrastructure
1. Set up Three.js project with TypeScript
2. Implement basic Surface hierarchy
3. Create WebGL canvas management
4. Basic input handling (mouse/touch)

### Phase 2: Rendering Pipeline
1. Implement Layer system
2. Add camera controls (3D and 2D)
3. Surface rendering and clipping
4. Basic container layouts

### Phase 3: Advanced Features
1. Physics integration (VerletSurface)
2. Complex input gestures
3. Performance optimizations
4. WebXR support

### Phase 4: Ecosystem
1. Widget library port
2. Documentation and examples
3. Testing framework
4. Community tools

## Key Technical Insights

1. **Unified 2D/3D**: The Java implementation successfully unifies 2D and 3D rendering through layered composition, which translates well to WebGL.

2. **Physics-Driven UI**: Verlet physics for layout provides natural, responsive interactions that would be compelling in web applications.

3. **Input Abstraction**: The Finger system provides a robust foundation for multi-modal input handling.

4. **Hierarchical Composition**: The surface/container system enables complex UI compositions with proper event propagation and rendering order.

5. **Performance Considerations**: The lazy layout system and efficient rendering pipeline are crucial for maintaining 60fps in web environments.

This architecture provides a solid foundation for building sophisticated web-based visualization and interaction systems with physics-inspired behaviors and unified 2D/3D rendering capabilities.
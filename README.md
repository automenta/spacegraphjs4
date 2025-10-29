# SpaceGraphJS4 - Enhanced Layout System, UI Components, and Physics Engine

This project extends the SpaceGraph JavaScript/WebGL engine with a comprehensive layout system, UI components, and physics engine.

## New Layout Containers

### BorderLayout
Arranges children in five regions: North, South, East, West, and Center.

```javascript
import { BorderLayout } from './layout/BorderLayout.js';

const borderContainer = new BorderLayout({ x: 6, y: 4 });
borderContainer.add(northPanel, 'north');
borderContainer.add(southPanel, 'south');
borderContainer.add(westPanel, 'west');
borderContainer.add(eastPanel, 'east');
borderContainer.add(centerPanel, 'center');
```

### GridLayout
Arranges children in a grid with customizable rows and columns.

```javascript
import { GridLayout } from './layout/GridLayout.js';

const gridContainer = new GridLayout({ x: 5, y: 4 }, 3, 3); // 3x3 grid
gridContainer.setSpacing(2, 2); // Set row and column spacing
```

### FlexLayout
Implements a flexible box layout similar to CSS Flexbox.

```javascript
import { FlexLayout } from './layout/FlexLayout.js';

const flexContainer = new FlexLayout({ x: 5, y: 3 });
flexContainer.setFlexOptions({ 
    direction: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center' 
});
```

## New UI Components

### Button
A clickable button with press/release states and click events.

```javascript
import { Button } from './components/Button.js';

const button = new Button("Click Me", { x: 100, y: 30 }, 0x4a86e8);
button.addEventListener('click', (event) => {
    console.log('Button clicked!');
});
```

### Slider
A draggable slider with value reporting.

```javascript
import { Slider } from './components/Slider.js';

const slider = new Slider({ x: 200, y: 20 }, 0, 100, 50); // min, max, initial
slider.addEventListener('change', (event) => {
    console.log('Slider value:', event.data.value);
});
```

### TextInput
A text input field with basic editing capabilities.

```javascript
import { TextInput } from './components/TextInput.js';

const textInput = new TextInput("Placeholder...", { x: 200, y: 30 });
textInput.addEventListener('input', (event) => {
    console.log('Text value:', event.data.value);
});
```

### ScrollableContainer
A container for large content with scrollbars.

```javascript
import { ScrollableContainer } from './components/ScrollableContainer.js';

const scrollable = new ScrollableContainer({ x: 200, y: 150 });
scrollable.setContentSize({ x: 200, y: 300 }); // Set content dimensions
```

## Physics Engine

### Verlet Physics System
A particle-based physics engine with constraints for realistic simulations.

```javascript
import { VerletPhysics, VerletParticle, SpringConstraint } from './physics/VerletPhysics.js';

// Create physics engine
const physics = new VerletPhysics();

// Create particles
const particleA = new VerletParticle(0, 0, 1);
const particleB = new VerletParticle(2, 0, 1);

// Add particles to physics
physics.addParticle(particleA);
physics.addParticle(particleB);

// Create spring constraint
const spring = new SpringConstraint(particleA, particleB, 1, 0.5);
physics.addConstraint(spring);

// Apply force to first particle
particleA.applyForce(new Vec2(10, 0));

// Update physics
physics.update(0.016);
```

### Physics Containers
Specialized containers for physics-enabled surfaces:

#### PhysicsContainer
General-purpose container with full physics simulation.

```javascript
import { PhysicsContainer } from './containers/PhysicsContainer.js';

const physicsContainer = new PhysicsContainer({ x: 10, y: 10 });
physicsContainer.setGravity(0, 0.5); // Set gravity
```

#### ForceDirectedLayoutContainer
Automatically arranges surfaces using force-directed algorithms.

```javascript
import { ForceDirectedLayoutContainer } from './containers/ForceDirectedLayoutContainer.js';

const forceContainer = new ForceDirectedLayoutContainer({ x: 10, y: 10 });
forceContainer.connectSurfaces(surfaceA, surfaceB); // Connect surfaces with springs
```

#### CollisionAwareContainer
Prevents surfaces from overlapping using physics-based collision detection.

```javascript
import { CollisionAwareContainer } from './containers/CollisionAwareContainer.js';

const collisionContainer = new CollisionAwareContainer({ x: 10, y: 10 });
```

### PhysicsSurface
Wrapper for making any surface physics-enabled.

```javascript
import { PhysicsSurface } from './PhysicsSurface.js';

const physicsSurface = new PhysicsSurface(existingSurface, { 
    mass: 2.0, 
    friction: 0.95 
});
```

### Physics Utilities
Helper functions for common physics operations:

```javascript
import { 
    applyForce, 
    applyImpulse, 
    createSpringConstraint, 
    applyRepulsion, 
    applyAttraction 
} from './physics/PhysicsUtils.js';

// Apply force to a surface
applyForce(surface, 10, 0);

// Create spring constraint between surfaces
createSpringConstraint(container, surfaceA, surfaceB, 50, 0.3);

// Apply repulsion between surfaces
applyRepulsion(surfaceA, surfaceB, 5.0, 100);
```

## Layout Utilities

Helper functions for common layout operations:

```javascript
import { LayoutUtils } from './layout/LayoutUtils.js';

// Center a surface
LayoutUtils.center(surface, containerBounds);

// Align surfaces
LayoutUtils.alignLeft(surface, containerBounds, padding);
LayoutUtils.alignRight(surface, containerBounds, padding);
LayoutUtils.alignTop(surface, containerBounds, padding);
LayoutUtils.alignBottom(surface, containerBounds, padding);

// Distribute surfaces
LayoutUtils.distributeHorizontally(surfaces, containerBounds, spacing);
LayoutUtils.distributeVertically(surfaces, containerBounds, spacing);
```

## Integration with Existing System

All new components integrate seamlessly with the existing scene graph, input handling, and camera systems. They follow the same patterns as existing surfaces and can be mixed with existing components.

## Running the Demo

1. Serve the project directory with a local web server
2. Open `demo/comprehensive-demo.html` in a browser to see the full demonstration
3. Open `demo/integration-tests.html` in a browser to run integration tests

See `demo/README.md` for detailed information about the demonstration features and controls.

## Architecture Notes

- All components extend the base `Surface` class
- Layout containers extend `ContainerSurface` with specialized layout algorithms
- Physics containers extend `ContainerSurface` with physics simulation capabilities
- Event handling follows the existing event propagation system
- Rendering integrates with the Three.js scene graph
- Input handling works with the existing finger/gesture recognition system
- Physics system operates independently but synchronizes with the scene graph

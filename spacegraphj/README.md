# SpaceGraph - Fractal Computer Interface & Dynamic Environment

SpaceGraph is a versatile Java-based framework for building dynamic, interactive applications with a focus on 2D and 3D environments. It combines a declarative UI composition model, inspired by Java2D, with OpenGL acceleration for high-performance graphics. Its architecture is designed for touch-first interaction and physics-inspired layouts and behaviors.

SpaceGraph is more than just a UI toolkit; it provides a rich ecosystem for creating simulations, data visualizations, interactive art, games, and complex user interfaces.

## Core Concepts

*   **Declarative UI**: Define user interfaces by composing `Surface` objects in a hierarchical scene graph.
*   **Hardware Acceleration**: Leverages JOGL for OpenGL rendering, ensuring smooth visuals and performance.
*   **Physics Integration**: Supports both 2D and 3D physics for dynamic layouts, interactions, and simulations.
*   **Rich I/O**: Built-in support for touch, gestures, keyboard, mouse, and an extensive audio engine.
*   **Extensibility**: Modular design allows for integration of various data sources, custom components, and external libraries.

## Core Architecture (ui module)

The `ui` module forms the heart of SpaceGraph:

*   **Surface Hierarchy**:
    *   `Surface`: Abstract base for all renderable and interactive elements, managing position, bounds, visibility, and parenting in the scene graph.
    *   `ContainerSurface`: Base for surfaces that contain and manage other surfaces, providing various layout strategies.
*   **Layout System**:
    *   Standard layouts: Bordering (N/S/E/W/Center), scrolling, resizable splitting.
    *   Dynamic layouts: Physics-inspired spring systems (`Springing`), circular/radial arrangements (`RingContainer`), and more.
*   **Input System**:
    *   `Finger`: Tracks touch/pointer states (press, release, drag) with normalized coordinates.
    *   `Fingering`: Base for custom gesture recognition.
    *   Keyboard and mouse event handling.
*   **Rendering Pipeline**:
    *   `JoglWindow`: Manages the OpenGL context, render loop, and multi-layer compositing.
    *   `Layer`: Interface for distinct rendering stages within the window.
    *   `ReSurface`: Propagates rendering context (transforms, culling) through the surface hierarchy.
*   **Audio Engine**:
    *   Comprehensive audio capabilities leveraging the "Beads" library and custom extensions.
    *   Supports audio synthesis, sample playback, MIDI, effects, and spatial audio.
*   **Bundled Libraries & Integrations**:
    *   **JOGL**: Core OpenGL bindings.
    *   **Toxiclibs (geom, math, physics2d)**: Utilities for 2D geometry, mathematical functions, and basic 2D physics.
    *   **Beads**: Advanced audio processing library.
    *   **t-SNE (jujutsu.tsne)**: For dimensionality reduction in visualizations.
    *   **JCTerm**: Terminal emulation capabilities.
    *   **Propero RDP**: Remote Desktop Protocol client functionality.

## Submodules

SpaceGraph is organized into the following main modules:

*   **`ui`**: The core UI framework, rendering engine, input handling, audio processing, and bundled libraries as described above. It provides the tools for building 2D interfaces and visualizations.
*   **`phy2d`**: Contains specialized 2D physics engine components, likely extending beyond the basic physics from Toxiclibs. This module powers the "physics-inspired layouts" and enables complex 2D dynamic simulations and interactions within SpaceGraph applications.
*   **`phy3d`**: Integrates the JBullet 3D physics engine (a Java port of Bullet Physics). This allows for the creation of 3D environments, simulations with rigid body dynamics, collision detection, and other 3D physical phenomena.

## Key Features

*   Declarative and hierarchical UI composition for 2D interfaces.
*   OpenGL accelerated rendering for high performance.
*   Integrated 2D and 3D physics engines for dynamic layouts and simulations.
*   Touch-optimized interaction model with gesture support.
*   Rich audio engine for synthesis, playback, and interactive sound.
*   Cross-platform compatibility (via Java and JOGL).
*   Support for terminal emulation and RDP client integration.
*   Tools for data visualization (e.g., t-SNE).

## Application Possibilities

SpaceGraph's flexible architecture opens up a wide range of application possibilities:

*   **Interactive Data Visualizations**: Create dynamic charts, graphs, and network visualizations that users can interact with physically.
*   **Physics-Based Games**: Develop 2D and 3D games with realistic physics interactions.
*   **Simulation Environments**: Build environments for simulating physical systems, agent-based models, or complex processes.
*   **Creative Coding & Generative Art**: An ideal platform for artists and creative coders to explore dynamic visuals and sound.
*   **Novel User Interfaces**: Design unconventional UIs that go beyond standard widgets, leveraging physics and spatial layouts.
*   **Educational Tools**: Create interactive learning modules for physics, mathematics, or computer science concepts.
*   **Remote System Interfaces**: Utilize its RDP and terminal capabilities to build interfaces for remote systems.
*   **Audio Applications**: Develop synthesizers, audio analysis tools, or interactive sound installations.

## Potential Future Development

*   **Enhanced 3D Scene Graph**: Further development of 3D scene management, lighting, and material systems beyond what JBullet directly provides.
*   **Improved Cross-Platform Support**: Streamlining dependencies and deployment for various operating systems.
*   **Expanded Widget Library**: Creation of more pre-built UI components for common use cases.
*   **Visual Editor/IDE Integration**: Tools to visually design and layout SpaceGraph scenes.
*   **Networked Multi-User Environments**: Built-in support for creating collaborative or shared virtual spaces.
*   **Integration with AI/ML Frameworks**: Easier ways to connect SpaceGraph environments with machine learning models for agent training or data-driven interactions.
*   **Documentation and Tutorials**: More comprehensive documentation, examples, and tutorials to lower the barrier to entry.
*   **WebAssembly/Browser Target**: Exploring possibilities for deploying SpaceGraph applications in web browsers.

SpaceGraph provides a powerful and unique foundation for developers looking to build visually rich and interactive applications that blend UI, physics, and multimedia.

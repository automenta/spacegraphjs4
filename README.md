# SpaceGraph.js

**SpaceGraph.js** is a minimalist JavaScript library for creating interactive 3D network visualizations and zooming user interfaces (ZUIs) in the browser. Built on top of [THREE.js](https://threejs.org/), it provides a simple API to render and navigate a scene of 3D objects and HTML elements.

The core navigation paradigm is **AutoZoom**: hover to highlight an object and click to smoothly fly the camera to frame it.

![SpaceGraph.js Demo](https://i.imgur.com/example.gif) <!-- Placeholder GIF -->

## Features

-   **Simple, Declarative API:** Define your scene with a plain JavaScript array of elements.
-   **AutoZoom Navigation:** A polished, intuitive click-to-zoom navigation experience.
-   **Multiple Node Types:** Render nodes as 3D shapes (boxes, spheres), sprites, images, videos, GLTF models, or HTML elements.
-   **HTML-in-3D:** Render rich HTML content as nodes in your 3D scene.
-   **Fisheye Lens Effect:** An optional fisheye lens effect to distort the view for focus and context.
-   **Lightweight:** Built on the powerful THREE.js library.
-   **UMD and ESM Bundles:** Works via a simple script tag or in a modern module-based workflow.

## Getting Started

The easiest way to use SpaceGraph.js is to include it in your HTML file with a `<script>` tag.

### 1. HTML Setup

Create a `<div>` in your HTML to serve as the container for your 3D scene.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SpaceGraph.js Example</title>
    <style>
        body { margin: 0; overflow: hidden; }
        #graph-container { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="graph-container"></div>

    <!-- 1. Include THREE.js (required peer dependency) -->
    <script src="https://unpkg.com/three@0.158.0/build/three.min.js"></script>

    <!-- 2. Include the SpaceGraph.js library -->
    <script src="path/to/your/dist/spacegraph.umd.js"></script>

    <script>
        // 3. Your application code
        const container = document.getElementById('graph-container');

        const myElements = [
            { id: 'hello', type: 'box', position: { x: -3, y: 0, z: 0 }, color: 0x00ff00, size: 1.5 },
            { id: 'world', type: 'sphere', position: { x: 3, y: 0, z: 0 }, color: 0xff00ff, size: 1 },
            { id: 'intro-text', type: 'html', position: { x: 0, y: 1.5, z: 0 }, htmlContent: '<div style="color: white; font-size: 24px;">Welcome!</div>' }
        ];

        // Instantiate the graph
        const graph = new SpaceGraph(container, { elements: myElements });
    </script>
</body>
</html>
```

### 2. Installation via npm

For use in a project with a build system, you can install SpaceGraph.js via npm.

```bash
npm install three spacegraph-js # (assuming spacegraph-js is the package name)
```

```javascript
import * as THREE from 'three';
import SpaceGraph from 'spacegraph-js';

const container = document.getElementById('my-container');
const graph = new SpaceGraph(container, { /* ... elements ... */ });
```

## API Reference

### `new SpaceGraph(container, options)`

Creates a new SpaceGraph instance.

-   `container` (HTMLElement): The DOM element to render the scene into.
-   `options` (Object):
    -   `elements` (Array): An optional array of element objects to initialize the scene with.
    -   `fisheye` (Object): Optional configuration for the fisheye lens effect.
        -   `enabled` (Boolean): Whether the effect is enabled. Defaults to `false`.
        -   `strength` (Number): The strength of the distortion. Defaults to `2.0`.
        -   `radius` (Number): The radius of the effect. Defaults to `500`.

### Element Object

An element is a plain JavaScript object with the following properties:

| Property      | Type     | Description                                             |
|---------------|----------|---------------------------------------------------------|
| `id`          | `String` | **Required.** A unique identifier for the element.      |
| `type`        | `String` | `'box'`, `'sphere'`, `'sprite'`, `'image'`, `'video'`, `'gltf'`, or `'html'`. |
| `position`    | `Object` | `{ x, y, z }` coordinates for the element.              |
| `color`       | `Number` | (For `box`/`sphere`/`sprite`) A hexadecimal color (e.g., `0xff0000`). |
| `size`        | `Number` | The size of the object.  |
| `htmlContent` | `String` | (For `html`) The HTML string to render.                 |
| `imageUrl`    | `String` | (For `sprite`/`image`) The URL of the image to display. |
| `videoUrl`    | `String` | (For `video`) The URL of the video to play.             |
| `gltfUrl`     | `String` | (For `gltf`) The URL of the GLTF model to load.         |

### Public Methods

-   `.add(element)`: Adds a new element to the scene.
-   `.remove(elementId)`: Removes an element from the scene by its ID.
-   `.update(elementId, props)`: Updates properties of an existing element.
-   `.goBack()`: Navigates the camera back to its previous position.
-   `.destroy()`: Stops the render loop and cleans up all resources.
-   `.on(eventName, callback)`: Listens for events.
    -   `element:click`: Fired when a clickable element is clicked. The callback receives an event object with an `id` property.

### **SpaceGraph.js: Definitive Implementation Plan (v1.0)**

#### **1. Vision & Mandate**

This plan is the definitive roadmap for building and shipping **SpaceGraph.js v1.0**. Its sole purpose is to produce a stable, minimal, and shippable Zooming User Interface (ZUI) library. The central interaction paradigm is **AutoZoom**, and all development effort will be directed toward perfecting this core experience.

**Guiding Principles:**
1.  **Do Less, Better:** Every feature must directly serve or enhance the core ZUI loop. All decorative or speculative functionality is rejected.
2.  **Internal Modularity, External Simplicity:** The internal architecture will be modular to enable future expansion, but the v1.0 public API will be minimal and focused.
3.  **Verify, Then Build:** Each phase concludes with a working, demonstrable artifact. This ensures a clear and steady path to completion.

---

#### **2. Core Concepts**

*   **`SpaceGraph`:** The public API. A single constructor that accepts a container DOM element and an optional initial specification.
*   **Element:** A node in the scene, defined by a plain JavaScript object:
    *   `id` (string, required, unique)
    *   `type` (`'box'`, `'sphere'`, or `'html'`)
    *   `position`: `{ x, y, z }`
    *   Other type-specific properties (`color`, `size`, `htmlContent`, etc.)
*   **AutoZoom:** The primary and *only* supported navigation mode for v1.0.
    1.  **Hover:** A subtle, non-intrusive frame appears around the element.
    2.  **Click:** The camera executes a smooth, animated flight to perfectly frame the element.
    3.  **Return:** A subsequent click on the same focused element, or a call to `goBack()`, triggers a smooth flight back to the previous view.

> **Critical Design Decision:** Default `OrbitControls` will be used *only* for internal development and will be disabled in production builds to enforce the intended ZUI navigation model.

---

#### **3. System Architecture**

A `SpaceGraph` instance orchestrates four tightly-scoped, single-responsibility modules. This design promotes testability and clarity.

```
+--------------------------+
|   SpaceGraph (Public API)  |
+--------------------------+
      | Delegates To |
      v              v
+-----------+    +-------------+    +---------------+    +---------------------+
| Renderer  |    | SceneManager|    | CameraManager |    | InteractionManager  |
+-----------+    +-------------+    +---------------+    +---------------------+
```

**Module Responsibilities:**

| Module               | Key Responsibilities                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Renderer`**       | Manages the `<canvas>`, `WebGLRenderer`, and optional `CSS3DRenderer`. Runs the `requestAnimationFrame` loop. Handles window resize events to update the camera and renderer size. |
| **`SceneManager`**   | Maintains the mapping of `element.id` to `THREE.Object3D`. Creates, updates, and removes visual objects. Manages the geometry of the single, reusable AutoZoom frame.         |
| **`CameraManager`**  | Holds the `THREE.PerspectiveCamera` and manages all animation state. Implements the core `flyTo(element)` and `goBack()` methods. Maintains a history stack for camera states. |
| **`InteractionManager`** | Listens to mouse events on the canvas. Performs raycasting to identify the hovered element. Manages hover state and triggers the `flyTo` action or dispatches `element:click`. |

> **Key Implementation Detail:** The AutoZoom frame will be a **single, reusable `THREE.LineSegments` object**. Its geometry and transform will be updated in-place when the hovered element changes. It is never destroyed or re-created, preventing performance stutter.

---

#### **4. Phased Implementation Roadmap**

##### **Phase 1: Render a Static Scene**
*   **Goal:** Validate the foundational Three.js setup.
*   **Tasks:**
    1.  Set up the project with `three` as the sole runtime dependency.
    2.  Implement the `Renderer` module to create a `<canvas>`, `WebGLRenderer`, `PerspectiveCamera`, and a basic `Scene`.
    3.  Implement a minimal `SceneManager` that adds one hardcoded `BoxGeometry` mesh to the scene.
    4.  The `SpaceGraph` constructor will accept a container element, initialize the modules, and mount the canvas.
    5.  Implement basic resize handling to update the renderer and camera aspect ratio.
*   **Done When:** A static red cube renders within the specified container element.

##### **Phase 2: Dynamic Scene via Public API**
*   **Goal:** Enable full programmatic control over the scene's contents.
*   **Tasks:**
    1.  The `SpaceGraph` constructor now accepts an optional `elements` array.
    2.  Implement the public API methods: `add(element)`, `remove(elementId)`, and `update(elementId, props)`.
    3.  Enhance `SceneManager` to create objects based on `element.type` (`'box'`, `'sphere'`). All objects will use `MeshBasicMaterial` for simplicity (no lighting).
    4.  Elements are positioned according to their `position` property.
*   **Done When:** Code like `graph.add({ id: 'A', type: 'sphere', ... })` and `graph.remove('A')` works reliably.

##### **Phase 3: AutoZoom Navigation (The Core Loop)**
*   **Goal:** Deliver the complete, polished ZUI navigation experience.
*   **Tasks:**
    1.  **`InteractionManager`:**
        *   Listen to `mousemove` and `click` events on the canvas.
        *   On `mousemove`, raycast to determine the `hoveredElementId`.
        *   On `click`, if `hoveredElementId` exists, call `cameraManager.flyTo(hoveredElementId)`.
    2.  **AutoZoom Frame Logic:**
        *   The `SceneManager` creates a single, hidden `THREE.LineSegments` object at initialization.
        *   When the `hoveredElementId` changes, compute the target's world-space bounding box and update the frame's position, scale, and visibility.
    3.  **`CameraManager.flyTo(elementId)`:**
        *   Get the target element's `THREE.Object3D`.
        *   Compute its bounding box using `new THREE.Box3().setFromObject(obj)`.
        *   Calculate the ideal camera distance to frame the object with a 20% padding.
        *   Animate the camera's position and `lookAt` target over ~500ms (using a simple lerp function or a minimal tweening library).
    4.  **History Stack:**
        *   Before `flyTo` begins, push the current camera state (`{ position, target }`) to a history stack (max depth: 10).
        *   Implement `goBack()` to pop from the stack and fly to the previous state.
        *   A double-click on the same element will also trigger `goBack()`.
*   **Done When:** The core ZUI loop is fully functional and feels smooth. Hovering shows a frame, clicking zooms, and `goBack()` returns.

##### **Phase 4: HTML Elements & Finalization**
*   **Goal:** Support rich content and prepare the API for release.
*   **Tasks:**
    1.  **Add `type: 'html'` support:**
        *   The `Renderer` will now manage both a `WebGLRenderer` and a `CSS3DRenderer`, compositing them in the same container.
        *   The `SceneManager` will create `THREE.CSS3DObject` instances for HTML elements.
        *   **Design Constraint:** HTML elements will be clickable (dispatching an `element:click` event) but will **not** participate in the AutoZoom framing/fly-to mechanism to avoid complexity. AutoZoom is for geometric primitives only.
    2.  **Finalize Public API:**
        *   `SpaceGraph(container, { elements })`
        *   `.add(element)`, `.remove(id)`, `.update(id, props)`
        *   `.goBack()`
        *   `.on(eventName, callback)` for `element:click` events.
        *   `.destroy()`: Implements comprehensive cleanup of renderers, event listeners, and animation loops.
*   **Done When:** HTML content can be displayed at a 3D position. The public API is stable. Calling `.destroy()` results in no memory leaks.

##### **Phase 5: Release v1.0**
*   **Goal:** Ship a production-ready, developer-friendly library.
*   **Tasks:**
    1.  Write minimal but complete **TypeScript definitions**.
    2.  Set up a build process (Vite or Rollup) to create a **single-file UMD/ESM bundle**.
    3.  Publish the package to npm.
    4.  Write a high-quality `README.md` with installation instructions, a 5-line "Hello World" example, and a concise API reference.
*   **Done When:** `npm install spacegraph-js` works and a developer can successfully integrate the library into a project.

---

#### **5. Explicitly Out of Scope for v1.0**

To ensure completion, the following features will **not** be implemented:
- Any form of HUD (REPL, log console).
- Reactive data binding patterns.
- Physics-based or automatic layout engines.
- Lighting, custom shaders, or post-processing effects.
- Touch/mobile support (desktop mouse-only).
- A plugin system or user-defined element types.

---

#### **6. Success Metrics for v1.0**

The project is complete and successful when:
- A developer can implement a functional ZUI with **fewer than 10 lines of JavaScript**.
- The AutoZoom navigation feels **instant, fluid, and predictable**.
- The final library bundle is **under 50 KB gzipped** (excluding the Three.js peer dependency).
- The `.destroy()` method ensures **no memory leaks** or dangling event listeners.

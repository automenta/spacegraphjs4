// src/config.js
import AnimationManager from './AnimationManager.js';
import CameraManager from './CameraManager.js';
import ControlsManager from './ControlsManager.js';
import FisheyeManager from './FisheyeManager.js';
import GraphManager from './GraphManager.js';
import InteractionManager from './InteractionManager.js';
import LayoutManager from './LayoutManager.js';
import MouseManager from './MouseManager.js';
import RaycastManager from './RaycastManager.js';
import Renderer from './Renderer.js';
import SceneManager from './SceneManager.js';

export const defaultConfig = {
    managers: {
        graph: GraphManager,
        scene: SceneManager,
        renderer: Renderer,
        interaction: InteractionManager,
        controls: ControlsManager,
        camera: CameraManager,
        layout: LayoutManager,
        fisheye: FisheyeManager,
        animation: AnimationManager,
        mouse: MouseManager,
        raycast: RaycastManager,
    },
    animation: {
        duration: 500,
    },
    camera: {
        initialPosition: { x: 0, y: 0, z: 1000 },
        near: 0.1,
        far: 10000,
        fov: 45,
        zoomSpeed: 0.002,
        zoom: {
            padding: 1.2,
        },
    },
    controls: {
        orbit: {
            enabled: true,
            ui: {
                label: 'Orbit Controls',
                type: 'toggle',
                manager: 'controls',
                key: 'orbit',
                setter: 'setOrbitControls',
                getter: 'isOrbitControlsEnabled',
            },
        },
        autoZoom: {
            enabled: true,
            ui: {
                label: 'AutoZoom',
                type: 'toggle',
                manager: 'controls',
                key: 'autoZoom',
                setter: 'setAutoZoom',
                getter: 'isAutoZoomEnabled',
            },
        },
    },
    interaction: {
        doubleClickTimeout: 300,
        dragThreshold: 5,
    },
    scope: {
        fadeDuration: 250,
        outOfScopeOpacity: 0.1,
    },
    fisheye: {
        enabled: false,
        strength: 2.0,
        radius: 500,
        ui: {
            label: 'Fisheye Effect',
            type: 'toggle',
            manager: 'fisheye',
            key: 'fisheye',
            setter: 'setEnabled',
            getter: 'isEnabled',
        },
    },
    styles: {
        default: {
            node: { type: 'box', color: 0xcccccc, size: 10 },
            edge: { color: 0xffffff, dashed: false },
        },
        rules: [
            {
                property: 'type',
                value: 'person',
                style: {
                    node: { color: 0x00ff00 },
                },
            },
        ],
    },
    layout: {
        alpha: 1,
        alphaDecay: 0.0228,
        velocityDecay: 0.6,
        force: {
            charge: -120,
            link: 1,
            collide: 1,
        },
    },
    renderer: {
        antialias: true,
        alpha: true,
        bloom: {
            enabled: false,
            strength: 0.5,
            radius: 0.5,
            threshold: 0.5,
            ui: {
                label: 'Bloom Effect',
                type: 'toggle',
                manager: 'renderer',
                key: 'bloom',
                setter: 'setBloom',
                getter: 'isBloomEnabled',
            },
        },
        backgroundColor: '#000000',
    },
    scene: {
        lighting: {
            ambient: { color: 0xffffff, intensity: 0.5 },
            directional: { color: 0xffffff, intensity: 1, position: { x: 5, y: 10, z: 7.5 } },
        },
        hover: {
            color: 0x00ffff,
            scale: 1.1,
        },
    },
};

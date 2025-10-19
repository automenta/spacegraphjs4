export const defaultConfig = {
    camera: {
        initialPosition: { x: 0, y: 0, z: 1000 },
        near: 0.1,
        far: 10000,
        fov: 45,
        animationDuration: 500,
        zoomSpeed: 0.002,
        zoom: {
            padding: 1.2, // Tighter frame
        },
    },
    controls: {
        orbit: {
            enabled: true,
            enableDamping: true,
            dampingFactor: 0.05,
            screenSpacePanning: false,
            enableZoom: true,
            enablePan: true,
            enableRotate: true,
        },
        autoZoom: {
            enabled: true,
        },
    },
    interaction: {
        dragThreshold: 2, // pixels
        doubleClickTimeout: 300, // ms
    },
    scope: {
        fadeDuration: 250, // ms
        outOfScopeOpacity: 0.1,
    },
    fisheye: {
        enabled: false,
        strength: 2.0,
        radius: 500,
    },
    styles: {
        default: {
            node: {
                type: 'box',
                color: 0xcccccc,
                size: 10,
            },
            edge: {
                color: 0xffffff,
                dashed: false,
            },
        },
        rules: [
            {
                property: 'type',
                value: 'person',
                style: {
                    node: {
                        color: 0x00ff00,
                    },
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
        },
        backgroundColor: '#000000',
    },
    scene: {
        lighting: {
            ambient: {
                color: 0xffffff,
                intensity: 0.5,
            },
            directional: {
                color: 0xffffff,
                intensity: 1,
                position: { x: 5, y: 10, z: 7.5 },
            },
        },
        hover: {
            color: 0x00ffff,
            scale: 1.1,
        },
    },
};

const defaultConfig = {
    graph: {
        backgroundColor: 0x000000,
        elements: [],
    },
    camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
        position: {
            x: 0,
            y: 0,
            z: 35,
        },
        flyTo: {
            duration: 500,
            easing: 'Quadratic.InOut',
        },
    },
    renderer: {
        bloom: {
            enabled: false,
            strength: 1.5,
            radius: 0.4,
            threshold: 0.85,
        },
    },
    layout: {
        link: {
            distance: 10,
        },
        charge: {
            strength: -15,
        },
    },
    interactions: {
        html: {
            pointerEvents: 'auto',
        },
    },
    objects: {
        defaults: {
            color: 0xffffff,
            size: 1,
            htmlContent: '',
        },
        edge: {
            dashed: false,
            dashSize: 0.5,
            gapSize: 0.25,
        },
    },
};

function mergeConfig(userConfig) {
    const config = { ...defaultConfig };
    for (const key in userConfig) {
        if (userConfig.hasOwnProperty(key)) {
            if (typeof userConfig[key] === 'object' && userConfig[key] !== null && !Array.isArray(userConfig[key])) {
                config[key] = { ...config[key], ...userConfig[key] };
            } else {
                config[key] = userConfig[key];
            }
        }
    }
    return config;
}

export { defaultConfig, mergeConfig };
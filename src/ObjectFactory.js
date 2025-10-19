import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Simple deep merge for styles
function deepMerge(target, source) {
    const output = { ...target };
    if (target && source && typeof target === 'object' && typeof source === 'object') {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && key in target && target[key] && typeof target[key] === 'object') {
                output[key] = deepMerge(target[key], source[key]);
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
}

const nodeCreators = {
    html: (data, style) => {
        const element = document.createElement('div');
        element.innerHTML = data.htmlContent || style.htmlContent;
        const object = new CSS3DObject(element);
        object.userData = { id: data.id, type: 'html' };
        return object;
    },
    box: (data, style) => {
        const geometry = new THREE.BoxGeometry(style.size, style.size, style.size);
        const material = new THREE.MeshStandardMaterial({
            color: style.color,
            transparent: true,
            opacity: 1,
        });
        const object = new THREE.Mesh(geometry, material);
        object.userData = { id: data.id, type: 'box' };
        return object;
    },
    sphere: (data, style) => {
        const geometry = new THREE.SphereGeometry(style.size / 2, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: style.color,
            transparent: true,
            opacity: 1,
        });
        const object = new THREE.Mesh(geometry, material);
        object.userData = { id: data.id, type: 'sphere' };
        return object;
    },
    sprite: (data, style) => {
        const texture = new THREE.TextureLoader().load(data.imageUrl);
        const material = new THREE.SpriteMaterial({ map: texture, color: style.color });
        const object = new THREE.Sprite(material);
        object.scale.set(style.size, style.size, style.size);
        object.userData = { id: data.id, type: 'sprite' };
        return object;
    },
    gltf: (data, style) => {
        const loader = new GLTFLoader();
        const object = new THREE.Object3D();
        loader.load(data.gltfUrl, (gltf) => {
            gltf.scene.scale.set(style.size, style.size, style.size);
            object.add(gltf.scene);
        });
        object.userData = { id: data.id, type: 'gltf' };
        return object;
    },
    image: (data, style) => {
        const geometry = new THREE.PlaneGeometry(style.size, style.size);
        const texture = new THREE.TextureLoader().load(data.imageUrl);
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const object = new THREE.Mesh(geometry, material);
        object.userData = { id: data.id, type: 'image' };
        return object;
    },
    video: (data, style) => {
        const video = document.createElement('video');
        video.src = data.videoUrl;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.play();
        const texture = new THREE.VideoTexture(video);
        const geometry = new THREE.PlaneGeometry(style.size, style.size);
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const object = new THREE.Mesh(geometry, material);
        object.userData = { id: data.id, type: 'video' };
        return object;
    }
};

class ObjectFactory {
    constructor(styles) {
        this.styles = styles;
    }

    _getStyle(data) {
        // Start with the default style for a node
        let style = deepMerge({}, this.styles.default.node);

        // Apply rules that match the data
        this.styles.rules.forEach(rule => {
            if (data[rule.property] === rule.value) {
                style = deepMerge(style, rule.style.node);
            }
        });

        // Apply direct properties from the data object as final overrides
        style.color = data.color || style.color;
        style.size = data.size || data.width || data.height || data.depth || style.size;
        style.type = data.type || style.type;
        if (data.htmlContent) {
            style.htmlContent = data.htmlContent;
        }

        return style;
    }

    create(data) {
        const style = this._getStyle(data);
        const creator = nodeCreators[style.type];

        if (creator) {
            const object = creator(data, style);
            // Default position, will be updated by layout manager
            object.position.set(0, 0, 0);
            return object;
        }

        console.warn(`No creator found for node type: ${style.type}`);
        return null;
    }
}

export default ObjectFactory;

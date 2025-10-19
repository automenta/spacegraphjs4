import * as THREE from 'three';
import { deepMerge } from './utils.js';
import * as nodeCreators from './node_types/index.js';

class ObjectFactory {
    constructor(styles) {
        this.styles = styles;
        this.creators = {
            html: nodeCreators.createHtmlNode,
            box: nodeCreators.createBoxNode,
            sphere: nodeCreators.createSphereNode,
            sprite: nodeCreators.createSpriteNode,
            gltf: nodeCreators.createGltfNode,
            image: nodeCreators.createImageNode,
            video: nodeCreators.createVideoNode,
        };
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
        const creator = this.creators[style.type];

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

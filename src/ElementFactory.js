import * as THREE from 'three';
import { deepMerge } from './utils.js';
import * as nodeCreators from './node_types/index.js';

class ElementFactory {
    constructor(styles) {
        this.styles = styles;
        this.creators = {
            // Node creators
            html: nodeCreators.createHtmlNode,
            box: nodeCreators.createBoxNode,
            sphere: nodeCreators.createSphereNode,
            sprite: nodeCreators.createSpriteNode,
            gltf: nodeCreators.createGltfNode,
            image: nodeCreators.createImageNode,
            video: nodeCreators.createVideoNode,

            // Edge creators
            edge: this._createEdge.bind(this),
        };
    }

    _getStyle(element) {
        const elementType = element.type === 'edge' ? 'edge' : 'node';

        // 1. Start with a deep copy of the default style
        const defaultStyle = deepMerge({}, this.styles.default[elementType] || {});

        // 2. Find and apply matching rule styles
        const ruleStyle = this.styles.rules
            .filter(rule => element.hasOwnProperty(rule.property) && element[rule.property] === rule.value)
            .reduce((acc, rule) => deepMerge(acc, rule.style && rule.style[elementType] ? rule.style[elementType] : {}), {});

        // 3. Extract direct style overrides from the element itself.
        // This is the most specific style and should override all others.
        const elementStyle = {};
        const potentialStyleKeys = { ...defaultStyle, ...ruleStyle };
        for (const key in potentialStyleKeys) {
            if (element.hasOwnProperty(key)) {
                elementStyle[key] = element[key];
            }
        }

        // 4. Merge all styles together in order of increasing specificity.
        return deepMerge(defaultStyle, ruleStyle, elementStyle);
    }

    create(element, elements) {
        const style = this._getStyle(element);
        const creator = this.creators[style.type] || this.creators[element.type];

        if (creator) {
            const object = creator(element, style, elements);
            object.userData = { ...element };
            return object;
        }

        console.warn(`No creator found for element type: ${style.type || element.type}`);
        return null;
    }

    update(object, props) {
        if (props.color && object.material && object.material.color) {
            object.material.color.set(props.color);
        }

        if (props.htmlContent && object instanceof CSS3DObject) {
            object.element.innerHTML = props.htmlContent;
        }
    }

    _createEdge(edgeData, style, elements) {
        const sourceNode = elements.get(edgeData.source);
        const targetNode = elements.get(edgeData.target);

        if (!sourceNode || !targetNode) {
            console.warn(`Edge ${edgeData.id} cannot be created: source or target node not found yet.`);
            return null;
        }

        // Use dummy points for initialization; _updateEdgeGeometry will set the correct points.
        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);

        const material = style.dashed
            ? new THREE.LineDashedMaterial({ color: style.color, dashSize: 0.5, gapSize: 0.2 })
            : new THREE.LineBasicMaterial({ color: style.color });

        const line = new THREE.Line(geometry, material);

        this._updateEdgeGeometry(line, sourceNode, targetNode);

        return line;
    }

    _updateEdgeGeometry(edge, sourceNode, targetNode) {
        if (!sourceNode || !targetNode) return;

        const sourceSphere = new THREE.Sphere();
        new THREE.Box3().setFromObject(sourceNode, true).getBoundingSphere(sourceSphere);
        const sourceCenter = sourceSphere.center;
        const sourceRadius = sourceSphere.radius;

        const targetSphere = new THREE.Sphere();
        new THREE.Box3().setFromObject(targetNode, true).getBoundingSphere(targetSphere);
        const targetCenter = targetSphere.center;
        const targetRadius = targetSphere.radius;

        const dir = new THREE.Vector3().subVectors(targetCenter, sourceCenter);
        const distance = dir.length();
        dir.normalize();

        // If nodes are overlapping or one is inside another, connect centers
        let startPoint = sourceCenter;
        let endPoint = targetCenter;

        // A small epsilon prevents z-fighting if nodes are touching
        if (distance > sourceRadius + targetRadius + 1e-3) {
            startPoint = sourceCenter.clone().add(dir.clone().multiplyScalar(sourceRadius));
            endPoint = targetCenter.clone().sub(dir.clone().multiplyScalar(targetRadius));
        }

        const positions = edge.geometry.attributes.position;
        positions.setXYZ(0, startPoint.x, startPoint.y, startPoint.z);
        positions.setXYZ(1, endPoint.x, endPoint.y, endPoint.z);
        positions.needsUpdate = true;
        if (edge.material.isLineDashedMaterial) {
            edge.computeLineDistances();
        }
    }
}

export default ElementFactory;

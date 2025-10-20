import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { createNode } from './createNode.js';

export function createHtmlNode(element, style) {
    const domElement = document.createElement('div');
    domElement.innerHTML = element.htmlContent || style.htmlContent;
    const object = new CSS3DObject(domElement);
    return createNode(element, object);
}

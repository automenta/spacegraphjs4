import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

export function createHtmlNode(data, style) {
    const element = document.createElement('div');
    element.innerHTML = data.htmlContent || style.htmlContent;
    const object = new CSS3DObject(element);
    object.userData = { id: data.id, type: 'html' };
    return object;
}

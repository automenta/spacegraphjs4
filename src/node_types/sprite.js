import * as THREE from 'three';
import { createNode } from './createNode.js';

export function createSpriteNode(element, style) {
    const texture = new THREE.TextureLoader().load(element.imageUrl);
    const material = new THREE.SpriteMaterial({ map: texture, color: style.color, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(style.size, style.size, 1);
    return createNode(element, sprite);
}

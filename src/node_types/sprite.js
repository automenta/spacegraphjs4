import * as THREE from 'three';

export function createSpriteNode(data, style) {
    const texture = new THREE.TextureLoader().load(data.imageUrl);
    const material = new THREE.SpriteMaterial({ map: texture, color: style.color });
    const object = new THREE.Sprite(material);
    object.scale.set(style.size, style.size, style.size);
    object.userData = { id: data.id, type: 'sprite' };
    return object;
}

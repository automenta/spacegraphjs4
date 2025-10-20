import * as THREE from 'three';
import { createNode } from './createNode.js';

export function createVideoNode(element, style) {
    const video = document.createElement('video');
    video.src = element.videoUrl;
    video.crossOrigin = 'anonymous'; // Required for video textures
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.play();

    const texture = new THREE.VideoTexture(video);
    const geometry = new THREE.PlaneGeometry(style.size, style.size);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    return createNode(element, mesh);
}

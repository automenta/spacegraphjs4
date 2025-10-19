import * as THREE from 'three';

export function createVideoNode(data, style) {
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

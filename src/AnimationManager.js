import TWEEN from '@tweenjs/tween.js';

class AnimationManager {
    constructor() {
        this.tweens = new Set();
    }

    createTween(from, to, duration, easing = TWEEN.Easing.Quadratic.InOut) {
        const tween = new TWEEN.Tween(from)
            .to(to, duration)
            .easing(easing)
            .onComplete(() => {
                this.tweens.delete(tween);
            });
        this.tweens.add(tween);
        return tween;
    }

    update(time) {
        TWEEN.update(time);
    }

    destroy() {
        this.tweens.forEach(tween => tween.stop());
        this.tweens.clear();
    }
}

export default AnimationManager;

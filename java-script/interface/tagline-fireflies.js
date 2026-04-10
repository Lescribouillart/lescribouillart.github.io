(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const taglines = document.querySelectorAll('.tagline');

        if (!taglines.length) {
            return;
        }

        taglines.forEach(function(tagline) {
            let lastSpawnAt = 0;

            tagline.addEventListener('mousemove', function(event) {
                const rect = tagline.getBoundingClientRect();
                const offsetX = event.clientX - rect.left;
                const offsetY = event.clientY - rect.top;
                const midY = rect.height / 2;
                const isNearGlowHeight = Math.abs(offsetY - midY) <= 14;
                const isLeftGlow = offsetX <= 12;
                const isRightGlow = offsetX >= rect.width - 12;

                if (!isNearGlowHeight || (!isLeftGlow && !isRightGlow)) {
                    return;
                }

                const now = performance.now();

                if (now - lastSpawnAt < 90) {
                    return;
                }

                lastSpawnAt = now;
                createFirefly(tagline, isLeftGlow ? 'left' : 'right');
            });
        });

        function createFirefly(tagline, side) {
            const firefly = document.createElement('span');
            const size = 4 + Math.random() * 4;
            const driftX = (side === 'left' ? -1 : 1) * (12 + Math.random() * 26);
            const driftY = (Math.random() * 24) - 12;
            const duration = 850 + Math.random() * 500;
            const startX = side === 'left' ? 0 : tagline.clientWidth;
            const startY = (tagline.clientHeight / 2) + ((Math.random() * 10) - 5);

            firefly.className = 'tagline-firefly';
            firefly.style.left = `${startX}px`;
            firefly.style.top = `${startY}px`;
            firefly.style.setProperty('--firefly-size', `${size}px`);
            firefly.style.setProperty('--firefly-x', `${driftX}px`);
            firefly.style.setProperty('--firefly-y', `${driftY}px`);
            firefly.style.setProperty('--firefly-duration', `${duration}ms`);

            tagline.appendChild(firefly);

            firefly.addEventListener('animationend', function() {
                firefly.remove();
            });
        }
    });
})();
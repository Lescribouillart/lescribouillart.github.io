(function() {
    'use strict';

    const LEAF_SPAWN_INTERVAL = 2560;

    document.addEventListener('DOMContentLoaded', function() {
        const taglines = document.querySelectorAll('.tagline');
        const script = document.currentScript || document.querySelector('script[src*="tagline-fireflies.js"]');
        const leafImageUrl = script ? new URL('../../images/icons/feuille.png', script.src).href : 'images/icons/feuille.png';

        if (!taglines.length) {
            return;
        }

        taglines.forEach(function(tagline) {
            let activeSide = null;
            let spawnTimer = null;

            tagline.addEventListener('mousemove', function(event) {
                const hoveredSide = getHoveredGlowSide(tagline, event);

                if (!hoveredSide) {
                    stopLeafStream();
                    return;
                }

                activeSide = hoveredSide;
                startLeafStream();
            });

            tagline.addEventListener('mouseleave', function() {
                stopLeafStream();
            });

            function startLeafStream() {
                if (spawnTimer) {
                    return;
                }

                createLeaf(tagline, activeSide, leafImageUrl);
                spawnTimer = window.setInterval(function() {
                    if (!activeSide) {
                        stopLeafStream();
                        return;
                    }

                    createLeaf(tagline, activeSide, leafImageUrl);
                }, LEAF_SPAWN_INTERVAL);
            }

            function stopLeafStream() {
                activeSide = null;

                if (!spawnTimer) {
                    return;
                }

                window.clearInterval(spawnTimer);
                spawnTimer = null;
            }
        });

        function getHoveredGlowSide(tagline, event) {
            const rect = tagline.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const offsetY = event.clientY - rect.top;
            const midY = rect.height / 2;
            const isNearGlowHeight = Math.abs(offsetY - midY) <= 14;
            const isLeftGlow = offsetX <= 12;
            const isRightGlow = offsetX >= rect.width - 12;

            if (!isNearGlowHeight || (!isLeftGlow && !isRightGlow)) {
                return null;
            }

            return isLeftGlow ? 'left' : 'right';
        }

        function createLeaf(tagline, side, leafImageUrl) {
            const leaf = document.createElement('span');
            const size = 18 + Math.random() * 12;
            const sideDirection = side === 'left' ? 1 : -1;
            const trajectory = pickTrajectory(sideDirection);
            const duration = 4600 + Math.random() * 2200;
            const startX = side === 'left' ? 0 : tagline.clientWidth;
            const startY = (tagline.clientHeight / 2) + ((Math.random() * 14) - 7);
            const rotationDirection = Math.random() < 0.5 ? -1 : 1;
            const rotationStart = rotationDirection * (8 + Math.random() * 16);
            const rotationOne = rotationStart + (rotationDirection * (10 + Math.random() * 18));
            const rotationTwo = rotationOne - (rotationDirection * (14 + Math.random() * 20));
            const rotationThree = rotationTwo + (rotationDirection * (12 + Math.random() * 20));
            const rotationEnd = rotationThree + (rotationDirection * (8 + Math.random() * 18));

            leaf.className = 'tagline-leaf';
            leaf.style.left = `${startX}px`;
            leaf.style.top = `${startY}px`;
            leaf.style.setProperty('--leaf-size', `${size}px`);
            leaf.style.setProperty('--leaf-x-1', `${trajectory.x1}px`);
            leaf.style.setProperty('--leaf-y-1', `${trajectory.y1}px`);
            leaf.style.setProperty('--leaf-x-2', `${trajectory.x2}px`);
            leaf.style.setProperty('--leaf-y-2', `${trajectory.y2}px`);
            leaf.style.setProperty('--leaf-x-3', `${trajectory.x3}px`);
            leaf.style.setProperty('--leaf-y-3', `${trajectory.y3}px`);
            leaf.style.setProperty('--leaf-x-end', `${trajectory.endX}px`);
            leaf.style.setProperty('--leaf-y-end', `${trajectory.endY}px`);
            leaf.style.setProperty('--leaf-rotate-start', `${rotationStart}deg`);
            leaf.style.setProperty('--leaf-rotate-one', `${rotationOne}deg`);
            leaf.style.setProperty('--leaf-rotate-two', `${rotationTwo}deg`);
            leaf.style.setProperty('--leaf-rotate-three', `${rotationThree}deg`);
            leaf.style.setProperty('--leaf-rotate-end', `${rotationEnd}deg`);
            leaf.style.setProperty('--leaf-duration', `${duration}ms`);
            leaf.style.setProperty('--leaf-delay', `${Math.random() * 140}ms`);
            leaf.style.setProperty('--leaf-image', `url("${leafImageUrl}")`);

            tagline.appendChild(leaf);

            leaf.addEventListener('animationend', function() {
                leaf.remove();
            });
        }

        function pickTrajectory(sideDirection) {
            const lanes = [
                createDirectionalPath(sideDirection, 0, 28, 96, 0.18),
                createDirectionalPath(sideDirection, -75, 24, 92, 0.22),
                createDirectionalPath(sideDirection, 75, 24, 94, 0.22),
                createDirectionalPath(-sideDirection, 0, 26, 88, 0.2)
            ];

            return lanes[Math.floor(Math.random() * lanes.length)];
        }

        function createDirectionalPath(horizontalDirection, verticalAngle, minRadius, maxRadius, curveStrength) {
            const angleJitter = (Math.random() * 18) - 9;
            const angle = (verticalAngle + angleJitter) * (Math.PI / 180);
            const baseRadius = minRadius + Math.random() * (maxRadius - minRadius);
            const axisX = Math.cos(angle) * baseRadius * horizontalDirection;
            const axisY = Math.sin(angle) * baseRadius;
            const normalX = -Math.sin(angle);
            const normalY = Math.cos(angle);
            const sway = ((Math.random() * 2) - 1) * baseRadius * curveStrength;
            const swayTwo = ((Math.random() * 2) - 1) * baseRadius * (curveStrength + 0.08);
            const swayThree = ((Math.random() * 2) - 1) * baseRadius * (curveStrength + 0.12);

            return {
                x1: (axisX * 0.22) + (normalX * sway),
                y1: (axisY * 0.22) + (normalY * sway),
                x2: (axisX * 0.48) - (normalX * swayTwo),
                y2: (axisY * 0.48) - (normalY * swayTwo),
                x3: (axisX * 0.76) + (normalX * swayThree),
                y3: (axisY * 0.76) + (normalY * swayThree),
                endX: axisX + (normalX * (((Math.random() * 2) - 1) * baseRadius * 0.16)),
                endY: axisY + (normalY * (((Math.random() * 2) - 1) * baseRadius * 0.16))
            };
        }
    });
})();
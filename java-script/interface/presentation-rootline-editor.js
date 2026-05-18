(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const rootline = document.querySelector('.presentation-rootline');
        const cloneRootline = document.querySelector('[data-rootline-clone]');
        const cloneStorageKey = 'presentationRootlineCloneState';
        const defaultCloneState = {
            x: 480,
            y: 180,
            rotation: 0
        };

        if (!rootline || !cloneRootline) {
            return;
        }

        let cloneState = {
            x: defaultCloneState.x,
            y: defaultCloneState.y,
            rotation: defaultCloneState.rotation
        };
        let activeDrag = null;

        function clampValue(value) {
            if (!Number.isFinite(value)) {
                return 0;
            }

            return Math.round(value);
        }

        function applyCloneState() {
            if (!cloneRootline) {
                return;
            }

            cloneRootline.style.setProperty('--presentation-rootline-clone-x', cloneState.x + 'px');
            cloneRootline.style.setProperty('--presentation-rootline-clone-y', cloneState.y + 'px');
            cloneRootline.style.setProperty('--presentation-rootline-clone-rotation', cloneState.rotation + 'deg');
        }

        function saveCloneState() {
            if (!cloneRootline) {
                return;
            }

            window.localStorage.setItem(cloneStorageKey, JSON.stringify(cloneState));
        }

        function loadCloneState() {
            if (!cloneRootline) {
                return;
            }

            try {
                const savedState = JSON.parse(window.localStorage.getItem(cloneStorageKey) || 'null');

                if (!savedState) {
                    return;
                }

                cloneState = {
                    x: clampValue(savedState.x),
                    y: clampValue(savedState.y),
                    rotation: clampValue(savedState.rotation)
                };
            } catch (error) {
                cloneState = {
                    x: defaultCloneState.x,
                    y: defaultCloneState.y,
                    rotation: defaultCloneState.rotation
                };
            }
        }

        function startCloneDrag(event) {
            if (!cloneRootline || event.button !== 0) {
                return;
            }

            activeDrag = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startOffsetX: cloneState.x,
                startOffsetY: cloneState.y
            };

            cloneRootline.classList.add('is-dragging');
            cloneRootline.setPointerCapture(event.pointerId);
            event.preventDefault();
        }

        function updateDrag(event) {
            if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
                return;
            }

            const deltaX = event.clientX - activeDrag.startX;
            const deltaY = event.clientY - activeDrag.startY;

            cloneState.x = clampValue(activeDrag.startOffsetX + deltaX);
            cloneState.y = clampValue(activeDrag.startOffsetY + deltaY);
            applyCloneState();
        }

        function endDrag(event) {
            if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
                return;
            }

            cloneRootline.classList.remove('is-dragging');
            cloneRootline.releasePointerCapture(event.pointerId);
            saveCloneState();
            activeDrag = null;
        }

        function resetClone() {
            cloneState = {
                x: defaultCloneState.x,
                y: defaultCloneState.y,
                rotation: defaultCloneState.rotation
            };
            applyCloneState();
            saveCloneState();
        }

        function rotateClone(event) {
            if (!cloneRootline) {
                return;
            }

            cloneState.rotation = clampValue(cloneState.rotation + (event.deltaY > 0 ? 5 : -5));
            applyCloneState();
            saveCloneState();
            event.preventDefault();
        }

        loadCloneState();
        applyCloneState();

        cloneRootline.title = 'Glissez pour deplacer l angle duplique. Molette pour pivoter. Double-clic pour reinitialiser.';
        cloneRootline.addEventListener('pointerdown', startCloneDrag);
        cloneRootline.addEventListener('wheel', rotateClone, { passive: false });
        cloneRootline.addEventListener('dblclick', resetClone);

        window.addEventListener('pointermove', updateDrag);
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
    });
})();

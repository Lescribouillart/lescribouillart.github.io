(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const rootline = document.querySelector('.presentation-rootline');
        const cloneRootline = document.querySelector('[data-rootline-clone]');
        const pieces = Array.from(document.querySelectorAll('[data-rootline-piece]'));
        const storageKey = 'presentationRootlineOffsets';
        const cloneStorageKey = 'presentationRootlineCloneState';
        const defaultOffsets = {
            horizontal: { x: 680, y: 14 },
            vertical: { x: 836, y: 14 }
        };
        const defaultCloneState = {
            x: 480,
            y: 180,
            rotation: 0
        };

        if (!rootline || pieces.length === 0) {
            return;
        }

        let offsets = {
            horizontal: { x: defaultOffsets.horizontal.x, y: defaultOffsets.horizontal.y },
            vertical: { x: defaultOffsets.vertical.x, y: defaultOffsets.vertical.y }
        };
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

        function applyOffsets() {
            rootline.style.setProperty('--presentation-rootline-horizontal-x', offsets.horizontal.x + 'px');
            rootline.style.setProperty('--presentation-rootline-horizontal-y', offsets.horizontal.y + 'px');
            rootline.style.setProperty('--presentation-rootline-vertical-x', offsets.vertical.x + 'px');
            rootline.style.setProperty('--presentation-rootline-vertical-y', offsets.vertical.y + 'px');
        }

        function applyCloneState() {
            if (!cloneRootline) {
                return;
            }

            cloneRootline.style.setProperty('--presentation-rootline-clone-x', cloneState.x + 'px');
            cloneRootline.style.setProperty('--presentation-rootline-clone-y', cloneState.y + 'px');
            cloneRootline.style.setProperty('--presentation-rootline-clone-rotation', cloneState.rotation + 'deg');
        }

        function saveOffsets() {
            window.localStorage.setItem(storageKey, JSON.stringify(offsets));
        }

        function saveCloneState() {
            if (!cloneRootline) {
                return;
            }

            window.localStorage.setItem(cloneStorageKey, JSON.stringify(cloneState));
        }

        function loadOffsets() {
            try {
                const savedOffsets = JSON.parse(window.localStorage.getItem(storageKey) || 'null');

                if (!savedOffsets) {
                    return;
                }

                offsets = {
                    horizontal: {
                        x: clampValue(savedOffsets.horizontal && savedOffsets.horizontal.x),
                        y: clampValue(savedOffsets.horizontal && savedOffsets.horizontal.y)
                    },
                    vertical: {
                        x: clampValue(savedOffsets.vertical && savedOffsets.vertical.x),
                        y: clampValue(savedOffsets.vertical && savedOffsets.vertical.y)
                    }
                };
            } catch (error) {
                offsets = {
                    horizontal: { x: defaultOffsets.horizontal.x, y: defaultOffsets.horizontal.y },
                    vertical: { x: defaultOffsets.vertical.x, y: defaultOffsets.vertical.y }
                };
            }
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

        function startDrag(event, piece) {
            if (event.button !== 0) {
                return;
            }

            const key = piece.dataset.rootlinePiece;
            activeDrag = {
                key: key,
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startOffsetX: offsets[key].x,
                startOffsetY: offsets[key].y,
                piece: piece
            };

            piece.classList.add('is-dragging');
            piece.setPointerCapture(event.pointerId);
            event.preventDefault();
        }

        function startCloneDrag(event) {
            if (!cloneRootline || event.button !== 0) {
                return;
            }

            activeDrag = {
                type: 'clone',
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startOffsetX: cloneState.x,
                startOffsetY: cloneState.y,
                piece: cloneRootline
            };

            cloneRootline.classList.add('is-dragging');
            cloneRootline.setPointerCapture(event.pointerId);
            event.preventDefault();
        }

        function updateDrag(event) {
            if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
                return;
            }

            if (activeDrag.type === 'clone') {
                cloneState = {
                    x: clampValue(activeDrag.startOffsetX + (event.clientX - activeDrag.startX)),
                    y: clampValue(activeDrag.startOffsetY + (event.clientY - activeDrag.startY)),
                    rotation: cloneState.rotation
                };

                applyCloneState();
                return;
            }

            offsets[activeDrag.key] = {
                x: clampValue(activeDrag.startOffsetX + (event.clientX - activeDrag.startX)),
                y: clampValue(activeDrag.startOffsetY + (event.clientY - activeDrag.startY))
            };

            applyOffsets();
        }

        function endDrag(event) {
            if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
                return;
            }

            if (activeDrag.type === 'clone') {
                activeDrag.piece.classList.remove('is-dragging');
                activeDrag.piece.releasePointerCapture(event.pointerId);
                saveCloneState();
                activeDrag = null;
                return;
            }

            activeDrag.piece.classList.remove('is-dragging');
            activeDrag.piece.releasePointerCapture(event.pointerId);
            saveOffsets();
            activeDrag = null;
        }

        function resetPiece(piece) {
            const key = piece.dataset.rootlinePiece;
            offsets[key] = { x: defaultOffsets[key].x, y: defaultOffsets[key].y };
            applyOffsets();
            saveOffsets();
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

        function resetClone() {
            if (!cloneRootline) {
                return;
            }

            cloneState = {
                x: defaultCloneState.x,
                y: defaultCloneState.y,
                rotation: defaultCloneState.rotation
            };
            applyCloneState();
            saveCloneState();
        }

        loadOffsets();
        applyOffsets();
        loadCloneState();
        applyCloneState();

        pieces.forEach(function(piece) {
            piece.title = 'Glissez pour deplacer la racine. Double-clic pour reinitialiser.';
            piece.addEventListener('pointerdown', function(event) {
                startDrag(event, piece);
            });
            piece.addEventListener('dblclick', function() {
                resetPiece(piece);
            });
        });

        if (cloneRootline) {
            cloneRootline.title = 'Glissez pour deplacer l angle duplique. Molette pour pivoter. Double-clic pour reinitialiser.';
            cloneRootline.addEventListener('pointerdown', startCloneDrag);
            cloneRootline.addEventListener('wheel', rotateClone, { passive: false });
            cloneRootline.addEventListener('dblclick', resetClone);
        }

        window.addEventListener('pointermove', updateDrag);
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
    });
})();

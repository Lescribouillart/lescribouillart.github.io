(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const toggleButton = document.querySelector('.header-drawer-toggle');
        const sidePanel = document.getElementById('home-side-panel');
        const backdrop = document.querySelector('.home-drawer-backdrop');
        const closeButton = document.querySelector('.home-side-panel-close');

        if (!toggleButton || !sidePanel || !backdrop) {
            return;
        }

        function setDrawerState(isOpen) {
            document.body.classList.toggle('home-drawer-open', isOpen);
            toggleButton.setAttribute('aria-expanded', String(isOpen));
            sidePanel.setAttribute('aria-hidden', String(!isOpen));
            sidePanel.hidden = !isOpen;
            backdrop.hidden = !isOpen;

            if (isOpen) {
                return;
            }

            toggleButton.focus();
        }

        toggleButton.addEventListener('click', function() {
            const isOpen = toggleButton.getAttribute('aria-expanded') === 'true';
            setDrawerState(!isOpen);
        });

        if (closeButton) {
            closeButton.addEventListener('click', function() {
                setDrawerState(false);
            });
        }

        backdrop.addEventListener('click', function() {
            setDrawerState(false);
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && toggleButton.getAttribute('aria-expanded') === 'true') {
                setDrawerState(false);
            }
        });
    });
})();
// Gestion du bouton "Fermer la vidéo" depuis index.html
(function () {
    'use strict';

    function initIndexVideoClose() {
        const closeBtn = document.querySelector('.index-video-close');
        if (!closeBtn) return;

        closeBtn.addEventListener('click', function () {
            const v = document.querySelector('.index-unavailable-site-trigger video');
            if (v && typeof v.pause === 'function') v.pause();
            window.location.href = 'html/accueil.html';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIndexVideoClose);
    } else {
        initIndexVideoClose();
    }
})();
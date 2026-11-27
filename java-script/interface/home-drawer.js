(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const toggleButtons = document.querySelectorAll('button.header-drawer-toggle');
        const sidePanel = document.getElementById('home-side-panel');
        const backdrop = document.querySelector('.home-drawer-backdrop');
        const closeButton = document.querySelector('.home-side-panel-close');
        let activeToggleButton = toggleButtons[0];

        if (!toggleButtons.length || !sidePanel || !backdrop) {
            return;
        }

        function setDrawerState(isOpen) {
            document.body.classList.toggle('home-drawer-open', isOpen);
            toggleButtons.forEach(function(toggleButton) {
                toggleButton.setAttribute('aria-expanded', String(isOpen));
            });
            sidePanel.setAttribute('aria-hidden', String(!isOpen));
            sidePanel.hidden = !isOpen;
            backdrop.hidden = !isOpen;

            if (isOpen) {
                return;
            }

            if (activeToggleButton) {
                activeToggleButton.focus();
            }
        }

        toggleButtons.forEach(function(toggleButton) {
            toggleButton.addEventListener('click', function() {
                activeToggleButton = toggleButton;
                const isOpen = toggleButton.getAttribute('aria-expanded') === 'true';
                setDrawerState(!isOpen);
            });
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
            if (event.key === 'Escape' && activeToggleButton.getAttribute('aria-expanded') === 'true') {
                setDrawerState(false);
            }
        });
    });
})();

// Gestion de la fin de vidéo sur index.html
(function () {
    'use strict';

    function initIndexVideoBehavior() {
        const video = document.getElementById('intro-video');
        const container = document.querySelector('.index-unavailable-site-trigger');

        if (!video || !container) {
            return;
        }

        video.loop = false;
        video.addEventListener('ended', function() {
            container.classList.add('blurred');
        }, { once: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIndexVideoBehavior);
    } else {
        initIndexVideoBehavior();
    }
})();
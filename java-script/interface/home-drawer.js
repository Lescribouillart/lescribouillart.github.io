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
// Gestion du comportement vidéo depuis index.html
(function () {
    'use strict';

    function initIndexVideoBehavior() {
        const video = document.getElementById('intro-video');
        const btn = document.getElementById('index-video-close');
        const container = document.querySelector('.index-unavailable-site-trigger');
        if (!video || !btn) return;

        let shownAfterFirst = false;
        let durationKnown = false;

        function showButtonAndBlur() {
            if (shownAfterFirst) return;
            shownAfterFirst = true;
            try { container.classList.add('blurred'); } catch (e) {}
            try { video.loop = false; } catch (e) {}
            try { video.pause(); } catch (e) {}
            btn.style.display = 'block';
            btn.removeAttribute('aria-hidden');
            try { btn.focus(); } catch (e) {}
        }

        video.addEventListener('ended', function () {
            showButtonAndBlur();
        });

        video.addEventListener('loadedmetadata', function () {
            durationKnown = true;
        });

        video.addEventListener('timeupdate', function () {
            if (shownAfterFirst) return;
            const d = video.duration;
            if (!durationKnown || !d || isNaN(d) || d === Infinity) return;
            if (video.currentTime >= d - 0.2) {
                showButtonAndBlur();
            }
        });

        btn.addEventListener('click', function () {
            try { container.classList.remove('blurred'); } catch (e) {}
            if (container) container.style.display = 'none';
            window.location.href = 'html/accueil.html';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIndexVideoBehavior);
    } else {
        initIndexVideoBehavior();
    }
})();
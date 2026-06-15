// Navigation clavier pour le volet "Le feuillet"
// Flèches gauche/droite ou haut/bas naviguent entre les liens du panneau
document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('home-side-panel');
    if (!panel) return;

    const links = Array.from(panel.querySelectorAll('a.home-side-panel-text'));
    if (!links.length) return;

    function currentIndex() {
        const currentFile = window.location.pathname.split('/').pop();
        const idx = links.findIndex(a => {
            const hrefFile = a.getAttribute('href').split('/').pop();
            return hrefFile === currentFile;
        });
        return idx >= 0 ? idx : 0;
    }

    let idx = currentIndex();

    function navigateTo(i) {
        const next = (i + links.length) % links.length;
        // Briefly show visual feedback before navigating to help debugging
        setActive(next);
        setTimeout(() => {
            window.location.href = links[next].href;
        }, 250);
    }

    function clearActive() {
        links.forEach(l => l.classList.remove('active'));
    }

    function setActive(i) {
        clearActive();
        const link = links[(i + links.length) % links.length];
        if (link) {
            link.classList.add('active');
            // remove after animation ends (in case navigation not happening)
            setTimeout(() => link.classList.remove('active'), 1200);
        }
    }

    document.addEventListener('keydown', (ev) => {
        // Only navigate when the side panel is visible/open
        if (panel.hidden || panel.getAttribute('aria-hidden') === 'true') return;

        // Ignore when typing in inputs, textareas or contentEditable
        const active = document.activeElement;
        const tag = active && active.tagName ? active.tagName : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (active && active.isContentEditable)) return;

        if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
            ev.preventDefault();
            idx = (idx - 1 + links.length) % links.length;
            setActive(idx);
            // move focus to the link so Enter will activate it
            const link = links[idx];
            if (link && typeof link.focus === 'function') link.focus();
        } else if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
            ev.preventDefault();
            idx = (idx + 1) % links.length;
            setActive(idx);
            const link = links[idx];
            if (link && typeof link.focus === 'function') link.focus();
        } else if (ev.key === 'Enter' || ev.key === ' ') {
            // Activate current selection only on Enter or Space
            if (typeof ev.preventDefault === 'function') ev.preventDefault();
            navigateTo(idx);
        }
    });

    // Mouse/focus interactions: add active class for feedback (no navigation delay)
    links.forEach((a, i) => {
        a.addEventListener('focus', () => setActive(i));
        a.addEventListener('mouseenter', () => a.classList.add('active'));
        a.addEventListener('mouseleave', () => a.classList.remove('active'));
        a.addEventListener('click', () => {
            // ensure visible feedback on click (navigation will follow)
            a.classList.add('active');
        });
    });

    // Observe visibility changes on the panel: when opened, flash current link
    const mo = new MutationObserver(() => {
        if (!panel.hidden && panel.getAttribute('aria-hidden') === 'false') {
            idx = currentIndex();
            setActive(idx);
        }
    });
    mo.observe(panel, { attributes: true, attributeFilter: ['hidden', 'aria-hidden'] });
});

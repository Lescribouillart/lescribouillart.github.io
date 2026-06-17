// Navigation clavier + indicateur mobile pour le volet "Le feuillet"
// Le sélecteur est un élément indépendant (.feuillet-selector) qui se déplace
// et clignote pour indiquer l'élément sélectionné.
document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('home-side-panel');
    if (!panel) return;

    const inner = panel.querySelector('.home-side-panel-inner') || panel;
    const links = Array.from(inner.querySelectorAll('a.home-side-panel-text'));
    if (!links.length) return;

    // state
    let selectedIndex = 0;

    function normalize(i) {
        return ((i % links.length) + links.length) % links.length;
    }

    function updateSelection(i, { focus = false } = {}) {
        selectedIndex = normalize(i);
        // mark selected link with integrated background
        links.forEach((el, idx) => {
            el.classList.toggle('selected-bg', idx === selectedIndex);
        });

        // accessibility attributes
        links.forEach((el, idx) => {
            el.setAttribute('aria-selected', idx === selectedIndex ? 'true' : 'false');
            el.tabIndex = idx === selectedIndex ? 0 : -1;
        });

        if (focus && typeof links[selectedIndex].focus === 'function') links[selectedIndex].focus();
    }

    function navigateTo(i) {
        const next = normalize(i);
        if (links[next] && links[next].href) {
            links[next].classList.add('active');
            setTimeout(() => window.location.href = links[next].href, 200);
        }
    }

    // keyboard navigation while panel is visible
    document.addEventListener('keydown', (ev) => {
        if (panel.hidden || panel.getAttribute('aria-hidden') === 'true') return;
        const active = document.activeElement;
        const tag = active && active.tagName ? active.tagName : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (active && active.isContentEditable)) return;

        if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') {
            ev.preventDefault();
            selectedIndex = normalize(selectedIndex - 1);
            updateSelection(selectedIndex, { focus: true });
        } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') {
            ev.preventDefault();
            selectedIndex = normalize(selectedIndex + 1);
            updateSelection(selectedIndex, { focus: true });
        } else if (ev.key === 'Enter' || ev.key === ' ') {
            if (typeof ev.preventDefault === 'function') ev.preventDefault();
            navigateTo(selectedIndex);
        }
    });

    // mouse & focus interactions
    links.forEach((el, idx) => {
        el.addEventListener('click', () => updateSelection(idx));
        el.addEventListener('focus', () => updateSelection(idx));
        el.addEventListener('mouseenter', () => updateSelection(idx));
    });

    // Observe panel open/close to initialize or clear selector
    const mo = new MutationObserver(() => {
        if (!panel.hidden && panel.getAttribute('aria-hidden') === 'false') {
            // On open: select La chronologie by default if present
            const chronol = inner.querySelector('a.home-side-panel-text[href$="feuillet.html"], a.home-side-panel-text[href$="/feuillet.html"]');
            const found = chronol ? links.indexOf(chronol) : -1;
            selectedIndex = found >= 0 ? found : 0;
            updateSelection(selectedIndex);
        } else {
            // On close: remove selection background from all
            links.forEach(l => l.classList.remove('selected-bg'));
        }
    });
    mo.observe(panel, { attributes: true, attributeFilter: ['hidden', 'aria-hidden'] });
});

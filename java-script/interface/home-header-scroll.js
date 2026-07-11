(function () {
    const body = document.body;
    const header = document.querySelector('.header');

    if (!body || !header || body.classList.contains('search-page')) {
        return;
    }

    // Active le header fixe via CSS (position: fixed)
    body.classList.add('has-scroll-header');

    const syncHeaderHeight = () => {
        body.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
    };

    const suppressTransitions = (fn) => {
        body.classList.add('header-no-anim');
        fn();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                body.classList.remove('header-no-anim');
            });
        });
    };

    suppressTransitions(syncHeaderHeight);

    window.addEventListener('load', () => {
        suppressTransitions(syncHeaderHeight);
    });

    window.addEventListener('resize', syncHeaderHeight);

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(syncHeaderHeight);
        resizeObserver.observe(header);
    }
})();
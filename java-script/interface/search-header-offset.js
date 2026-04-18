(function () {
    const body = document.body;
    const header = document.querySelector('.search-page-header');

    if (!body || !header) {
        return;
    }

    const syncHeaderHeight = () => {
        body.style.setProperty('--search-header-height', `${header.offsetHeight}px`);
    };

    syncHeaderHeight();
    window.addEventListener('load', syncHeaderHeight);
    window.addEventListener('resize', syncHeaderHeight);

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(syncHeaderHeight);
        resizeObserver.observe(header);
    }
})();
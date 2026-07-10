(function () {
    const body = document.body;
    const header = document.querySelector('.header');

    if (!body || !header || body.classList.contains('search-page')) {
        return;
    }

    const scrolledClassName = 'header-scrolled';
    body.classList.add('has-scroll-header');
    const enterThreshold = 48;
    const exitThreshold = 6;
    let isCompact = false;

    const syncHeaderHeight = () => {
        body.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
    };

    const syncScrollState = () => {
        const scrollTop = window.scrollY;
        const shouldCompact = isCompact
            ? scrollTop > exitThreshold
            : scrollTop > enterThreshold;

        if (shouldCompact === isCompact) {
            return;
        }

        isCompact = shouldCompact;
        body.classList.toggle(scrolledClassName, isCompact);
        syncHeaderHeight();
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

    suppressTransitions(() => {
        syncHeaderHeight();
        syncScrollState();
    });

    window.addEventListener('load', () => {
        suppressTransitions(() => {
            syncHeaderHeight();
            syncScrollState();
        });
    });

    window.addEventListener('resize', () => {
        syncHeaderHeight();
        syncScrollState();
    });

    window.addEventListener('scroll', syncScrollState, { passive: true });

    header.addEventListener('transitionend', (event) => {
        if (event.propertyName === 'padding' || event.propertyName === 'font-size' || event.propertyName === 'height' || event.propertyName === 'opacity') {
            syncHeaderHeight();
        }
    });

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(syncHeaderHeight);
        resizeObserver.observe(header);
    }
})();
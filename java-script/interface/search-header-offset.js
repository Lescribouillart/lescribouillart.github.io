(function () {
    const body = document.body;
    const header = document.querySelector('.search-page-header');
    const searchResults = document.querySelector('#search-results');
    const scrolledClassName = 'search-page-scrolled';
    const compactEnterThreshold = 40;
    const compactExitThreshold = 4;
    const minimumResultsForCompact = 8;
    let isCompact = false;
    let canCompact = false;

    if (!body || !header) {
        return;
    }

    const getSearchResultCount = () => {
        if (!searchResults) {
            return 0;
        }

        return searchResults.querySelectorAll('[data-search-result-item]').length;
    };

    const syncHeaderHeight = () => {
        body.style.setProperty('--search-header-height', `${header.offsetHeight}px`);
    };

    const disableCompactMode = () => {
        if (!isCompact) {
            return;
        }

        isCompact = false;
        body.classList.remove(scrolledClassName);
    };

    const syncCompactEligibility = () => {
        canCompact = getSearchResultCount() >= minimumResultsForCompact;

        if (!canCompact) {
            disableCompactMode();
        }

        syncHeaderHeight();
    };

    const syncScrollState = () => {
        if (!canCompact) {
            disableCompactMode();
            return;
        }

        const scrollTop = window.scrollY;
        const shouldCompact = isCompact
            ? scrollTop > compactExitThreshold
            : scrollTop > compactEnterThreshold;

        if (shouldCompact === isCompact) {
            return;
        }

        isCompact = shouldCompact;
        body.classList.toggle(scrolledClassName, isCompact);
        syncHeaderHeight();
    };

    syncCompactEligibility();
    syncScrollState();
    syncHeaderHeight();
    window.addEventListener('load', () => {
        syncCompactEligibility();
        syncScrollState();
        syncHeaderHeight();
    });
    window.addEventListener('resize', () => {
        syncCompactEligibility();
        syncScrollState();
        syncHeaderHeight();
    });
    window.addEventListener('scroll', syncScrollState, { passive: true });
    header.addEventListener('transitionend', (event) => {
        if (event.propertyName === 'padding' || event.propertyName === 'max-height' || event.propertyName === 'font-size') {
            syncHeaderHeight();
        }
    });

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(syncHeaderHeight);
        resizeObserver.observe(header);
    }

    if (searchResults) {
        const resultsObserver = new MutationObserver(() => {
            syncCompactEligibility();
            syncScrollState();
        });

        resultsObserver.observe(searchResults, { childList: true, subtree: true });
    }
})();
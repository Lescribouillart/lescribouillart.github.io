// Fonction de recherche d'articles et de pages
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    const searchStats = document.getElementById('search-stats');
    const searchTabButtons = Array.from(document.querySelectorAll('[data-search-tab]'));
    const defaultSearchTab = 'all';
    
    if (!searchInput) {
        return; // Si l'élément n'existe pas, on sort
    }

    function updateSearchInputCursor(event) {
        const inputRect = searchInput.getBoundingClientRect();
        const iconZoneWidth = 34;
        const pointerOffsetX = event.clientX - inputRect.left;
        const pointerOffsetY = event.clientY - inputRect.top;
        const isInsideInput = pointerOffsetX >= 0
            && pointerOffsetX <= inputRect.width
            && pointerOffsetY >= 0
            && pointerOffsetY <= inputRect.height;
        const isOverSearchIcon = isInsideInput && pointerOffsetX >= (inputRect.width - iconZoneWidth);

        searchInput.style.cursor = isOverSearchIcon ? 'pointer' : 'text';
    }

    searchInput.addEventListener('mousemove', updateSearchInputCursor);
    searchInput.addEventListener('mouseleave', () => {
        searchInput.style.cursor = 'text';
    });

    // Ajout : redirection au clic dans le champ ou sur la loupe (hors page moteur de recherche)
    const isSearchPage = /moteurderecherche\.html$/.test(window.location.pathname);
    if (!isSearchPage) {
        searchInput.addEventListener('mousedown', function(event) {
            const inputRect = searchInput.getBoundingClientRect();
            const iconZoneWidth = 34;
            const pointerOffsetX = event.clientX - inputRect.left;
            const pointerOffsetY = event.clientY - inputRect.top;
            const isInsideInput = pointerOffsetX >= 0
                && pointerOffsetX <= inputRect.width
                && pointerOffsetY >= 0
                && pointerOffsetY <= inputRect.height;
            const isOverSearchIcon = isInsideInput && pointerOffsetX >= (inputRect.width - iconZoneWidth);
            // Redirige si clic dans le champ ou sur la loupe
            if (isInsideInput) {
                event.preventDefault();
                window.location.href = buildSearchPageUrl();
            }
        });
    }

    const sitePagesFallback = [
        { title: 'Accueil', url: '../index.html', keywords: ['accueil', 'home', 'bienvenue', 'index'], snippet: 'Bienvenue sur Le Scribouill\'art, le journal fictif aux articles bien réels.' }
    ];
    let cachedSitePages = null;

    function getPagesIndexUrl() {
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/');
        return isInHtmlFolder ? '../pages.json' : 'pages.json';
    }

    async function loadSitePages() {
        if (cachedSitePages) {
            return cachedSitePages;
        }

        try {
            const response = await fetch(getPagesIndexUrl());
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const pages = await response.json();
            cachedSitePages = Array.isArray(pages) ? pages : sitePagesFallback;
            return cachedSitePages;
        } catch (error) {
            console.error('Erreur lors du chargement de pages.json:', error);
            cachedSitePages = sitePagesFallback;
            return cachedSitePages;
        }
    }

    function buildSearchPageUrl(searchTerm = '') {
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/');
        const activeTab = getActiveSearchTab();
        const baseUrl = isInHtmlFolder
            ? 'moteurderecherche.html'
            : 'html/moteurderecherche.html';

        if (!searchTerm) {
            return `${baseUrl}?tab=${encodeURIComponent(activeTab)}`;
        }

        return `${baseUrl}?search=${encodeURIComponent(searchTerm)}&tab=${encodeURIComponent(activeTab)}`;
    }

    // Fonction pour effectuer la recherche
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm === '') {
            return;
        }

        // Rediriger vers la page moteur de recherche avec le terme de recherche
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/');
        
        // Construire l'URL en fonction de l'emplacement actuel
        let targetUrl;
        const activeTab = getActiveSearchTab();
        if (isInHtmlFolder) {
            targetUrl = `moteurderecherche.html?search=${encodeURIComponent(searchTerm)}&tab=${encodeURIComponent(activeTab)}`;
        } else {
            targetUrl = `html/moteurderecherche.html?search=${encodeURIComponent(searchTerm)}&tab=${encodeURIComponent(activeTab)}`;
        }
        
        window.location.href = buildSearchPageUrl(searchTerm);
    }

    function getActiveSearchTab() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        return tab === 'images' ? 'images' : defaultSearchTab;
    }

    function setActiveSearchTab(tab) {
        const nextTab = tab === 'images' ? 'images' : defaultSearchTab;

        searchTabButtons.forEach((button) => {
            const isActive = button.dataset.searchTab === nextTab;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
            button.tabIndex = isActive ? 0 : -1;
        });
    }

    function updateSearchUrl(searchTerm, tab) {
        const url = new URL(window.location.href);

        if (searchTerm) {
            url.searchParams.set('search', searchTerm);
        }

        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url);
    }

    function normalizeAssetPath(path) {
        if (!path) {
            return '';
        }

        if (/^(?:https?:)?\/\//.test(path) || path.startsWith('../')) {
            return path;
        }

        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/');
        return isInHtmlFolder ? `../${path}` : path;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function isDecorativeImageSource(src) {
        const normalizedSrc = (src || '').toLowerCase();

        return [
            'images/header/',
            'images/logo/',
            'images/icons/',
            'images/inclusif/',
            'images/info/',
            'racines-bas-header',
            'scribouillart.png',
            'dislexie'
        ].some(fragment => normalizedSrc.includes(fragment));
    }

    function extractRelevantPageImage(main) {
        const images = Array.from(main.querySelectorAll('img'));
        const relevantImage = images.find((image) => !isDecorativeImageSource(image.getAttribute('src') || ''));

        if (!relevantImage) {
            return null;
        }

        return {
            src: relevantImage.getAttribute('src') || '',
            alt: relevantImage.getAttribute('alt') || ''
        };
    }

    function buildDefaultNoResults(searchTerm) {
        return `
            <div class="no-results-google">
                <h2>Aucun document ne correspond aux termes de recherche spécifiés.</h2>
                <p>Suggestions :</p>
                <ul style="color: #70757a; font-size: 0.875rem; line-height: 1.8;">
                    <li>Vérifiez l'orthographe des termes de recherche.</li>
                    <li>Essayez d'autres mots.</li>
                    <li>Utilisez des mots plus généraux.</li>
                </ul>
                <p>Recherche : "${escapeHtml(searchTerm)}"</p>
            </div>
        `;
    }

    function renderAllResults(matchingPages, matchingArticles, searchTerm) {
        let resultsHTML = '';

        if (matchingPages.length > 0) {
            matchingPages.forEach(page => {
                resultsHTML += `
                    <div class="search-result-item-google" data-search-result-item>
                        <h3 class="search-result-title">
                            <a href="${page.url}">${escapeHtml(page.title)}</a>
                        </h3>
                        <p class="search-result-snippet">${escapeHtml(page.snippet || '')}</p>
                        <div class="search-result-url">
                            <span class="search-result-domain">drelall.github.io</span>
                            <span style="color: #006621;"> › </span>
                            <span style="color: #006621;">${escapeHtml(page.title)}</span>
                        </div>
                    </div>
                `;
            });
        }

        if (matchingArticles.length > 0) {
            matchingArticles.forEach(article => {
                resultsHTML += `
                    <div class="search-result-item-google" data-search-result-item>
                        <h3 class="search-result-title">
                            <a href="affichage-article.html?id=${article.id}">${escapeHtml(article.title)}</a>
                        </h3>
                        <p class="search-result-snippet">${escapeHtml(article.excerpt || '')}</p>
                        <div class="search-result-url">
                            <span class="search-result-domain">drelall.github.io</span>
                            <span style="color: #006621;"> › </span>
                            <span style="color: #006621;">${escapeHtml(article.category || '')}</span>
                            <span style="color: #70757a; margin-left: 0.5rem;">${escapeHtml(article.date || '')}</span>
                        </div>
                    </div>
                `;
            });
        }

        if (matchingPages.length === 0 && matchingArticles.length === 0) {
            return buildDefaultNoResults(searchTerm);
        }

        return resultsHTML;
    }

    function renderImageResults(matchingPages, matchingArticles, searchTerm) {
        const pagesWithImages = matchingPages.filter(page => page.image);
        const articlesWithImages = matchingArticles.filter(article => article.image);
        const imageResults = [
            ...pagesWithImages.map(page => ({
                type: 'page',
                url: page.url,
                title: page.title,
                image: page.image,
                imageAlt: page.imageAlt,
                source: 'Page du site'
            })),
            ...articlesWithImages.map(article => ({
                type: 'article',
                url: `affichage-article.html?id=${article.id}`,
                title: article.title,
                image: article.image,
                imageAlt: article.imageCaption || article.title,
                source: article.category || 'Article'
            }))
        ];

        if (imageResults.length === 0) {
            return `
                <div class="no-results-google">
                    <h2>Aucune image ne correspond à cette recherche.</h2>
                    <p>Essaie l'onglet Tous pour voir les pages et articles textuels liés à "${escapeHtml(searchTerm)}".</p>
                </div>
            `;
        }

        return imageResults.map(result => `
            <article class="search-image-card" data-search-result-item>
                <a class="search-image-link" href="${result.url}">
                    <img class="search-image-thumb" src="${normalizeAssetPath(result.image)}" alt="${escapeHtml(result.imageAlt || result.title)}">
                </a>
                <div class="search-image-meta">
                    <h3 class="search-image-title">
                        <a class="search-image-link" href="${result.url}">${escapeHtml(result.title)}</a>
                    </h3>
                    <span class="search-image-source">${escapeHtml(result.source)}</span>
                </div>
            </article>
        `).join('');
    }

    function renderSearchResults(activeTab, matchingPages, matchingArticles, searchTerm) {
        if (!searchResults) {
            return;
        }

        const isImageTab = activeTab === 'images';
        searchResults.classList.toggle('search-results-grid', isImageTab);
        searchResults.innerHTML = isImageTab
            ? renderImageResults(matchingPages, matchingArticles, searchTerm)
            : renderAllResults(matchingPages, matchingArticles, searchTerm);
    }

    // Événement sur la touche Entrée
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    if (window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('/index') || !window.location.pathname.includes('/html/')) {
        const redirectToSearchPage = () => {
            window.location.href = buildSearchPageUrl(searchInput.value.trim());
        };

        searchInput.addEventListener('focus', redirectToSearchPage);
        searchInput.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            redirectToSearchPage();
        });
    }

    // Fonction pour filtrer les articles et pages sur la page de recherche
    async function displaySearchResults() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchTerm = urlParams.get('search');
        const activeTab = getActiveSearchTab();
        setActiveSearchTab(activeTab);
        
        if (!searchTerm) {
            return;
        }

        // Remplir le champ de recherche avec le terme recherché
        if (searchInput) {
            searchInput.value = searchTerm;
        }

        const searchLower = searchTerm.toLowerCase();
        
        if (!searchResults) {
            return;
        }

        // Fonction pour charger et chercher dans le contenu d'une page
        async function searchInPageContent(page) {
            try {
                const response = await fetch(page.url);
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Extraire le texte du contenu principal (éviter header, footer, nav)
                const main = doc.querySelector('main') || doc.body;
                const textContent = main.textContent.toLowerCase();
                const pageImage = extractRelevantPageImage(main);
                
                return {
                    contentMatch: textContent.includes(searchLower),
                    image: pageImage?.src || '',
                    imageAlt: pageImage?.alt || ''
                };
            } catch (error) {
                console.error('Erreur lors du chargement de la page:', error);
                return {
                    contentMatch: false,
                    image: '',
                    imageAlt: ''
                };
            }
        }

        const sitePages = await loadSitePages();

        // Rechercher dans les pages du site
        Promise.all(sitePages.map(async (page) => {
            const titleMatch = page.title.toLowerCase().includes(searchLower);
            const keywordMatch = (page.keywords || []).some(keyword => keyword.includes(searchLower));
            const snippetMatch = (page.snippet || '').toLowerCase().includes(searchLower);
            const pageContentData = await searchInPageContent(page);
            
            return (titleMatch || keywordMatch || snippetMatch || pageContentData.contentMatch)
                ? {
                    ...page,
                    image: pageContentData.image,
                    imageAlt: pageContentData.imageAlt
                }
                : null;
        })).then(results => {
            const matchingPages = results.filter(page => page !== null);
            
            // Charger et filtrer les articles
            const startTime = performance.now();
            fetch('../publication-articles.json')
                .then(response => response.json())
                .then(articles => {
                    const matchingArticles = articles.filter(article => {
                        return article.title.toLowerCase().includes(searchLower) ||
                               article.excerpt.toLowerCase().includes(searchLower) ||
                               article.category.toLowerCase().includes(searchLower);
                    });

                    const totalResults = matchingPages.length + matchingArticles.length;
                    const endTime = performance.now();
                    const searchTime = ((endTime - startTime) / 1000).toFixed(2);

                    if (searchStats) {
                        searchStats.textContent = `${totalResults} résultat${totalResults > 1 ? 's' : ''} en ${searchTime} s`;
                    }

                    renderSearchResults(activeTab, matchingPages, matchingArticles, searchTerm);
            })
            .catch(error => {
                console.error('Erreur lors du chargement des articles:', error);
                searchResults.innerHTML = '<div class="no-results-google"><h2>Erreur</h2><p>Impossible de charger les résultats.</p></div>';
            });
        });
    }

    // Exécuter l'affichage des résultats si on est sur la page moteur de recherche
    if (window.location.pathname.includes('moteurderecherche')) {
        displaySearchResults();
    }

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }

    searchTabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const nextTab = button.dataset.searchTab === 'images' ? 'images' : defaultSearchTab;
            setActiveSearchTab(nextTab);
            updateSearchUrl(searchInput.value.trim(), nextTab);
            displaySearchResults();
        });
    });

    // Fonction pour filtrer les articles sur la page de listage (conservée pour compatibilité)
    async function filterArticlesOnPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchTerm = urlParams.get('search');
        
        if (!searchTerm) {
            return;
        }

        // Remplir le champ de recherche avec le terme recherché
        if (searchInput) {
            searchInput.value = searchTerm;
        }

        // Récupérer tous les articles
        const articles = document.querySelectorAll('.article-card');
        let visibleCount = 0;
        
        const searchLower = searchTerm.toLowerCase();

        // Filtrer les articles
        articles.forEach(article => {
            const title = article.querySelector('.article-title')?.textContent.toLowerCase() || '';
            const excerpt = article.querySelector('.article-excerpt')?.textContent.toLowerCase() || '';
            const category = article.querySelector('.article-category')?.textContent.toLowerCase() || '';
            
            // Vérifier si le terme de recherche est dans le titre, l'extrait ou la catégorie
            if (title.includes(searchLower) || excerpt.includes(searchLower) || category.includes(searchLower)) {
                article.style.display = '';
                visibleCount++;
            } else {
                article.style.display = 'none';
            }
        });

        // Rechercher dans les pages du site
        const sitePages = await loadSitePages();
        const matchingPages = sitePages.filter(page => {
            return page.title.toLowerCase().includes(searchLower) || 
                   (page.keywords || []).some(keyword => keyword.includes(searchLower)) ||
                   (page.snippet || '').toLowerCase().includes(searchLower);
        });

        // Afficher les résultats
        const articlesGrid = document.querySelector('.articles-grid');
        if (articlesGrid) {
            // Supprimer les résultats de pages précédents si ils existent
            const oldPagesResults = document.querySelector('.pages-results');
            if (oldPagesResults) {
                oldPagesResults.remove();
            }

            // Si on a des pages correspondantes, les afficher en premier
            if (matchingPages.length > 0) {
                const pagesResultsDiv = document.createElement('div');
                pagesResultsDiv.className = 'pages-results';
                pagesResultsDiv.style.marginBottom = '2rem';
                
                let pagesHTML = '<h2 style="color: var(--primary-color); margin-bottom: 1rem;">Pages du site</h2><div class="pages-list">';
                
                matchingPages.forEach(page => {
                    pagesHTML += `
                        <a href="${page.url}" class="page-result-item">
                            <span class="page-icon">📄</span>
                            <span class="page-title">${page.title}</span>
                        </a>
                    `;
                });
                
                pagesHTML += '</div>';
                pagesResultsDiv.innerHTML = pagesHTML;
                
                // Insérer avant la grille d'articles
                articlesGrid.parentNode.insertBefore(pagesResultsDiv, articlesGrid);
            }

            // Si aucun article et aucune page ne correspond
            if (visibleCount === 0 && matchingPages.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.innerHTML = `
                    <h2>Aucun résultat trouvé</h2>
                    <p>Aucun article ou page ne correspond à votre recherche : "<strong>${searchTerm}</strong>"</p>
                    <p><a href="listage-articles.html" class="nav-link">Voir tous les articles</a></p>
                `;
                noResults.style.textAlign = 'center';
                noResults.style.padding = '2rem';
                noResults.style.color = 'var(--text-light)';
                
                // Insérer le message après la grille
                articlesGrid.parentNode.insertBefore(noResults, articlesGrid.nextSibling);
            }
        }
    }

    // Exécuter le filtrage si on est sur la page de listage
    if (window.location.pathname.includes('listage-articles')) {
        filterArticlesOnPage();
    }

    // Bouton "J'ai de la chance" - redirection vers une page aléatoire
    const luckyButton = document.querySelector('.search-button-secondary');
    if (luckyButton) {
        luckyButton.addEventListener('click', async function(e) {
            e.preventDefault();
            const sitePages = await loadSitePages();
            if (sitePages.length === 0) {
                return;
            }
            const randomPage = sitePages[Math.floor(Math.random() * sitePages.length)];
            window.location.href = randomPage.url;
        });
    }
});

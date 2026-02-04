// Fonction de recherche d'articles et de pages
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    
    if (!searchInput) {
        return; // Si l'élément n'existe pas, on sort
    }

    // Liste des pages du site
    const sitePages = [
        { title: 'Accueil', url: '../index.html', keywords: ['accueil', 'home', 'bienvenue', 'index'] },
        { title: 'Contact', url: 'contact.html', keywords: ['contact', 'contacter', 'message', 'email', 'écrire'] },
        { title: 'À propos', url: 'a-propos.html', keywords: ['à propos', 'a propos', 'about', 'rédacteur', 'redacteur', 'devenir'] },
        { title: 'Auteur', url: 'auteur.html', keywords: ['auteur', 'drelall', 'créateur', 'createur', 'rédacteur', 'redacteur'] },
        { title: 'Mentions légales', url: 'mentions-legales.html', keywords: ['mentions légales', 'mentions legales', 'legal', 'rgpd', 'données', 'donnees'] },
        { title: 'Publications', url: 'listage-articles.html', keywords: ['publications', 'articles', 'liste', 'tous les articles'] },
        { title: 'Feuillet', url: 'feuillet.html', keywords: ['feuillet', 'chronologie', 'timeline', 'histoire'] }
    ];

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
        if (isInHtmlFolder) {
            targetUrl = `moteurderecherche.html?search=${encodeURIComponent(searchTerm)}`;
        } else {
            targetUrl = `html/moteurderecherche.html?search=${encodeURIComponent(searchTerm)}`;
        }
        
        window.location.href = targetUrl;
    }

    // Événement sur la touche Entrée
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    // Fonction pour filtrer les articles et pages sur la page de recherche
    function displaySearchResults() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchTerm = urlParams.get('search');
        
        if (!searchTerm) {
            return;
        }

        // Remplir le champ de recherche avec le terme recherché
        if (searchInput) {
            searchInput.value = searchTerm;
        }

        const searchLower = searchTerm.toLowerCase();
        const searchResults = document.getElementById('search-results');
        const searchStats = document.getElementById('search-stats');
        
        if (!searchResults) {
            return;
        }

        // Rechercher dans les pages du site
        const matchingPages = sitePages.filter(page => {
            return page.title.toLowerCase().includes(searchLower) || 
                   page.keywords.some(keyword => keyword.includes(searchLower));
        });

        // Charger et filtrer les articles
        fetch('../publication-articles.json')
            .then(response => response.json())
            .then(articles => {
                const matchingArticles = articles.filter(article => {
                    return article.title.toLowerCase().includes(searchLower) ||
                           article.excerpt.toLowerCase().includes(searchLower) ||
                           article.category.toLowerCase().includes(searchLower);
                });

                const totalResults = matchingPages.length + matchingArticles.length;
                
                // Afficher les statistiques
                if (searchStats) {
                    searchStats.textContent = `Environ ${totalResults} résultat${totalResults > 1 ? 's' : ''} pour "${searchTerm}"`;
                }

                let resultsHTML = '';

                // Afficher les pages correspondantes
                if (matchingPages.length > 0) {
                    resultsHTML += '<h3 class="search-section-title">Pages du site</h3>';
                    
                    matchingPages.forEach(page => {
                        resultsHTML += `
                            <div class="search-result-item-google">
                                <div class="search-result-url">
                                    <span class="search-result-domain">lescribouillart.fr</span>
                                    <span style="color: #70757a;">›</span>
                                    <span>${page.title}</span>
                                </div>
                                <h3 class="search-result-title">
                                    <a href="${page.url}">${page.title}</a>
                                </h3>
                                <p class="search-result-snippet">Accédez à la page ${page.title.toLowerCase()} du site Le Scribouill'art.</p>
                            </div>
                        `;
                    });
                }

                // Afficher les articles correspondants
                if (matchingArticles.length > 0) {
                    if (matchingPages.length > 0) {
                        resultsHTML += '<h3 class="search-section-title">Articles</h3>';
                    }
                    
                    matchingArticles.forEach(article => {
                        resultsHTML += `
                            <div class="search-result-item-google">
                                <div class="search-result-url">
                                    <span class="search-result-domain">lescribouillart.fr</span>
                                    <span style="color: #70757a;">›</span>
                                    <span>${article.category}</span>
                                </div>
                                <h3 class="search-result-title">
                                    <a href="affichage-article.html?id=${article.id}">${article.title}</a>
                                </h3>
                                <div class="search-result-date">${article.date}</div>
                                <p class="search-result-snippet">${article.excerpt}</p>
                            </div>
                        `;
                    });
                }

                // Si aucun résultat
                if (matchingPages.length === 0 && matchingArticles.length === 0) {
                    if (searchStats) {
                        searchStats.textContent = `Aucun résultat pour "${searchTerm}"`;
                    }
                    resultsHTML = `
                        <div class="no-results-google">
                            <h2>Aucun document ne correspond aux termes de recherche spécifiés.</h2>
                            <p>Suggestions :</p>
                            <ul style="color: #70757a; font-size: 0.875rem; line-height: 1.8;">
                                <li>Vérifiez l'orthographe des termes de recherche.</li>
                                <li>Essayez d'autres mots.</li>
                                <li>Utilisez des mots plus généraux.</li>
                            </ul>
                        </div>
                    `;
                }

                searchResults.innerHTML = resultsHTML;
            })
            .catch(error => {
                console.error('Erreur lors du chargement des articles:', error);
                searchResults.innerHTML = '<div class="no-results-google"><h2>Erreur</h2><p>Impossible de charger les résultats.</p></div>';
            });
    }

    // Exécuter l'affichage des résultats si on est sur la page moteur de recherche
    if (window.location.pathname.includes('moteurderecherche')) {
        displaySearchResults();
    }

    // Fonction pour filtrer les articles sur la page de listage (conservée pour compatibilité)
    function filterArticlesOnPage() {
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
        const matchingPages = sitePages.filter(page => {
            return page.title.toLowerCase().includes(searchLower) || 
                   page.keywords.some(keyword => keyword.includes(searchLower));
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
});

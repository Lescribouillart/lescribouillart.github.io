// Fonction de recherche d'articles et de pages
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    
    if (!searchInput) {
        return; // Si l'élément n'existe pas, on sort
    }

    // Liste des pages du site
    const sitePages = [
        { title: 'Accueil', url: '../index.html', keywords: ['accueil', 'home', 'bienvenue', 'index'], snippet: 'Bienvenue sur Le Scribouill\'art, le journal fictif aux articles bien réels.' },
        { title: 'Contact', url: 'contact.html', keywords: ['contact', 'contacter', 'message', 'email', 'écrire'], snippet: 'N\'hésitez pas à nous contacter pour toute question ou suggestion. Nous nous efforçons de répondre selon nos disponibilités.' },
        { title: 'À propos', url: 'a-propos.html', keywords: ['à propos', 'a propos', 'about', 'rédacteur', 'redacteur', 'devenir'], snippet: 'Découvrez qui se cache derrière Le Scribouill\'art et comment devenir rédacteur.' },
        { title: 'Auteur', url: 'auteur.html', keywords: ['auteur', 'drelall', 'créateur', 'createur', 'rédacteur', 'redacteur'], snippet: 'Découvrez les auteurs et créateurs du Scribouill\'art.' },
        { title: 'Mentions légales', url: 'mentions-legales.html', keywords: ['mentions légales', 'mentions legales', 'legal', 'rgpd', 'données', 'donnees'], snippet: 'Consultez les mentions légales et la politique de confidentialité du site Le Scribouill\'art.' },
        { title: 'Accessibilité', url: 'accessibilite.html', keywords: ['accessibilité', 'accessibilite', 'a11y', 'wcag', 'inclusion'], snippet: 'Découvrez les engagements d\'accessibilité et les fonctionnalités inclusives du site.' },
        { title: 'Publications', url: 'listage-articles.html', keywords: ['publications', 'articles', 'liste', 'tous les articles'], snippet: 'Retrouvez tous les articles publiés sur Le Scribouill\'art.' },
        { title: 'Feuillet', url: 'feuillet.html', keywords: ['feuillet', 'chronologie', 'timeline', 'histoire'], snippet: 'Parcourez la chronologie des publications du Scribouill\'art.' }
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
                
                return textContent.includes(searchLower);
            } catch (error) {
                console.error('Erreur lors du chargement de la page:', error);
                return false;
            }
        }

        // Rechercher dans les pages du site
        Promise.all(sitePages.map(async (page) => {
            const titleMatch = page.title.toLowerCase().includes(searchLower);
            const keywordMatch = page.keywords.some(keyword => keyword.includes(searchLower));
            const snippetMatch = page.snippet.toLowerCase().includes(searchLower);
            const contentMatch = await searchInPageContent(page);
            
            return (titleMatch || keywordMatch || snippetMatch || contentMatch) ? page : null;
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
                    
                    let resultsHTML = '';

                // Afficher les pages correspondantes
                if (matchingPages.length > 0) {
                    
                    matchingPages.forEach(page => {
                        resultsHTML += `
                            <div class="search-result-item-google">
                                <h3 class="search-result-title">
                                    <a href="${page.url}">${page.title}</a>
                                </h3>
                                <p class="search-result-snippet">${page.snippet}</p>
                                <div class="search-result-url">
                                    <span class="search-result-domain">drelall.github.io</span>
                                    <span style="color: #006621;"> › </span>
                                    <span style="color: #006621;">${page.title}</span>
                                </div>
                            </div>
                        `;
                    });
                }

                // Afficher les articles correspondants
                if (matchingArticles.length > 0) {
                    
                    matchingArticles.forEach(article => {
                        resultsHTML += `
                            <div class="search-result-item-google">
                                <h3 class="search-result-title">
                                    <a href="affichage-article.html?id=${article.id}">${article.title}</a>
                                </h3>
                                <p class="search-result-snippet">${article.excerpt}</p>
                                <div class="search-result-url">
                                    <span class="search-result-domain">drelall.github.io</span>
                                    <span style="color: #006621;"> › </span>
                                    <span style="color: #006621;">${article.category}</span>
                                    <span style="color: #70757a; margin-left: 0.5rem;">${article.date}</span>
                                </div>
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
                   page.keywords.some(keyword => keyword.includes(searchLower)) ||
                   page.snippet.toLowerCase().includes(searchLower);
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
        luckyButton.addEventListener('click', function(e) {
            e.preventDefault();
            const randomPage = sitePages[Math.floor(Math.random() * sitePages.length)];
            window.location.href = randomPage.url;
        });
    }
});

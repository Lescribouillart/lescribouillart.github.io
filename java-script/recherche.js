// Fonction de recherche d'articles
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    if (!searchInput || !searchButton) {
        return; // Si les éléments n'existent pas, on sort
    }

    // Fonction pour effectuer la recherche
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm === '') {
            alert('Veuillez entrer un terme de recherche');
            return;
        }

        // Rediriger vers la page de listage avec le terme de recherche
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/');
        
        // Construire l'URL en fonction de l'emplacement actuel
        let targetUrl;
        if (isInHtmlFolder) {
            targetUrl = `listage-articles.html?search=${encodeURIComponent(searchTerm)}`;
        } else {
            targetUrl = `html/listage-articles.html?search=${encodeURIComponent(searchTerm)}`;
        }
        
        window.location.href = targetUrl;
    }

    // Événement sur le bouton de recherche
    searchButton.addEventListener('click', performSearch);

    // Événement sur la touche Entrée
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    // Fonction pour filtrer les articles sur la page de listage
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

        // Afficher un message si aucun résultat
        const articlesGrid = document.querySelector('.articles-grid');
        if (articlesGrid && visibleCount === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = `
                <h2>Aucun résultat trouvé</h2>
                <p>Aucun article ne correspond à votre recherche : "<strong>${searchTerm}</strong>"</p>
                <p><a href="listage-articles.html" class="nav-link">Voir tous les articles</a></p>
            `;
            noResults.style.textAlign = 'center';
            noResults.style.padding = '2rem';
            noResults.style.color = 'var(--text-light)';
            
            // Insérer le message après la grille
            articlesGrid.parentNode.insertBefore(noResults, articlesGrid.nextSibling);
        }
    }

    // Exécuter le filtrage si on est sur la page de listage
    if (window.location.pathname.includes('listage-articles')) {
        filterArticlesOnPage();
    }
});

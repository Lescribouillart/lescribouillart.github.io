// Charger et afficher tous les articles
async function loadArticles() {
    try {
        const response = await fetch('../publication-articles.json');
        const articles = await response.json();
        
        displayArticles(articles);
    } catch (error) {
        console.error('Erreur lors du chargement des articles:', error);
        document.getElementById('articles-list').innerHTML = 
            '<p>Erreur lors du chargement des articles.</p>';
    }
}

// Afficher les articles sous forme de cartes cliquables
function displayArticles(articles) {
    const container = document.getElementById('articles-list');
    
    if (articles.length === 0) {
        container.innerHTML = '<p>Aucun article disponible pour le moment.</p>';
        return;
    }
    
    container.innerHTML = articles.map(article => `
        <a href="affichage-article.html?id=${article.id}" class="article-card${article.id === 1 ? ' article-card-eyelets' : ''}">
            ${article.id === 1 ? `
            <span class="article-card-eyelet article-card-eyelet-top-left" aria-hidden="true"></span>
            <span class="article-card-eyelet article-card-eyelet-top-right" aria-hidden="true"></span>
            ` : ''}
            ${article.image ? `
            <div class="article-image-wrapper">
                <img src="../${article.image}" alt="${article.title}" class="article-image">
            </div>
            ` : ''}
            <div class="article-content">
                <span class="article-category">${article.category}</span>
                <h3 class="article-title">${article.title}</h3>
                <p class="article-date">${article.date}</p>
                <p class="article-summary">${article.excerpt}</p>
                <span class="article-link">Lire l'article</span>
            </div>
        </a>
    `).join('');
}

// Charger les articles au chargement de la page
loadArticles();

// Charger les articles depuis le fichier JSON
async function loadArticles() {
    try {
        const response = await fetch('articles.json');
        const articles = await response.json();
        return articles;
    } catch (error) {
        console.error('Erreur de chargement des articles:', error);
        return [];
    }
}

// Afficher la liste des articles
async function displayArticlesList(limit = null) {
    const articles = await loadArticles();
    const articlesList = document.getElementById('articles-list');
    
    if (!articlesList) return;

    const articlesToDisplay = limit ? articles.slice(0, limit) : articles;
    
    articlesList.innerHTML = articlesToDisplay.map(article => `
        <article class="article-card">
            <div class="article-meta">
                <span class="article-date">${article.date}</span>
                <span class="article-category">${article.category}</span>
            </div>
            <h3 class="article-title">
                <a href="article.html?id=${article.id}">${article.title}</a>
            </h3>
            <p class="article-excerpt">
                ${article.excerpt}
            </p>
            <a href="article.html?id=${article.id}" class="article-link">Lire la suite →</a>
        </article>
    `).join('');
}

// Afficher un article individuel
async function displaySingleArticle() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = parseInt(urlParams.get('id'));
    
    const articles = await loadArticles();
    const article = articles.find(a => a.id === articleId);
    
    const container = document.getElementById('article-container');
    
    if (!container) return;

    if (article) {
        document.title = `${article.title} - Le Scribouill'art`;
        
        container.innerHTML = `
            <div class="article-header">
                <div class="article-meta">
                    <span class="article-date">${article.date}</span>
                    <span class="article-category">${article.category}</span>
                </div>
                <h1 class="article-content-title">${article.title}</h1>
            </div>

            <div class="article-body">
                ${article.content}
            </div>

            <div class="article-footer">
                <a href="articles.html" class="back-link">← Retour aux articles</a>
            </div>
        `;
    } else {
        container.innerHTML = `
            <p>Article non trouvé.</p>
            <a href="articles.html" class="back-link">← Retour aux articles</a>
        `;
    }
}

// Initialisation selon la page
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si on est sur la page article
    if (document.getElementById('article-container')) {
        displaySingleArticle();
    }
    // Vérifier si on est sur la page liste d'articles
    else if (document.getElementById('articles-list')) {
        // Page articles : afficher tous les articles
        displayArticlesList();
    }
});

// Récupérer l'ID de l'article depuis l'URL
function getArticleId() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'));
}

// Charger et afficher l'article
async function loadArticle() {
    const articleId = getArticleId();
    
    if (!articleId) {
        displayError('Article non trouvé');
        return;
    }
    
    try {
        const response = await fetch('../articles.json');
        const articles = await response.json();
        
        const article = articles.find(a => a.id === articleId);
        
        if (article) {
            displayArticle(article);
        } else {
            displayError('Article non trouvé');
        }
    } catch (error) {
        console.error('Erreur lors du chargement de l\'article:', error);
        displayError('Erreur lors du chargement de l\'article');
    }
}

// Afficher l'article complet
function displayArticle(article) {
    // Mettre à jour le titre de la page
    document.getElementById('page-title').textContent = `${article.title} - Le Scribouill'art`;
    
    // Afficher le contenu de l'article
    const container = document.getElementById('article-content');
    container.innerHTML = `
        <div class="article-header">
            <span class="article-category">${article.category}</span>
            <h1 class="article-content-title">${article.title}</h1>
            <p class="article-date">${article.date}</p>
        </div>
        <div class="article-body">
            ${article.content}
        </div>
    `;
}

// Afficher un message d'erreur
function displayError(message) {
    document.getElementById('article-content').innerHTML = `
        <p style="text-align: center; color: var(--text-light);">${message}</p>
    `;
}

// Charger l'article au chargement de la page
loadArticle();

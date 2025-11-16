// Configuration - REMPLACEZ par votre username et repo GitHub
const GITHUB_USER = 'votre-username-github'; // Exemple: 'jacq'
const GITHUB_REPO = 'votre-repo'; // Exemple: 'Blog'
const ARTICLES_FOLDER = 'articles';

// Fonction pour récupérer la liste des articles depuis GitHub
async function loadArticles() {
    try {
        // Récupérer la liste des fichiers dans le dossier articles/
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${ARTICLES_FOLDER}`
        );
        
        if (!response.ok) {
            throw new Error('Impossible de charger les articles');
        }

        const files = await response.json();
        
        // Filtrer uniquement les fichiers .md
        const markdownFiles = files.filter(file => file.name.endsWith('.md') && file.name !== '.gitkeep');
        
        if (markdownFiles.length === 0) {
            document.getElementById('articles-list').innerHTML = '<p>Aucun article publié pour le moment.</p>';
            return;
        }

        // Charger le contenu de chaque article
        const articles = await Promise.all(
            markdownFiles.map(file => loadArticleContent(file.download_url, file.name))
        );

        // Trier par date (du plus récent au plus ancien)
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Afficher les articles
        displayArticles(articles);

    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('articles-list').innerHTML = 
            '<p>Erreur lors du chargement des articles. Vérifiez la configuration GitHub.</p>';
    }
}

// Fonction pour charger le contenu d'un article
async function loadArticleContent(url, filename) {
    const response = await fetch(url);
    const content = await response.text();
    
    // Extraire les métadonnées (front matter)
    const metadata = extractMetadata(content);
    
    return {
        filename: filename,
        title: metadata.title || 'Sans titre',
        date: metadata.date || new Date().toISOString(),
        category: metadata.category || 'Non catégorisé',
        summary: metadata.summary || '',
        image: metadata.image || '',
        content: metadata.body,
        draft: metadata.draft || false
    };
}

// Fonction pour extraire les métadonnées du fichier Markdown
function extractMetadata(content) {
    const metadata = {};
    
    // Chercher le front matter entre --- et ---
    const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    
    if (frontMatterMatch) {
        const frontMatter = frontMatterMatch[1];
        const body = frontMatterMatch[2];
        
        // Parser le YAML simple
        frontMatter.split('\n').forEach(line => {
            const match = line.match(/^(\w+):\s*(.+)$/);
            if (match) {
                const key = match[1];
                let value = match[2].trim();
                
                // Enlever les guillemets si présents
                value = value.replace(/^["']|["']$/g, '');
                
                metadata[key] = value;
            }
        });
        
        metadata.body = body;
    } else {
        metadata.body = content;
    }
    
    return metadata;
}

// Fonction pour afficher les articles
function displayArticles(articles) {
    const container = document.getElementById('articles-list');
    
    // Filtrer les brouillons
    const publishedArticles = articles.filter(article => article.draft !== true && article.draft !== 'true');
    
    if (publishedArticles.length === 0) {
        container.innerHTML = '<p>Aucun article publié pour le moment.</p>';
        return;
    }
    
    container.innerHTML = publishedArticles.map(article => `
        <article class="article-card">
            ${article.image ? `<img src="${article.image}" alt="${article.title}" class="article-image">` : ''}
            <div class="article-content">
                <span class="article-category">${article.category}</span>
                <h3 class="article-title">${article.title}</h3>
                <p class="article-date">${formatDate(article.date)}</p>
                <p class="article-summary">${article.summary}</p>
                <a href="article.html?file=${article.filename}" class="article-link">Lire l'article →</a>
            </div>
        </article>
    `).join('');
}

// Fonction pour formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Charger les articles au chargement de la page
loadArticles();

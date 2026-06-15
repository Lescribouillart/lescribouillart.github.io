// Récupérer l'ID de l'article depuis l'URL
function getArticleId() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'));
}

function normalizeArticleContent(content) {
    if (Array.isArray(content)) {
        return content.join('\n');
    }

    return content || '';
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function parseInlineMarkdown(text) {
    return escapeHtml(text)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/_([^_]+)_/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function renderMarkdown(markdown) {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let paragraphBuffer = [];
    let listBuffer = [];
    let listType = null;
    let htmlBuffer = [];

    function flushParagraph() {
        if (paragraphBuffer.length === 0) {
            return;
        }

        html.push(`<p>${parseInlineMarkdown(paragraphBuffer.join(' '))}</p>`);
        paragraphBuffer = [];
    }

    function flushList() {
        if (listBuffer.length === 0 || !listType) {
            return;
        }

        const items = listBuffer.map((item) => `<li>${parseInlineMarkdown(item)}</li>`).join('');
        html.push(`<${listType}>${items}</${listType}>`);
        listBuffer = [];
        listType = null;
    }

    function flushHtmlBuffer() {
        if (htmlBuffer.length === 0) {
            return;
        }

        html.push(htmlBuffer.join('\n'));
        htmlBuffer = [];
    }

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
            flushParagraph();
            flushList();
            flushHtmlBuffer();
            continue;
        }

        if (htmlBuffer.length > 0 || trimmed.startsWith('<')) {
            flushParagraph();
            flushList();
            htmlBuffer.push(line);
            continue;
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);

        if (headingMatch) {
            flushParagraph();
            flushList();
            const level = headingMatch[1].length;
            html.push(`<h${level}>${parseInlineMarkdown(headingMatch[2])}</h${level}>`);
            continue;
        }

        const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)$/);

        if (unorderedMatch) {
            flushParagraph();

            if (listType && listType !== 'ul') {
                flushList();
            }

            listType = 'ul';
            listBuffer.push(unorderedMatch[1]);
            continue;
        }

        const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);

        if (orderedMatch) {
            flushParagraph();

            if (listType && listType !== 'ol') {
                flushList();
            }

            listType = 'ol';
            listBuffer.push(orderedMatch[1]);
            continue;
        }

        flushList();
        paragraphBuffer.push(trimmed);
    }

    flushParagraph();
    flushList();
    flushHtmlBuffer();

    return html.join('\n');
}

async function resolveArticleContent(article) {
    if (article.markdownFile) {
        try {
            const response = await fetch(`../${article.markdownFile}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const markdown = await response.text();
            return renderMarkdown(markdown);
        } catch (error) {
            console.error('Erreur lors du chargement du Markdown :', error);
        }
    }

    return normalizeArticleContent(article.content);
}

// Charger et afficher l'article
async function loadArticle() {
    const articleId = getArticleId();
    
    if (!articleId) {
        displayError('Article non trouvé');
        return;
    }
    
    try {
        const response = await fetch('../publication-articles.json');
        const articles = await response.json();
        
        const article = articles.find(a => a.id === articleId);
        
        if (article) {
            const articleContent = await resolveArticleContent(article);
            displayArticle(article, articleContent);
        } else {
            displayError('Article non trouvé');
        }
    } catch (error) {
        console.error('Erreur lors du chargement de l\'article:', error);
        displayError('Erreur lors du chargement de l\'article');
    }
}

// Afficher l'article complet
function displayArticle(article, articleContent) {
    // Mettre à jour le titre de la page
    document.getElementById('page-title').textContent = `${article.title} - Le Scribouill'art`;
    
    // Afficher le contenu de l'article
    const container = document.getElementById('article-content');
    const backHTML = (article.id === 1 || article.category === 'À paraître') ? `<div class="article-top-back">\n            <a href="listage-articles.html" class="back-link"><span class="back-icon" aria-hidden="true"></span><span class="sr-only">Retour</span></a>\n            <div class="article-top-band" aria-hidden="true"></div>\n        </div>` : '';
    const heroImage = article.heroImage || article.image;
    const heroImageCaption = article.heroImageCaption || article.imageCaption;
    const imageHTML = heroImage
        ? `<figure class="article-hero-wrapper">
            <div class="article-hero-bg" style="background-image: url('../${heroImage}')"></div>
            <img src="../${heroImage}" alt="Illustration : ${article.title}" class="article-hero-image">
            ${heroImageCaption ? `<figcaption>${heroImageCaption}</figcaption>` : ''}
           </figure>`
        : '';
    const articleMeta = [
        article.date ? `<span class="article-meta-date">${article.date}</span>` : '',
        article.author ? `<span class="article-meta-author">Article rédigé par ${article.author}</span>` : ''
    ].filter(Boolean).join(' - ');
    container.innerHTML = `
        ${backHTML}
        <div class="article-header">
            <span class="article-category">${article.category}</span>
            <h1 class="article-content-title">${article.title}</h1>
            ${articleMeta ? `<p class="article-date">${articleMeta}</p>` : ''}
        </div>
        ${imageHTML}
        <div class="article-body">
            ${articleContent}
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

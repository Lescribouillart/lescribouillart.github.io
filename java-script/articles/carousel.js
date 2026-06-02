// Carrousel des nouveaux articles
let currentIndex = 0;
let articles = [];
let autoPlayInterval = null;
const autoPlayDelay = 4000; // Délai entre chaque glissement (en ms)
const isInHtmlFolder = window.location.pathname.includes('/html/');
const assetPrefix = isInHtmlFolder ? '../' : './';

function buildArticlesDataUrl() {
    return `${assetPrefix}publication-articles.json`;
}

function buildArticlePageUrl(articleId) {
    const basePath = isInHtmlFolder ? 'affichage-article.html' : 'html/affichage-article.html';
    return `${basePath}?id=${articleId}`;
}

function normalizeAssetPath(path) {
    if (!path) return '';
    if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) {
        return path;
    }
    return `${assetPrefix}${path.replace(/^\.\//, '')}`;
}

async function initCarousel() {
    try {
        // Charger les articles
        const response = await fetch(buildArticlesDataUrl());
        articles = await response.json();
        
        if (articles.length === 0) {
            const carouselRoot = document.querySelector('.left-body-carousel');
            if (carouselRoot) {
                carouselRoot.style.display = 'none';
            }
            return;
        }
        
        // Afficher les articles
        renderCarousel();
        setupEventListeners();
    } catch (error) {
        console.error('Erreur lors du chargement du carrousel:', error);
        const carouselRoot = document.querySelector('.left-body-carousel');
        if (carouselRoot) {
            carouselRoot.style.display = 'none';
        }
    }
}

function renderCarousel() {
    const track = document.getElementById('carousel-track');
    const indicators = document.getElementById('carousel-indicators');
    
    // Vider le contenu
    track.innerHTML = '';
    indicators.innerHTML = '';
    
    // Dupliquer les articles pour un défilement infini
    const duplicatedArticles = [...articles, ...articles];
    
    // Créer les cartes d'articles
    duplicatedArticles.forEach((article, index) => {
        // Carte d'article
        const articleCard = document.createElement('div');
        articleCard.className = 'carousel-item';
        const articleUrl = buildArticlePageUrl(article.id);
        const articleImage = normalizeAssetPath(article.image);
        articleCard.innerHTML = `
            <a href="${articleUrl}" class="carousel-card">
                ${article.image ? `
                <div class="carousel-image-wrapper">
                    <img src="${articleImage}" alt="${article.title}" class="carousel-image">
                </div>
                ` : ''}
                <div class="carousel-content">
                    <span class="carousel-category">${article.category}</span>
                    <h3 class="carousel-title-article">${article.title}</h3>
                    ${article.date ? `<p class="carousel-date">${article.date}</p>` : ''}
                    <p class="carousel-excerpt">${article.excerpt}</p>
                    <span class="carousel-link">Lire l'article</span>
                </div>
            </a>
        `;
        track.appendChild(articleCard);
    });
    
    // Créer les indicateurs (une seule fois pour les articles originaux)
    articles.forEach((article, index) => {
        const indicator = document.createElement('button');
        indicator.className = 'carousel-indicator';
        if (index === 0) indicator.classList.add('active');
        indicator.setAttribute('aria-label', `Article ${index + 1}`);
        indicator.addEventListener('click', () => goToSlide(index));
        indicators.appendChild(indicator);
    });
    
    updateCarousel();
}

function updateCarousel() {
    const track = document.getElementById('carousel-track');
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    // Calculer le décalage (défilement d'un article à la fois)
    const offset = -currentIndex * 100;
    track.style.transform = `translateX(${offset}%)`;
    
    // Mettre à jour les indicateurs
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex % articles.length);
    });
}

function nextSlide() {
    currentIndex++;
    
    // Réinitialiser pour la boucle infinie
    if (currentIndex >= articles.length * 2) {
        currentIndex = articles.length;
    }
    
    updateCarousel();
}

function prevSlide() {
    currentIndex--;
    
    if (currentIndex < 0) {
        currentIndex = articles.length - 1;
    }
    
    updateCarousel();
}

function goToSlide(index) {
    currentIndex = index;
    updateCarousel();
}

function startAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(() => {
        nextSlide();
    }, autoPlayDelay);
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

function setupEventListeners() {
    const prevBtn = document.querySelector('.carousel-button-prev');
    const nextBtn = document.querySelector('.carousel-button-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
        });
    }
    
    // Support au clavier
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        }
        if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });
}

// Initialiser le carrousel au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousel);
} else {
    initCarousel();
}

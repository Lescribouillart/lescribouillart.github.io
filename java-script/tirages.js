// Vérification si on est en local
function isLocalHost() {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname === '' || 
           hostname.startsWith('192.168.') ||
           hostname.startsWith('10.') ||
           hostname.endsWith('.local');
}

// Bloquer l'accès en production
if (!isLocalHost()) {
    document.getElementById('localOnlyWarning').style.display = 'block';
    document.getElementById('editorContainer').style.display = 'none';
} else {
    initEditor();
}

function initEditor() {
    const editor = document.getElementById('editor');
    const articleSubject = document.getElementById('articleSubject');
    const output = document.getElementById('output');
    const formatSelector = document.getElementById('formatSelector');
    const convertBtn = document.getElementById('convertBtn');
    const copyBtn = document.getElementById('copyBtn');
    const statusMessage = document.getElementById('statusMessage');
    const linkBtn = document.getElementById('linkBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const newArticleBtn = document.getElementById('newArticleBtn');
    const articlesList = document.getElementById('articlesList');
    const darkModeToggle = document.getElementById('darkModeToggle');

    let currentArticleId = null;

    // Charger le contenu sauvegardé au démarrage (localStorage)
    loadFromLocalStorage();
    
    // Afficher la liste des articles
    refreshArticlesList();

    // Charger la préférence du mode nuit
    loadDarkModePreference();

    // Bouton Mode Nuit
    darkModeToggle.addEventListener('click', () => {
        toggleDarkMode();
    });

    // Gestion des boutons de la barre d'outils
    document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            const value = btn.dataset.value || null;
            
            document.execCommand(command, false, value);
            editor.focus();
        });
    });

    // Bouton lien personnalisé
    linkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = prompt('Entrez l\'URL du lien :');
        if (url) {
            document.execCommand('createLink', false, url);
        }
        editor.focus();
    });

    // Conversion
    convertBtn.addEventListener('click', () => {
        const format = formatSelector.value;
        const content = editor.innerHTML;

        if (format === 'html') {
            output.textContent = cleanHTML(content);
        } else if (format === 'javascript') {
            output.textContent = convertToJavaScript(content);
        }

        hideStatus();
    });

    // Copie dans le presse-papiers
    copyBtn.addEventListener('click', async () => {
        const text = output.textContent;
        
        if (!text) {
            showStatus('Aucun contenu à copier', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            showStatus('✓ Copié dans le presse-papiers !', 'success');
        } catch (err) {
            // Fallback pour les navigateurs plus anciens
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                showStatus('✓ Copié dans le presse-papiers !', 'success');
            } catch (e) {
                showStatus('Erreur lors de la copie', 'error');
            }
            
            document.body.removeChild(textarea);
        }
    });

    // Sauvegarde automatique dans localStorage toutes les 30 secondes
    let autoSaveInterval = setInterval(() => {
        saveToLocalStorage(true);
    }, 30000);

    // Bouton Publier - Télécharger ET sauvegarder dans la liste
    saveBtn.addEventListener('click', () => {
        publishArticle();
    });

    // Bouton Nouvel Article
    newArticleBtn.addEventListener('click', () => {
        createNewArticle();
    });

    // Bouton Charger - Charger depuis un fichier
    loadBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.html';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target.result;
                    
                    // Extraire l'objet depuis les commentaires si présent
                    const subjectMatch = content.match(/<!-- Objet: (.+?) -->/);
                    if (subjectMatch) {
                        articleSubject.value = subjectMatch[1];
                        // Retirer les métadonnées du contenu
                        editor.innerHTML = content.replace(/<!-- .+? -->\n*/g, '').trim();
                    } else {
                        editor.innerHTML = content;
                    }
                    
                    showStatus('✓ Fichier chargé !', 'success');
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    });

    // Bouton Effacer
    clearBtn.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir effacer tout le contenu ? Cette action est irréversible.')) {
            articleSubject.value = '';
            editor.innerHTML = '<h2>Titre de votre article</h2><p>Commencez à écrire votre article ici...</p>';
            output.textContent = '';
            showStatus('✓ Contenu effacé !', 'success');
        }
    });

    /**
     * Crée un nouvel article vierge
     */
    function createNewArticle() {
        if (confirm('Voulez-vous créer un nouvel article ? Les modifications non enregistrées seront perdues.')) {
            currentArticleId = null;
            articleSubject.value = '';
            editor.innerHTML = '<h2>Titre de votre article</h2><p>Commencez à écrire votre article ici...</p>';
            output.textContent = '';
            
            refreshArticlesList();
            showStatus('✓ Nouvel article créé !', 'success');
        }
    }

    /**
     * Publie l'article : télécharge le fichier ET l'ajoute à la liste
     */
    function publishArticle() {
        const subject = articleSubject.value.trim();
        const content = editor.innerHTML;
        
        if (!subject) {
            showStatus('⚠️ Veuillez saisir un objet pour l\'article', 'error');
            return;
        }
        
        // 1. Télécharger le fichier
        downloadFile(subject, content);
        
        // 2. Sauvegarder dans la liste
        saveArticleToList(subject, content);
    }

    /**
     * Télécharge le contenu de l'éditeur dans un fichier HTML
     */
    function downloadFile(subject, content) {
        const timestamp = new Date().toISOString().slice(0, 10);
        
        // Générer un nom de fichier basé sur l'objet
        const cleanSubject = subject
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
        const filename = `${cleanSubject}-${timestamp}.html`;
        
        // Créer le contenu complet avec métadonnées
        const fullContent = `<!-- Objet: ${subject} -->\n<!-- Date: ${timestamp} -->\n\n${content}`;
        
        // Créer un blob avec le contenu
        const blob = new Blob([fullContent], { type: 'text/html;charset=utf-8' });
        
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        
        // Déclencher le téléchargement
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Libérer la mémoire
        URL.revokeObjectURL(link.href);
    }

    /**
     * Sauvegarde l'article dans la liste
     */
    function saveArticleToList(subject, content) {
        // Récupérer la liste des articles
        const articles = getArticlesList();
        
        // Créer ou mettre à jour l'article
        const article = {
            id: currentArticleId || Date.now(),
            subject: subject,
            content: content,
            preview: getTextPreview(content),
            date: new Date().toLocaleString('fr-FR')
        };
        
        // Vérifier si l'article existe déjà
        const existingIndex = articles.findIndex(a => a.id === article.id);
        
        if (existingIndex >= 0) {
            articles[existingIndex] = article;
        } else {
            articles.unshift(article);
        }
        
        // Sauvegarder dans localStorage
        localStorage.setItem('scribouillart_articles', JSON.stringify(articles));
        
        currentArticleId = article.id;
        
        // Rafraîchir la liste
        refreshArticlesList();
        
        showStatus(`✓ Article "${subject}" publié et sauvegardé !`, 'success');
    }

    /**
     * Récupère la liste des articles depuis localStorage
     */
    function getArticlesList() {
        const stored = localStorage.getItem('scribouillart_articles');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Extrait un aperçu textuel du contenu HTML
     */
    function getTextPreview(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const text = temp.textContent || temp.innerText || '';
        return text.substring(0, 100);
    }

    /**
     * Rafraîchit l'affichage de la liste des articles
     */
    function refreshArticlesList() {
        const articles = getArticlesList();
        
        if (articles.length === 0) {
            articlesList.innerHTML = '<div class="no-articles">Aucun article sauvegardé</div>';
            return;
        }
        
        articlesList.innerHTML = articles.map(article => `
            <div class="article-card-item ${article.id === currentArticleId ? 'active' : ''}" data-id="${article.id}">
                <div class="article-card-subject">${escapeHtml(article.subject)}</div>
                <div class="article-card-preview">${escapeHtml(article.preview)}</div>
                <div class="article-card-date">${article.date}</div>
                <button class="article-card-delete" data-id="${article.id}" onclick="event.stopPropagation()">
                    🗑️ Supprimer
                </button>
            </div>
        `).join('');
        
        // Ajouter les événements de clic
        articlesList.querySelectorAll('.article-card-item').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                loadArticleFromList(id);
            });
        });
        
        // Ajouter les événements de suppression
        articlesList.querySelectorAll('.article-card-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                deleteArticleFromList(id);
            });
        });
    }

    /**
     * Charge un article depuis la liste
     */
    function loadArticleFromList(id) {
        const articles = getArticlesList();
        const article = articles.find(a => a.id === id);
        
        if (article) {
            articleSubject.value = article.subject;
            editor.innerHTML = article.content;
            currentArticleId = article.id;
            
            refreshArticlesList();
            showStatus(`✓ Article "${article.subject}" chargé !`, 'success');
        }
    }

    /**
     * Supprime un article de la liste
     */
    function deleteArticleFromList(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
            return;
        }
        
        const articles = getArticlesList();
        const filteredArticles = articles.filter(a => a.id !== id);
        
        localStorage.setItem('scribouillart_articles', JSON.stringify(filteredArticles));
        
        if (currentArticleId === id) {
            currentArticleId = null;
        }
        
        refreshArticlesList();
        showStatus('✓ Article supprimé !', 'success');
    }

    /**
     * Échappe le HTML pour l'affichage
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Sauvegarde le contenu dans le localStorage (sauvegarde automatique)
     */
    function saveToLocalStorage(isAutoSave = false) {
        const content = editor.innerHTML;
        const subject = articleSubject.value;
        const timestamp = new Date().toLocaleString('fr-FR');
        
        try {
            localStorage.setItem('scribouillart_editor_content', content);
            localStorage.setItem('scribouillart_editor_subject', subject);
            localStorage.setItem('scribouillart_editor_timestamp', timestamp);
            
            if (!isAutoSave) {
                console.log(`Sauvegarde automatique : ${timestamp}`);
            }
        } catch (e) {
            console.error('Erreur lors de la sauvegarde automatique');
        }
    }

    /**
     * Charge le contenu depuis le localStorage
     */
    function loadFromLocalStorage() {
        const savedContent = localStorage.getItem('scribouillart_editor_content');
        const savedSubject = localStorage.getItem('scribouillart_editor_subject');
        const timestamp = localStorage.getItem('scribouillart_editor_timestamp');
        
        if (savedContent) {
            editor.innerHTML = savedContent;
        }
        
        if (savedSubject) {
            articleSubject.value = savedSubject;
        }
        
        if (timestamp) {
            console.log(`Contenu restauré (dernier enregistrement : ${timestamp})`);
        }
    }

    /**
     * Bascule entre le mode clair et le mode nuit
     */
    function toggleDarkMode() {
        const body = document.body;
        const isDarkMode = body.classList.toggle('dark-mode');
        
        // Changer l'icône
        darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
        
        // Sauvegarder la préférence
        localStorage.setItem('scribouillart_dark_mode', isDarkMode ? 'true' : 'false');
    }

    /**
     * Charge la préférence du mode nuit
     */
    function loadDarkModePreference() {
        const isDarkMode = localStorage.getItem('scribouillart_dark_mode') === 'true';
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️';
        }
    }

    // Sauvegarder dans localStorage avant de quitter la page
    window.addEventListener('beforeunload', () => {
        saveToLocalStorage(true);
    });
}

/**
 * Nettoie et formate le HTML généré par contenteditable
 */
function cleanHTML(html) {
    // Créer un élément temporaire pour parser le HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Supprimer les attributs de style inline ajoutés par contenteditable
    temp.querySelectorAll('[style]').forEach(el => {
        el.removeAttribute('style');
    });

    // Supprimer les balises non désirées
    temp.querySelectorAll('font, span').forEach(el => {
        const parent = el.parentNode;
        while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
    });

    // Récupérer le HTML nettoyé
    let cleaned = temp.innerHTML;

    // Formater avec indentation
    cleaned = formatHTML(cleaned);

    return cleaned;
}

/**
 * Formate le HTML avec indentation
 */
function formatHTML(html) {
    let formatted = '';
    let indent = 0;
    const tab = '    ';

    // Supprimer les espaces multiples
    html = html.replace(/\s+/g, ' ');

    // Diviser par balises
    const tokens = html.split(/(<\/?[^>]+>)/g).filter(token => token.trim());

    tokens.forEach(token => {
        if (token.match(/^<\/\w/)) {
            // Balise fermante
            indent = Math.max(0, indent - 1);
            formatted += tab.repeat(indent) + token.trim() + '\n';
        } else if (token.match(/^<\w[^>]*[^\/]>$/)) {
            // Balise ouvrante
            formatted += tab.repeat(indent) + token.trim() + '\n';
            indent++;
        } else if (token.match(/^<\w[^>]*\/>$/)) {
            // Balise auto-fermante
            formatted += tab.repeat(indent) + token.trim() + '\n';
        } else {
            // Texte
            const text = token.trim();
            if (text) {
                formatted += tab.repeat(indent) + text + '\n';
            }
        }
    });

    return formatted.trim();
}

/**
 * Convertit le HTML en code JavaScript
 */
function convertToJavaScript(html) {
    // Nettoyer le HTML d'abord
    const cleanedHTML = cleanHTML(html);

    // Échapper les backticks et les template literals
    const escaped = cleanedHTML
        .replace(/\\/g, '\\\\')  // Échapper les backslashes
        .replace(/`/g, '\\`')     // Échapper les backticks
        .replace(/\$\{/g, '\\${'); // Échapper les interpolations

    // Créer le code JavaScript
    const jsCode = `const articleContent = \`
${escaped}
\`;

export default articleContent;

// Ou en CommonJS :
// module.exports = articleContent;

// Ou comme constante simple :
// const content = \`${escaped.split('\n').slice(0, 3).join('\n')}...\`;`;

    return jsCode;
}

/**
 * Affiche un message de statut
 */
function showStatus(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            hideStatus();
        }, 3000);
    }
}

/**
 * Cache le message de statut
 */
function hideStatus() {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.className = 'status-message';
}

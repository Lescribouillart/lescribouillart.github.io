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

    // Charger le contenu sauvegardé au démarrage (localStorage)
    loadFromLocalStorage();

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

    // Bouton Enregistrer - Télécharger le fichier
    saveBtn.addEventListener('click', () => {
        downloadFile();
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
                    editor.innerHTML = event.target.result;
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
     * Télécharge le contenu de l'éditeur dans un fichier HTML
     */
    function downloadFile() {
        const content = editor.innerHTML;
        const subject = articleSubject.value.trim();
        const timestamp = new Date().toISOString().slice(0, 10);
        
        // Générer un nom de fichier basé sur l'objet ou la date
        let filename;
        if (subject) {
            // Nettoyer l'objet pour le nom de fichier
            const cleanSubject = subject
                .toLowerCase()
                .replace(/[àáâãäå]/g, 'a')
                .replace(/[èéêë]/g, 'e')
                .replace(/[ìíîï]/g, 'i')
                .replace(/[òóôõö]/g, 'o')
                .replace(/[ùúûü]/g, 'u')
                .replace(/[ç]/g, 'c')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .substring(0, 50);
            filename = `${cleanSubject}-${timestamp}.html`;
        } else {
            filename = `article-${timestamp}.html`;
        }
        
        // Créer le contenu complet avec métadonnées
        const fullContent = subject 
            ? `<!-- Objet: ${subject} -->\n<!-- Date: ${timestamp} -->\n\n${content}`
            : content;
        
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
        
        showStatus(`✓ Fichier "${filename}" téléchargé !`, 'success');
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

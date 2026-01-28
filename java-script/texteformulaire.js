// Gestion de l'éditeur de texte riche pour le formulaire de contact
document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('message-editor');
    const hiddenTextarea = document.getElementById('message');
    const editorButtons = document.querySelectorAll('.editor-btn');
    const form = document.getElementById('contact-form');

    // Initialiser avec le placeholder
    if (editor) {
        editor.setAttribute('data-placeholder', 'Écrivez votre message ici...');
        
        // Gérer le placeholder
        editor.addEventListener('focus', function() {
            if (this.textContent.trim() === '') {
                this.classList.add('has-content');
            }
        });
        
        editor.addEventListener('blur', function() {
            if (this.textContent.trim() === '') {
                this.classList.remove('has-content');
            }
        });
        
        // Synchroniser avec le textarea caché
        editor.addEventListener('input', function() {
            hiddenTextarea.value = this.innerHTML;
            
            // Validation
            if (this.textContent.trim() === '') {
                hiddenTextarea.setCustomValidity('Le message est requis');
            } else {
                hiddenTextarea.setCustomValidity('');
            }
        });
    }

    // Gérer les boutons de la barre d'outils
    editorButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const command = this.getAttribute('data-command');
            
            // Exécuter la commande
            document.execCommand(command, false, null);
            
            // Mettre à jour l'état visuel du bouton
            updateButtonState(this, command);
            
            // Remettre le focus sur l'éditeur
            editor.focus();
            
            // Synchroniser avec le textarea caché
            hiddenTextarea.value = editor.innerHTML;
        });
    });

    // Fonction pour mettre à jour l'état visuel des boutons
    function updateButtonState(button, command) {
        // Vérifier si la commande est active à la position actuelle
        const isActive = document.queryCommandState(command);
        
        if (isActive) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }

    // Mettre à jour les boutons quand la sélection change
    editor.addEventListener('mouseup', updateAllButtons);
    editor.addEventListener('keyup', updateAllButtons);
    editor.addEventListener('focus', updateAllButtons);

    function updateAllButtons() {
        editorButtons.forEach(button => {
            const command = button.getAttribute('data-command');
            if (command) {
                const isActive = document.queryCommandState(command);
                if (isActive) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
    }

    // Avant la soumission du formulaire, s'assurer que le contenu est synchronisé
    if (form) {
        form.addEventListener('submit', function(e) {
            const content = editor.textContent.trim();
            
            if (content === '') {
                e.preventDefault();
                alert('Veuillez écrire un message avant d\'envoyer le formulaire.');
                editor.focus();
                return false;
            }
            
            // Synchroniser une dernière fois
            hiddenTextarea.value = editor.innerHTML;
        });
    }

    // Gérer le collage de texte (nettoyer le formatage externe)
    editor.addEventListener('paste', function(e) {
        e.preventDefault();
        
        // Récupérer le texte brut
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        
        // Insérer le texte brut
        document.execCommand('insertText', false, text);
    });
});

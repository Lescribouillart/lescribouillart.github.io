// Configuration du formulaire de contact avec Web3Forms
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contact-form');
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Désactiver le bouton pendant l'envoi
        submitButton.disabled = true;
        submitButton.textContent = 'Envoi en cours...';

        // Récupérer les données du formulaire
        const formData = new FormData(form);

        try {
            // Envoi à Web3Forms
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Message de succès
                showMessage('✅ Votre message a été envoyé avec succès !', 'success');
                form.reset();
            } else {
                // Message d'erreur
                showMessage('❌ Une erreur est survenue. Veuillez réessayer.', 'error');
                console.error('Erreur:', data);
            }
        } catch (error) {
            // Erreur de connexion
            showMessage('❌ Erreur de connexion. Veuillez vérifier votre connexion internet.', 'error');
            console.error('Erreur:', error);
        } finally {
            // Réactiver le bouton
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Fonction pour afficher les messages
    function showMessage(text, type) {
        // Supprimer les anciens messages
        const oldMessage = form.querySelector('.form-message');
        if (oldMessage) {
            oldMessage.remove();
        }

        // Créer le nouveau message
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${type}`;
        messageDiv.textContent = text;
        
        // Insérer le message après le bouton
        submitButton.parentNode.insertBefore(messageDiv, submitButton.nextSibling);

        // Supprimer le message après 5 secondes
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
});

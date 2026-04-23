// Configuration du formulaire de contact avec Web3Forms
// Basé sur l'exemple officiel de Web3Forms
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contact-form');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        // Anti-bot : si le champ honeypot est rempli, on bloque la soumission
        if (form.website && form.website.value) {
            e.preventDefault();
            showMessage("Erreur : tentative de spam détectée.", "error");
            return;
        }
        e.preventDefault();

        const formData = new FormData(form);
        // Ajout de la clé d'accès via JavaScript (méthode Web3Forms)
        formData.append("access_key", "85ca8a20-ae8d-4ee7-abc1-d47fa9ded6ef");

        const originalText = submitBtn.textContent;

        submitBtn.textContent = "Envoi en cours...";
        submitBtn.disabled = true;

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Redirection vers la page de confirmation
                window.location.href = "confirmation.html";
            } else {
                showMessage(" Erreur : " + (data.message || "Veuillez réessayer."), "error");
                console.error("Erreur Web3Forms:", data);
            }

        } catch (error) {
            showMessage(" Erreur de connexion. Veuillez vérifier votre connexion internet.", "error");
            console.error("Erreur:", error);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
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
        submitBtn.parentNode.insertBefore(messageDiv, submitBtn.nextSibling);

        // Supprimer le message après 5 secondes
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
});

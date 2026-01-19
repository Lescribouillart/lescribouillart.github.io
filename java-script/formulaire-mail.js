// Configuration du formulaire de contact avec Web3Forms
// Basé sur l'exemple officiel de Web3Forms
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contact-form');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        // Ajout de la clé d'accès via JavaScript (méthode Web3Forms)
        formData.append("access_key", "e3dd0f5e-91eb-481f-8ead-f5fe129beaae");

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
                showMessage("✅ Votre message a été envoyé avec succès !", "success");
                form.reset();
            } else {
                showMessage("❌ Erreur : " + (data.message || "Veuillez réessayer."), "error");
                console.error("Erreur Web3Forms:", data);
            }

        } catch (error) {
            showMessage("❌ Erreur de connexion. Veuillez vérifier votre connexion internet.", "error");
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

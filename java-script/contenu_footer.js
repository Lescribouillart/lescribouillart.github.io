// Contenu des différentes pages du footer
const contenuPagesFooter = {
    'a-propos': {
        titre: 'À Propos',
        contenu: `
            <div class="presentation">
                <div class="presentation-bg2">
                    <h1>À Propos</h1>
                    <p>Bienvenue sur notre blog dédié à [votre thématique].</p>
                    <p>Notre mission est de partager des connaissances, des expériences et des idées pour [objectif du blog].</p>
                    <p>Lancé en [année], ce blog est devenu une référence pour [votre domaine].</p>
                </div>
            </div>
        `
    },
    'contact': {
        titre: 'Contact',
        contenu: `
            <div class="presentation">
                <div class="presentation-bg2">
                    <h1>Contact</h1>
                    <p>N'hésitez pas à nous contacter pour toute question ou suggestion.</p>
                    <form id="contact-form">
                        <!-- Configuration optionnelle -->
                        <input type="hidden" name="subject" value="Nouveau message depuis Le Scribouill'art">
                        <input type="hidden" name="from_name" value="Le Scribouill'art">
                        
                        <!-- Protection anti-spam (honeypot) -->
                        <input type="checkbox" name="botcheck" style="display: none;">
                        
                        <div class="form-group">
                            <label for="nom">Nom :</label>
                            <input type="text" id="nom" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email :</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="message">Message :</label>
                            <textarea id="message" name="message" rows="5" required></textarea>
                        </div>
                        <button type="submit">Envoyer</button>
                    </form>
                    
                    <div class="article-footer">
                        <a href="index.html" class="back-link">← Retour à l'accueil</a>
                    </div>
                </div>
            </div>
        `
    }
};

// Fonction pour afficher une page du footer
async function afficherPageFooter(pageId) {
    const page = contenuPagesFooter[pageId];
    if (!page) return;

    const mainContent = document.querySelector('main .container');
    if (!mainContent) return;

    // Sauvegarder le contenu original si ce n'est pas déjà fait
    if (!mainContent.dataset.originalContent) {
        mainContent.dataset.originalContent = mainContent.innerHTML;
    }

    // Charger le contenu depuis un fichier HTML si spécifié
    let contenu = page.contenu;
    if (page.fichier) {
        try {
            const response = await fetch(page.fichier);
            const html = await response.text();
            // Extraire le contenu du body
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            contenu = doc.body.innerHTML;
        } catch (error) {
            console.error('Erreur lors du chargement de la page:', error);
            contenu = '<p>Erreur lors du chargement du contenu.</p>';
        }
    }

    // Remplacer le contenu du main
    mainContent.innerHTML = contenu;

    window.scrollTo(0, 0);

    if (pageId === 'contact') {
        const form = document.getElementById('contact-form');
        if (form) {
            form.addEventListener('submit', gererSoumissionContactWeb3Forms);
        }
    }
}

// Fonction pour fermer la page du footer
function fermerPageFooter() {
    const mainContent = document.querySelector('main .container');
    if (mainContent && mainContent.dataset.originalContent) {
        mainContent.innerHTML = mainContent.dataset.originalContent;
    }
    window.scrollTo(0, 0);
}

// Fonction pour gérer la soumission du formulaire de contact avec Web3Forms
async function gererSoumissionContactWeb3Forms(e) {
    e.preventDefault();
    console.log("📤 Formulaire contact soumis depuis index.html");
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    const formData = new FormData(form);
    // Ajout de la clé d'accès via JavaScript
    formData.append("access_key", "85ca8a20-ae8d-4ee7-abc1-d47fa9ded6ef");
    
    console.log("📦 Données du formulaire :");
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    submitBtn.textContent = "Envoi en cours...";
    submitBtn.disabled = true;
    
    try {
        console.log("🌐 Envoi vers Web3Forms...");
        
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });
        
        const data = await response.json();
        console.log("📨 Réponse reçue :", data);
        
        if (response.ok) {
            console.log("✅ Succès !");
            showMessageInForm(form, submitBtn, "✅ Votre message a été envoyé avec succès !", "success");
            form.reset();
        } else {
            console.error("❌ Erreur de Web3Forms :", data);
            showMessageInForm(form, submitBtn, "❌ Erreur : " + (data.message || "Veuillez réessayer."), "error");
        }
        
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi :", error);
        showMessageInForm(form, submitBtn, "❌ Erreur de connexion. Veuillez vérifier votre connexion internet.", "error");
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Fonction pour afficher les messages dans le formulaire
function showMessageInForm(form, submitBtn, text, type) {
    console.log(`💬 Affichage message : ${text}`);
    
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

// Fonction pour gérer la soumission du formulaire de contact (ancienne version - conservée pour compatibilité)
function gererSoumissionContact(e) {
    e.preventDefault();
    
    const nom = document.getElementById('nom').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // Simuler l'envoi (à remplacer par un vrai système d'envoi)
    console.log('Message envoyé:', { nom, email, message });
    
    alert('Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
    e.target.reset();
}

// Initialisation : ajouter les écouteurs d'événements aux liens du footer
function initialiserLinksFooter() {
    // Attendre que le DOM soit chargé
    const links = document.querySelectorAll('.footer-link[data-page]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            afficherPageFooter(pageId);
        });
    });
}

// Lancer l'initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiserLinksFooter);
} else {
    initialiserLinksFooter();
}

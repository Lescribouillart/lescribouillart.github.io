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
                        <div class="form-group">
                            <label for="nom">Nom :</label>
                            <input type="text" id="nom" name="nom" required>
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
            form.addEventListener('submit', gererSoumissionContact);
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

// Fonction pour gérer la soumission du formulaire de contact
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

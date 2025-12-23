// Contenu des différentes pages du footer
const contenuPagesFooter = {
    'a-propos': {
        titre: 'À Propos',
        contenu: `
            <div class="page-footer-content">
                <h1>À Propos</h1>
                <p>Bienvenue sur notre blog dédié à [votre thématique].</p>
                <p>Notre mission est de partager des connaissances, des expériences et des idées pour [objectif du blog].</p>
                <p>Lancé en [année], ce blog est devenu une référence pour [votre domaine].</p>
            </div>
        `
    },
    'contact': {
        titre: 'Contact',
        contenu: `
            <div class="page-footer-content">
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
        `
    },
    'auteur': {
        titre: 'Auteur',
        contenu: `
            <div class="page-footer-content">
                <h1>L'Auteur</h1>
                <p><strong>Nom de l'auteur</strong></p>
                <p>Passionné par [domaine], j'écris sur ce blog depuis [année].</p>
                <p>Mon parcours : [description brève du parcours]</p>
                <p>Mes centres d'intérêt : [liste des centres d'intérêt]</p>
                <div class="social-links">
                    <a href="#" target="_blank">Twitter</a>
                    <a href="#" target="_blank">LinkedIn</a>
                    <a href="#" target="_blank">GitHub</a>
                </div>
            </div>
        `
    },
    'mentions-legales': {
        titre: 'Mentions Légales',
        contenu: `
            <div class="page-footer-content">
                <h1>Mentions Légales</h1>
                <h2>Éditeur du site</h2>
                <p>[Nom ou raison sociale]<br>
                [Adresse]<br>
                Email : [email]</p>
                
                <h2>Hébergeur</h2>
                <p>[Nom de l'hébergeur]<br>
                [Adresse de l'hébergeur]</p>
                
                <h2>Propriété intellectuelle</h2>
                <p>Tous les contenus présents sur ce site sont protégés par le droit d'auteur.</p>
                
                <h2>Protection des données personnelles</h2>
                <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.</p>
            </div>
        `
    }
};

// Fonction pour afficher une page du footer
function afficherPageFooter(pageId) {
    const page = contenuPagesFooter[pageId];
    if (!page) return;

    // Créer le conteneur de la page s'il n'existe pas
    let pageContainer = document.getElementById('page-footer-container');
    if (!pageContainer) {
        pageContainer = document.createElement('div');
        pageContainer.id = 'page-footer-container';
        document.body.appendChild(pageContainer);
    }

    // Afficher le contenu
    pageContainer.innerHTML = `
        <button id="btn-retour" class="btn-retour">← Retour</button>
        ${page.contenu}
    `;

    // Cacher le contenu principal
    const mainContent = document.querySelector('main') || document.querySelector('.container');
    if (mainContent) {
        mainContent.style.display = 'none';
    }

    // Afficher le conteneur de la page
    pageContainer.style.display = 'block';

    // Gérer le bouton retour
    document.getElementById('btn-retour').addEventListener('click', fermerPageFooter);

    // Scroll vers le haut
    window.scrollTo(0, 0);

    // Si c'est la page contact, gérer le formulaire
    if (pageId === 'contact') {
        const form = document.getElementById('contact-form');
        if (form) {
            form.addEventListener('submit', gererSoumissionContact);
        }
    }
}

// Fonction pour fermer la page du footer
function fermerPageFooter() {
    const pageContainer = document.getElementById('page-footer-container');
    if (pageContainer) {
        pageContainer.style.display = 'none';
    }

    // Réafficher le contenu principal
    const mainContent = document.querySelector('main') || document.querySelector('.container');
    if (mainContent) {
        mainContent.style.display = 'block';
    }
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

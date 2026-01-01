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
                <p><strong>Nom ou pseudonyme :</strong> Drelall</p>
                <p><strong>Email :</strong> lescribouillart@protonmail.com</p>
                <p>Site non professionnel réalisé à titre personnel.</p>
                <p><strong>Adresse du site :</strong> <a href="https://drelall.github.io/" target="_blank" rel="noopener noreferrer">https://drelall.github.io/</a></p>
                
                <h2>Hébergeur</h2>
                <p><strong>Nom :</strong> GitHub Pages</p>
                <p><strong>Compte GitHub :</strong> <a href="https://github.com/Drelall" target="_blank" rel="noopener noreferrer">https://github.com/Drelall</a></p>
                <p><strong>Adresse du dépôt :</strong> <a href="https://github.com/Drelall/drelall.github.io" target="_blank" rel="noopener noreferrer">https://github.com/Drelall/drelall.github.io</a></p>
                <p><strong>Hébergeur :</strong> GitHub, Inc.<br>
                88 Colin P. Kelly Jr Street, San Francisco, CA 94107, USA<br>
                <strong>Site :</strong> <a href="https://github.com" target="_blank" rel="noopener noreferrer">https://github.com</a></p>
                
                <h2>Propriété intellectuelle</h2>
                <p>L'ensemble du contenu présent sur ce site (textes, images, illustrations, code, design) est protégé par le droit d'auteur. Toute reproduction, modification ou diffusion sans autorisation est interdite.</p>
                
                <h2>Données personnelles</h2>
                <p>Ce site ne collecte aucune donnée personnelle et ne dépose aucun cookie.</p>
                <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour toute demande, vous pouvez contacter l'éditeur à l'adresse mentionnée ci-dessus.</p>
                
                <h2>Cookies</h2>
                <p>Ce site n'utilise aucun cookie et ne trace aucune activité des visiteurs.</p>
                
                <p style="margin-top: 2em;"><em>Dernière mise à jour : 1er janvier 2026</em></p>
            </div>
        `
    }
};

// Fonction pour afficher une page du footer
function afficherPageFooter(pageId) {
    const page = contenuPagesFooter[pageId];
    if (!page) return;

    const mainContent = document.querySelector('main .container');
    if (!mainContent) return;

    // Sauvegarder le contenu original si ce n'est pas déjà fait
    if (!mainContent.dataset.originalContent) {
        mainContent.dataset.originalContent = mainContent.innerHTML;
    }

    // Remplacer le contenu du main
    mainContent.innerHTML = page.contenu;

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

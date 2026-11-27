(function() {
    'use strict';

    const translations = {
        fr: {
            title: "Présentation — Le Scribouill'art",
            skip: 'Aller au contenu principal',
            chooseLanguage: 'Choisir la langue',
            login: 'Connexion',
            root: 'racine décorative',
            folio: 'Le feuillet',
            chronology: 'La chronologie',
            characters: 'Les personnages',
            library: 'La bibliothèque',
            places: 'Les lieux',
            construction: 'est en construction',
            unavailable: 'Site indisponible pour le moment',
            constructionArt: 'Illustration chantier du site',
            rights: 'Tous droits réservés'
        },
        en: {
            title: "Presentation — Le Scribouill'art",
            skip: 'Skip to main content',
            chooseLanguage: 'Choose language',
            login: 'Sign in',
            root: 'decorative roots',
            folio: 'The folio',
            chronology: 'The timeline',
            characters: 'The characters',
            library: 'The library',
            places: 'The places',
            construction: 'is under construction',
            unavailable: 'The website is currently unavailable',
            constructionArt: 'Website under construction illustration',
            rights: 'All rights reserved'
        },
        es: {
            title: "Presentación — Le Scribouill'art",
            skip: 'Ir al contenido principal',
            chooseLanguage: 'Elegir idioma',
            login: 'Iniciar sesión',
            root: 'raíces decorativas',
            folio: 'El cuadernillo',
            chronology: 'La cronología',
            characters: 'Los personajes',
            library: 'La biblioteca',
            places: 'Los lugares',
            construction: 'está en construcción',
            unavailable: 'El sitio no está disponible por el momento',
            constructionArt: 'Ilustración del sitio en construcción',
            rights: 'Todos los derechos reservados'
        },
        de: {
            title: "Präsentation — Le Scribouill'art",
            skip: 'Zum Hauptinhalt springen',
            chooseLanguage: 'Sprache auswählen',
            login: 'Anmelden',
            root: 'dekorative Wurzeln',
            folio: 'Das Blatt',
            chronology: 'Die Zeitleiste',
            characters: 'Die Figuren',
            library: 'Die Bibliothek',
            places: 'Die Orte',
            construction: 'befindet sich im Aufbau',
            unavailable: 'Die Website ist derzeit nicht verfügbar',
            constructionArt: 'Illustration der Website im Aufbau',
            rights: 'Alle Rechte vorbehalten'
        }
    };

    const sharedTranslations = {
        fr: {
            'Présentation': 'Présentation',
            'Publications': 'Publications',
            'Nouveautés': 'Nouveautés',
            'Le feuillet': 'Le feuillet',
            'La chronologie': 'La chronologie',
            'Les personnages': 'Les personnages',
            'La bibliothèque': 'La bibliothèque',
            'Les lieux': 'Les lieux',
            'Devenir membre': 'Devenir membre',
            'Contact': 'Contact',
            'Scribes': 'Scribes',
            'Mentions légales': 'Mentions légales',
            'Tous droits réservés': 'Tous droits réservés'
        },
        en: {
            'Présentation': 'Home',
            'Publications': 'Publications',
            'Nouveautés': 'News',
            'Le feuillet': 'The folio',
            'La chronologie': 'Timeline',
            'Les personnages': 'Characters',
            'La bibliothèque': 'Library',
            'Les lieux': 'Places',
            'Devenir membre': 'Become a member',
            'Contact': 'Contact',
            'Scribes': 'Writers',
            'Mentions légales': 'Legal notice',
            'Tous droits réservés': 'All rights reserved'
        },
        es: {
            'Présentation': 'Presentación',
            'Publications': 'Publicaciones',
            'Nouveautés': 'Novedades',
            'Le feuillet': 'El cuadernillo',
            'La chronologie': 'Cronología',
            'Les personnages': 'Personajes',
            'La bibliothèque': 'Biblioteca',
            'Les lieux': 'Lugares',
            'Devenir membre': 'Hacerse miembro',
            'Contact': 'Contacto',
            'Scribes': 'Autores',
            'Mentions légales': 'Aviso legal',
            'Tous droits réservés': 'Todos los derechos reservados'
        },
        de: {
            'Présentation': 'Präsentation',
            'Publications': 'Veröffentlichungen',
            'Nouveautés': 'Neuigkeiten',
            'Le feuillet': 'Das Blatt',
            'La chronologie': 'Zeitleiste',
            'Les personnages': 'Figuren',
            'La bibliothèque': 'Bibliothek',
            'Les lieux': 'Orte',
            'Devenir membre': 'Mitglied werden',
            'Contact': 'Kontakt',
            'Scribes': 'Autoren',
            'Mentions légales': 'Impressum',
            'Tous droits réservés': 'Alle Rechte vorbehalten'
        }
    };

    const picker = document.querySelector('.index-language-picker');
    const currentLabel = document.querySelector('[data-language-current]');
    const storedLanguage = localStorage.getItem('scribouillart-language');
    let currentLanguage = translations[storedLanguage] ? storedLanguage : 'fr';

    function applyLanguage(language) {
        const messages = translations[language];
        if (document.body.classList.contains('index-page')) {
            document.title = messages.title;
        }

        document.querySelectorAll('[data-i18n]').forEach(function(element) {
            element.textContent = messages[element.dataset.i18n];
        });

        document.querySelectorAll('[data-i18n-alt]').forEach(function(element) {
            element.alt = messages[element.dataset.i18nAlt];
        });

        document.querySelectorAll('[data-i18n-aria]').forEach(function(element) {
            element.setAttribute('aria-label', messages[element.dataset.i18nAria]);
        });

        document.querySelectorAll('.nav-link, .home-side-panel-title, .home-side-panel-text, .footer-link, .footer-copyright').forEach(function(element) {
            if (element.classList.contains('footer-copyright')) {
                const suffix = element.innerHTML.includes('<br>') ? element.innerHTML.substring(element.innerHTML.indexOf('<br>')) : '';
                element.innerHTML = "Le Scribouill'art - " + sharedTranslations[language]['Tous droits réservés'] + ' ' + suffix;
                return;
            }

            const originalText = element.dataset.originalLanguageText || element.textContent.trim();
            element.dataset.originalLanguageText = originalText;
            const replacement = sharedTranslations[language][originalText];

            if (!replacement) {
                return;
            }

            element.textContent = replacement;
        });

        currentLanguage = language;
        if (currentLabel) {
            currentLabel.textContent = language.toUpperCase();
        }
        if (picker) {
            picker.querySelectorAll('[data-language]').forEach(function(button) {
                button.setAttribute('aria-pressed', String(button.dataset.language === language));
            });
        }
        localStorage.setItem('scribouillart-language', language);
    }

    if (picker) {
        picker.querySelectorAll('[data-language]').forEach(function(button) {
            button.addEventListener('click', function() {
                applyLanguage(button.dataset.language);
                picker.open = false;
                picker.querySelector('summary').focus();
            });
        });

        document.addEventListener('click', function(event) {
            if (picker.open && !picker.contains(event.target)) {
                picker.open = false;
            }
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && picker.open) {
                picker.open = false;
                picker.querySelector('summary').focus();
            }
        });
    }

    applyLanguage(currentLanguage);
})();

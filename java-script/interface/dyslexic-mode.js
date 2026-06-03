// Mode Dyslexie - Accessibilité
(function() {
    'use strict';

    const MOBILE_BREAKPOINT = 900;

    function getDesktopOnlyPath() {
        const currentPath = window.location.pathname;

        if (currentPath.includes('/html2/')) {
            return '../html/bloquage.html';
        }

        if (currentPath.includes('/html/')) {
            return 'bloquage.html';
        }

        return 'html/bloquage.html';
    }

    function redirectMobileVisitors() {
        const isBlockingPage = window.location.pathname.endsWith('/html/bloquage.html')
            || window.location.pathname.endsWith('\\html\\bloquage.html')
            || window.location.pathname.endsWith('/bloquage.html')
            || window.location.pathname.endsWith('\\bloquage.html');

        if (isBlockingPage || window.innerWidth > MOBILE_BREAKPOINT) {
            return;
        }

        window.location.replace(getDesktopOnlyPath());
    }

    redirectMobileVisitors();
    
    // Vérifier si le mode dyslexie est activé dans le localStorage
    const isDyslexicMode = localStorage.getItem('dyslexicMode') === 'true';
    
    // Appliquer le mode au chargement de la page
    if (isDyslexicMode) {
        document.body.classList.add('dyslexic-mode');
    }
    
    // Fonction pour basculer le mode dyslexie
    function toggleDyslexicMode() {
        const body = document.body;
        const isActive = body.classList.toggle('dyslexic-mode');
        
        // Sauvegarder la préférence
        localStorage.setItem('dyslexicMode', isActive);
        
        // Animation de confirmation sur le bouton
        const btn = document.querySelector('.accessibility-btn');
        if (btn) {
            btn.style.transform = isActive ? 'scale(1.2)' : 'scale(1)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 300);
        }
    }
    
    // Attacher l'événement au bouton
    document.addEventListener('DOMContentLoaded', function() {
        const btn = document.querySelector('.accessibility-btn');
        if (btn) {
            btn.addEventListener('click', toggleDyslexicMode);
            btn.setAttribute('aria-pressed', isDyslexicMode);
            btn.setAttribute('title', 'Activer/Désactiver le mode dyslexie');
        }
    });
})();

// Mode Dyslexie - Accessibilité
(function() {
    'use strict';
    
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

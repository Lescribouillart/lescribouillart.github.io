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
        
        // Animation de confirmation
        const btn = document.querySelector('.accessibility-btn');
        if (btn) {
            btn.style.transform = isActive ? 'scale(1.2)' : 'scale(1)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 300);
        }
        
        // Message de confirmation
        showNotification(isActive ? 'Mode dyslexie activé' : 'Mode dyslexie désactivé');
    }
    
    // Fonction pour afficher une notification
    function showNotification(message) {
        // Supprimer les notifications existantes
        const existingNotif = document.querySelector('.dyslexic-notification');
        if (existingNotif) {
            existingNotif.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'dyslexic-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #7ba3d8;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }
    
    // Ajouter les styles d'animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
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

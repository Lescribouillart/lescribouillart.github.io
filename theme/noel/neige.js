(function() {
    'use strict';

    function createSnowEffect() {
        const header = document.querySelector('header');
        if (!header) {
            console.warn('Header non trouvé');
            return;
        }

        // Style pour le conteneur de neige
        const snowContainer = document.createElement('div');
        snowContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // S'assurer que le header a position relative
        if (getComputedStyle(header).position === 'static') {
            header.style.position = 'relative';
        }
        
        header.appendChild(snowContainer);

        function createSnowflake() {
            const snowflake = document.createElement('div');
            const size = Math.random() * 5 + 2; // Entre 2px et 7px
            const startX = Math.random() * 100; // Position horizontale en %
            const duration = Math.random() * 3 + 2; // Entre 2s et 5s
            const delay = Math.random() * 2; // Délai initial
            const opacity = Math.random() * 0.6 + 0.4; // Entre 0.4 et 1
            
            snowflake.style.cssText = `
                position: absolute;
                top: -10px;
                left: ${startX}%;
                width: ${size}px;
                height: ${size}px;
                background: white;
                border-radius: 50%;
                opacity: ${opacity};
                animation: snowfall ${duration}s linear ${delay}s;
                pointer-events: none;
            `;

            snowContainer.appendChild(snowflake);

            // Supprimer le flocon après l'animation
            setTimeout(() => {
                snowflake.remove();
            }, (duration + delay) * 1000);
        }

        // Ajouter les keyframes pour l'animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes snowfall {
                to {
                    transform: translateY(${header.offsetHeight + 10}px) translateX(${Math.random() * 50 - 25}px);
                }
            }
        `;
        document.head.appendChild(style);

        // Créer des flocons régulièrement
        setInterval(createSnowflake, 200);

        // Créer quelques flocons initiaux
        for (let i = 0; i < 10; i++) {
            setTimeout(createSnowflake, i * 100);
        }
    }

    // Lancer l'effet quand le DOM est chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createSnowEffect);
    } else {
        createSnowEffect();
    }
})();

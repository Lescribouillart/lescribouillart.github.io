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
        
        header.style.overflow = 'hidden';
        header.appendChild(snowContainer);

        function createSnowflake() {
            const snowflake = document.createElement('div');
            const size = Math.random() * 5 + 2;
            const startX = Math.random() * 95 + 2.5; // Entre 2.5% et 97.5% pour rester dans les limites
            const duration = Math.random() * 15 + 12;
            const delay = Math.random() * 2;
            const opacity = Math.random() * 0.6 + 0.4;
            const drift = Math.random() * 30 - 15; // Dérive horizontale limitée entre -15px et +15px
            
            snowflake.textContent = '❆';
            snowflake.style.cssText = `
                position: absolute;
                top: -30px;
                left: ${startX}%;
                font-size: ${size * 2}px;
                color: white;
                opacity: ${opacity};
                animation: snowfall-${Math.floor(Math.random() * 1000)} ${duration}s linear ${delay}s;
                pointer-events: none;
                user-select: none;
            `;

            snowContainer.appendChild(snowflake);

            // Animation inline pour éviter les débordements
            const keyframeName = `snowfall-${Math.floor(Math.random() * 10000)}`;
            const style = document.createElement('style');
            style.textContent = `
                @keyframes ${keyframeName} {
                    0% {
                        transform: translateY(0) translateX(0);
                        opacity: 1;
                    }
                    70% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(${header.offsetHeight + 50}px) translateX(${drift}px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
            snowflake.style.animation = `${keyframeName} ${duration}s linear ${delay}s`;

            // Supprimer le flocon et le style après l'animation
            setTimeout(() => {
                snowflake.remove();
                style.remove();
            }, (duration + delay) * 1000);
        }

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

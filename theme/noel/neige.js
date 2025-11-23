// Animation de neige pour Noël
(function() {
    // Créer le conteneur de neige
    const snowContainer = document.createElement('div');
    snowContainer.className = 'snow-container';
    snowContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        z-index: 10;
    `;

    // Ajouter le conteneur au header
    const header = document.querySelector('.header');
    if (header) {
        header.style.position = 'relative';
        header.appendChild(snowContainer);
    }

    // Fonction pour créer un flocon
    function createSnowflake() {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerHTML = '❄';
        
        // Position de départ aléatoire
        const startPositionX = Math.random() * 100;
        const startPositionY = Math.random() * -100; // Démarrer plus haut et varié
        const fontSize = Math.random() * 10 + 10; // 10-20px
        const duration = Math.random() * 5 + 8; // 8-13 secondes (plus lent)
        const opacity = Math.random() * 0.6 + 0.4; // 0.4-1
        
        snowflake.style.cssText = `
            position: absolute;
            left: ${startPositionX}%;
            top: ${startPositionY}px;
            font-size: ${fontSize}px;
            color: white;
            opacity: ${opacity};
            animation: snowfall ${duration}s linear infinite;
            user-select: none;
        `;
        
        snowContainer.appendChild(snowflake);
        
        // Repositionner le flocon après l'animation
        snowflake.addEventListener('animationiteration', () => {
            snowflake.style.left = Math.random() * 100 + '%';
        });
    }

    // Ajouter les styles d'animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes snowfall {
            0% {
                transform: translateY(-20px) rotate(0deg);
            }
            100% {
                transform: translateY(100vh) rotate(360deg);
            }
        }
    `;
    document.head.appendChild(style);

    // Créer plusieurs flocons
    const numberOfSnowflakes = 50;
    for (let i = 0; i < numberOfSnowflakes; i++) {
        createSnowflake();
    }
})();

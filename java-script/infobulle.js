// Gestion des infobulles
document.addEventListener('DOMContentLoaded', function() {
    const infoIcons = document.querySelectorAll('.info-icon');
    
    infoIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            const tooltip = this.getAttribute('data-tooltip');
            const tooltipElement = document.createElement('div');
            tooltipElement.className = 'tooltip-bubble';
            tooltipElement.textContent = tooltip;
            tooltipElement.id = 'active-tooltip';
            
            document.body.appendChild(tooltipElement);
            
            // Positionner l'infobulle
            const iconRect = this.getBoundingClientRect();
            tooltipElement.style.left = (iconRect.left + iconRect.width / 2) + 'px';
            tooltipElement.style.top = (iconRect.top - tooltipElement.offsetHeight - 8) + 'px';
            
            // Animation d'apparition
            setTimeout(() => {
                tooltipElement.classList.add('show');
            }, 10);
        });
        
        icon.addEventListener('mouseleave', function() {
            const tooltipElement = document.getElementById('active-tooltip');
            if (tooltipElement) {
                tooltipElement.classList.remove('show');
                setTimeout(() => {
                    tooltipElement.remove();
                }, 200);
            }
        });
    });
});

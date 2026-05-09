(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const directory = document.querySelector('[data-character-directory]');

        if (!directory) {
            return;
        }

        const filterButtons = Array.from(directory.querySelectorAll('[data-character-filter]'));
        const cards = Array.from(directory.querySelectorAll('[data-character-card]'));
        const status = directory.querySelector('[data-character-status]');
        const list = directory.querySelector('[data-character-list]');
        const availableInitials = new Set(cards.map(function(card) {
            return card.dataset.characterInitial;
        }));

        function updateStatus(visibleCount, filter) {
            if (!status) {
                return;
            }

            if (visibleCount === 0) {
                status.textContent = 'Aucun personnage ne correspond à cette initiale.';
                return;
            }

            const scopeLabel = filter === 'all' ? 'toutes initiales' : 'initiale ' + filter;
            const noun = visibleCount > 1 ? 'personnages répertoriés' : 'personnage répertorié';
            status.textContent = visibleCount + ' ' + noun + ' - ' + scopeLabel;
        }

        function updateEmptyState(visibleCount) {
            if (!list) {
                return;
            }

            let emptyState = list.querySelector('.character-directory-empty');

            if (visibleCount > 0) {
                if (emptyState) {
                    emptyState.remove();
                }
                return;
            }

            if (!emptyState) {
                emptyState = document.createElement('p');
                emptyState.className = 'character-directory-empty';
                emptyState.textContent = 'Aucune fiche disponible pour ce filtre.';
                list.appendChild(emptyState);
            }
        }

        function applyFilter(filter) {
            let visibleCount = 0;

            cards.forEach(function(card) {
                const matches = filter === 'all' || card.dataset.characterInitial === filter;
                card.hidden = !matches;
                if (matches) {
                    visibleCount += 1;
                }
            });

            filterButtons.forEach(function(button) {
                const isActive = button.dataset.characterFilter === filter;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });

            updateStatus(visibleCount, filter);
            updateEmptyState(visibleCount);
        }

        filterButtons.forEach(function(button) {
            const filter = button.dataset.characterFilter;
            const isEmptyFilter = filter !== 'all' && !availableInitials.has(filter);
            button.classList.toggle('is-empty', isEmptyFilter);

            button.addEventListener('click', function() {
                applyFilter(button.dataset.characterFilter || 'all');
            });
        });

        applyFilter('all');
    });
})();
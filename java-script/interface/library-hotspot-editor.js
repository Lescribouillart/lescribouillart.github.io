(() => {
    'use strict';

    const editor = document.querySelector('[data-library-hotspot-editor]');
    if (!editor) return;

    const grid = editor.querySelector('.bibliotheque-hotspot-grid');
    const toggleButton = editor.querySelector('.bibliotheque-editor-toggle');
    const clearButton = editor.querySelector('.bibliotheque-editor-clear');
    const status = editor.querySelector('.bibliotheque-editor-status');
    const columns = Number.parseInt(editor.dataset.columns, 10);
    const rows = Number.parseInt(editor.dataset.rows, 10);
    const target = editor.dataset.target;
    const storageKey = `library-hotspots:${columns}x${rows}`;
    let gridIsVisible = true;
    let selectedCells = new Set();

    if (!grid || !toggleButton || !clearButton || !status ||
        !Number.isInteger(columns) || columns <= 0 ||
        !Number.isInteger(rows) || rows <= 0 || !target) {
        console.error('La configuration de la zone cliquable de la bibliothèque est invalide.');
        return;
    }

    try {
        const savedCells = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (Array.isArray(savedCells)) {
            selectedCells = new Set(savedCells.filter(Number.isInteger));
        } else {
            console.warn('La sélection enregistrée de la bibliothèque a été ignorée car son format est invalide.');
        }
    } catch (error) {
        console.warn('Impossible de lire la sélection enregistrée de la bibliothèque.', error);
    }

    function updateStatus() {
        const count = selectedCells.size;
        status.textContent = `${count} case${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}`;
    }

    function saveSelection() {
        try {
            localStorage.setItem(storageKey, JSON.stringify([...selectedCells].sort((a, b) => a - b)));
        } catch (error) {
            console.error('Impossible d’enregistrer la sélection de la bibliothèque.', error);
        }
    }

    function setCellState(cell, isSelected) {
        cell.classList.toggle('is-selected', isSelected);
        cell.setAttribute('aria-pressed', String(isSelected));
    }

    grid.style.setProperty('--hotspot-columns', columns);
    grid.style.setProperty('--hotspot-rows', rows);

    const cells = document.createDocumentFragment();
    for (let index = 0; index < columns * rows; index += 1) {
        const cell = document.createElement('button');
        const row = Math.floor(index / columns) + 1;
        const column = (index % columns) + 1;
        const isSelected = selectedCells.has(index);

        cell.type = 'button';
        cell.className = 'bibliotheque-hotspot-cell';
        cell.dataset.index = String(index);
        cell.setAttribute('aria-label', `Case ligne ${row}, colonne ${column}`);
        setCellState(cell, isSelected);
        cell.addEventListener('click', () => {
            if (!gridIsVisible) {
                window.location.href = target;
                return;
            }

            if (selectedCells.has(index)) {
                selectedCells.delete(index);
                setCellState(cell, false);
            } else {
                selectedCells.add(index);
                setCellState(cell, true);
            }

            saveSelection();
            updateStatus();
        });
        cells.appendChild(cell);
    }
    grid.appendChild(cells);

    toggleButton.addEventListener('click', () => {
        gridIsVisible = !gridIsVisible;
        editor.classList.toggle('is-grid-hidden', !gridIsVisible);
        toggleButton.textContent = gridIsVisible ? 'Masquer la grille' : 'Afficher la grille';
        toggleButton.setAttribute('aria-pressed', String(gridIsVisible));
    });

    clearButton.addEventListener('click', () => {
        selectedCells.clear();
        grid.querySelectorAll('.bibliotheque-hotspot-cell.is-selected').forEach((cell) => {
            setCellState(cell, false);
        });
        saveSelection();
        updateStatus();
    });

    updateStatus();
})();

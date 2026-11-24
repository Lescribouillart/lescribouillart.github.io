(() => {
    'use strict';

    const editor = document.querySelector('[data-library-hotspot-editor]');
    if (!editor) return;

    const grid = editor.querySelector('.bibliotheque-hotspot-grid');
    const toggleButton = editor.querySelector('.bibliotheque-editor-toggle');
    const clearButton = editor.querySelector('.bibliotheque-editor-clear');
    const copyButton = editor.querySelector('.bibliotheque-editor-copy');
    const status = editor.querySelector('.bibliotheque-editor-status');
    const columns = Number.parseInt(editor.dataset.columns, 10);
    const rows = Number.parseInt(editor.dataset.rows, 10);
    const target = editor.dataset.target;
    const bookModal = document.getElementById('book-modal');
    const bookFrame = bookModal?.querySelector('[data-book-modal-frame]');
    const closeModalButton = bookModal?.querySelector('.book-modal-close');
    const storageKey = `library-hotspots:${columns}x${rows}`;
    const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
    const isLocalEditor = window.location.protocol === 'file:' || localHosts.has(window.location.hostname);
    let gridIsVisible = isLocalEditor;
    let selectedCells = new Set();

    if (!grid || !toggleButton || !clearButton || !copyButton || !status ||
        !Number.isInteger(columns) || columns <= 0 ||
        !Number.isInteger(rows) || rows <= 0 || !target) {
        console.error('La configuration de la zone cliquable de la bibliothèque est invalide.');
        return;
    }

    function openBook() {
        if (!bookModal || !bookFrame || typeof bookModal.showModal !== 'function') {
            window.location.href = target;
            return;
        }

        if (!bookFrame.getAttribute('src')) bookFrame.src = target;
        bookModal.showModal();
    }

    closeModalButton?.addEventListener('click', () => bookModal.close());
    bookModal?.addEventListener('click', (event) => {
        if (event.target === bookModal) bookModal.close();
    });

    function parseCells(value, source) {
        try {
            const cells = JSON.parse(value || '[]');
            if (!Array.isArray(cells)) {
                console.warn(`La sélection ${source} a été ignorée car son format est invalide.`);
                return new Set();
            }
            return new Set(cells.filter((index) =>
                Number.isInteger(index) && index >= 0 && index < columns * rows
            ));
        } catch (error) {
            console.warn(`Impossible de lire la sélection ${source}.`, error);
            return new Set();
        }
    }

    if (isLocalEditor) {
        try {
            const savedSelection = localStorage.getItem(storageKey);
            selectedCells = savedSelection
                ? parseCells(savedSelection, 'enregistrée localement')
                : parseCells(editor.dataset.publishedCells, 'publiée');
        } catch (error) {
            console.warn('Le stockage local n’est pas disponible pour cette page.', error);
            selectedCells = parseCells(editor.dataset.publishedCells, 'publiée');
        }
        editor.classList.add('is-local-editor');
    } else {
        selectedCells = parseCells(editor.dataset.publishedCells, 'publiée');
        editor.classList.add('is-grid-hidden');
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
        if (!isLocalEditor && !selectedCells.has(index)) continue;

        const cell = document.createElement('button');
        const row = Math.floor(index / columns) + 1;
        const column = (index % columns) + 1;
        const isSelected = selectedCells.has(index);

        cell.type = 'button';
        cell.className = 'bibliotheque-hotspot-cell';
        cell.dataset.index = String(index);
        cell.style.gridColumn = String(column);
        cell.style.gridRow = String(row);
        cell.setAttribute('aria-label', `Case ligne ${row}, colonne ${column}`);
        setCellState(cell, isSelected);
        cell.addEventListener('click', () => {
            if (!gridIsVisible) {
                openBook();
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
        if (!isLocalEditor) return;
        gridIsVisible = !gridIsVisible;
        editor.classList.toggle('is-grid-hidden', !gridIsVisible);
        toggleButton.textContent = gridIsVisible ? 'Masquer la grille' : 'Afficher la grille';
        toggleButton.setAttribute('aria-pressed', String(gridIsVisible));
    });

    clearButton.addEventListener('click', () => {
        if (!isLocalEditor) return;
        selectedCells.clear();
        grid.querySelectorAll('.bibliotheque-hotspot-cell.is-selected').forEach((cell) => {
            setCellState(cell, false);
        });
        saveSelection();
        updateStatus();
    });

    copyButton.addEventListener('click', async () => {
        if (!isLocalEditor) return;
        const publishedCells = JSON.stringify([...selectedCells].sort((a, b) => a - b));

        try {
            await navigator.clipboard.writeText(publishedCells);
            status.textContent = 'Liste copiée dans le presse-papiers.';
        } catch (error) {
            console.error('Impossible de copier la zone publiée.', error);
            status.textContent = 'Copie impossible : autorisez l’accès au presse-papiers.';
        }
    });

    updateStatus();
})();

function getCharacterId() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'), 10);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function parseInlineMarkdown(text) {
    return escapeHtml(text)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/_([^_]+)_/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function renderMarkdown(markdown) {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let paragraphBuffer = [];
    let listBuffer = [];
    let listType = null;
    let htmlBuffer = [];

    function flushParagraph() {
        if (paragraphBuffer.length === 0) {
            return;
        }

        html.push(`<p>${parseInlineMarkdown(paragraphBuffer.join(' '))}</p>`);
        paragraphBuffer = [];
    }

    function flushList() {
        if (listBuffer.length === 0 || !listType) {
            return;
        }

        const items = listBuffer.map((item) => `<li>${parseInlineMarkdown(item)}</li>`).join('');
        html.push(`<${listType}>${items}</${listType}>`);
        listBuffer = [];
        listType = null;
    }

    function flushHtmlBuffer() {
        if (htmlBuffer.length === 0) {
            return;
        }

        html.push(htmlBuffer.join('\n'));
        htmlBuffer = [];
    }

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
            flushParagraph();
            flushList();
            flushHtmlBuffer();
            continue;
        }

        if (htmlBuffer.length > 0 || trimmed.startsWith('<')) {
            flushParagraph();
            flushList();
            htmlBuffer.push(line);
            continue;
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);

        if (headingMatch) {
            flushParagraph();
            flushList();
            const level = headingMatch[1].length;
            html.push(`<h${level}>${parseInlineMarkdown(headingMatch[2])}</h${level}>`);
            continue;
        }

        const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)$/);

        if (unorderedMatch) {
            flushParagraph();

            if (listType && listType !== 'ul') {
                flushList();
            }

            listType = 'ul';
            listBuffer.push(unorderedMatch[1]);
            continue;
        }

        const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);

        if (orderedMatch) {
            flushParagraph();

            if (listType && listType !== 'ol') {
                flushList();
            }

            listType = 'ol';
            listBuffer.push(orderedMatch[1]);
            continue;
        }

        flushList();
        paragraphBuffer.push(trimmed);
    }

    flushParagraph();
    flushList();
    flushHtmlBuffer();

    return html.join('\n');
}

async function resolveCharacterContent(character) {
    if (!character.markdownFile) {
        return '<p>Cette fiche ne contient pas encore de contenu.</p>';
    }

    try {
        const response = await fetch(`../${character.markdownFile}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const markdown = await response.text();
        return renderMarkdown(markdown);
    } catch (error) {
        console.error('Erreur lors du chargement du Markdown du personnage :', error);
        return '<p>Impossible de charger cette fiche pour le moment.</p>';
    }
}

function displayError(message) {
    document.getElementById('character-content').innerHTML = `
        <div class="article-top-back">
            <a href="lespersonnages.html" class="back-link"><span class="back-icon" aria-hidden="true"></span><span class="sr-only">Retour</span></a>
            <div class="article-top-band" aria-hidden="true"></div>
        </div>
        <p style="text-align: center; color: var(--text-light);">${message}</p>
    `;
}

function displayCharacter(character, characterContent) {
    document.getElementById('page-title').textContent = `${character.title} - Le Scribouill'art`;

    const container = document.getElementById('character-content');
    const characterMeta = [
        character.category ? `<span class="article-meta-date">${character.category}</span>` : '',
        character.role ? `<span class="article-meta-author">${character.role}</span>` : ''
    ].filter(Boolean).join(' - ');

    container.innerHTML = `
        <div class="article-top-back">
            <a href="lespersonnages.html" class="back-link"><span class="back-icon" aria-hidden="true"></span><span class="sr-only">Retour</span></a>
            <div class="article-top-band" aria-hidden="true"></div>
        </div>
        <div class="article-header">
            <h1 class="article-content-title">${character.title}</h1>
            ${characterMeta ? `<p class="article-date">${characterMeta}</p>` : ''}
            ${character.excerpt ? `<p class="article-summary">${character.excerpt}</p>` : ''}
        </div>
        <div class="article-body">
            ${characterContent}
        </div>
    `;
}

async function loadCharacter() {
    const characterId = getCharacterId();

    if (!characterId) {
        displayError('Personnage non trouvé');
        return;
    }

    try {
        const response = await fetch('../personnages.json');
        const characters = await response.json();
        const character = characters.find((item) => item.id === characterId);

        if (!character) {
            displayError('Personnage non trouvé');
            return;
        }

        const characterContent = await resolveCharacterContent(character);
        displayCharacter(character, characterContent);
    } catch (error) {
        console.error('Erreur lors du chargement du personnage :', error);
        displayError('Erreur lors du chargement du personnage');
    }
}

loadCharacter();

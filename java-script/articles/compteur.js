function normalizeAuthorName(value) {
	return String(value || '').trim().toLowerCase();
}

function formatArticleCount(count) {
	return `${count} ${count > 1 ? 'articles' : 'article'}`;
}

async function loadAuthorArticleCount() {
	const statsElement = document.getElementById('author-stats');

	if (!statsElement) {
		return;
	}

	const authorName = statsElement.dataset.author;
	const memberSince = statsElement.dataset.memberSince || '';

	if (!authorName) {
		return;
	}

	try {
		const response = await fetch('../publication-articles.json');

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const articles = await response.json();
		const normalizedAuthorName = normalizeAuthorName(authorName);
		const publishedArticleCount = articles.filter((article) => {
			const articleAuthor = normalizeAuthorName(article.author);
			return articleAuthor === normalizedAuthorName;
		}).length;

		statsElement.textContent = `${formatArticleCount(publishedArticleCount)} / membre depuis ${memberSince}`;
	} catch (error) {
		console.error('Erreur lors du chargement du compteur d\'articles :', error);
		statsElement.textContent = `0 article / membre depuis ${memberSince}`;
	}
}

loadAuthorArticleCount();

if (window.self !== window.top) {
  document.documentElement.classList.add('book-embedded-root');
  document.body.classList.add('book-embedded');

  document.addEventListener('click', (event) => {
    if (event.target.closest('#book-frame')) return;
    window.parent.postMessage({ type: 'close-book-modal' }, window.location.origin);
  });
}

const pages = Array.from(document.querySelectorAll('.page'));
const bookFrame = document.getElementById('book-frame');
const total = pages.length;
let current = -1;

function update() {
  bookFrame?.classList.toggle('is-open', current >= 0);
  pages.forEach((p, i) => {
    if (i <= current) p.classList.add('flipped'); else p.classList.remove('flipped');
    p.style.zIndex = total - i;
  });
}

pages.forEach((p, i) => {
  p.addEventListener('click', () => {
    if (i > current) current = i;
    else if (i <= current) current = i - 1;
    update();
  });
});

update();

;(function loadCover(){
  const img = document.getElementById('cover');
  if(!img) return;
  const book = document.getElementById('book');
  const spine = document.getElementById('spine');
  const main = document.querySelector('.book-main');
  const heading = main?.querySelector('h1');
  const SPINE_RATIO = 0.09;
  let aspect = null;

  function applySpineSize(w, h){
    if(!spine) return;
    const spineWidth = Math.round(w * SPINE_RATIO);
    spine.style.width = spineWidth + 'px';
    spine.style.height = h + 'px';
    bookFrame.style.setProperty('--spine-width', spineWidth + 'px');
  }

  function clamp(v){ return Math.max(0, Math.min(255, Math.round(v))); }

  function shade(rgb, percent){
    const amt = 2.55 * percent;
    return `rgb(${clamp(rgb[0] + amt)}, ${clamp(rgb[1] + amt)}, ${clamp(rgb[2] + amt)})`;
  }

  function sampleEdgeColor(image){
    try {
      const h = image.naturalHeight || 100;
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, 24, image.naturalHeight, 0, 0, 24, h);
      const data = ctx.getImageData(3, 0, 10, h).data;
      let r = 0, g = 0, b = 0, count = 0;
      for(let i = 0; i < data.length; i += 4){
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
      if(!count) return null;
      return [r / count, g / count, b / count];
    } catch(e){
      return null;
    }
  }

  function applySpineColor(image){
    if(!spine) return;
    const base = sampleEdgeColor(image);
    if(!base) return;
    spine.style.background = `linear-gradient(90deg,
      ${shade(base, -32)} 0%,
      ${shade(base, -14)} 12%,
      ${shade(base, 22)} 24%,
      ${shade(base, -18)} 40%,
      ${shade(base, 14)} 58%,
      ${shade(base, -26)} 78%,
      ${shade(base, -6)} 100%)`;
  }

  function setBookSizeFromAspect(imgW, imgH){
    if(!imgW || !imgH) return;
    aspect = imgH / imgW;
    const embedded = window.self !== window.top;
    const verticalSpace = embedded
      ? window.innerHeight
        - (heading?.offsetHeight || 0)
        - 40
      : window.innerHeight - 120;
    const maxHeight = Math.max(200, verticalSpace);
    const maxPageWidth = (embedded
      ? window.innerWidth / 2.15
      : Math.min(window.innerWidth * 0.92, 900)) / (1 + SPINE_RATIO);
    const w = Math.min(imgW, maxPageWidth, maxHeight / aspect);
    const h = Math.round(w * aspect);
    book.style.width = w + 'px';
    book.style.height = h + 'px';
    bookFrame.style.width = `${Math.round((w + w * SPINE_RATIO) * 2)}px`;
    bookFrame.style.height = h + 'px';
    applySpineSize(w, h);
  }

  window.addEventListener('resize', () => {
    if(!aspect) return;
    setBookSizeFromAspect(img.naturalWidth, img.naturalHeight);
  });

  function initializeCover() {
    setBookSizeFromAspect(img.naturalWidth, img.naturalHeight);
    applySpineColor(img);
  }

  img.addEventListener('load', initializeCover);
  if (img.complete && img.naturalWidth) initializeCover();
})();

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

function renderStoryMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let paragraph = [];
  let list = [];
  let listType = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    html.push(`<p>${parseInlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (list.length === 0 || !listType) return;
    html.push(`<${listType}>${list.map((item) => `<li>${parseInlineMarkdown(item)}</li>`).join('')}</${listType}>`);
    list = [];
    listType = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${parseInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = trimmed.match(/^[-*+]\s+(.*)$/);
    const ordered = trimmed.match(/^\d+\.\s+(.*)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextListType = unordered ? 'ul' : 'ol';
      if (listType && listType !== nextListType) flushList();
      listType = nextListType;
      list.push((unordered || ordered)[1]);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return html.join('\n');
}

(async function loadStory() {
  const storyPage = document.querySelector('[data-book-story]');
  if (!storyPage) return;

  try {
    const response = await fetch('../textes/luneeternelle.md');
    if (!response.ok) throw new Error(`Chargement du récit impossible (${response.status})`);

    storyPage.innerHTML = renderStoryMarkdown(await response.text());
  } catch (error) {
    console.error('Impossible de charger le récit de la lune éternelle.', error);
    storyPage.replaceChildren();
    const message = document.createElement('p');
    message.textContent = 'Le récit est momentanément indisponible.';
    storyPage.appendChild(message);
  }
})();

if (window.self !== window.top) {
  document.documentElement.classList.add('book-embedded-root');
  document.body.classList.add('book-embedded');

  document.addEventListener('click', (event) => {
    if (event.target.closest('#book-frame')) return;
    window.parent.postMessage({ type: 'close-book-modal' }, window.location.origin);
  });
}

const bookFrame = document.getElementById('book-frame');
const book = document.getElementById('book');
const MIN_STORY_PAGES = 10;
let pages = [];
let current = -1;
let storyMarkdown = '';
let paginationTimer = 0;
let coverMarkup = document.getElementById('cover')?.outerHTML || '';

function update() {
  bookFrame?.classList.toggle('is-open', current >= 0);
  pages.forEach((p, i) => {
    const flipped = i <= current;
    p.classList.toggle('flipped', flipped);
    p.style.zIndex = flipped ? i + 1 : pages.length - i;
  });
}

function bindPages() {
  pages = Array.from(document.querySelectorAll('.book .page'));
  current = -1;
  update();
}

bindPages();

function goToAdjacentPage(direction) {
  current = Math.max(-1, Math.min(pages.length - 1, current + direction));
  update();
}

bookFrame?.addEventListener('click', (event) => {
  if (event.target.closest('a, button')) return;
  const bounds = bookFrame.getBoundingClientRect();
  const direction = event.clientX < bounds.left + bounds.width / 2 ? -1 : 1;
  goToAdjacentPage(direction);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') goToAdjacentPage(1);
  if (event.key === 'ArrowLeft') goToAdjacentPage(-1);
});

;(function loadCover(){
  const img = document.getElementById('cover');
  if(!img) return;
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
        - 64
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
    window.clearTimeout(paginationTimer);
    paginationTimer = window.setTimeout(paginateStory, 100);
  });

  function initializeCover() {
    setBookSizeFromAspect(img.naturalWidth, img.naturalHeight);
    applySpineColor(img);
    paginateStory();
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

function parseStoryMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  const blocks = [];
  let paragraph = [];
  let list = [];
  let listType = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    blocks.push(`<p>${parseInlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (list.length === 0 || !listType) return;
    blocks.push(`<${listType}>${list.map((item) => `<li>${parseInlineMarkdown(item)}</li>`).join('')}</${listType}>`);
    list = [];
    listType = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      if (blocks.length > 0) blocks.push('<div class="book-spacer" aria-hidden="true"></div>');
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${parseInlineMarkdown(heading[2])}</h${level}>`);
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
  return blocks;
}

function getTextPoint(root, offset) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode();

  while (node) {
    if (remaining <= node.textContent.length) {
      return [node, remaining];
    }
    remaining -= node.textContent.length;
    node = walker.nextNode();
  }

  return [root, root.childNodes.length];
}

function cloneBlockPart(block, start, end) {
  if (!block.textContent) return block.cloneNode(true);

  const range = document.createRange();
  const startPoint = getTextPoint(block, start);
  const endPoint = getTextPoint(block, end);
  range.setStart(startPoint[0], startPoint[1]);
  range.setEnd(endPoint[0], endPoint[1]);

  const part = block.cloneNode(false);
  part.appendChild(range.cloneContents());
  return part;
}

function paginateBlocks(blocks) {
  if (!book || !book.clientWidth || !book.clientHeight) return [];

  const measurer = document.createElement('div');
  measurer.className = 'face back book-text-page pagination-measurer book-opening-page';
  const content = document.createElement('div');
  content.className = 'book-page-content';
  measurer.appendChild(content);
  book.appendChild(measurer);

  const styles = window.getComputedStyle(measurer);
  const availableHeight = measurer.clientHeight
    - parseFloat(styles.paddingTop)
    - parseFloat(styles.paddingBottom);
  const renderedPages = [];

  function fits(candidate) {
    content.appendChild(candidate);
    const result = content.scrollHeight <= availableHeight;
    candidate.remove();
    return result;
  }

  function finishPage() {
    renderedPages.push(content.innerHTML);
    content.replaceChildren();
    if (renderedPages.length === 1) measurer.classList.remove('book-opening-page');
  }

  for (const markup of blocks) {
    const template = document.createElement('template');
    template.innerHTML = markup;
    const block = template.content.firstElementChild;
    if (!block) continue;

    if (!block.textContent) {
      if (!fits(block.cloneNode(true))) finishPage();
      content.appendChild(block);
      continue;
    }

    const textLength = block.textContent.length;
    let start = 0;

    while (start < textLength) {
      while (start < textLength && /\s/.test(block.textContent[start])) start++;
      if (start >= textLength) break;

      const remaining = cloneBlockPart(block, start, textLength);
      if (fits(remaining)) {
        content.appendChild(remaining);
        start = textLength;
        break;
      }

      let low = start + 1;
      let high = textLength;
      let best = start;

      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const part = cloneBlockPart(block, start, middle);

        if (fits(part)) {
          best = Math.max(best, middle);
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }

      if (best > start) {
        const text = block.textContent;
        const space = text.lastIndexOf(' ', best);
        if (space > start && best < textLength) best = space;
        content.appendChild(cloneBlockPart(block, start, best));
        start = best;

        if (start < textLength) finishPage();
        continue;
      }

      if (content.childNodes.length > 0) {
        finishPage();
        continue;
      }

      content.appendChild(block.cloneNode(true));
      break;
    }
  }

  if (content.childNodes.length > 0) finishPage();
  measurer.remove();
  return renderedPages;
}

function createStoryFace(content, pageNumber) {
  const face = document.createElement('div');
  face.className = 'face book-text-page';
  if (pageNumber === 1) face.classList.add('book-opening-page');
  const pageContent = document.createElement('div');
  pageContent.className = 'book-page-content';
  pageContent.innerHTML = content;
  const number = document.createElement('span');
  number.className = 'book-page-number';
  number.textContent = pageNumber;
  number.setAttribute('aria-label', `Page ${pageNumber}`);
  face.append(pageContent, number);
  return face;
}

function paginateStory() {
  if (!storyMarkdown || !book || !book.clientWidth || !book.clientHeight) return;

  const storyPages = paginateBlocks(parseStoryMarkdown(storyMarkdown));
  while (storyPages.length < MIN_STORY_PAGES) storyPages.push('');
  const sheetCount = Math.max(1, Math.ceil((storyPages.length + 1) / 2));
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < sheetCount; index++) {
    const sheet = document.createElement('div');
    sheet.className = 'page';
    sheet.dataset.index = index;

    if (index === 0) {
      const front = document.createElement('div');
      front.className = 'face front book-cover-face';
      front.innerHTML = coverMarkup;
      sheet.appendChild(front);
    } else {
      const frontPage = storyPages[2 * index - 1];
      sheet.appendChild(frontPage !== undefined
        ? createStoryFace(frontPage, 2 * index)
        : document.createElement('div'));
    }

    const firstStoryFace = 2 * index;
    const backContent = storyPages[firstStoryFace];
    if (backContent !== undefined) {
      const back = createStoryFace(backContent, firstStoryFace + 1);
      back.classList.add('back');
      sheet.appendChild(back);
    } else {
      const back = document.createElement('div');
      back.className = 'face back';
      sheet.appendChild(back);
    }

    sheet.children[0].classList.add('face');
    if (index > 0) sheet.children[0].classList.add('front');
    fragment.appendChild(sheet);
  }

  book.replaceChildren(fragment);
  bindPages();
}

(async function loadStory() {
  const storyPage = document.querySelector('[data-book-story]');
  if (!storyPage) return;

  try {
    const response = await fetch('../textes/luneeternelle.md');
    if (!response.ok) throw new Error(`Chargement du récit impossible (${response.status})`);

    storyMarkdown = await response.text();
    paginateStory();
  } catch (error) {
    console.error('Impossible de charger le récit de la lune éternelle.', error);
    storyPage.replaceChildren();
    const message = document.createElement('p');
    message.textContent = 'Le récit est momentanément indisponible.';
    storyPage.appendChild(message);
  }
})();

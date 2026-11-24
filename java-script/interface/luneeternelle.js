if (window.self !== window.top) {
  document.documentElement.classList.add('book-embedded-root');
  document.body.classList.add('book-embedded');
}

const pages = Array.from(document.querySelectorAll('.page'));
const total = pages.length;
let current = -1;

function update() {
  pages.forEach((p, i) => {
    if (i <= current) p.classList.add('flipped'); else p.classList.remove('flipped');
    p.style.zIndex = total - i;
  });
}

document.getElementById('next').addEventListener('click', () => {
  if (current < total - 1) current++;
  update();
});

document.getElementById('prev').addEventListener('click', () => {
  if (current >= 0) current--;
  update();
});

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
  const controls = main?.querySelector('.controls');
  const SPINE_RATIO = 0.09;
  let aspect = null;

  function applySpineSize(w, h){
    if(!spine) return;
    spine.style.width = Math.round(w * SPINE_RATIO) + 'px';
    spine.style.height = h + 'px';
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
        - (controls?.offsetHeight || 0)
        - 40
      : window.innerHeight - 120;
    const maxHeight = Math.max(200, verticalSpace);
    const maxPageWidth = Math.min(window.innerWidth * 0.92, 900) / (1 + SPINE_RATIO);
    const w = Math.min(imgW, maxPageWidth, maxHeight / aspect);
    const h = Math.round(w * aspect);
    book.style.width = w + 'px';
    book.style.height = h + 'px';
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

(async function loadStory() {
  const storyPage = document.querySelector('[data-book-story]');
  if (!storyPage) return;

  try {
    const response = await fetch('../textes/luneeternelle.txt');
    if (!response.ok) throw new Error(`Chargement du récit impossible (${response.status})`);

    const [title, ...paragraphs] = (await response.text()).split(/\r?\n/);
    storyPage.replaceChildren();

    const heading = document.createElement('h2');
    heading.textContent = title.trim();
    storyPage.appendChild(heading);

    paragraphs.forEach((paragraph) => {
      const text = paragraph.trim();
      if (!text) return;
      const element = document.createElement('p');
      element.textContent = text;
      storyPage.appendChild(element);
    });
  } catch (error) {
    console.error('Impossible de charger le récit de la lune éternelle.', error);
    storyPage.replaceChildren();
    const message = document.createElement('p');
    message.textContent = 'Le récit est momentanément indisponible.';
    storyPage.appendChild(message);
  }
})();

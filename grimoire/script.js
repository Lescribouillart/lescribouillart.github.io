// Contrôle simple pour tourner les pages
const pages = Array.from(document.querySelectorAll('.page'));
const total = pages.length;
let current = -1; // index de la dernière page tournée

function update() {
  pages.forEach((p, i) => {
    if (i <= current) p.classList.add('flipped'); else p.classList.remove('flipped');
    // empilement : page 0 au-dessus
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
  p.addEventListener('click', (e) => {
    // si on clique sur une page non tournée -> tourner jusqu'à cette page
    if (i > current) current = i;
    else if (i <= current) current = i - 1;
    update();
  });
});

// init
update();

// Essayer plusieurs chemins pour la couverture (pratique si le fichier est à la racine ou dans images/)
;(function loadCover(){
  const img = document.getElementById('cover');
  if(!img) return;
  const book = document.getElementById('book');
  const spine = document.getElementById('spine');
  const SPINE_RATIO = 0.09; // largeur de la reliure, en proportion de la largeur du livre
  let aspect = null;

  function applySpineSize(w, h){
    if(!spine) return;
    spine.style.width = Math.round(w * SPINE_RATIO) + 'px';
    spine.style.height = h + 'px';
  }

  function clamp(v){ return Math.max(0, Math.min(255, Math.round(v))); }

  function shade(rgb, percent){
    // percent négatif = assombrit, positif = éclaircit
    const amt = 2.55 * percent;
    return `rgb(${clamp(rgb[0] + amt)}, ${clamp(rgb[1] + amt)}, ${clamp(rgb[2] + amt)})`;
  }

  // Récupère la couleur moyenne du bord gauche de la couverture, pour que la
  // reliure adopte exactement le même ton que l'illustration (plutôt qu'une
  // couleur arbitraire qui ne correspond pas au livre).
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
      return null; // canvas "tainted" ou image indisponible : on garde le style CSS par défaut
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
    const maxPageWidth = Math.min(window.innerWidth * 0.92, 900) / (1 + SPINE_RATIO);
    const w = Math.min(imgW, maxPageWidth);
    const h = Math.round(w * aspect);
    book.style.width = w + 'px';
    book.style.height = h + 'px';
    applySpineSize(w, h);
  }

  window.addEventListener('resize', () => {
    if(!aspect) return;
    const maxPageWidth = Math.min(window.innerWidth * 0.92, 900) / (1 + SPINE_RATIO);
    const w = Math.min(book.clientWidth || maxPageWidth, maxPageWidth);
    const h = Math.round(w * aspect);
    book.style.width = w + 'px';
    book.style.height = h + 'px';
    applySpineSize(w, h);
  });

  img.onload = () => {
    setBookSizeFromAspect(img.naturalWidth, img.naturalHeight);
    applySpineColor(img);
  };

  const candidates = [
    'images/grimnoelpass.png',       // ancien nom/dossier
    'images/grimnoelpasse.png',      // variante avec 'e'
    'grimnoelpasse.png',             // fichier à la racine du projet
    'grimnoelpass.png'               // autre variante à la racine
  ];

  let i = 0;
  function tryNext(){
    if(i >= candidates.length){
      img.alt = 'Image introuvable: grimnoelpasse.png';
      return;
    }
    const testSrc = candidates[i++];
    const tester = new Image();
    tester.onload = () => { img.src = testSrc; /* déclenche img.onload qui ajuste la taille */ };
    tester.onerror = () => { tryNext(); };
    tester.src = testSrc;
  }
  tryNext();
})();

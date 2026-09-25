(async () => {
  const response = await fetch('assets/images.json', { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Image manifest failed: ${response.status}`);

  const images = await response.json();
  images.forEach(item => {
    item.src = `data:image/webp;base64,${item.b64}`;
  });

  const byId = Object.fromEntries(images.map(item => [item.id, item]));

  function makeImg(item, eager = false) {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.alt || item.title;
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.style.objectPosition = item.pos || '50% 50%';
    return img;
  }

  document.querySelectorAll('[data-image-id]').forEach(el => {
    const item = byId[el.dataset.imageId];
    if (!item) return;
    const slot = el.querySelector('.image-slot') || el;
    slot.appendChild(makeImg(item, true));
  });

  function card(item, index) {
    const fig = document.createElement('figure');
    fig.className = 'work-card reveal';
    fig.tabIndex = 0;
    fig.dataset.index = index;

    const wrap = document.createElement('div');
    wrap.className = 'img-wrap';
    wrap.appendChild(makeImg(item));

    const cap = document.createElement('figcaption');
    cap.innerHTML = `<span>${String(index + 1).padStart(2, '0')} — ${item.title}</span><span class="series">${item.series}</span><span class="year">${item.year}</span>`;

    fig.append(wrap, cap);
    fig.addEventListener('click', () => openLightbox(index));
    fig.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(index);
      }
    });
    return fig;
  }

  const art = images.filter(item => item.category === 'art');
  const life = images.filter(item => item.category === 'life');
  const ordered = [...art, ...life];

  const artGrid = document.getElementById('art-grid');
  const lifeGrid = document.getElementById('life-grid');
  art.forEach(item => artGrid.appendChild(card(item, ordered.indexOf(item))));
  life.forEach(item => lifeGrid.appendChild(card(item, ordered.indexOf(item))));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -4% 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox.querySelector('img');
  const lightboxTitle = lightbox.querySelector('.lb-title');
  const lightboxMeta = lightbox.querySelector('.lb-meta');
  let current = 0;

  function renderLightbox() {
    const item = ordered[current];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt || item.title;
    lightboxTitle.textContent = item.title;
    lightboxMeta.textContent = `${item.series} / ${item.year}`;
  }

  function openLightbox(index) {
    current = index;
    renderLightbox();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function step(direction) {
    current = (current + direction + ordered.length) % ordered.length;
    renderLightbox();
  }

  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.prev').addEventListener('click', () => step(-1));
  lightbox.querySelector('.next').addEventListener('click', () => step(1));
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });

  window.addEventListener('keydown', event => {
    if (!lightbox.classList.contains('open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  });

  let touchX = null;
  lightbox.addEventListener('touchstart', event => {
    touchX = event.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', event => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 45) step(dx > 0 ? -1 : 1);
    touchX = null;
  }, { passive: true });

  const heroImage = document.querySelector('.hero-image img');
  if (heroImage && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', () => {
      const y = Math.min(window.scrollY, window.innerHeight);
      heroImage.style.transform = `translateY(${y * .035}px) scale(1.025)`;
    }, { passive: true });
  }
})().catch(error => {
  console.error(error);
  document.documentElement.dataset.loadError = 'true';
});

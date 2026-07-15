// slider.js — minimal vanilla JS slider (avtomatsko drsi, kontrole, dots, dotik)
(function() {
  // Debug logging (visible in browser console)
  function log(...args) { console.log('[slider]', ...args); }

  // Global image error tracking
  window.addEventListener('error', (e) => {
    if (e.target && e.target.tagName === 'IMG') {
      console.error('[slider] IMG failed to load:', e.target.src);
      // Add a CSS class so the page can show fallback if needed
      e.target.classList.add('img-failed');
    }
  }, true);

  // Force image load with retry
  function forceLoad(img) {
    if (!img || img.dataset.loaded) return;
    const src = img.getAttribute('data-real-src') || img.src;
    if (!src) return;
    const test = new Image();
    test.onload = () => { img.dataset.loaded = '1'; };
    test.onerror = () => {
      console.warn('[slider] retry failed for', src);
      // Try once more after 1s
      setTimeout(() => {
        const retry = new Image();
        retry.onload = () => { img.src = src + '?retry=' + Date.now(); img.dataset.loaded = '1'; };
        retry.onerror = () => { img.classList.add('img-failed'); };
        retry.src = src + '?retry=' + Date.now();
      }, 1000);
    };
    test.src = src;
  }

  function initSlider(root) {
    const track = root.querySelector('.slider-track');
    if (!track) return;
    const slides = track.querySelectorAll('.slide');
    if (slides.length < 2) return;

    const prevBtn = root.querySelector('.slider-prev');
    const nextBtn = root.querySelector('.slider-next');
    const dotsContainer = root.querySelector('.slider-dots');
    const autoplayMs = parseInt(root.dataset.autoplay || '0', 10);

    let index = 0;
    let timer = null;
    let startX = 0;
    let isDragging = false;

    // Build dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Pojdi na sliko ' + (i + 1));
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      });
    }

    // Force-load all images (lazy in flex slider never triggers)
    function ensureImage(i) {
      const img = slides[i] && slides[i].querySelector('img');
      if (!img) return;
      // If image src missing but data-src present, swap
      if (!img.src || img.src === window.location.href) {
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc) {
          img.src = dataSrc;
          img.removeAttribute('data-src');
        }
      }
    }
    function preloadAround(i) {
      ensureImage(i);
      ensureImage((i + 1) % slides.length);
      ensureImage((i - 1 + slides.length) % slides.length);
    }

    function update() {
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      if (dotsContainer) {
        dotsContainer.querySelectorAll('.slider-dot').forEach((d, i) => {
          d.classList.toggle('active', i === index);
        });
      }
      preloadAround(index);
    }
    function goTo(i) {
      index = (i + slides.length) % slides.length;
      update();
    }
    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function startAutoplay() {
      if (autoplayMs <= 0) return;
      stopAutoplay();
      timer = setInterval(next, autoplayMs);
    }
    function stopAutoplay() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    // Buttons
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAutoplay(); });

    // Keyboard
    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { prev(); resetAutoplay(); }
      if (e.key === 'ArrowRight') { next(); resetAutoplay(); }
    });

    // Touch / drag
    track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; isDragging = true; stopAutoplay(); }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) next(); else prev();
      }
      startAutoplay();
    });

    // Pause on hover
    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);

    // Pause when tab not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAutoplay(); else startAutoplay();
    });

    // Initial state
    log('init', slides.length, 'slides, autoplay', autoplayMs + 'ms');
    update();
    startAutoplay();
  }

  function init() {
    document.querySelectorAll('.slider').forEach(initSlider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

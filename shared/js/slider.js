// slider.js — minimal vanilla JS slider (avtomatsko drsi, kontrole, dots, dotik)
(function() {
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

    function update() {
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      if (dotsContainer) {
        dotsContainer.querySelectorAll('.slider-dot').forEach((d, i) => {
          d.classList.toggle('active', i === index);
        });
      }
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

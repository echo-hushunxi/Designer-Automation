// Shared homepage behavior: keep touch, keyboard and named controls together.
export function enhanceHomeMobileLayout(document, options = {}) {
  if (document.body.dataset.page === 'home' && document.body.dataset.brand) {
    document.body.dataset.deliveryPage = 'home';
    document.body.dataset.deliverySite = document.body.dataset.brand;
  }
  if (document.body.classList.contains('rp-page-home')) {
    document.body.dataset.deliveryPage = 'home';
    document.body.dataset.deliverySite = 'rallyperks';
  }
  if (document.body.dataset.deliveryPage !== 'home') return;
  const view = document.defaultView;
  const headings = options.headings || '[data-section-heading],.jh-heading,.r5-heading,.ph-heading,.rp-section-head,.f4-heading,.ah-heading,.cv-section-head,.cv-shelf-head,.cv-topic-rail-head,.op-section-head,.mv-section-head';
  for (const heading of document.querySelectorAll(headings)) {
    const link = [...heading.children].find(e => e.matches('a[href]'));
    if (!heading.querySelector('h2') || !link || link.classList.contains('mobile-heading-link')) continue;
    heading.classList.add('mobile-section-heading');
    link.classList.add('mobile-heading-link');
    link.setAttribute('aria-label', link.getAttribute('aria-label') || link.textContent.trim());
    const label = document.createElement('span');
    label.className = 'mobile-heading-label';
    label.append(...link.childNodes);
    link.append(label);
    link.insertAdjacentHTML('beforeend', '<svg class="mobile-heading-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>');
  }
  // Static preparation must never mark interactive rails as already bound.
  if (options.bindRails === false) return;
  const rails = document.querySelectorAll(options.rails || '[data-horizontal-rail],[data-topic-rail], .mv-store-grid, .op-window-rail, .cv-shelf-track');
  rails.forEach((rail, index) => {
    if (rail.dataset.homeRailReady) return;
    rail.dataset.homeRailReady = 'true';
    let controls, previous, next;
    const filter = rail.matches('[data-topic-rail]');
    const label = filter ? 'categories' : 'stores';
    const countLine = filter && rail.closest('[data-filters]')?.previousElementSibling;
    const motion = () => view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    const update = () => {
      const scrollable = rail.scrollWidth > rail.clientWidth + 2;
      if (!controls && !scrollable) return;
      if (!controls) {
        rail.id ||= `home-scroll-rail-${index + 1}`;
        rail.classList.add('home-scroll-rail');
        rail.tabIndex = 0;
        rail.setAttribute('aria-label', `Browse ${label}`);
        const shell = document.createElement('span');
        shell.className = 'home-rail-shell';
        shell.dataset.railKind = filter ? 'filters' : 'stores';
        rail.before(shell);
        shell.append(rail);
        controls = document.createElement('span');
        controls.className = `home-rail-controls${filter ? ' home-rail-controls--filters' : ''}`;
        controls.setAttribute('role', 'group');
        controls.setAttribute('aria-label', `Scroll ${label}`);
        const button = direction => {
          const el = document.createElement('button');
          el.type = 'button';
          el.className = 'home-rail-arrow';
          el.setAttribute('aria-controls', rail.id);
          el.setAttribute('aria-label', `${direction < 0 ? 'Previous' : 'Next'} ${label}`);
          el.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${direction < 0 ? 'm14 5-7 7 7 7' : 'm10 5 7 7-7 7'}"/></svg>`;
          el.addEventListener('click', () => rail.scrollBy({left: direction * Math.max(120, rail.clientWidth * .8), behavior: motion()}));
          controls.append(el);
          return el;
        };
        previous = button(-1);
        next = button(1);
        shell.prepend(controls);
      }
      controls.hidden = !scrollable;
      if (countLine?.matches('[data-count-line]')) countLine.classList.toggle('home-rail-count', scrollable && view.innerWidth > 760);
      const style = view.getComputedStyle(rail);
      const tolerance = Math.max(2, parseFloat(style.paddingInlineStart) || 0, parseFloat(style.paddingInlineEnd) || 0);
      previous.disabled = rail.scrollLeft <= tolerance;
      next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - tolerance;
    };
    rail.addEventListener('scroll', update, {passive: true});
    rail.addEventListener('keydown', event => {
      if (event.target !== rail || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const left = event.key === 'Home' ? 0 : event.key === 'End' ? rail.scrollWidth : rail.scrollLeft + (event.key === 'ArrowLeft' ? -1 : 1) * rail.clientWidth * .8;
      rail.scrollTo({left, behavior: motion()});
    });
    rail.addEventListener('focusin', event => {
      if (event.target === rail) return;
      const track = rail.getBoundingClientRect(), item = event.target.getBoundingClientRect();
      if (item.left < track.left) rail.scrollBy({left: item.left - track.left, behavior: 'instant'});
      else if (item.right > track.right) rail.scrollBy({left: item.right - track.right, behavior: 'instant'});
    });
    new view.ResizeObserver(update).observe(rail);
    view.addEventListener('resize', update, {passive: true});
    update();
  });
}
if (typeof document !== 'undefined') enhanceHomeMobileLayout(document);

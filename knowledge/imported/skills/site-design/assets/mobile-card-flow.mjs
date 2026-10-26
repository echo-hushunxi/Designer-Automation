// Semantic hooks only; CSS owns layout, and original links/data stay in place.
export function enhanceMobileCardFlow(document, options = {}) {
  if (document.body.dataset.deliveryPage !== 'home') return;
  const site = document.body.dataset.deliverySite;
  const profiles = {
    rivetdeals: {actions: '.r5-full .r5-button', narrow: '.r5-quick .r5-button', articles: [['.r5-guide', ':scope>img', ':scope>span', ':scope>span>span']]},
    folioperks: {actions: '.f4-spot .f4-button,.f4-find .f4-button', articles: [['.f4-guide', ':scope>img', ':scope>span', ':scope>span>span']]},
    rallyperks: {dates:'.rp-row .rp-date,.rp-feature .rp-date', actions: '.rp-row .rp-cta', articles: [['.rp-guide-card', '.rp-guide-cover img', '.rp-guide-body', null, '.rp-guide-cover']]},
    ribbonperks: {dates:'.rp-home-date', actions: '.rp-home-action'},
    orbitperks: {actions: ':not(*)', articles: [['.op-guide-card', '.op-guide-cover img', '.op-guide-copy', '.op-guide-action', '.op-guide-cover']]},
    aster: {actions: '.ah-offer .ah-action', articles: [['.ah-guide', ':scope>img', '.ah-guide-copy', '.ah-guide-copy>span']]},
    mavora: {actions: ':not(*)', articles: [['.mv-guide-card', '.mv-guide-cover img', '.mv-guide-copy', '.mv-guide-link', '.mv-guide-cover', 'stacked']]},
    paloma: {articles: [['.ph-guide', ':scope>img', ':scope>div', ':scope>div>span']]},
    jingle: {articles: [['.jh-guide', ':scope>img', '.jh-guide-copy', '.jh-guide-copy>span']]}
  };
  const profile = {...profiles[site], ...options};
  const markAction = (action, mode) => {
    if (action.dataset.mobileClaimReady) return;
    action.dataset.mobileClaimReady = 'true';
    action.dataset.compactOfferAction = mode;
    action.classList.add('mobile-claim');
    const label = action.getAttribute('aria-label') || action.textContent.trim();
    action.setAttribute('aria-label', label);
    for (const node of [...action.childNodes]) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const span = document.createElement('span'); span.className = 'mobile-claim-content mobile-claim-text';
        node.replaceWith(span); span.append(node);
      } else if (node.nodeType === 1) node.classList.add('mobile-claim-content');
    }
    action.insertAdjacentHTML('beforeend', '<svg class="mobile-claim-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>');
  };
  const prepare = () => {
    for (const action of document.querySelectorAll(profile.actions || '[data-compact-offer-action=base]')) markAction(action, 'base');
    for (const action of document.querySelectorAll(profile.narrow || '[data-compact-offer-action=narrow]')) markAction(action, 'narrow');
    for (const date of document.querySelectorAll(profile.dates || '[data-compact-offer-date]')) {
      if (date.dataset.mobileDateReady) continue;
      date.dataset.mobileDateReady = 'true';date.setAttribute('aria-label', date.getAttribute('aria-label') || date.textContent.trim());
      const node = [...date.childNodes].find(n => n.nodeType === 3 && /^(Expires |Ends )/.test(n.textContent));
      if (node) {const prefix = node.textContent.match(/^(Expires |Ends )/)[0], span = document.createElement('span');span.className = 'mobile-date-prefix';span.textContent = prefix;node.textContent = node.textContent.slice(prefix.length);node.before(span);}
    }
    for (const [selector, photo, copy, hint, frame, mode = 'horizontal'] of profile.articles || []) {
      for (const card of document.querySelectorAll(selector)) {
        card.dataset.readingLayout = mode;
        const image = card.querySelector(photo), text = card.querySelector(copy), holder = frame ? card.querySelector(frame) : image;
        if (image) image.dataset.readingPhoto = '';
        if (text) text.dataset.readingCopy = '';
        if (holder) holder.dataset.readingFrame = '';
        const label = hint && card.querySelector(hint);
        if (label && label.tagName !== 'A' && card.tagName === 'A') label.dataset.decorativeReadingAction = '';
      }
    }
  };
  prepare();
  const main = document.querySelector('main');
  if (main && options.observe !== false) new document.defaultView.MutationObserver(prepare).observe(main, {childList: true, subtree: true});
}
if (typeof document !== 'undefined') enhanceMobileCardFlow(document);

import {enhanceHomeMobileLayout} from './home-mobile-controls.mjs';
import {enhanceMobileCardFlow} from './mobile-card-flow.mjs';

// Reuse the runtime's semantic preparation at generation time. No layout,
// timers or listeners: a slow/failed script must not change the first layout.
export function prepareReadingHtml(html, parseHTML) {
  const body = html.match(/<body\b[^>]*>[\s\S]*?<\/body>/i);
  if (!body) return html;
  const isHome = /data-(?:delivery-page|page)=["']home["']|\brp-page-home\b/.test(body[0].slice(0, body[0].indexOf('>') + 1));
  const hasReadingCards = /class=["'][^"']*\b(?:article-card|as-guide-card)\b/.test(body[0]);
  if (!isHome && !hasReadingCards) return html;
  const {document} = parseHTML('<!doctype html><html><head></head>' + body[0] + '</html>');
  if (isHome) {
    enhanceHomeMobileLayout(document, {bindRails: false});
    enhanceMobileCardFlow(document, {observe: false});
    document.body.setAttribute('data-home-flow-static', '1');
  }
  // These are whole-card links with direct title/hint siblings. Group the
  // complete copy; decorative hints do not need a separate 44px hit area.
  for (const card of document.querySelectorAll('a.article-card,a.as-guide-card')) {
    if (card.querySelector('[data-reading-copy]')) continue;
    const image = card.querySelector(':scope>img');
    const heading = card.querySelector(':scope>h3');
    const hint = card.querySelector(':scope>span');
    if (!image || !heading || !hint) continue;
    const copy = document.createElement('div');
    copy.setAttribute('data-reading-copy', '');
    heading.before(copy);
    copy.append(heading, hint);
    card.setAttribute('data-reading-callsite', 'whole-link');
    image.setAttribute('data-reading-photo', '');
    hint.setAttribute('data-decorative-reading-action', '');
  }
  assertReadingMarkup(document);
  return html.slice(0, body.index) + document.body.outerHTML + html.slice(body.index + body[0].length);
}

// Called by the generator, and reusable by an offline/first-paint reviewer.
// Missing hooks fail instead of silently accepting only a homepage sample.
export function assertReadingMarkup(document) {
  const body = document.body;
  if (body.dataset.deliveryPage === 'home' && body.getAttribute('data-home-flow-static') !== '1') throw Error('Homepage card flow must be present in initial HTML');
  for (const card of document.querySelectorAll('a.article-card,a.as-guide-card')) {
    if (!card.querySelector('img')) continue;
    const copy = card.querySelector(':scope>[data-reading-copy]');
    if (!copy?.querySelector('h3') || !copy.querySelector('[data-decorative-reading-action]')) throw Error('Reading callsite lacks its complete title/action group: ' + card.getAttribute('href'));
  }
}

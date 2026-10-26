// Presentation only. Keep coupon IDs, masked values and native copy handlers.
export function normalizeCouponPresentation(document) {
  const names = [['about','About Us'],['disclaimer','Disclaimer'],['contact','Contact Us'],['privacy','Privacy Policy']];
  for (const footer of document.querySelectorAll('footer:not([data-coupon-footer="four-links"])')) {
    if(footer.closest('main,article'))continue;
    const links = names.map(([key,label]) => {
      const original = [...footer.querySelectorAll('a[href]')].find(a => new RegExp('(?:^|/)'+key+'(?:/|\\.html|[?#]|$)').test(a.getAttribute('href')));
      if (!original) throw Error('Footer lacks its real '+key+' destination');
      const link = document.createElement('a'); link.href = original.getAttribute('href'); link.textContent = label; return link;
    });
    const brand = footer.querySelector('[aria-label$=" home"],.hc-wordmark,.as-brand,.rp-footer-brand,.pl-wordmark,.brand,.cv-brand');
    const wrapper = document.createElement('div'); wrapper.setAttribute('data-coupon-footer-inner','');
    if (brand) { const identity = document.createElement('div'); identity.setAttribute('data-coupon-footer-brand',''); identity.innerHTML = brand.innerHTML; wrapper.append(identity); }
    const nav = document.createElement('nav'); nav.setAttribute('aria-label','Information'); nav.setAttribute('data-coupon-footer-links',''); nav.append(...links); wrapper.append(nav);
    const copyright = [...footer.querySelectorAll('small,span,p,div')].filter(e=>/©\s*\d{4}/.test(e.textContent)&&!e.querySelector('a')).sort((a,b)=>a.textContent.length-b.textContent.length)[0]?.textContent.trim().replace(/\s+/g,' ');
    if (copyright) { const small=document.createElement('small');small.setAttribute('data-coupon-footer-copyright','');small.textContent=copyright;wrapper.append(small); }
    footer.replaceChildren(wrapper); footer.setAttribute('data-coupon-footer','four-links');
  }
  for (const button of document.querySelectorAll('main button[data-copy],main button[data-reveal],main button[data-reveal-copy],main button[data-claim]')) {
    const walk=document.createTreeWalker(button,4),texts=[];let node;
    while ((node=walk.nextNode())) if(!node.parentElement?.closest('svg'))texts.push(node);
    const phrase=texts.map(n=>n.textContent).join('');
    if(/reveal\s*(?:&|and|\+)\s*copy|get\s+code/i.test(phrase)){texts[0].textContent=phrase.replace(/reveal\s*(?:&|and|\+)\s*copy|get\s+code/ig,'Copy code');for(const text of texts.slice(1))text.textContent='';}
    const label=button.getAttribute('aria-label');if(label)button.setAttribute('aria-label',label.replace(/reveal\s*(?:&|and|\+)\s*copy|get\s+code/ig,'Copy code'));
  }
  for (const claim of document.querySelectorAll('[data-owner-claim],.pl-claim')) {
    for (const node of [...claim.querySelectorAll('*')].reverse()) if (/^No code (?:needed|required)$/i.test(node.textContent.trim()) && !node.querySelector('a,button')) node.remove();
    if (claim.getAttribute('data-density-claim')==='deal') claim.setAttribute('data-coupon-shopping-only','');
  }
  for (const card of document.querySelectorAll('[data-reading-layout],a.article-card,a.as-guide-card')) {
    const photos=[...card.querySelectorAll('img')];if(!photos.length)continue;
    card.setAttribute('data-coupon-reading','');
    if(card.getAttribute('data-reading-layout')!=='stacked')card.setAttribute('data-coupon-reading-responsive','');
    for(const image of photos)image.setAttribute('data-coupon-reading-photo','');
  }
  // Article directories and related cards may use another renderer entirely.
  // Discover their real destinations; do not equate an absent home hook with
  // an absent article family. Existing healthy compositions stay in place.
  for(const link of document.querySelectorAll('main a[href]'))if(/\/(?:tips|guides)\/[^/]+\/(?:index\.html)?(?:[?#].*)?$/.test(link.getAttribute('href'))){
    for(const image of link.querySelectorAll('img'))image.setAttribute('data-coupon-reading-photo','');
  }
}

export function prepareCouponPresentationHtml(html, parseHTML) {
  const body=html.match(/<body\b[^>]*>[\s\S]*?<\/body>/i);if(!body)return html;
  const {document}=parseHTML('<!doctype html><html><head></head>'+body[0]+'</html>');
  normalizeCouponPresentation(document);
  const root=document.body.getAttribute('data-root');
  const result=html.slice(0,body.index)+document.body.outerHTML+html.slice(body.index+body[0].length);
  return root && !result.includes('data-coupon-presentation-styles') ? result.replace('</head>','<link data-coupon-presentation-styles rel="stylesheet" href="'+root+'assets/coupon-presentation.css"></head>') : result;
}

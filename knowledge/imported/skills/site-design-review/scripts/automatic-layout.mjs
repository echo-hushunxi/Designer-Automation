import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {inspectLayout} from './inspect-layout.mjs';

export const automaticLayoutVersion = '2026-10-26.1';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const matches = (pattern, route) => new RegExp('^' + pattern.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$').test(route);
export const needsAutomaticLayout = craft => Boolean(craft?.densityStandard?.version && craft.densityStandard.version.localeCompare('2026-10-24.2', undefined, {numeric:true}) >= 0);

export function assertAutomaticLayoutReport(report,{identity,budgetHash}={}){
  if(report.status!=='pass'||report.failures?.length||report.error||!report.groups?.length||!report.results?.length||JSON.stringify(report.identity)!==JSON.stringify(identity)||report.budgetHash!==budgetHash)throw Error('Automatic layout report is incomplete or mismatched');
  for(const width of[320,375,393,649,768,1090,1440])if(!report.widths?.includes(width))throw Error('Automatic layout report omitted required width: '+width);
  const allRoutes=new Set(report.groups.flatMap(g=>g.routes)),expected=new Set();
  if(allRoutes.size!==report.htmlCount)throw Error('Automatic layout report lost output routes');
  for(const group of report.groups){
    if(!group.samples?.length||group.samples.some(r=>!group.routes.includes(r)))throw Error('Automatic layout report lost group samples');
    for(const route of group.samples)for(const width of report.widths)for(const scripts of['on','off'])expected.add(JSON.stringify([group.id,route,width,scripts]));
  }
  const actual=report.results.map(r=>JSON.stringify([r.group,r.route,r.width,r.scripts]));
  if(new Set(actual).size!==actual.length||actual.length!==expected.size||actual.some(key=>!expected.has(key))||report.results.some(r=>!Array.isArray(r.failures)||r.failures.length))throw Error('Automatic layout report has missing, duplicate or failed cases');
}

async function htmlFiles(root, relative = '') {
  const result = [];
  for (const entry of await fs.readdir(path.join(root, relative), {withFileTypes:true})) {
    const name = relative ? relative + '/' + entry.name : entry.name;
    if (entry.isSymbolicLink()) throw Error('Automatic layout audit does not follow symlinks: ' + name);
    if (entry.isDirectory()) result.push(...await htmlFiles(root, name));
    else if (entry.isFile() && name.endsWith('.html')) result.push(name);
  }
  return result.sort();
}

// Scan EVERY output route. Group by actual element/class/role structure, not
// just a declared page name; a second card implementation creates a new group.
export async function automaticLayoutPlan(root, layoutBudget, {homeOnly = false, breakpoints = []} = {}) {
  if (!layoutBudget?.pages?.length) throw Error('Automatic layout requires frozen executable budgets');
  const groups = new Map(), failures = []; let htmlCount = 0;
  for (const route of await htmlFiles(root)) {
    const html = await fs.readFile(path.join(root, route), 'utf8');
    if (route === 'index.html' && /<meta\s+[^>]*http-equiv=["']refresh["']/i.test(html)) continue;
    const mapped = layoutBudget.pages.filter(p => matches(p.routePattern, route));
    if (homeOnly && !mapped.some(p => p.id === 'home')) continue;
    htmlCount++;
    if (mapped.length !== 1) { failures.push({route, reason:'unmapped-or-ambiguous-route'}); continue; }
    const body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
    const stack=[],edges=new Set(),voidTags=new Set(['img','input','br','hr','meta','link','source','area','base','embed','param','track','wbr']);
    for(const m of body.matchAll(/<(\/?)([a-z][\w-]*)\b([^>]*)>/gi)){
      const tag=m[2].toLowerCase();
      if(m[1]){const index=stack.map(s=>s.tag).lastIndexOf(tag);if(index>=0)stack.splice(index);continue;}
      const roles=[...m[3].matchAll(/\b(class|data-site-role|data-reading-layout)=["']([^"']*)["']/g)].map(a=>a[1]+'='+a[2]);
      const identity=tag+':'+roles.join(':'),edge=stack.slice(-3).map(s=>s.identity).join('>')+'>'+identity;edges.add(edge);
      if(!voidTags.has(tag)&&!m[3].endsWith('/'))stack.push({tag,identity});
    }
    const shape=[...edges].sort().join('|');
    const key = mapped[0].id + ':' + hash(shape), length = body.replace(/<[^>]*>/g, '').length;
    const titles=[...body.matchAll(/<(h[1-4]|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m=>m[2].replace(/<[^>]*>/g,'').trim().length).filter(Boolean),shortTitle=titles.length?Math.min(...titles):length,longTitle=titles.length?Math.max(...titles):length;
    if (!groups.has(key)) groups.set(key, {id:key, page:mapped[0], routes:[], short:{route,length}, long:{route,length},shortTitle:{route,length:shortTitle},longTitle:{route,length:longTitle}});
    const group = groups.get(key); group.routes.push(route);
    if (length < group.short.length) group.short = {route,length};
    if (length > group.long.length) group.long = {route,length};
    if (shortTitle < group.shortTitle.length) group.shortTitle={route,length:shortTitle};
    if (longTitle > group.longTitle.length) group.longTitle={route,length:longTitle};
  }
  if (!htmlCount) failures.push({reason:'no-output-pages'});
  const pages = [...groups.values()].map(g => ({...g, samples:[...new Set([g.routes[0], g.short.route, g.long.route, g.shortTitle.route, g.longTitle.route, g.routes.at(-1)])]}));
  const widths = new Set([320,375,393,649,768,1090,1440]);
  for (const p of pages) for (const c of p.page.checks || []) for (const key of ['minViewport','maxViewport']) {
    if (Number.isInteger(c[key])) for (const w of [c[key]-1,c[key],c[key]+1]) if (w >= 320 && w <= 2560) widths.add(w);
  }
  for (const point of breakpoints) for (const w of [point-1,point,point+1]) if (w >= 320 && w <= 2560) widths.add(w);
  return {htmlCount, groups:pages, widths:[...widths].sort((a,b)=>a-b), failures};
}

// Destination-based reconciliation catches a forgotten ordinary/related card
// even when all of the author's chosen selectors happen to pass.
export function inspectAutomaticCoverage(document, checks, modules = []) {
  const failures = [], inventory = [], view = document.defaultView;
  const footerNames=['About Us','Disclaimer','Contact Us','Privacy Policy'];
  const rgba=s=>{const n=s.match(/[\d.]+/g)?.map(Number);return n?.length>=3?[...n.slice(0,3),n[3]??1]:[0,0,0,0];};
  const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
  const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  for(const footer of document.querySelectorAll('footer')){
    if(footer.closest('main,article'))continue;
    const links=[...footer.querySelectorAll('a[href]')].map(a=>a.textContent.trim());
    if(JSON.stringify(links)!==JSON.stringify(footerNames))failures.push({reason:'footer-navigation-mismatch',actual:links,expected:footerNames});
    if(/back\s+to\s+top/i.test(footer.textContent))failures.push({reason:'footer-retains-orphan-navigation-copy'});
    for(const link of footer.querySelectorAll('a[href]')){const ancestors=[];for(let e=link;e;e=e.parentElement)ancestors.push(e);let bg=[255,255,255];for(const e of ancestors.reverse())bg=blend(rgba(view.getComputedStyle(e).backgroundColor),bg);const fg=blend(rgba(view.getComputedStyle(link).color),bg),a=luminance(fg),b=luminance(bg),contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);if(contrast<4.5)failures.push({reason:'footer-link-contrast',text:link.textContent.trim(),contrast});}
  }
  for(const button of document.querySelectorAll('main button[data-copy],main button[data-reveal],main button[data-reveal-copy],main button[data-claim]')){
    if(/reveal/i.test(button.textContent+' '+button.getAttribute('aria-label')))failures.push({reason:'copy-action-must-not-say-reveal'});
    if(!/^cop(?:y|ied)\b/i.test(button.textContent.trim()))failures.push({reason:'copy-action-label-must-say-copy'});
  }
  for(const claim of document.querySelectorAll('[data-owner-claim],.pl-claim')){
    if(/No code (needed|required)/i.test(claim.textContent))failures.push({reason:'shopping-action-has-false-code-panel'});
    if(claim.getAttribute('data-density-claim')==='deal'){const action=claim.querySelector('[data-density-action]');if(action){const c=claim.getBoundingClientRect(),a=action.getBoundingClientRect(),padding=parseFloat(view.getComputedStyle(claim).paddingLeft)||0;if(a.left-c.left>padding+4)failures.push({reason:'shopping-action-retains-empty-code-track',gap:a.left-c.left});for(const note of claim.querySelectorAll('p:not([role=status])')){const r=note.getBoundingClientRect();if(r.width&&r.height&&note.textContent.trim()&&r.left>=a.right-1&&Math.min(r.bottom,a.bottom)>Math.max(r.top,a.top))failures.push({reason:'shopping-note-squeezed-beside-action'});}}}
  }
  const shown = e => { const r=e.getBoundingClientRect(),s=view.getComputedStyle(e); return r.width>0 && r.height>0 && s.visibility==='visible' && s.display!=='none'; };
  const title = e => e.querySelector('h2,h3,h4,[data-site-role="offer-title"],[data-site-role="guide-title"]') || (!e.matches('a') && e.querySelector('strong'));
  const insideProse = e => { const a=e.closest('article'); return a?.querySelector('h1') && !e.querySelector('img,h2,h3,h4'); };
  const cards = new Map();
  for(const module of modules)if(!document.querySelector(module.selector))failures.push({reason:'missing-declared-module',module:module.id,selector:module.selector});
  for (const link of document.querySelectorAll('main a[href]')) {
    if (link.closest('nav,[role="navigation"]') || insideProse(link)) continue;
    const href = link.getAttribute('href');let target;try{target=new URL(href,document.baseURI);}catch{continue;}
    if(target.protocol!==view.location.protocol||target.origin!==view.location.origin)continue;
    const parts=target.pathname.split('/').filter(Boolean),entity=names=>names.some(name=>{const i=parts.lastIndexOf(name);return i>=0&&parts[i+1]&&parts[i+1]!=='index.html';});
    const kind=entity(['offers','coupons'])?'offer':entity(['tips','guides'])?'reading':null;
    if (!kind) continue;
    const mappedCard=kind==='offer'?checks.filter(c=>c.type==='action-flow').map(c=>link.closest(c.selector)).find(Boolean):null;
    let card = mappedCard || (title(link) ? link : link.closest('[data-site-role="offer-entry"],[data-site-role="guide-entry"],[data-card-href],article:not(:has(h1))'));
    if (!card) for (let parent=link.parentElement;parent && parent.tagName!=='MAIN';parent=parent.parentElement) {
      if (title(parent) && (parent.querySelector('img,time,[data-site-role="date"]'))) { card=parent; break; }
    }
    if (!card) { if(kind==='offer'||link.querySelector('img')) failures.push({reason:'unclassified-'+kind+'-entry',href}); continue; }
    if (!shown(card)) continue;
    cards.set(card,{kind,href});
  }
  const applicable = checks.filter(c => view.innerWidth >= (c.minViewport??0) && view.innerWidth <= (c.maxViewport??Infinity) && c.optional!==true);
  for(const module of modules)if(/merchant|store|category|topic/i.test(module.cardFamily)&&!applicable.some(c=>c.moduleId===module.id&&c.type==='packing'&&Array.isArray(c.gapRange)))failures.push({reason:'unmapped-responsive-packing',module:module.id});
  if(view.innerWidth<=760){
    for(const heading of document.querySelectorAll('main h2')){
      const group=heading.parentElement,link=[...group.children].find(e=>e.matches('a[href]')&&!e.querySelector('img,h2,h3'));
      if(!link||!shown(group)||!/(?:offers|stores|topics|categories|tips|guides)\/(?:index\.html)?(?:[?#].*)?$/.test(link.getAttribute('href')))continue;
      if(!applicable.some(c=>c.type==='heading-action'&&group.matches(c.selector)))failures.push({reason:'unmapped-section-heading-action',href:link.getAttribute('href')});
    }
  }
  for(const button of document.querySelectorAll('main button[aria-label]')){
    if(!shown(button)||button.closest('nav')||[...cards.keys()].some(c=>c.contains(button))||! /^(?:previous|prev|next)\b/i.test(button.getAttribute('aria-label')))continue;
    if(!applicable.some(c=>c.type==='rail-controls'&&[...document.querySelectorAll(c.selector)].some(g=>g.contains(button))))failures.push({reason:'unmapped-rail-controls',label:button.getAttribute('aria-label')});
  }
  for (const [card,{kind,href}] of cards) {
    const photos = [...card.querySelectorAll('img')], heading = title(card);
    inventory.push({kind,href,selector:card.tagName.toLowerCase()+'.'+[...card.classList].join('.'),photos:photos.length,mode:photos.length?'illustrated':'text-only'});
    if (kind==='offer') {
      if (view.innerWidth<=760 && !applicable.some(c=>c.type==='action-flow' && card.matches(c.selector))) failures.push({reason:'unmapped-offer-card-family',href});
      continue;
    }
    for (const image of photos) {
      const c = applicable.find(c=>c.type==='image-fit' && image.matches(c.selector));
      if (!c) { failures.push({reason:'unmapped-reading-callsite',href}); continue; }
      if(c.conventionalFrame!==true||c.requireLoaded!==true)failures.push({reason:'reading-frame-or-loading-check-missing',href});
      if(c.contentVisibility!=='full')failures.push({reason:'reading-full-content-check-missing',href});
      const r=image.getBoundingClientRect(),h=heading?.getBoundingClientRect();
      const horizontal=h && r.right<=h.left+1 && Math.min(r.bottom,h.bottom)>Math.max(r.top,h.top);
      if (horizontal) {
        const copy=c.balanceWith && card.querySelector(c.balanceWith);
        if (!copy || !copy.contains(heading)) { failures.push({reason:'horizontal-reading-needs-complete-copy',href}); continue; }
        const walker=document.createTreeWalker(card,4),media=image.closest('picture,figure')||image; let node;
        while ((node=walker.nextNode())) if(node.textContent.trim() && shown(node.parentElement) && !node.parentElement.closest('svg,[aria-hidden="true"],script,style') && !copy.contains(node) && !media.contains(node)) {
          failures.push({reason:'incomplete-reading-copy-group',href}); break;
        }
      } else if (c.layout!=='stacked' || !['natural','contain'].includes(c.fitMode)) failures.push({reason:'stacked-reading-needs-natural-image-mapping',href});
      else {const cr=card.getBoundingClientRect(),cs=view.getComputedStyle(card),inner=cr.width-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0);if(r.width<inner*.85)failures.push({reason:'stacked-reading-underuses-card-width',href,width:r.width,available:inner});}
    }
  }
  return {inventory,failures};
}

export async function runAutomaticLayout({root,layoutBudget,identity={},output,homeOnly=false,breakpoints=[],modulesByPage={},launch,signal}) {
  const plan=await automaticLayoutPlan(root,layoutBudget,{homeOnly,breakpoints});
  const report={version:automaticLayoutVersion,identity,budgetHash:hash(JSON.stringify(layoutBudget)),status:'running',htmlCount:plan.htmlCount,groups:plan.groups.map(({page,...g})=>g),widths:plan.widths,results:[],failures:[...plan.failures],visualAcceptance:'Independent pixel and interaction review still required'};
  await fs.mkdir(output,{recursive:true});
  const save=()=>fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  let owner;
  try {
    if (plan.failures.length) throw Error('Automatic layout route coverage failed');
    if (launch) owner=await launch();
    else {
      if (!process.env.SITE_BROWSER_EXECUTABLE) throw Error('Set SITE_BROWSER_EXECUTABLE; automatic layout is not-run without a real browser');
      const {chromium}=await import(process.env.DA_PLAYWRIGHT_MODULE||'playwright-core');
      const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE,headless:true}); owner={browser,close:()=>browser.close()};
    }
    for (const scripts of [false,true]) {
      const context=await owner.browser.newContext({javaScriptEnabled:scripts,reducedMotion:'reduce',viewport:{width:320,height:900}}),page=await context.newPage();
      page.setDefaultTimeout(10000);
      try { for (const group of plan.groups) for (const route of group.samples) {
        signal?.throwIfAborted();
        await page.goto(pathToFileURL(path.join(root,route)).href,{waitUntil:'load',timeout:20000});
        let settleTimer;
        try { await Promise.race([page.evaluate(async()=>{await document.fonts.ready; for(const i of document.querySelectorAll('main img'))i.loading='eager'; await Promise.all([...document.querySelectorAll('main img')].map(i=>i.decode().catch(()=>{})));}),new Promise((_,reject)=>{settleTimer=setTimeout(()=>reject(Error('Automatic layout fonts/images did not settle: '+route)),7500);})]); }
        finally {clearTimeout(settleTimer);}
        for (const width of plan.widths) {
          signal?.throwIfAborted();await page.setViewportSize({width,height:900});
          // Page animation callbacks are disabled in a real no-script context.
          // Wait from the host, then force layout through the read-only probe.
          await page.waitForTimeout(70);
          const checks=group.page.checks.map(c=>scripts||c.type!=='rail-controls'?c:{...c,optional:true});
          for(const c of group.page.checks.filter(c=>c.type==='action-flow'&&c.mode!=='whole-card'))checks.push({...c,id:c.id+'-automatic-outline',type:'action-shape',selector:':is('+c.selector+') '+(c.action.includes(':scope')?c.action.replaceAll(':scope',''):':is('+c.action+')'),pseudos:['::before','::after']});
          const layout=await page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
          const coverage=await page.evaluate(`(${inspectAutomaticCoverage.toString()})(document,${JSON.stringify(group.page.checks)},${JSON.stringify(modulesByPage[group.page.id]||[])})`);
          const failures=[...layout.budget.failures,...coverage.failures,...(layout.rootOverflow?[{reason:'root-overflow'}]:[]),...(layout.budget.measurements.length?[]:[{reason:'no-executed-layout-budget'}])];
          const row={route,width,scripts:scripts?'on':'off',group:group.id,inventory:coverage.inventory,failures};report.results.push(row);
          if(failures.length){const name='failure-'+report.results.length+'.png';await page.screenshot({path:path.join(output,name)});report.failures.push({...row,screenshot:name});}
        }
      }} finally {await context.close();}
    }
    report.status=report.failures.length?'fail':'pass';
  } catch(error) { report.status=!owner&&!plan.failures.length?'not-run':'fail';report.error=error.message; }
  finally {if(owner)await owner.close();await save();}
  return {...report,reportPath:path.join(output,'report.json'),reportHash:hash(await fs.readFile(path.join(output,'report.json')))};
}

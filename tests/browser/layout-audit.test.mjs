import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.DA_PLAYWRIGHT_MODULE||'playwright-core');
if(!process.env.SITE_BROWSER_EXECUTABLE)throw Error('Set SITE_BROWSER_EXECUTABLE to the actual available browser; missing capability is not-run');
import {inspectLayout} from '../../knowledge/imported/skills/site-design-review/scripts/inspect-layout.mjs';

test('initial HTML keeps mobile reading and named actions when scripts do not run; related calls share the full copy',async t=>{
  const {prepareReadingHtml,assertReadingMarkup}=await import(new URL('../../knowledge/imported/skills/site-design/assets/reading-static.mjs',import.meta.url));
  const {enhanceHomeMobileLayout}=await import(new URL('../../knowledge/imported/skills/site-design/assets/home-mobile-controls.mjs',import.meta.url));
  const {enhanceMobileCardFlow}=await import(new URL('../../knowledge/imported/skills/site-design/assets/mobile-card-flow.mjs',import.meta.url));
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE,headless:true});t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:375,height:900}});
  const photo='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="blue"/></svg>');
  const html='<html><body data-delivery-page="home" data-delivery-site="aster"><main><div class="ah-heading"><h2>Guides</h2><a href="#all">All guides</a></div><a class="ah-guide" href="#read"><img src="'+photo+'" width="900" height="600"><div class="ah-guide-copy"><h3>A long title for a useful shopping guide</h3><span>Read guide</span></div></a><article class="ah-offer"><a class="ah-action" href="#offer">Get code</a></article></main></body></html>';
  await page.setContent(html);await page.addStyleTag({content:'.ah-guide{display:grid;grid-template-columns:110px 1fr;gap:14px}.ah-guide img{width:110px;height:auto}.ah-guide-copy{height:100px}'});
  const sources=[enhanceHomeMobileLayout,enhanceMobileCardFlow,assertReadingMarkup,prepareReadingHtml].map(f=>f.toString()).join(';');
  const fixed=await page.evaluate('(()=>{'+sources+`;return prepareReadingHtml(${JSON.stringify(html)},text=>({document:new DOMParser().parseFromString(text,'text/html')}));})()`);
  assert.match(fixed,/data-home-flow-static="1"/);assert.match(fixed,/aria-label="Get code"/);assert.match(fixed,/data-reading-copy/);assert.doesNotMatch(fixed,/data-home-rail-ready/);
  await page.setContent(fixed);await page.addStyleTag({content:await fs.readFile(new URL('../../knowledge/imported/skills/site-design/assets/mobile-card-flow.css',import.meta.url),'utf8')});
  assert.equal(await page.locator('.mobile-claim-icon').count(),1);
  // Run again as an actual client enhancement: no double icons or labels.
  await page.evaluate('('+enhanceMobileCardFlow.toString()+')(document)');assert.equal(await page.locator('.mobile-claim-icon').count(),1);
  const article='<html><body><main><a class="article-card" href="#related"><img src="'+photo+'" width="900" height="600"><h3>A long related article heading on several lines at narrow widths</h3><span>Read guide</span></a></main></body></html>';
  const prepared=await page.evaluate('(()=>{'+sources+`;return prepareReadingHtml(${JSON.stringify(article)},text=>({document:new DOMParser().parseFromString(text,'text/html')}));})()`);
  await page.setContent(prepared);await page.addStyleTag({content:'body{margin:0}.article-card{padding:14px;border:1px solid;min-width:0}.article-card h3{font:18px/1.4 Arial;margin:0}.article-card>span{min-height:44px}'+await fs.readFile(new URL('../../knowledge/imported/skills/site-design/assets/reading-callsite.css',import.meta.url),'utf8')});await page.locator('img').evaluate(i=>i.decode());
  const checks=[{id:'related',type:'image-fit',selector:'.article-card img',card:'.article-card',stackedCopy:'[data-reading-copy]',minimumCardWidthRatio:.95,fitMode:'contain',contentVisibility:'full',requireLoaded:true,conventionalFrame:true}];
  for(const width of[320,375,393,760]){await page.setViewportSize({width,height:900});const result=await page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);assert.deepEqual(result.budget.failures,[]);}
  await page.locator('.article-card').focus();await page.keyboard.press('Enter');assert.equal(new URL(page.url()).hash,'#related');
});

test('real Chrome detects clipped/covered text even when document width fits; repaired fixture removes findings',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.setContent('<style>body{margin:0;padding:20px}.card{width:160px;overflow:hidden}.title{white-space:nowrap}.covered{position:relative;width:160px}.cta{position:absolute;inset:0;background:white}</style><div class="card"><span class="title">Important coupon title that must remain visible</span></div><div class="covered"><span>Merchant name</span><button class="cta">Shop</button></div>');
  const measure=()=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle)`);
  const broken=await measure();
  assert.equal(broken.rootOverflow,false);
  assert.ok(broken.samples.some(item=>item.reasons.includes('clipped-horizontal-text')));
  assert.ok(broken.samples.some(item=>item.reasons.includes('text-covered-at-sample')));
  await page.addStyleTag({content:'.card{width:auto;overflow:visible}.title{white-space:normal}.cta{position:static}'});
  const fixed=await measure();assert.equal(fixed.candidateCount,0);
});

test('global budgets measure edge, alignment, cumulative gap, typography and hidden coverage at PC and phone',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  t.after(()=>browser.close());
  const page=await browser.newPage();
  const checks=[
    {id:'edge',type:'gutter',selector:'main',range:[12,24]},
    {id:'axis',type:'alignment',selector:'h2',with:'.grid',axis:'left',range:[0,0]},
    {id:'section',type:'distance',selector:'h2',with:'.grid',range:[12,20]},
    {id:'cards',type:'grid',selector:'.grid',items:'.card',expectedItems:4,horizontalGap:[10,20],verticalGap:[10,20],height:[90,110]},
    {id:'title',type:'typography',selector:'.title',fontSize:[16,20],width:[80,1500]},
    {id:'roles',type:'separation',selector:'.card',first:'.logo',second:'.title'},
    {id:'hidden',type:'box',selector:'.required',height:[10,100]}
  ];
  const measure=()=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
  for(const width of [1440,393,320]){
    await page.setViewportSize({width,height:900});
    await page.setContent('<style>*{box-sizing:border-box}body{margin:0}h2{margin:0 0 36px 20px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0}.card{height:100px;position:relative}.logo{width:70px;height:70px}.title{position:absolute;left:30px;top:0;font-size:36px}.required{display:none}</style><main><h2>Offers</h2><div class="grid">'+Array.from({length:4},()=>'<div class="card"><div class="logo"></div><div class="title">Save</div></div>').join('')+'</div><div class="required">Visible requirement</div></main>');
    const bad=await measure();
    for(const id of ['edge','axis','section','cards','title','roles','hidden'])assert.ok(bad.budget.failures.some(f=>f.id===id),width+': '+id);
    await page.addStyleTag({content:'main{margin:0 16px}h2{margin:0 0 16px}.grid{grid-template-columns:1fr;gap:12px}.title{left:82px;font-size:16px;width:calc(100% - 94px)}.required{display:block;height:20px}'});
    const good=await measure();assert.deepEqual(good.budget.failures,[]);assert.equal(good.budget.status,'measured');
    const legacy=await page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle)`);
    assert.equal(legacy.budget.status,'not-run');
  }
});

test('empty checks cannot pass, glyph overflow enters logo track, and legal clipping stays diagnostic',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:393,height:900}});
  const measure=checks=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
  await page.setContent('<style>body{margin:0}.card{position:relative;height:100px}.logo{position:absolute;left:200px;width:70px;height:70px}.title{position:absolute;left:20px;width:100px;white-space:nowrap;font:16px sans-serif}</style><div class="card"><div class="logo"></div><div class="title">Long coupon title entering the logo track</div></div>');
  assert.equal((await measure([{id:'empty',type:'gutter',selector:'.missing',optional:true,range:[12,20]}])).budget.status,'not-run');
  const roles=[{id:'roles',type:'separation',selector:'.card',first:'.logo',second:'.title'}];
  assert.ok((await measure(roles)).budget.failures.some(f=>f.reason==='regions-overlap'));
  await page.addStyleTag({content:'.title{overflow:hidden;text-overflow:ellipsis}'});
  assert.equal((await measure(roles)).budget.status,'measured');
  await page.addStyleTag({content:'.card{opacity:0}'});
  assert.ok((await measure(roles)).budget.failures.some(f=>f.reason==='hidden-required-elements'));
});

test('purposeful space stays valid while inherited card height fails at intermediate widths',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
  const page=await browser.newPage(),evidenceDir=process.env.DA_VISUAL_EVIDENCE_DIR,results=[];
  if(evidenceDir)await fs.mkdir(evidenceDir,{recursive:true});
  const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>Layout regression fixture</title><style>
    *{box-sizing:border-box}body{margin:0;background:#f7f7f4;color:#18231e;font:16px/24px sans-serif}main{margin:16px}h1{margin:0;font:700 24px/32px sans-serif}p{margin:12px 0 0}
    #intro{padding:24px;background:#e7eee7}#offers{margin-top:56px}h2{margin:0 0 12px;font:700 20px/28px sans-serif}.cards{display:grid;gap:12px;align-items:start}
    .card{padding:16px;border:1px solid #bcc9bf;background:white;display:flex;flex-direction:column;align-items:flex-start}.info{font:18px/24px sans-serif;max-width:300px}.action{margin-top:12px;min-height:44px;padding:10px 16px;border:0;background:#244c39;color:white;font:16px/24px sans-serif}
    @media(min-width:600px){.cards{grid-template-columns:1fr 1fr}}
    @media(min-width:600px) and (max-width:800px){.card{min-height:280px}.action{margin-top:auto}}
    </style><main><header id="intro"><h1>Layout regression fixture</h1><p>Space between different groups is intentional. This is a test page, not a generated site.</p></header><section id="offers"><h2>Offer group</h2><div class="cards"><article class="card"><div class="info">A short offer title</div><button class="action">View offer</button></article><article class="card"><div class="info">A longer offer title checking actual reading capacity and the relationship to its own action</div><button class="action">View offer</button></article></div></section></main></html>`;
  const checks=[{id:'content-edge',type:'gutter',selector:'main',range:[16,16]},
    {id:'purposeful-section-space',type:'distance',selector:'#intro',with:'#offers',range:[56,56]},
    {id:'content-action',type:'distance',selector:'.info',with:'.action',range:[12,12]}];
  const measure=()=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
  for(const width of [320,393,599,600,601,768,800,801,1440]){
    await page.setViewportSize({width,height:900});await page.setContent(html);await page.evaluate(()=>document.fonts.ready);
    const before=await measure(),badRange=width>=600&&width<=800;
    assert.equal(before.rootOverflow,false);
    assert.equal(before.budget.failures.some(f=>f.id==='content-action'),badRange,'inherited height at '+width);
    assert(!before.budget.failures.some(f=>f.id==='purposeful-section-space'),'meaningful 56px space must remain valid');
    if(evidenceDir&&width===600)await page.screenshot({path:path.join(evidenceDir,'layout-600-before.png'),fullPage:true});
    await page.addStyleTag({content:'.card{min-height:0}.action{margin-top:12px}'});
    const after=await measure();assert.deepEqual(after.budget.failures,[]);assert.equal(after.budget.status,'measured');
    results.push({width,before:before.budget,after:after.budget});
    if(evidenceDir&&[393,600,1440].includes(width))await page.screenshot({path:path.join(evidenceDir,`layout-${width}-after.png`),fullPage:true});
  }
  if(evidenceDir){await fs.writeFile(path.join(evidenceDir,'layout-fixture.html'),html);await fs.writeFile(path.join(evidenceDir,'layout-results.json'),JSON.stringify({kind:'browser regression fixture; not generated-site aesthetic acceptance',results},null,2)+'\n');}
});

test('image/text center axes detect drift and retain purposeful top alignment and local optical offsets',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
  const page=await browser.newPage(),evidenceDir=process.env.DA_ALIGNMENT_EVIDENCE_DIR,results=[];
  if(evidenceDir)await fs.mkdir(evidenceDir,{recursive:true});
  const media='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="8" fill="#32634a"/><circle cx="40" cy="40" r="24" fill="#f4cf70"/></svg>');
  const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>Image/text alignment regression fixture</title><style>
    *{box-sizing:border-box}body{margin:16px;background:#f7f7f4;color:#18231e;font:16px/24px sans-serif}h1{font:700 22px/28px sans-serif;margin:0 0 12px}h2{font:700 18px/24px sans-serif;margin:20px 0 8px}
    .row,.stack{max-width:520px;background:white;border:1px solid #b7c6bd;padding:16px;display:flex;gap:16px;align-items:flex-start}.stack{flex-direction:column}.media{display:block;width:80px;height:80px;flex-shrink:0}.copy{min-width:0}.row .copy{flex:1}.stack .copy{width:240px;max-width:100%;text-align:center}.title{font:18px/24px sans-serif}.meta{font:16px/24px sans-serif;color:#476352}
    </style><h1>Image/text alignment fixture</h1><p>Geometry test, not a visual design reference.</p><h2>Horizontal group</h2><section class="row"><img class="media" src="${media}" alt="Synthetic test shape"><div class="copy"><div class="title">Save on this eligible offer today</div><div class="meta">Offer details</div></div></section><h2>Stacked group</h2><section class="stack"><img class="media" src="${media}" alt="Synthetic test shape"><div class="copy"><div class="title">A centered content group</div><div class="meta">Offer details</div></div></section></html>`;
  const centerChecks=[{id:'row-center',type:'alignment',selector:'.row .media',with:'.row .copy',axis:'center-y',range:[0,0]},
    {id:'stack-center',type:'alignment',selector:'.stack .media',with:'.stack .copy',axis:'center-x',range:[0,0]}];
  const measure=checks=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
  for(const width of [320,393,767,768,1024,1440]){
    await page.setViewportSize({width,height:1000});await page.setContent(html);await page.evaluate(()=>document.fonts.ready);
    const before=await measure(centerChecks);assert.equal(before.rootOverflow,false);
    for(const id of ['row-center','stack-center'])assert(before.budget.failures.some(f=>f.id===id),width+': '+id);
    if(evidenceDir&&[393,1440].includes(width))await page.screenshot({path:path.join(evidenceDir,`alignment-${width}-before.png`),fullPage:true});
    await page.addStyleTag({content:'.row,.stack{align-items:center}'});
    const centered=await measure(centerChecks);assert.deepEqual(centered.budget.failures,[]);
    if(evidenceDir&&[393,1440].includes(width))await page.screenshot({path:path.join(evidenceDir,`alignment-${width}-after.png`),fullPage:true});
    await page.addStyleTag({content:'.row .copy{transform:translateY(2px)}'});
    assert((await measure(centerChecks)).budget.failures.some(f=>f.id==='row-center'));
    const offset=await measure([{...centerChecks[0],range:[2,2]},centerChecks[1]]);assert.deepEqual(offset.budget.failures,[]);
    await page.evaluate(()=>{document.querySelector('.row .title').textContent='A much longer actual-content test title that wraps across several lines and changes the image and information group relationship at this viewport width. '.repeat(2);});
    await page.addStyleTag({content:'.row{align-items:flex-start}.row .copy{transform:none}'});
    const topAligned=await measure([{...centerChecks[0],axis:'top'},centerChecks[1]]);assert.deepEqual(topAligned.budget.failures,[]);
    assert((await measure(centerChecks)).budget.failures.some(f=>f.id==='row-center'),'Long copy need not be forced into centered alignment');
    results.push({width,before:before.budget,centered:centered.budget,declaredOffset:offset.budget,longCopyTopAligned:topAligned.budget});
  }
  if(evidenceDir){await fs.writeFile(path.join(evidenceDir,'alignment-fixture.html'),html);await fs.writeFile(path.join(evidenceDir,'alignment-results.json'),JSON.stringify({kind:'geometry and evidence regression; not proof of optical balance',results},null,2)+'\n');}
});

test('mixed text sizes share a baseline without sharing box tops; baseline is not claimed as an automatic measurement',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:393,height:500}});
  await page.setContent('<style>body{margin:16px}.line{display:flex;align-items:flex-start;gap:8px}.large{font:32px/40px sans-serif}.small{font:16px/24px sans-serif}.probe{display:inline-block;width:1px;height:1px;background:red;vertical-align:baseline}</style><div class="line"><span class="large">20<i class="probe large-probe"></i></span><span class="small">% off<i class="probe small-probe"></i></span></div>');
  await page.evaluate(()=>document.fonts.ready);
  const evidenceDir=process.env.DA_ALIGNMENT_EVIDENCE_DIR;
  if(evidenceDir){await fs.mkdir(evidenceDir,{recursive:true});await page.screenshot({path:path.join(evidenceDir,'baseline-before.png'),fullPage:true});}
  // These explicit probes belong to this synthetic fixture; the inspector never inserts them.
  const baselineCheck={id:'known-probes',type:'alignment',selector:'.large-probe',with:'.small-probe',axis:'bottom',range:[0,0]};
  const measure=checks=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
  assert.equal((await measure([{...baselineCheck,selector:'.large',with:'.small',axis:'top'}])).budget.status,'measured');
  assert.equal((await measure([baselineCheck])).budget.status,'fail');
  await page.addStyleTag({content:'.line{align-items:baseline}'});
  if(evidenceDir)await page.screenshot({path:path.join(evidenceDir,'baseline-after.png'),fullPage:true});
  assert.equal((await measure([baselineCheck])).budget.status,'measured');
  assert.equal((await measure([{...baselineCheck,selector:'.large',with:'.small',axis:'top'}])).budget.status,'fail');
  const unsupported=await measure([{...baselineCheck,axis:'baseline'}]);assert(unsupported.budget.failures.some(f=>f.reason==='invalid-axis'));
});

test('single-line summaries reject inner hard cuts and content-dependent height; topic grouping rejects empty, reversed and distant roles',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
  const page=await browser.newPage();
  const checks=[{id:'summary',type:'summary',selector:'.card',title:'.title'},{id:'topic',type:'topic',selector:'.topic',icon:'.icon',label:'.label',maximumGapPx:12}];
  const measure=()=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
  for(const width of [320,393,768,1440]){
    await page.setViewportSize({width,height:900});
    await page.setContent('<style>*{box-sizing:border-box}body{margin:16px;font:16px/24px sans-serif}.card{width:280px;height:100px;padding:12px}.title{width:150px;height:44px;line-height:22px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.inner{display:block;overflow:hidden}.topic{display:flex;width:280px;padding:12px;gap:100px}.icon{order:2;flex:none;width:36px;height:36px;background:#275}.label{order:1;text-align:center;font:16px/24px sans-serif}</style><article class="card"><h2 class="title"><span class="inner">A very long real merchant name without an inner ellipsis</span></h2></article><article class="card" style="height:140px"><h2 class="title">Short</h2></article><a class="topic"><i class="icon"></i><span class="label">Clothing</span></a>');
    const bad=await measure();
    for(const reason of ['summary-reserved-or-wrapped-line','nested-summary-text-not-ellipsized','content-dependent-card-height','topic-icon-must-be-left-or-above','topic-label-not-left-aligned'])assert(bad.budget.failures.some(f=>f.reason===reason),reason+' '+width);
    await page.addStyleTag({content:'.card{height:100px!important}.title{height:22px}.inner{white-space:nowrap;text-overflow:ellipsis}.icon{order:0}.label{order:0;text-align:left}.topic{align-items:center;gap:8px}'});
    assert.deepEqual((await measure()).budget.failures,[]);
    await page.addStyleTag({content:'.topic{gap:24px}'});assert((await measure()).budget.failures.some(f=>f.reason==='topic-group-disconnected'));
    await page.addStyleTag({content:'.topic{gap:8px;flex-direction:column;align-items:flex-start}'});assert((await measure()).budget.failures.some(f=>f.reason==='topic-icon-not-centered'));
    await page.addStyleTag({content:'.topic{align-items:center}.label{align-self:stretch;text-align:center}'});assert.deepEqual((await measure()).budget.failures,[]);
    await page.evaluate(()=>document.querySelector('.icon').remove());assert((await measure()).budget.failures.some(f=>f.reason==='topic-role-count'));
  }
});

test('topics keep complete long names: vertical icon and text share a center, horizontal labels align left',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
  const page=await browser.newPage();
  const checks=[{id:'topics',type:'topic',selector:'.topic',icon:'.icon',label:'.label',maximumGapPx:12}];
  const measure=()=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
  for(const width of [320,393,1440]){
    await page.setViewportSize({width,height:900});
    await page.setContent('<style>*{box-sizing:border-box}body{margin:16px;font:16px/22px sans-serif}.topic{display:flex;flex-direction:column;align-items:center;width:140px;padding:10px;gap:8px}.icon{width:36px;height:36px;flex:none;background:#275}.label{width:100%;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style><a class="topic"><i class="icon"></i><span class="label">Music, Books, Movies &amp; Games</span></a>');
    assert((await measure()).budget.failures.some(f=>f.reason==='topic-label-must-remain-full'));
    await page.addStyleTag({content:'.label{white-space:normal;overflow:visible;text-overflow:clip}'});assert((await measure()).budget.failures.some(f=>f.reason==='topic-label-not-centered'));
    await page.addStyleTag({content:'.label{text-align:center}'});assert.deepEqual((await measure()).budget.failures,[]);
    await page.addStyleTag({content:'.label{width:90%;align-self:flex-start}'});assert((await measure()).budget.failures.some(f=>f.reason==='topic-label-slot-not-centered'));
    await page.addStyleTag({content:'.label{width:100%;align-self:center}'});assert.deepEqual((await measure()).budget.failures,[]);
    await page.addStyleTag({content:'.topic{height:76px;overflow:hidden}'});assert((await measure()).budget.failures.some(f=>f.reason==='topic-label-clipped-by-ancestor'));
    await page.addStyleTag({content:'.topic{height:auto;overflow:visible;flex-direction:row;width:280px}.label{min-width:0;text-align:left}'});assert.deepEqual((await measure()).budget.failures,[]);
    await page.addStyleTag({content:'.icon{align-self:flex-start}'});assert((await measure()).budget.failures.some(f=>f.reason==='topic-icon-not-centered'));
    await page.addStyleTag({content:'.icon{align-self:center}'});assert.deepEqual((await measure()).budget.failures,[]);
  }
});

test('stability compares entity and field geometry across text, hover, redraw, filtering and scrollbar changes without resetting the baseline',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
  const page=await browser.newPage();
  const checks=[{id:'stable',type:'stability',selector:'.card',keyAttribute:'data-id',fields:['.logo','.title','.action'],tolerancePx:0.75}];
  const measure=baseline=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks,stabilityBaseline:baseline})})`);
  for(const width of [320,393,768,1440]){
    await page.setViewportSize({width,height:900});
    await page.setContent('<style>*{box-sizing:border-box}html{overflow-y:scroll}body{margin:16px;font:16px/24px sans-serif}.card{display:flex;align-items:center;justify-content:center;height:100px;gap:8px;margin-bottom:12px}.logo{width:70px;height:70px;flex:none;background:#265}.title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.action{width:44px;height:44px;flex:none}.bad-hover:hover{transform:translateX(5px)}</style><main>'+['a','b','c'].map(id=>'<article class="card" data-id="'+id+'"><i class="logo"></i><span class="title">Short</span><button class="action">Go</button></article>').join('')+'</main>');
    const first=await measure();assert.equal(first.budget.status,'not-run');assert(first.budget.pending.some(p=>p.reason==='stability-baseline-required'));
    const baseline=first.stabilitySnapshots;assert.equal((await measure(baseline)).budget.status,'measured');
    await page.evaluate(()=>document.querySelector('.title').textContent='A much longer merchant name');
    assert((await measure(baseline)).budget.failures.some(f=>f.reason==='field-geometry-shift'),'intrinsic centered group moves logo at '+width);
    await page.addStyleTag({content:'.card{display:grid;grid-template-columns:70px minmax(0,1fr) 44px}.title{width:100%}'});
    // The repaired implementation is a new candidate and deliberately gets one new baseline.
    const fixedBaseline=(await measure()).stabilitySnapshots;
    await page.evaluate(()=>document.querySelector('.title').textContent='Tiny');assert.equal((await measure(fixedBaseline)).budget.status,'measured');
    await page.evaluate(()=>{const card=document.querySelector('.card');card.replaceWith(card.cloneNode(true));});assert.equal((await measure(fixedBaseline)).budget.status,'measured');
    await page.evaluate(()=>document.querySelector('.card').classList.add('bad-hover'));await page.locator('.card').first().hover();
    assert((await measure(fixedBaseline)).budget.failures.some(f=>f.reason==='card-geometry-shift'));
    assert((await measure(fixedBaseline)).budget.failures.some(f=>f.reason==='card-geometry-shift'),'repeat cannot launder failure');
    await page.addStyleTag({content:'.bad-hover:hover{transform:none;background:#eef5ee}'});assert.equal((await measure(fixedBaseline)).budget.status,'measured');
    await page.locator('.action').first().focus();assert.equal((await measure(fixedBaseline)).budget.status,'measured');
    await page.emulateMedia({reducedMotion:'reduce'});assert.equal((await measure(fixedBaseline)).budget.status,'measured');
    await page.evaluate(()=>document.querySelector('[data-id="b"]').remove());assert.equal((await measure(fixedBaseline)).budget.status,'measured','filtering may reorder surviving cards');
    await page.addStyleTag({content:'.title{transform:translateX(3px)}'});assert((await measure(fixedBaseline)).budget.failures.some(f=>f.reason==='field-geometry-shift'));
    await page.addStyleTag({content:'.title{transform:none}html{scrollbar-gutter:stable both-edges}'});
    assert((await measure(fixedBaseline)).budget.failures.some(f=>['card-geometry-shift','field-geometry-shift','scrollbar-width-shift'].includes(f.reason)),'reserved scrollbar width changes geometry even with overlay scrollbars');
    await page.evaluate(()=>document.querySelectorAll('.card').forEach(c=>c.dataset.id='new-'+c.dataset.id));
    assert((await measure(fixedBaseline)).budget.pending.some(p=>p.reason==='no-comparable-stability-entities'));
  }
});

test('adaptive checks reject sparse grids, unreadable ellipsis, wrong image frames, clipped actions and misplaced info',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:668,height:900}});
  const photo='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="teal"/></svg>');
  const checks=[
    {id:'packing',type:'packing',selector:'.grid',items:'.card',minReadableWidth:180,gap:20,maxColumns:3},
    {id:'name',type:'summary',selector:'.merchant',title:'.name',minVisibleCharacters:7},
    {id:'image',type:'image-fit',selector:'img',frame:'.frame',requireLoaded:true},
    {id:'action',type:'action-shape',selector:'button',pseudos:['::after']},
    {id:'info',type:'typography',selector:'.info',fontSize:[16,16],textAlign:'left',fontFamilyIncludes:'sans-serif'}
  ];
  const measure=()=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:16px}.grid{display:grid;grid-template-columns:1fr;gap:20px}.card{height:50px}.merchant{height:30px}.name{display:block;width:44px;height:20px;font:16px/20px sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.frame{width:160px;height:140px}img{display:block;width:160px;height:120px}.info{font:16px/20px Georgia,serif;text-align:center}button{height:44px;clip-path:polygon(0 0,90% 0,100% 50%,90% 100%,0 100%)}</style><div class="grid"><div class="card">One</div><div class="card">Two</div><div class="card">Three</div></div><div class="merchant"><span class="name">Booking.com</span></div><div class="merchant"><span class="name">H&amp;M</span></div><div class="frame"><img src="${photo}" width="160" height="90"></div><div class="info">Merchant information</div><button>View store</button>`);
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  const bad=await measure();
  for(const reason of ['sparse-packing','unrecognizable-summary','image-ratio-mismatch','image-frame-mismatch','unrecognizable-action-outline','wrong-text-alignment','wrong-information-font'])assert(bad.budget.failures.some(f=>f.reason===reason),reason);
  await page.addStyleTag({content:'.grid{grid-template-columns:repeat(3,1fr)}.name{width:160px}.frame{height:auto}img{height:auto}.info{font-family:Arial,sans-serif;text-align:left}button{clip-path:none;border-radius:6px}'});
  assert.deepEqual((await measure()).budget.failures,[]);
  await page.setContent('<div class="grid" style="height:20px"></div>');
  const empty=await page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks:[{id:'empty',type:'packing',selector:'.grid',items:'.card',minReadableWidth:180,gap:20,empty:true}]})})`);
  assert.deepEqual(empty.budget.failures,[]);
});

test('expanded hosts measure real gaps and capacity while narrow sidebars retain their layout',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:1090,height:900}});
  const checks=[{id:'expanded',type:'packing',selector:'.grid',items:'a',minReadableWidth:180,gap:20,gapRange:[15,30],maxItemWidth:180,minHostWidth:480}];
  const measure=()=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
  await page.setContent('<style>*{box-sizing:border-box}body{margin:24px}aside{width:1042px;container-type:inline-size}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}a{display:block;height:100px}</style><aside><div class="grid">'+Array.from({length:5},(_,i)=>'<a href="#'+i+'">Merchant '+i+'</a>').join('')+'</div></aside>');
  assert((await measure()).budget.failures.some(f=>f.reason==='sparse-packing'));
  await page.addStyleTag({content:'.grid{grid-template-columns:repeat(5,180px);justify-content:space-between}'});
  assert((await measure()).budget.failures.some(f=>f.metric?.includes('visible-gap')),'space-between must not pass from its CSS gap');
  await page.addStyleTag({content:'.grid{grid-template-columns:repeat(auto-fit,180px);justify-content:start}'});
  assert.deepEqual((await measure()).budget.failures,[]);
  await page.setViewportSize({width:768,height:900});await page.addStyleTag({content:'aside{width:720px}'});
  assert.deepEqual((await measure()).budget.failures,[],'last row retains ordinary track width and gaps');
  await page.addStyleTag({content:'aside{width:280px}.grid{grid-template-columns:repeat(2,1fr);gap:8px}'});
  const narrow=await measure();assert.deepEqual(narrow.budget.failures,[]);assert(narrow.budget.measurements.some(m=>m.metric==='packing-host-outside-scope'));
});

test('mobile controls reject standalone arrow rows, visible heading labels and asymmetric photos; shared behavior fixes all three',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
  const page=await browser.newPage({reducedMotion:'reduce'}),css=await fs.readFile(new URL('../../knowledge/imported/skills/site-design/assets/home-mobile-controls.css',import.meta.url),'utf8'),js=await fs.readFile(new URL('../../knowledge/imported/skills/site-design/assets/home-mobile-controls.mjs',import.meta.url),'utf8');
  const checks=[{id:'rail',type:'rail-controls',selector:'.home-rail-controls',optional:true,maxViewport:760},{id:'heading',type:'heading-action',selector:'.mobile-section-heading',maxViewport:760},{id:'photo',type:'image-fit',selector:'img',conventionalFrame:true,requireLoaded:true,maxViewport:760}];
  for(const width of[320,375,393,760]){
    await page.setViewportSize({width,height:900});
    await page.setContent('<style>*{box-sizing:border-box}body{margin:0;font:16px/24px sans-serif}main{margin:12px}.op-section-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}h2{font-size:24px;line-height:28px;margin:0}.op-window-rail{display:grid;grid-auto-flow:column;grid-auto-columns:260px;gap:12px;overflow:auto}.card{height:100px}.home-rail-controls{display:flex;justify-content:flex-end;gap:8px}.home-rail-arrow{width:44px;height:44px;min-width:44px;min-height:44px}img{display:block;width:160px;height:90px;border-radius:8px}</style><body data-delivery-page="home" data-delivery-site="orbitperks"><main><header class="op-section-head" data-section-heading><h2>Compare top codes &amp; deals</h2><a href="#offers">Browse all →<svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 12h15"/></svg></a></header><div class="op-window-rail" data-horizontal-rail>'+Array.from({length:5},(_,i)=>'<a class="card" href="#'+i+'">Store '+i+'</a>').join('')+'</div><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%2290%22/%3E"></main>');
    await page.addStyleTag({content:css});await page.addScriptTag({type:'module',content:js});await page.waitForSelector('.home-rail-shell');await page.locator('img').evaluate(e=>e.decode());
    const measure=()=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
    const good=await measure();assert.deepEqual(good.budget.failures,[],String(width));
    assert.equal(await page.getByRole('link',{name:'Browse all →'}).count(),1);
    const rail=page.locator('.home-scroll-rail');await page.getByRole('button',{name:'Next stores'}).click();await page.waitForFunction(()=>document.querySelector('.home-scroll-rail').scrollLeft>0);await page.getByRole('button',{name:'Previous stores'}).click();await page.waitForFunction(()=>document.querySelector('.home-scroll-rail').scrollLeft<=2);
    await page.addStyleTag({content:'body .home-rail-shell .home-rail-arrow{position:static!important;transform:none!important}body .home-rail-shell>.home-rail-controls{display:flex!important}body .mobile-heading-label{position:static!important;width:auto!important;height:auto!important;overflow:visible!important;clip-path:none!important}img{border-radius:15px 15px 0 0!important}'});
    const bad=await measure();for(const reason of['rail-controls-own-row-or-overlap-content','heading-action-needs-named-icon-only','unconventional-media-frame'])assert.ok(bad.budget.failures.some(f=>f.reason===reason),width+':'+reason);
  }
});

test('required rail controls cannot disappear while other page budgets pass',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());const page=await browser.newPage();await page.setContent('<main style="height:100px">Content</main>');const result=await page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks:[{id:'body',type:'box',selector:'main',height:[100,100]},{id:'rail',type:'rail-controls',selector:'.missing-controls'}]})})`);assert.ok(result.budget.failures.some(f=>f.reason==='missing-required-rail-controls'));
});

test('mobile filter controls return the count row to its original desktop height across breakpoints',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.setContent('<style>*{box-sizing:border-box}body{margin:12px}p{margin:0;line-height:20px}.home-rail-count{min-height:44px}[data-topic-rail]{display:flex;gap:12px;overflow:auto}[data-topic-rail]>button{flex:0 0 180px;height:44px}.home-rail-arrow{width:44px;height:44px}</style><body data-delivery-site="paloma" data-delivery-page="home"><p data-count-line>Offers</p><div data-filters><div data-topic-rail>'+Array.from({length:4},()=>'<button>Category</button>').join('')+'</div></div>');
  await page.addStyleTag({content:await fs.readFile(new URL('../../knowledge/imported/skills/site-design/assets/home-mobile-controls.css',import.meta.url),'utf8')});await page.addScriptTag({type:'module',content:await fs.readFile(new URL('../../knowledge/imported/skills/site-design/assets/home-mobile-controls.mjs',import.meta.url),'utf8')});
  assert.equal(await page.locator('[data-count-line]').evaluate(e=>e.getBoundingClientRect().height),20);
  for(const [width,expected]of[[375,20],[761,44],[1440,20]]){await page.setViewportSize({width,height:900});await page.waitForFunction(expected=>document.querySelector('[data-count-line]').getBoundingClientRect().height===expected,expected);}
});

test('mobile every-family action flow rejects orphan partial CTA and distinguishes full footer and whole-card paths',async t=>{
 const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:320,height:900}});
 const check=[{id:'flow',type:'action-flow',selector:'.card',action:'.cta',content:'.title,time'}];
 const measure=checks=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
 await page.setContent('<style>*{box-sizing:border-box}body{margin:14px}.card{width:292px;padding:12px;display:grid;grid-template-columns:72px 1fr;grid-template-rows:24px 20px 44px;gap:4px 12px}.logo{grid-row:1/4;width:72px;height:72px;background:#eee}.title,time{grid-column:2}.cta{grid-column:2;width:100px;height:44px;background:#633;color:white;border:0}.title,time{font:14px/20px Arial}</style><article class="card"><div class="logo"></div><div class="title">Save 25% on $25+</div><time>May 28, 2027</time><button class="cta" aria-label="Get code">Get code</button></article>');
 assert((await measure(check)).budget.failures.some(f=>f.reason==='orphan-partial-action-row'));
 await page.addStyleTag({content:'.card{grid-template-rows:24px 44px}time,.cta{grid-column:2;grid-row:2;align-self:center}time{width:calc(100% - 56px)}.cta{width:44px;justify-self:end;font-size:0}.logo{grid-row:1/3}'});assert.deepEqual((await measure(check)).budget.failures,[]);
 await page.addStyleTag({content:'.cta{grid-column:1/-1;grid-row:3;width:100%}time{grid-row:2}'});assert.deepEqual((await measure(check)).budget.failures,[]);
 await page.setContent('<a class="card" href="/offer"><span class="title">Save 25%</span></a>');assert.deepEqual((await measure([{...check[0],mode:'whole-card'}])).budget.failures,[]);
 await page.locator('.card').evaluate(e=>e.removeAttribute('href'));assert((await measure([{...check[0],mode:'whole-card'}])).budget.failures.some(f=>f.reason==='missing-offer-action'));
});

test('horizontal reading image must match the entire copy group and declare proportional cover crop',async t=>{
 const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());const page=await browser.newPage();
 const src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270"><rect width="480" height="270" fill="green"/></svg>');
 await page.setContent('<style>.card{display:grid;grid-template-columns:96px 200px;gap:12px;align-items:center}img{width:96px;height:54px;object-fit:cover;border-radius:8px}.copy{height:100px}</style><a class="card" href="/guide"><img width="480" height="270" src="'+src+'"><span class="copy">Long article title<br>Read guide</span></a>');await page.locator('img').evaluate(e=>e.decode());
 const checks=[{id:'reading',type:'image-fit',selector:'.card img',card:'.card',balanceWith:'.copy',frame:'img',fitMode:'cover',conventionalFrame:true,requireLoaded:true}];const measure=()=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks})})`);
 assert((await measure()).budget.failures.some(f=>f.reason==='reading-image-copy-height-mismatch'));
 await page.addStyleTag({content:'.card{align-items:stretch}img{height:100%}'});assert.deepEqual((await measure()).budget.failures,[]);
 await page.addStyleTag({content:'img{object-fit:fill}'});assert((await measure()).budget.failures.some(f=>f.reason==='cover-crop-not-proportional'));
});

test('purposeful media-height groups and anchored selected tickets pass while stretched ordinary tails still fail',async t=>{
 const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());const page=await browser.newPage();
 const checks=[{id:'flow',type:'action-flow',selector:'.card',action:'button',content:'.title,time',media:'.logo'}];const measure=c=>page.evaluate(`(${inspectLayout.toString()})(document,getComputedStyle,${JSON.stringify({checks:c})})`);
 await page.setContent('<style>.card{display:grid;grid-template-columns:80px 180px;grid-template-rows:24px 20px 44px;gap:6px 12px}.title{grid-column:1/-1;grid-row:1}.logo{grid-column:1;grid-row:2/4;width:80px;height:80px;background:#eee}time{grid-column:2;grid-row:2}button{grid-column:2;grid-row:3;width:132px;height:44px}</style><article class="card"><div class="logo"></div><div class="title">Gifts $20 &amp; Under</div><time>Jun 9, 2027</time><button>View offer</button></article>');
 assert.deepEqual((await measure(checks)).budget.failures,[]);
 await page.addStyleTag({content:'.card{grid-template-rows:24px 48px 44px}'});assert((await measure(checks)).budget.failures.some(f=>f.reason==='orphan-partial-action-row'));
 await page.setContent('<style>.title{height:24px}button{display:block;width:136px;height:44px;margin-top:8px}</style><article class="card"><div class="title">Selected offer title</div><button>Get code</button></article>');assert.deepEqual((await measure([{...checks[0],mode:'stacked-footer',rationale:'Selected vertical ticket: title then immediately left-aligned action.'}])).budget.failures,[]);
 await page.addStyleTag({content:'button{margin-left:80px}'});assert((await measure([{...checks[0],mode:'stacked-footer',rationale:'Selected vertical ticket.'}])).budget.failures.some(f=>f.reason==='orphan-partial-action-row'));
});

test('real reading links keep keyboard activation when compact metadata and action share a row',async t=>{
 const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());const page=await browser.newPage();await page.setContent('<style>.reading{display:contents}</style><a class="reading" href="#offer"><h3>25% Off Any Purchase</h3><time>May 28, 2027</time></a>');await page.locator('.reading').focus();await page.keyboard.press('Enter');assert.equal(new URL(page.url()).hash,'');
 await page.addStyleTag({content:'.reading{display:grid;width:206px;height:72px;grid-template-rows:22px 44px;gap:6px}.reading time{width:150px}'});await page.locator('.reading').focus();await page.keyboard.press('Enter');assert.equal(new URL(page.url()).hash,'#offer');
});

import test from 'node:test';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.DA_PLAYWRIGHT_MODULE||'playwright-core');
if(!process.env.SITE_BROWSER_EXECUTABLE)throw Error('Set SITE_BROWSER_EXECUTABLE to the actual available browser; missing capability is not-run');
import {inspectDetail} from '../../knowledge/imported/skills/coupon-detail-review/scripts/inspect-detail.mjs';

test('category navigation checks real browser geometry and rejects known regressions',async t=>{
 const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE,headless:true});
 t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:393,height:852}});
 const group={name:'categories',host:'.topics',cards:'a',label:'.label',mode:'svg',iconFrame:'.mark',icon:'.mark svg',markers:'.tag',iconMinPx:26,iconMaxPx:32,expectedCount:2,expectedLabels:['Fashion','Travel'],expectedMarkedLabels:['Fashion'],sharedAlignment:[{field:'iconFrame',axis:'y'},{field:'label',axis:'y'}]};
 const options={requiredRoles:[],requireTopicNavigation:true,topicNavigation:[group]};
 const fixture=`<style>
 *{box-sizing:border-box}body{margin:12px}.topics{width:320px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
 a{height:128px;padding:8px;display:grid;grid-template-rows:44px 38px 18px;gap:4px;justify-items:center;color:#222;text-decoration:none}
 .mark{display:grid;place-items:center;width:44px;height:44px;background:#eef7ff;color:#246bc3}.mark svg{width:26px;height:26px;stroke:currentColor;fill:none;stroke-width:2}
 .label{font:14px/19px Arial;height:38px;width:100%;text-align:center;display:flex;align-items:center;justify-content:center}
 .tag{font:14px/18px Arial;height:18px;background:#fff5d0;padding:0 4px}
 </style><div class="topics">${['Fashion','Travel'].map((name,i)=>`<a href="/topics/${name}/"><span class="mark"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4Z"/></svg></span><span class="label">${name}</span>${!i?'<span class="tag">Picked</span>':''}</a>`).join('')}</div>`;
 const reset=()=>page.setContent(fixture);
 const check=()=>page.evaluate(inspectDetail,options);
 const has=(result,rule)=>assert(result.failures.some(f=>f.rule===rule),JSON.stringify(result.failures));
 await t.test('colored glyphs and declared slots pass without requiring one universal arrangement',async()=>{
  await reset();const result=await check();assert.deepEqual(result.failures,[]);assert.equal(result.topicNavigation[0].cards[0].icon.h,26);
  await page.addStyleTag({content:'.topics{grid-template-columns:1fr}a{height:72px;grid-template-columns:44px 1fr 65px;grid-template-rows:1fr;align-items:center}.label{justify-content:flex-start;text-align:left}'});
  assert.deepEqual((await check()).failures,[]);
 });
 await t.test('missing mapping and empty category coverage cannot pass',async()=>{
  await reset();has(await page.evaluate(inspectDetail,{requiredRoles:[],requireTopicNavigation:true}),'topic-missing-mapping');
  await page.locator('.topics').evaluate(e=>e.innerHTML='');has(await check(),'topic-count-mismatch');
 });
 await t.test('enlarged outer box cannot conceal legacy SVG max-height',async()=>{
  await reset();await page.addStyleTag({content:'.mark svg{max-height:18px}'});has(await check(),'topic-icon-budget');
 });
 await t.test('colored base with gray actual SVG paint fails; genuine color syntax passes',async()=>{
  await reset();await page.addStyleTag({content:'.mark{background:red;color:blue}.mark path{stroke:#444}'});has(await check(),'topic-icon-color-missing');
  await page.addStyleTag({content:'.mark path{stroke:oklch(55% .19 250)}'});assert.deepEqual((await check()).failures,[]);
 });
 await t.test('effective opacity of SVG and paint ancestors cannot hide a missing icon',async()=>{
  await reset();await page.addStyleTag({content:'.mark svg{opacity:0}'});has(await check(),'topic-icon-not-visible');
  await reset();await page.locator('svg').evaluateAll(icons=>icons.forEach(icon=>{const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.style.opacity='0';group.appendChild(icon.querySelector('path'));icon.appendChild(group);}));
  const result=await check();has(result,'topic-icon-color-missing');assert(result.topicNavigation[0].cards.every(c=>!c.hasColoredPaint));
 });
 await t.test('actual label text alignment is independent of its centered slot',async()=>{
  await reset();const args={...options,topicNavigation:[{...group,alignment:[{field:'labelText',relativeTo:'label',axis:'x',anchor:'center'}]}]};
  assert.deepEqual((await page.evaluate(inspectDetail,args)).failures,[]);
  await page.locator('.label').first().evaluate(e=>e.style.justifyContent='flex-start');has(await page.evaluate(inspectDetail,args),'topic-declared-alignment');
  // Multiple centered lines, including inline emphasis, remain valid.
  await reset();await page.locator('.label').first().evaluate(e=>{e.style.display='block';e.innerHTML='<b>Fashion</b><br>Style';});
  const multiline={...args,topicNavigation:[{...args.topicNavigation[0],expectedLabels:undefined,expectedMarkedLabels:undefined}]};
  assert.deepEqual((await page.evaluate(inspectDetail,multiline)).failures,[]);
  // Declared left-aligned text is also valid; centering is not a global rule.
  await page.addStyleTag({content:'.label{text-align:left;justify-content:flex-start}'});
  assert.deepEqual((await page.evaluate(inspectDetail,{...multiline,topicNavigation:[{...multiline.topicNavigation[0],alignment:[{field:'labelText',relativeTo:'label',axis:'x',anchor:'start'}]}]})).failures,[]);
 });
 await t.test('symbol/use color is explicitly unverified, never mislabeled gray or silently passed',async()=>{
  for(const stroke of ['#246bc3','#444']){
   await reset();await page.locator('svg').evaluateAll((icons,color)=>icons.forEach((icon,i)=>{icon.innerHTML=`<defs><symbol id="shape-${i}" viewBox="0 0 24 24"><path d="M4 4h16v16H4Z" fill="none" stroke="${color}" stroke-width="2"/></symbol></defs><use href="#shape-${i}"/>`;icon.style.stroke='none';icon.style.fill='none';}),stroke);
   const result=await check();has(result,'topic-icon-paint-unverified');assert(!result.failures.some(f=>f.rule==='topic-icon-color-missing'));
   assert(result.failures.every(f=>f.status==='not-run'));assert(result.topicNavigation[0].cards.every(c=>c.hasColoredPaint===null));
  }
 });
 await t.test('long category name overflowing its own text slot fails even without page overflow',async()=>{
  await reset();await page.locator('.label').first().evaluate(e=>{e.textContent='Music, Books, Games & Movies';e.style.width='70px';});
  has(await check(),'topic-label-outside-slot');
 });
 await t.test('selected icon displacement and marker collision are caught separately',async()=>{
  await reset();await page.locator('.mark').first().evaluate(e=>e.style.transform='translateY(6px)');has(await check(),'topic-shared-alignment');
  await reset();await page.locator('.tag').evaluate(e=>e.style.transform='translateY(-30px)');has(await check(),'topic-marker-overlap');
 });
 await t.test('a requested width capped by max-width is not valid breakpoint evidence',async()=>{
  await reset();await page.addStyleTag({content:'.topics{width:265px;max-width:260px}'});
  has(await page.evaluate(inspectDetail,{...options,topicNavigation:[{...group,requestedHostWidth:265}]}),'topic-host-width-not-reached');
 });
 await t.test('expected category identity, marker and hit-area coverage are checked',async()=>{
  await reset();await page.locator('.tag').evaluate(e=>e.remove());has(await check(),'topic-marker-coverage');
  await page.locator('.label').first().evaluate(e=>e.textContent='Wrong category');has(await check(),'topic-label-order-mismatch');
  await page.locator('a').first().evaluate(e=>e.style.height='40px');has(await check(),'topic-hit-min44');
 });
 await t.test('intentional text directory remains valid without icons or arbitrary size floors',async()=>{
  await page.setContent('<style>a{display:block;width:240px;height:48px;padding:10px;font:14px/24px Arial}.label{display:inline-block}</style><nav><a href="/topics/fashion/"><span class="label">Fashion</span></a></nav>');
  const result=await page.evaluate(inspectDetail,{requiredRoles:[],requireTopicNavigation:true,topicNavigation:[{name:'directory',host:'nav',cards:'a',label:'.label',mode:'text',expectedCount:1,expectedLabels:['Fashion']}]});
  assert.deepEqual(result.failures,[]);
 });
});

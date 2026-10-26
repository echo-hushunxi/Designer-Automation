import test from 'node:test';
import assert from 'node:assert/strict';
import {captureInventory} from '../../bin/inventory.mjs';
const {chromium}=await import(process.env.DA_PLAYWRIGHT_MODULE||'playwright-core');
if(!process.env.SITE_BROWSER_EXECUTABLE)throw Error('Set SITE_BROWSER_EXECUTABLE; missing browser is not-run');

test('actual inventory records missing selectors rather than echoing declared modules',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE,headless:true});t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:393,height:852}});await page.setContent('<header>Header</header><main data-module="campaign">Real section</main><footer hidden>Footer</footer>');
  const result=await page.evaluate(captureInventory,{project:'test',page:'home',route:'/',evidence:'review-1/inventory.json',modules:[{id:'header',selector:'header'},{id:'campaign',selector:'main'},{id:'footer',selector:'footer'},{id:'missing',selector:'.absent'},{id:'invalid',selector:'['}]});
  assert.deepEqual(result.routes[0].modules,['header','campaign']);
  assert.equal(result.observation.measured.find(m=>m.id==='footer').visibleCount,0);
  assert.equal(result.observation.measured.find(m=>m.id==='missing').count,0);
  assert(result.observation.measured.find(m=>m.id==='invalid').error);
  assert.equal(result.observation.width,393);assert.deepEqual(result.observation.markedRoles,['campaign']);
});

test('hidden child cards and families do not become observed module samples',async t=>{
  const browser=await chromium.launch({executablePath:process.env.SITE_BROWSER_EXECUTABLE,headless:true});t.after(()=>browser.close());
  const page=await browser.newPage();await page.setContent('<section data-module="more-offers"><article data-offer-id="real-visible" data-home-card="ordinary">Visible card</article><article hidden data-offer-id="missing-last" data-home-card="hidden-family">Hidden card</article></section><section hidden data-module="hidden-seasonal">Hidden module</section>');
  const result=await page.evaluate(captureInventory,{project:'test',page:'home',route:'/',evidence:'review-1/observed.json',modules:[{id:'more-offers',selector:'section[data-module=more-offers]',cardFamily:'expected-must-not-be-copied'}]});
  const card=result.routes[0].moduleCards[0];assert.equal(card.cardFamily,null);assert.deepEqual(card.rawFamilies,['ordinary']);assert.deepEqual(card.sampleIds,['real-visible']);assert.deepEqual(result.routes[0].markedRoles,['more-offers']);
});

// Shared, portable obligations. These validate evidence coverage, never aesthetics.
export const moduleVisualCriteria=['purposeAndHierarchy','shortLongContent','spaceAndAction','groupAndLastRow','mobileComposition'];
export const adaptiveVisualCriteria=['moduleBoundaries','imageFrameAndBalance','readableCapacity','responsivePacking','controlRecognizability','informationTypography'];
export const moduleCriteria=module=>[...new Set([...moduleVisualCriteria,...(module.criteria||[])])];
const validWidth=w=>Number.isInteger(w)&&w>=240&&w<=3840;
export function moduleReviewWidths(page={},module={}){
  for(const source of [page,module])for(const field of ['reviewWidths','breakpoints'])if(source[field]!==undefined&&(!Array.isArray(source[field])||source[field].some(w=>!validWidth(w))))throw Error('Invalid responsive '+field);
  const widths=[1440,393,320,...(page.reviewWidths||[]),...(module.reviewWidths||[]),...Object.keys(module.samplesByWidth||{}).map(Number)];
  for(const point of [...(page.breakpoints||[]),...(module.breakpoints||[])])widths.push(point-1,point,point+1);
  return [...new Set(widths.filter(validWidth))].sort((a,b)=>b-a);
}
export const sampleRoles=['short','long','last-row'];
export const evidenceViews=['group',...sampleRoles];
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const identity=c=>JSON.stringify([c.role,c.id]);

export function validateSampleCases(module){
  for(const field of ['reviewWidths','breakpoints'])if(module[field]!==undefined&&(!Array.isArray(module[field])||module[field].some(w=>!validWidth(w))))throw Error('Invalid module '+field+': '+module.id);
  if(module.criteria!==undefined&&(!Array.isArray(module.criteria)||new Set(module.criteria).size!==module.criteria.length||module.criteria.some(c=>!adaptiveVisualCriteria.includes(c))))throw Error('Invalid adaptive visual criteria: '+module.id);
  const cases=module.sampleCases;
  if(!Array.isArray(cases)||!cases.length||cases.some(c=>!sampleRoles.includes(c.role)||!nonempty(c.id))
    ||new Set(cases.map(identity)).size!==cases.length||sampleRoles.some(role=>!cases.some(c=>c.role===role)))
    throw Error('Module needs explicit short/long/last-row sampleCases with actual entity IDs: '+module.id);
  if(new Set(cases.map(c=>c.id)).size===1&&!nonempty(module.singleSampleReason))
    throw Error('One entity covering all sample roles needs a singleSampleReason: '+module.id);
  if(module.samplesByWidth!==undefined){
    if(!module.samplesByWidth||Array.isArray(module.samplesByWidth)||typeof module.samplesByWidth!=='object')throw Error('samplesByWidth must declare exact target widths: '+module.id);
    for(const [width,variant] of Object.entries(module.samplesByWidth)){
      if(!/^[1-9][0-9]*$/.test(width)||!validWidth(Number(width))||!variant||typeof variant!=='object'||Object.keys(variant).some(k=>!['sampleCases','singleSampleReason','expectedCount'].includes(k)))throw Error('Invalid responsive module sample declaration: '+module.id);
      validateSampleCases({...variant,id:module.id+'@'+width});
    }
  }
  return cases;
}

export function validateModuleVisualRecord(spec,entry,pixelRefs,{allowMissing=false}={}){
  if(!moduleCriteria(spec).every(key=>nonempty(entry.observations?.[key])))
    throw Error('Module visual check needs concrete observations for every criterion: '+spec.id);
  const observed=entry.observedSamples;
  const missingSamples=entry.missingSamples||[],missingViews=entry.missingViews||[];
  if((missingSamples.length||missingViews.length)&&!allowMissing)throw Error('Missing module samples/views cannot be declared as passed: '+spec.id);
  if(!Array.isArray(observed)||spec.sampleCases.some(c=>!observed.some(o=>identity(o)===identity(c))&&!(allowMissing&&missingSamples.some(s=>identity(s)===identity(c)&&nonempty(s.reason)))))
    throw Error('Module visual check omitted or substituted short/long/last-row samples: '+spec.id);
  const views=entry.evidenceViews;
  if(!Array.isArray(views)||evidenceViews.some(view=>!views.some(v=>v.view===view&&pixelRefs.includes(v.evidence))&&!(allowMissing&&missingViews.some(v=>v.view===view&&nonempty(v.reason))))
    ||views.some(v=>!evidenceViews.includes(v.view)||!pixelRefs.includes(v.evidence)))
    throw Error('Module visual check needs bound group/short/long/last-row pixel evidenceViews: '+spec.id);
}

export function reconcileModuleCards(modules,actual,{allowMissing=false}={}){
  const failures=[],cards=actual.moduleCards;
  const wanted=modules.filter(m=>!m.excluded);
  if(!Array.isArray(cards))return [{reason:'missing independently observed moduleCards inventory'}];
  const keys=cards.map(c=>JSON.stringify([c.module,c.cardFamily]));
  if(new Set(keys).size!==keys.length)failures.push({reason:'duplicate observed module/card family'});
  for(const m of wanted){
    const c=cards.find(c=>c.module===m.id&&c.cardFamily===m.cardFamily);
    if(!c){failures.push({module:m.id,reason:'missing or changed observed card family',expected:m.cardFamily});continue;}
    const missing=c.missingSamples||[];
    if(missing.length&&!allowMissing)failures.push({module:m.id,reason:'missing samples cannot be passed'});
    const expected=[...m.sampleCases,...Object.values(m.samplesByWidth||{}).flatMap(v=>v.sampleCases)];
    if(!Array.isArray(c.sampleIds)||expected.some(s=>!c.sampleIds.includes(s.id)&&!(allowMissing&&missing.some(v=>identity(v)===identity(s)&&nonempty(v.reason)))))failures.push({module:m.id,reason:'missing observed real sample IDs'});
    if(!nonempty(c.evidence))failures.push({module:m.id,reason:'missing module inventory evidence'});
  }
  for(const c of cards)if(!wanted.some(m=>m.id===c.module&&m.cardFamily===c.cardFamily))failures.push({module:c.module,reason:'undeclared observed module/card family'});
  const marked=actual.markedRoles??actual.observation?.markedRoles;
  if(!Array.isArray(marked))failures.push({reason:'missing observed markedRoles inventory; use an empty list only when no role markers exist'});
  else for(const role of marked)if(!modules.some(m=>(m.markedRole||m.id)===role))failures.push({module:role,reason:'undeclared marked role; expand task or record a scoped exclusion'});
  return failures;
}

export function validateVisualModules(contract){
  if(!contract)return null;
  if(contract.version!==1||!Array.isArray(contract.pages)||!contract.pages.length)throw Error('Visual modules contract needs version 1 and pages');
  const routes=new Set();
  for(const page of contract.pages){
    for(const field of ['reviewWidths','breakpoints'])if(page[field]!==undefined&&(!Array.isArray(page[field])||page[field].some(w=>!validWidth(w))))throw Error('Invalid page '+field);
    if(!['home','store','listing','detail'].includes(page.family)||!nonempty(page.route)||page.route.startsWith('/')||/[\\?#]/.test(page.route)||page.route.split('/').some(p=>p==='..'||p==='.')||!Array.isArray(page.modules)||!page.modules.length)
      throw Error('Visual modules need a page family, artifact-relative route and modules');
    const route=JSON.stringify([page.family,page.route]);if(routes.has(route))throw Error('Duplicate visual module route');routes.add(route);
    const ids=new Set();
    for(const m of page.modules){
      if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(m.id)||ids.has(m.id)||!nonempty(m.selector)||!nonempty(m.cardFamily))throw Error('Visual module needs unique id, selector and card family');
      ids.add(m.id);validateSampleCases(m);
    }
  }
  return structuredClone(contract);
}

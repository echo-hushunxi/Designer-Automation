// Pass directly to a real browser's evaluate. This function has no host imports.
// Selectors describe responsibilities, not a prescribed DOM or card style.
export function captureInventory({project,page,route,modules,evidence}){
  const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility==='visible'&&Number(s.opacity)!==0&&el.checkVisibility?.({checkOpacity:true,checkVisibilityCSS:true})!==false;};
  const measured=modules.filter(m=>!m.excluded).map(m=>{
    let nodes=[],error=null;try{nodes=[...document.querySelectorAll(m.selector)];}catch(e){error=e.message;}
    const live=nodes.filter(visible),entities=live.flatMap(node=>[node,...node.querySelectorAll('[data-offer-id],[data-cid],[data-store-id],[data-live-store],a[href]')]).filter(visible);
    const sampleIds=[...new Set(entities.flatMap(el=>[el.dataset.offerId,el.dataset.cid,el.dataset.storeId,el.dataset.liveStore,el.getAttribute('href')].filter(Boolean)))];
    const rawFamilies=[...new Set(live.flatMap(node=>[node,...node.querySelectorAll('[data-card-family],[data-home-card]')]).filter(visible).flatMap(el=>[el.dataset.cardFamily,el.dataset.homeCard].filter(Boolean)))];
    return {id:m.id,selector:m.selector,count:nodes.length,visibleCount:live.length,error,sampleIds,rawFamilies,
      bounds:nodes.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})};
  });
  const markedRoles=[...new Set([...document.querySelectorAll('[data-coupon-module],[data-module]')].filter(visible).map(e=>e.dataset.couponModule||e.dataset.module))];
  return {routes:[{project,page,route,modules:measured.filter(m=>m.visibleCount>0&&!m.error).map(m=>m.id),markedRoles,
    moduleCards:measured.filter(m=>m.visibleCount>0&&!m.error).map(m=>({module:m.id,cardFamily:null,rawFamilies:m.rawFamilies,sampleIds:m.sampleIds,evidence})),evidence}],
    observation:{url:location.href,width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth,measured,
      markedRoles},
    limit:'This is raw DOM inventory, not a verdict. cardFamily is intentionally null: the independent reviewer must classify actual information/action organization after viewing pixels, retain rawFamilies and this evidence, and reconcile unexpected markers and sample IDs. Never copy the expected card family as an observed result.'};
}

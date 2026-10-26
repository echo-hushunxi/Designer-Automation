// Pass this self-contained function to page.evaluate with actual role selectors.
// This reports geometry, not a visual-acceptance verdict.
export function inspectDetail(selectors){
 const requiredRoles=selectors.requiredRoles||['content','header','main','mainTitle','claimAction','logos','names','dates'];
 const visible=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none';
 const all=selector=>selector?[...document.querySelectorAll(selector)].filter(visible):[];
 const round=v=>Math.round(v*100)/100;
 const box=e=>{const r=e.getBoundingClientRect();return{x:round(r.x),y:round(r.y),w:round(r.width),h:round(r.height),right:round(r.right),bottom:round(r.bottom)}};
 const measure=e=>{const s=getComputedStyle(e),r=box(e);return{text:e.innerText?.trim()||'',tag:e.tagName.toLowerCase(),class:e.className,box:r,size:Number.parseFloat(s.fontSize),weight:s.fontWeight,lineHeight:s.lineHeight,color:s.color,background:s.backgroundColor,padding:s.padding,margin:s.margin,gap:s.gap,columns:s.gridTemplateColumns,display:s.display,overflow:s.overflow,clamp:s.getPropertyValue('-webkit-line-clamp')||s.webkitLineClamp||'none',border:s.border,borderRadius:s.borderRadius,href:e.getAttribute('href'),label:e.getAttribute('aria-label'),scrollW:e.scrollWidth,clientW:e.clientWidth,scrollH:e.scrollHeight,clientH:e.clientHeight};};
 const roles=Object.fromEntries(Object.entries(selectors).filter(([,v])=>typeof v==='string').map(([k,v])=>[k,all(v).map(measure)]));
 const failures=[];
 // Capacity exceptions are field-specific. Main/first coupons are always full text.
 const firstCoupons=all(selectors.firstCoupon);
 const protectedField=e=>all(selectors.main).some(c=>c.contains(e))||firstCoupons.some(c=>c.contains(e));
 const capacityConfig=e=>(selectors.capacityFields||[]).find(c=>c.selector&&e.matches(c.selector));
 const capacityAllowed=e=>!!capacityConfig(e)&&!protectedField(e);
 for(const config of selectors.capacityFields||[]){
  const fields=all(config.selector);
  if(!fields.length)failures.push({rule:'capacity-field-coverage',selector:config.selector});
  for(const field of fields){
   if(protectedField(field)){failures.push({rule:'first-coupon-capacity-forbidden',text:field.textContent});continue;}
   const s=getComputedStyle(field),b=box(field),lh=Number.parseFloat(s.lineHeight);
   const card=config.card&&field.closest(config.card);
   const link=field.closest('a[href]')||(card&&config.fullTextLink&&card.querySelector(config.fullTextLink));
   if(!Number.isInteger(config.maxLines)||config.maxLines<1||!Number.isFinite(lh)||b.h>config.maxLines*lh+1||b.w<=0||b.h<=0)failures.push({rule:'capacity-field-budget',value:measure(field)});
   if(!link||!link.getAttribute('href')||/^(#|javascript:)/i.test(link.getAttribute('href')))failures.push({rule:'capacity-full-detail-link',text:field.textContent});
   if(!card)failures.push({rule:'capacity-card-coverage',selector:config.card});
   else {const cb=box(card);if(b.x<cb.x-1||b.right>cb.right+1||b.y<cb.y-1||b.bottom>cb.bottom+1)failures.push({rule:'capacity-field-outside-card',value:measure(field)});}
   if((field.scrollWidth>field.clientWidth||field.scrollHeight>field.clientHeight+1)&&!['hidden','clip'].includes(s.overflow))failures.push({rule:'capacity-uncontained-text',value:measure(field)});
   for(let ancestor=field.parentElement;ancestor&&ancestor!==document.body;ancestor=ancestor.parentElement){
    const style=getComputedStyle(ancestor),ab=box(ancestor);
    if(style.display==='contents'||!ancestor.getClientRects().length)continue;
    if((['hidden','clip'].includes(style.overflowX)&&(b.x<ab.x-1||b.right>ab.right+1))||(['hidden','clip'].includes(style.overflowY)&&(b.y<ab.y-1||b.bottom>ab.bottom+1)))failures.push({rule:'capacity-field-ancestor-clipping',selector:config.selector,ancestor:ancestor.className});
   }
  }
 }
 for(const role of requiredRoles)if(!roles[role]?.length)failures.push({rule:'missing-role',role});
 const clippedText=(element,role)=>{
  if(capacityAllowed(element))return;
  const range=document.createRange();range.selectNodeContents(element);
  const rects=[...range.getClientRects()].filter(r=>r.width&&r.height),style=getComputedStyle(element);
  if(protectedField(element)&&style.webkitLineClamp&&style.webkitLineClamp!=='none')failures.push({rule:'first-coupon-clamp-forbidden',role,text:element.textContent});
  const own=element.getBoundingClientRect();
  if(element.clientWidth>0&&element.scrollWidth>element.clientWidth)failures.push({rule:'full-field-own-width-overflow',role,text:element.textContent.trim(),value:measure(element)});
  if(rects.some(r=>r.left<own.left-1||r.right>own.right+1))failures.push({rule:'full-field-own-range-overflow',role,text:element.textContent.trim(),value:measure(element)});
  if((element.scrollWidth>element.clientWidth||element.scrollHeight>element.clientHeight)&&(['hidden','clip'].includes(style.overflowX)||['hidden','clip'].includes(style.overflowY)))failures.push({rule:'full-field-own-clipping',role,text:element.textContent.trim(),value:measure(element)});
  for(let node=element;node&&node!==document.body;node=node.parentElement){
   const s=getComputedStyle(node),r=node.getBoundingClientRect();
   if(s.display==='contents'||!node.getClientRects().length)continue;
   // Range font boxes can extend 1px beyond a line box while the painted glyph fits.
   // Keep that tolerance here; scroll/client extents above still catch 1px ellipsis.
   if(rects.some(t=>(['hidden','clip'].includes(s.overflowX)&&(t.left<r.left-1||t.right>r.right+1))||(['hidden','clip'].includes(s.overflowY)&&(t.top<r.top-1||t.bottom>r.bottom+1))))failures.push({rule:'full-field-ancestor-clipping',role,text:element.textContent.trim(),ancestor:node.className});
  }
 };
 for(const name of all(selectors.names))clippedText(name,'merchant-name');
 for(const title of all(selectors.firstCouponTitle))clippedText(title,'first-coupon-title');
 for(const field of all(selectors.dates).filter(protectedField))clippedText(field,'first-coupon-date');
 for(const field of all(selectors.fullCouponFields))clippedText(field,'first-coupon-required-field');
 let storeHeading=null;
 if(selectors.storeHeading){
  const config=selectors.storeHeading,host=all(config.container)[0],name=host?.querySelector(config.name),count=host?.querySelector(config.count);
  if(config.forbiddenFeaturedCoupon&&all(config.forbiddenFeaturedCoupon).length)failures.push({rule:'store-page-featured-coupon'});
  if(!host||!visible(name)||!visible(count))failures.push({rule:'store-heading-fields',missing:[...(!host?['container']:[]),...(!visible(name)?['name']:[]),...(!visible(count)?['count']:[])]});
  else{
   const nameText=name.textContent.trim(),countText=count.textContent.trim(),number=countText.replaceAll(',','').match(/\d+/),actualCount=number?Number(number[0]):null;
   storeHeading={box:box(host),name:measure(name),count:measure(count),actualCount};
   if(Number.isFinite(config.maximumHeightPx)&&box(host).h>config.maximumHeightPx+0.1)failures.push({rule:'store-card-height',actual:box(host).h,maximum:config.maximumHeightPx});
   if(config.logo){
    const logo=host.querySelector(config.logo);storeHeading.logo=visible(logo)?measure(logo):null;
    if(!visible(logo))failures.push({rule:'store-card-logo-missing'});
    else{
     const lb=box(logo),nb=box(name),cb=box(count);
     if(Number.isFinite(config.logoPx)&&(Math.abs(lb.w-config.logoPx)>0.1||Math.abs(lb.h-config.logoPx)>0.1))failures.push({rule:'store-card-logo-size',actual:lb,expected:config.logoPx});
     if([nb,cb].some(b=>lb.x<b.right&&lb.right>b.x&&lb.y<b.bottom&&lb.bottom>b.y))failures.push({rule:'store-card-logo-text-overlap'});
    }
   }
   clippedText(name,'store-heading-name');clippedText(count,'store-heading-count');
   if(config.expectedName!==undefined&&nameText!==config.expectedName)failures.push({rule:'store-heading-name-mismatch',expected:config.expectedName,actual:nameText});
   if(actualCount===null||(Number.isInteger(config.expectedCount)&&actualCount!==config.expectedCount))failures.push({rule:'store-heading-count-mismatch',expected:config.expectedCount,actual:actualCount,text:countText});
   const nb=box(name),cb=box(count);if(nb.x<cb.right&&nb.right>cb.x&&nb.y<cb.bottom&&nb.bottom>cb.y)failures.push({rule:'store-heading-overlap'});
   const following=all(config.followingContent)[0];
   if(config.followingContent){
    if(!following)failures.push({rule:'store-heading-following-content'});
    else{const gap=round(box(following).y-box(host).bottom);storeHeading.followingGap=gap;if(gap<0||gap>(config.maximumFollowingGapPx??24))failures.push({rule:'store-heading-content-gap',gap});}
   }
  }
 }
 if(selectors.fullCouponFields&&!all(selectors.fullCouponFields).length)failures.push({rule:'first-coupon-required-field-coverage'});
 if(selectors.firstCoupon&&(!firstCoupons.length||!all(selectors.firstCouponTitle).length))failures.push({rule:'first-coupon-full-text-coverage'});
 const scope=all(selectors.content)[0]||document.body;
 const hiddenElements=[...scope.querySelectorAll('[hidden]')].filter(e=>visible(e)&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0).map(measure);
 for(const value of hiddenElements)failures.push({rule:'hidden-element-occupies-layout',value});
 const main=all(selectors.main)[0];
 if(main){
  if(!roles.mainTitle?.length)failures.push({rule:'missing-main-title'});
  if(!roles.claimAction?.length)failures.push({rule:'missing-claim-action'});
 }
 const hard=(role,predicate,rule)=>{for(const value of roles[role]||[])if(!predicate(value))failures.push({rule,role,text:value.text.slice(0,120),value});};
 hard('header',m=>Math.abs(m.box.h-50)<1,'header-50');
 if(selectors.expectedWideContentPx&&innerWidth>=1248)hard('content',m=>Math.abs(m.box.w-selectors.expectedWideContentPx)<1,'wide-content-width');
 hard('titles',m=>m.size>=16&&m.size<=20,'title-16-20');
 hard('names',m=>m.size>=16&&m.size<=20,'merchant-16-20');
 hard('dates',m=>m.size>=14,'date-min14');
 hard('auxiliary',m=>m.size>=14,'auxiliary-min14');
 hard('mainTitle',m=>m.size>=16&&m.size<=20&&m.clamp==='none'&&!['hidden','clip'].includes(m.overflow),'main-title-full');
 for(const title of all(selectors.mainTitle)){
  if(title.scrollWidth>title.clientWidth)failures.push({rule:'main-title-width-overflow',text:title.textContent,value:measure(title)});
  if(title.scrollHeight>title.clientHeight+1)failures.push({rule:'main-title-own-clipping',text:title.textContent});
  const range=document.createRange();range.selectNodeContents(title);const textBox=range.getBoundingClientRect();
  if(main){const card=main.getBoundingClientRect();if(textBox.left<card.left-1||textBox.right>card.right+1)failures.push({rule:'main-title-outside-coupon',text:title.textContent,card:box(main),textBox:{left:round(textBox.left),right:round(textBox.right)}});}
  for(let node=title;node&&node!==document.body;node=node.parentElement){
   const s=getComputedStyle(node),r=node.getBoundingClientRect();
   if((['hidden','clip'].includes(s.overflowY)&&(textBox.bottom>r.bottom+1||textBox.top<r.top-1))||(['hidden','clip'].includes(s.overflowX)&&(textBox.right>r.right+1||textBox.left<r.left-1)))failures.push({rule:'main-title-ancestor-clipping',ancestor:node.className,text:title.textContent});
  }
 }
 hard('claimAction',m=>m.box.w>=43.9&&m.box.h>=43.9&&m.size>=14,'claim-hit-and-type');
 hard('rowAction',m=>m.box.w>=43.9&&m.box.h>=43.9,'row-hit-area');
 const layoutWidth=document.documentElement.clientWidth||innerWidth;
 if(innerWidth<=600)hard('content',m=>m.box.x>=11.9&&m.box.x<=15.1&&layoutWidth-m.box.right>=11.9&&layoutWidth-m.box.right<=15.1,'phone-gutter');
 if(document.documentElement.scrollWidth>layoutWidth+1)failures.push({rule:'horizontal-overflow',width:document.documentElement.scrollWidth,viewport:layoutWidth});
 const images=all(selectors.logos).map(e=>{const s=getComputedStyle(e),r=box(e);return{...measure(e),src:e.currentSrc,loaded:e.complete&&e.naturalWidth>0,onScreen:r.bottom>0&&r.y<innerHeight,fit:s.objectFit,padding:s.padding,border:s.border,hasFallback:!!e.dataset.fallbackSrc};});
 for(const m of images){
  if(Math.abs(m.box.w-m.box.h)>1||m.fit!=='contain'||m.padding!=='0px'||(m.onScreen&&!m.loaded))failures.push({rule:'square-loaded-contained-logo',value:m});
  if(selectors.logoMinimumPx&&(m.box.w< selectors.logoMinimumPx-1||m.box.h<selectors.logoMinimumPx-1))failures.push({rule:'logo-display-minimum',value:m});
 }
 const code=roles.code?.[0],action=roles.claimAction?.[0];
 if(selectors.joinedCodeAction!==false&&code&&action&&action.box.x>code.box.x+2&&(Math.abs(code.box.y-action.box.y)>2||Math.abs(code.box.h-action.box.h)>2||Math.abs(code.box.right-action.box.x)>2))failures.push({rule:'joined-code-action-geometry',code:code.box,action:action.box});
 const intersects=(a,b)=>Math.min(a.right,b.right)>Math.max(a.x,b.x)+1&&Math.min(a.bottom,b.bottom)>Math.max(a.y,b.y)+1;
 if(code&&action&&intersects(code.box,action.box))failures.push({rule:'code-action-overlap'});
 const rowAlignment=selectors.rowActionAlignment;
 const activeRowAlignment=rowAlignment?.vertical==='center'&&(!rowAlignment.maxViewport||innerWidth<=rowAlignment.maxViewport)&&(!rowAlignment.minViewport||innerWidth>=rowAlignment.minViewport);
 if(activeRowAlignment&&!selectors.rows)failures.push({rule:'missing-row-selector'});
 if(activeRowAlignment&&!selectors.rowActionInRow)failures.push({rule:'missing-row-action-selector'});
 const rows=all(selectors.rows).map(row=>{
  const title=selectors.rowTitle&&row.querySelector(selectors.rowTitle),action=selectors.rowActionInRow&&row.querySelector(selectors.rowActionInRow),name=selectors.rowName&&row.querySelector(selectors.rowName);
  const result={...measure(row),title:title&&measure(title),action:action&&measure(action),name:name&&measure(name)};
  if(selectors.rowActionInRow&&(!action||!visible(action)))failures.push({rule:'missing-row-action',text:result.text.slice(0,120)});
  if(result.action&&visible(action)){
   const r=result.box,a=result.action.box;
   if(a.x<r.x-1||a.right>r.right+1||a.y<r.y-1||a.bottom>r.bottom+1)failures.push({rule:'row-action-outside-card',row:r,action:a,text:result.text.slice(0,120)});
   if(a.w<43.9||a.h<43.9)failures.push({rule:'row-action-hit-area',action:a});
   if(result.name&&intersects(result.name.box,a))failures.push({rule:'row-name-action-overlap',text:result.name.text});
   const config=selectors.rowActionAlignment;
   if(activeRowAlignment){
    const reference=config.reference==='logo'?(selectors.rowLogo&&row.querySelector(selectors.rowLogo)):row;
    if(!reference||!visible(reference))failures.push({rule:'missing-row-alignment-reference',reference:config.reference||'row'});
    else{const b=box(reference),delta=round(a.y+a.h/2-b.y-b.h/2);result.actionAlignment={reference:config.reference||'row',centerOffsetY:delta,tolerancePx:config.tolerancePx??2};if(Math.abs(delta)>(config.tolerancePx??2))failures.push({rule:'row-action-alignment',...result.actionAlignment,text:result.text.slice(0,120)});}
   }
  }
  if(result.title&&result.action&&intersects(result.title.box,result.action.box))failures.push({rule:'row-title-action-overlap',text:result.title.text});
  return result;
 });
 if(activeRowAlignment&&!rows.length&&selectors.expectedRowCount!==0)failures.push({rule:'missing-row-action-coverage'});
 if(Number.isInteger(selectors.expectedRowCount)&&rows.length!==selectors.expectedRowCount)failures.push({rule:'row-coverage-count',actual:rows.length,expected:selectors.expectedRowCount});
 // Optional semantic mapping for ordinary coupons. Include the painted SVG rail,
 // not just the image box: a fixed decorative width can cross an otherwise valid grid.
 const recommendationBoundaries=(selectors.recommendationBoundaries||[]).map(config=>{
  const cards=all(config.cards),measured=[];
  if(!cards.length&&config.expectedCount!==0)failures.push({rule:'recommendation-boundary-coverage',group:config.name});
  if(Number.isInteger(config.expectedCount)&&cards.length!==config.expectedCount)failures.push({rule:'recommendation-boundary-count',group:config.name,actual:cards.length,expected:config.expectedCount});
  const inside=(child,parent)=>child.x>=parent.x-1&&child.right<=parent.right+1&&child.y>=parent.y-1&&child.bottom<=parent.bottom+1;
  const glyphs=element=>{
   const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),rects=[];
   for(let node=walker.nextNode();node;node=walker.nextNode()){
    if(!node.textContent.trim()||!visible(node.parentElement))continue;
    const range=document.createRange();range.selectNodeContents(node);
    for(const r of range.getClientRects()){
     let b={x:r.left,y:r.top,right:r.right,bottom:r.bottom};
     // Range includes text beyond ellipsis/clamp. Test only the visible portion.
     for(let parent=node.parentElement;parent&&parent!==document.body;parent=parent.parentElement){
      const style=getComputedStyle(parent),p=parent.getBoundingClientRect();
      if(['hidden','clip','auto','scroll'].includes(style.overflowX)){b.x=Math.max(b.x,p.left);b.right=Math.min(b.right,p.right);}
      if(['hidden','clip','auto','scroll'].includes(style.overflowY)){b.y=Math.max(b.y,p.top);b.bottom=Math.min(b.bottom,p.bottom);}
     }
     if(b.right>b.x&&b.bottom>b.y)rects.push(b);
    }
   }
   return rects;
  };
  for(const card of cards){
   const logo=config.logo&&card.querySelector(config.logo),action=config.action&&card.querySelector(config.action),fields=config.fields?[...card.querySelectorAll(config.fields)].filter(visible):[],image=logo?.matches('img')?logo:logo?.querySelector('img');
   const wrappers=config.wrappers?[...card.querySelectorAll(config.wrappers)].filter(visible):[],rails=config.logoArea?[...card.querySelectorAll(config.logoArea)].filter(visible):[];
   if(!visible(logo)||!visible(image)||!visible(action)||!fields.length){failures.push({rule:'recommendation-boundary-missing-field',group:config.name,card:card.className});continue;}
   const cb=box(card),lb=box(logo),ib=box(image),ab=box(action),logoParts=[lb,ib,...wrappers.map(box)],railBoxes=rails.map(box);
   if(!inside(lb,cb)||!inside(ib,lb)||wrappers.some(w=>!inside(box(w),lb)))failures.push({rule:'recommendation-logo-containment',group:config.name,card:cb,logo:lb,image:ib,wrappers:wrappers.map(box)});
   if(ib.w<(config.minimumLogoPx??70)-.1||ib.h<(config.minimumLogoPx??70)-.1)failures.push({rule:'recommendation-logo-minimum',group:config.name,image:ib});
   if(!inside(ab,cb))failures.push({rule:'recommendation-action-containment',group:config.name,action:ab,card:cb});
   const fieldResults=fields.map(field=>{
    const text=field.textContent.trim(),paint=glyphs(field);
    if(paint.some(b=>logoParts.some(p=>intersects(b,p))))failures.push({rule:'recommendation-text-enters-logo',group:config.name,text});
    if(paint.some(b=>railBoxes.some(p=>intersects(b,p))))failures.push({rule:'recommendation-text-enters-logo-rail',group:config.name,text});
    if(paint.some(b=>intersects(b,ab)))failures.push({rule:'recommendation-text-enters-action',group:config.name,text});
    if(paint.some(b=>!inside(b,cb)))failures.push({rule:'recommendation-text-outside-card',group:config.name,text});
    return{text,box:box(field),visibleGlyphRects:paint};
   });
   measured.push({card:cb,logo:lb,image:ib,action:ab,wrappers:wrappers.map(box),logoAreas:railBoxes,fields:fieldResults});
  }
  return{name:config.name,count:cards.length,cards:measured};
 });
 // Fixed card capacity does not reserve an unused second title line.
 const couponTextGroups=(selectors.couponTextGroups||[]).map(config=>{
  const cards=all(config.cards),issue=(rule,detail={})=>failures.push({rule,group:config.name,...detail});
  if(!cards.length&&config.expectedCount!==0)issue('coupon-text-group-coverage');
  if(Number.isInteger(config.expectedCount)&&cards.length!==config.expectedCount)issue('coupon-text-group-count',{actual:cards.length,expected:config.expectedCount});
  const measured=cards.map(card=>{
   const title=config.title&&card.querySelector(config.title),date=config.date&&card.querySelector(config.date);
   if(!visible(title)||!visible(date)){issue('coupon-text-group-fields');return{incomplete:true};}
   const tb=box(title),db=box(date),style=getComputedStyle(title),lineHeight=parseFloat(style.lineHeight),lineTops=[];
   const walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT);
   for(let node=walker.nextNode();node;node=walker.nextNode())if(node.textContent.trim()&&visible(node.parentElement)){
    const range=document.createRange();range.selectNodeContents(node);
    for(const r of range.getClientRects())if(r.width>0&&r.height>0&&r.bottom>tb.y&&r.top<tb.bottom&&r.right>tb.x&&r.left<tb.right&&!lineTops.some(top=>Math.abs(top-r.top)<2))lineTops.push(r.top);
   }
   const value={title:title.textContent.trim(),titleBox:tb,dateBox:db,lineHeight,visibleLines:lineTops.length,unusedTitleHeight:round(tb.h-lineTops.length*lineHeight),titleDateGap:round(db.y-tb.bottom)};
   if(!Number.isFinite(lineHeight)||!lineTops.length)issue('coupon-text-group-line-mapping',{title:value.title});
   else if(value.unusedTitleHeight>(config.unusedHeightTolerancePx??2))issue('coupon-title-unused-line-space',value);
   if(value.titleDateGap<-.5||value.titleDateGap>(config.maximumTitleDateGapPx??12))issue('coupon-title-date-gap',value);
   return value;
  });
  return{name:config.name,count:cards.length,cards:measured};
 });
 // Category navigation uses its own declared budget, never the merchant-logo minimum.
 // Supply expected labels/counts from the frozen data, not from the DOM being tested.
 if(selectors.requireTopicNavigation&&!(selectors.topicNavigation||[]).length)failures.push({rule:'topic-missing-mapping'});
 const topicNavigation=(selectors.topicNavigation||[]).map(config=>{
  const host=all(config.host)[0],cards=host&&config.cards?[...host.querySelectorAll(config.cards)].filter(visible):[];
  const issue=(rule,extra={})=>failures.push({rule,group:config.name,...extra});
  const inside=(a,b)=>a.x>=b.x-1&&a.right<=b.right+1&&a.y>=b.y-1&&a.bottom<=b.bottom+1;
  const textRects=element=>{
   const rects=[],walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
   for(let node=walker.nextNode();node;node=walker.nextNode()){
    if(!node.textContent.trim()||!visible(node.parentElement))continue;
    const range=document.createRange();range.selectNodeContents(node);
    for(const r of range.getClientRects())if(r.width&&r.height)rects.push({x:r.left,y:r.top,w:r.width,h:r.height,right:r.right,bottom:r.bottom});
   }
   return rects;
  };
  const opacityVisible=element=>{
   for(let e=element;e;e=e.parentElement){const s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse'||Number(s.opacity)===0)return false;}
   return true;
  };
  // Canvas resolves CSS color syntax (including oklch) to sRGB. Inspect actual SVG
  // paint nodes, so coloring a surrounding empty box cannot satisfy this check.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const chromatic=color=>{
   if(!ctx||!color||color==='none'||!CSS.supports('color',color))return false;
   ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);
   const [r,g,b,a]=ctx.getImageData(0,0,1,1).data;
   return a>0&&Math.max(r,g,b)-Math.min(r,g,b)>=12;
  };
  if(!host)issue('topic-host-missing');
  if(!Number.isInteger(config.expectedCount)||config.expectedCount<0)issue('topic-expected-count-missing');
  else if(cards.length!==config.expectedCount)issue('topic-count-mismatch',{expected:config.expectedCount,actual:cards.length});
  if(!['svg','text'].includes(config.mode))issue('topic-mode-missing');
  if(!config.label)issue('topic-label-mapping-missing');
  if(config.mode==='svg'&&(!config.icon||!config.iconFrame||!Number.isFinite(config.iconMinPx)||config.iconMinPx<=0||!Number.isFinite(config.iconMaxPx)||config.iconMaxPx<config.iconMinPx))issue('topic-icon-budget-missing');
  if(host&&Number.isFinite(config.requestedHostWidth)&&Math.abs(box(host).w-config.requestedHostWidth)>.5)issue('topic-host-width-not-reached',{requested:config.requestedHostWidth,actual:box(host).w});
  const measured=cards.map(card=>{
   const child=selector=>selector&&card.querySelector(selector),label=child(config.label),frame=child(config.iconFrame),icon=child(config.icon);
   const markerElements=config.markers?[...card.querySelectorAll(config.markers)].filter(visible):[];
   const cb=box(card),fields={card:cb},labelText=label?.textContent.trim();
   if(!visible(label)){issue('topic-label-missing');return{...fields,incomplete:true};}
   fields.label=box(label);fields.text=labelText;
   clippedText(label,'topic-label');
   const glyphs=textRects(label);fields.glyphs=glyphs;
   // Merge same-line text fragments (including inline emphasis) before comparing
   // visible text alignment. A centered wrapper says nothing about its glyphs.
   const lines=[];
   for(const r of glyphs){const line=lines.find(l=>Math.abs(l.y-r.y)<1&&Math.abs(l.bottom-r.bottom)<1);if(line){line.x=Math.min(line.x,r.x);line.right=Math.max(line.right,r.right);line.w=line.right-line.x;}else lines.push({...r});}
   fields.labelLines=lines;
   if(lines.length){const x=Math.min(...lines.map(r=>r.x)),y=Math.min(...lines.map(r=>r.y)),right=Math.max(...lines.map(r=>r.right)),bottom=Math.max(...lines.map(r=>r.bottom));fields.labelText={x,y,right,bottom,w:right-x,h:bottom-y};}
   if(!glyphs.length)issue('topic-label-empty');
   if(parseFloat(getComputedStyle(label).fontSize)<14)issue('topic-label-min14',{text:labelText});
   if(glyphs.some(r=>!inside(r,fields.label)||!inside(r,cb)))issue('topic-label-outside-slot',{text:labelText});
   const action=config.action?child(config.action):card;
   if(!visible(action)||!action.matches('a[href]')||/^(?:#|javascript:|$)/i.test(action.getAttribute('href')||''))issue('topic-link-missing',{text:labelText});
   else if(box(action).w<43.9||box(action).h<43.9)issue('topic-hit-min44',{text:labelText});
   fields.href=action?.getAttribute('href');
   if(config.mode==='svg'){
    if(!visible(frame)||!visible(icon)||icon.tagName.toLowerCase()!=='svg')issue('topic-icon-missing',{text:labelText});
    else{
     fields.iconFrame=box(frame);fields.icon=box(icon);
     const style=getComputedStyle(icon);
     fields.iconStyle={width:style.width,height:style.height,minWidth:style.minWidth,minHeight:style.minHeight,maxWidth:style.maxWidth,maxHeight:style.maxHeight};
     if(!inside(fields.icon,fields.iconFrame)||!inside(fields.iconFrame,cb))issue('topic-icon-containment',{text:labelText});
     if(fields.icon.w<config.iconMinPx-.5||fields.icon.h<config.iconMinPx-.5||fields.icon.w>config.iconMaxPx+.5||fields.icon.h>config.iconMaxPx+.5)issue('topic-icon-budget',{text:labelText,actual:fields.icon});
     if(glyphs.some(r=>intersects(r,fields.iconFrame)))issue('topic-label-icon-overlap',{text:labelText});
     const referenced=[...icon.querySelectorAll('use')].some(e=>visible(e)&&opacityVisible(e));
     const paint=[...icon.querySelectorAll('path,circle,rect,ellipse,line,polyline,polygon,text')].filter(e=>visible(e)&&!e.closest('defs,clipPath,mask,symbol')&&opacityVisible(e));
     fields.iconPaint=paint.map(e=>{const s=getComputedStyle(e);return{fill:s.fill,stroke:s.stroke,fillOpacity:s.fillOpacity,strokeOpacity:s.strokeOpacity,strokeWidth:s.strokeWidth};});
     fields.hasColoredPaint=referenced?null:fields.iconPaint.some(s=>(parseFloat(s.fillOpacity)>0&&chromatic(s.fill))||(parseFloat(s.strokeOpacity)>0&&parseFloat(s.strokeWidth)>0&&chromatic(s.stroke)));
     fields.paintStatus=referenced?'unverified-reference':'measured-direct-paint';
     if(!opacityVisible(icon))issue('topic-icon-not-visible',{text:labelText});
     // Referenced paint has a different inheritance tree. Never call it colorless
     // (or passed) based on the <use> element's own fill/stroke.
     if(referenced)issue('topic-icon-paint-unverified',{text:labelText,status:'not-run',reason:'SVG use/symbol paint requires equivalent rendered-pixel evidence'});
     else if(config.requireColor!==false&&!fields.hasColoredPaint)issue('topic-icon-color-missing',{text:labelText});
    }
   }
   fields.markers=markerElements.map(e=>({text:e.textContent.trim(),box:box(e),glyphs:textRects(e)}));
   for(const marker of fields.markers){
    if(!inside(marker.box,cb)||marker.glyphs.some(r=>!inside(r,marker.box)))issue('topic-marker-outside-slot',{text:labelText});
    if((fields.iconFrame&&intersects(marker.box,fields.iconFrame))||glyphs.some(r=>intersects(r,marker.box)))issue('topic-marker-overlap',{text:labelText});
   }
   for(const alignment of config.alignment||[]){
    const b=fields[alignment.field],reference=alignment.relativeTo?fields[alignment.relativeTo]:cb;
    if(!b||!reference||!['x','y'].includes(alignment.axis)||!['start','center','end'].includes(alignment.anchor)){issue('topic-alignment-mapping');continue;}
    const axis=alignment.axis,size=axis==='x'?'w':'h',factor={start:0,center:.5,end:1}[alignment.anchor];
    for(const target of alignment.field==='labelText'&&axis==='x'?lines:[b]){
     const delta=target[axis]+target[size]*factor-reference[axis]-reference[size]*factor-(alignment.offsetPx||0);
     if(Math.abs(delta)>(alignment.tolerancePx??2))issue('topic-declared-alignment',{text:labelText,field:alignment.field,delta:round(delta)});
    }
   }
   return fields;
  });
  for(const alignment of config.sharedAlignment||[]){
   const offsets=measured.map(m=>{const b=m[alignment.field];if(!b||!['x','y'].includes(alignment.axis))return null;return b[alignment.axis]-m.card[alignment.axis];});
   if(offsets.some(v=>v===null))issue('topic-alignment-mapping');
   else if(offsets.length&&Math.max(...offsets)-Math.min(...offsets)>(alignment.tolerancePx??2))issue('topic-shared-alignment',{field:alignment.field,offsets});
  }
  if(config.expectedLabels&&JSON.stringify(measured.map(m=>m.text))!==JSON.stringify(config.expectedLabels))issue('topic-label-order-mismatch');
  const marked=measured.filter(m=>m.markers?.length).map(m=>m.text);
  if(config.expectedMarkedLabels&&JSON.stringify(marked)!==JSON.stringify(config.expectedMarkedLabels))issue('topic-marker-coverage');
  for(let i=0;i<measured.length;i++)for(let j=i+1;j<measured.length;j++)if(intersects(measured[i].card,measured[j].card))issue('topic-card-overlap',{items:[i,j]});
  return{name:config.name,mode:config.mode,host:host&&box(host),count:cards.length,cards:measured};
 });
 const merchantNameSelector=selectors.merchantNameInCard||'.hc-merchant-name,.as-merchant-name,.cv-merchant-name,.op-merchant-name,.mv-merchant-name,.merchant-name,.store-tile-name,.sidebar-brand-copy>span:first-child';
 const inspectMerchant=(card,group={})=>{
  const logo=card.querySelector(group.logo||selectors.merchantLogoInCard||'img[data-api-logo]'),name=card.querySelector(group.nameSelector||merchantNameSelector),count=group.countSelector&&card.querySelector(group.countSelector);
  if(!logo||!name||(group.countSelector&&!count)){failures.push({rule:'missing-merchant-field',group:group.name,card:card.className,missing:[...(!logo?['logo']:[]),...(!name?['name']:[]),...(group.countSelector&&!count?['count']:[])]});return{card:box(card),incomplete:true};}
  clippedText(name,'merchant-card-name');
  const ns=getComputedStyle(name);if(Number.parseFloat(ns.fontSize)<16||Number.parseFloat(ns.fontSize)>20)failures.push({rule:'merchant-card-name-16-20',text:name.textContent,value:measure(name)});
  if(count){clippedText(count,'merchant-card-count');if(Number.parseFloat(getComputedStyle(count).fontSize)<14)failures.push({rule:'merchant-card-count-min14',text:count.textContent,value:measure(count)});}
  const cb=box(card),lb=box(logo),nb=box(name),range=document.createRange();range.selectNodeContents(name);const text=range.getBoundingClientRect();
  if(intersects(lb,nb))failures.push({rule:'merchant-logo-name-overlap',text:name.textContent,card:cb,logo:lb,name:nb});
  if(!capacityAllowed(name)&&(text.left<cb.x-1||text.right>cb.right+1||text.top<cb.y-1||text.bottom>cb.bottom+1))failures.push({rule:'merchant-name-outside-card',text:name.textContent,card:cb,name:nb});
  if(lb.x<cb.x-1||lb.right>cb.right+1||lb.y<cb.y-1||lb.bottom>cb.bottom+1)failures.push({rule:'merchant-logo-outside-card',text:name.textContent,card:cb,logo:lb});
  if(count){const b=box(count);if(intersects(lb,b)||intersects(nb,b))failures.push({rule:'merchant-count-overlap',text:name.textContent});}
  let compactText=null;
  if(group.compactText){
   const config=group.compactText,issue=(rule,detail={})=>failures.push({rule,group:group.name,text:name.textContent,...detail});
   if(!count||!visible(count))issue('merchant-compact-count-missing');
   else{
    const lineHeight=parseFloat(ns.lineHeight),tops=[],walker=document.createTreeWalker(name,NodeFilter.SHOW_TEXT);
    for(let node=walker.nextNode();node;node=walker.nextNode())if(node.textContent.trim()&&visible(node.parentElement)){
     const r=document.createRange();r.selectNodeContents(node);
     for(const rect of r.getClientRects())if(rect.width>0&&rect.height>0&&rect.top<nb.bottom&&rect.bottom>nb.y&&!tops.some(top=>Math.abs(top-rect.top)<2))tops.push(rect.top);
    }
    const gap=round(box(count).y-nb.bottom),unusedHeight=round(nb.h-tops.length*lineHeight);
    compactText={visibleNameLines:tops.length,nameCountGap:gap,unusedNameHeight:unusedHeight};
    if(!Number.isFinite(lineHeight)||!tops.length)issue('merchant-name-line-mapping');
    else if(unusedHeight>(config.unusedHeightTolerancePx??2))issue('merchant-name-unused-line-space',compactText);
    if(gap<-.1||gap>(config.maximumNameCountGapPx??8))issue('merchant-name-count-gap',compactText);
    if(config.centerWith){
     const copy=config.group&&card.querySelector(config.group),reference=config.centerWith==='card'?card:config.centerWith==='logo'?logo:card.querySelector(config.centerWith);
     if(!visible(copy)||!visible(reference))issue('merchant-center-mapping');
     else{const a=box(copy),b=box(reference),delta=round(a.y+a.h/2-b.y-b.h/2);compactText.centerOffsetY=delta;if(Math.abs(delta)>(config.tolerancePx??2))issue('merchant-text-group-center',{centerOffsetY:delta});}
    }
   }
  }
  const alignment=[],alignmentFields=[];
  for(const config of group.alignment||[]){
   const issue=(rule,detail={})=>failures.push({rule,group:group.name,text:name.textContent,...detail});
   const reference=config.reference==='card'?card:!config.reference||config.reference==='logo'?logo:card.querySelector(config.reference);
   const axis=config.axis==='center-x'?'x':config.axis==='center-y'?'y':null,tolerance=config.tolerancePx??2,offset=config.offsetPx??0;
   if(!axis||!visible(reference)||!Array.isArray(config.fields)||!config.fields.length||!Number.isFinite(tolerance)||tolerance<0||!Number.isFinite(offset)){issue('merchant-alignment-mapping');continue;}
   const rb=box(reference),size=axis==='x'?'w':'h',referenceCenter=rb[axis]+rb[size]/2;
   for(const field of config.fields){
    const elements=field.selector?[...card.querySelectorAll(field.selector)].filter(visible):[];
    if(!elements.length){issue('merchant-alignment-field-coverage',{selector:field.selector});continue;}
    for(const element of elements){
     alignmentFields.push({element,axis:config.axis,text:field.text===true});
     const shapes=[{kind:'box',...box(element)}];
     if(field.text){
      const rects=[],walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
      for(let node=walker.nextNode();node;node=walker.nextNode())if(node.textContent.trim()&&visible(node.parentElement)){
       const range=document.createRange();range.selectNodeContents(node);
       for(const rect of range.getClientRects()){
        let x=rect.left,y=rect.top,right=rect.right,bottom=rect.bottom;
        for(let parent=node.parentElement;parent&&parent!==document.body;parent=parent.parentElement){
         const style=getComputedStyle(parent),b=parent.getBoundingClientRect();
         if(['hidden','clip','auto','scroll'].includes(style.overflowX)){x=Math.max(x,b.left);right=Math.min(right,b.right);}
         if(['hidden','clip','auto','scroll'].includes(style.overflowY)){y=Math.max(y,b.top);bottom=Math.min(bottom,b.bottom);}
        }
        if(right>x&&bottom>y)rects.push({x,y,right,bottom});
       }
      }
      // Inline number/unit runs can use different fonts on the same visual line.
      // Merge overlapping line bands; a stacked count retains two separate lines.
      const lines=[];
      for(const rect of rects.sort((a,b)=>a.y-b.y||a.x-b.x)){
       const line=axis==='y'?lines[0]:lines.find(b=>Math.min(b.bottom,rect.bottom)-Math.max(b.y,rect.y)>.5);
       if(line){line.x=Math.min(line.x,rect.x);line.y=Math.min(line.y,rect.y);line.right=Math.max(line.right,rect.right);line.bottom=Math.max(line.bottom,rect.bottom);}
       else lines.push({...rect});
      }
      if(!lines.length)issue('merchant-alignment-text-coverage',{selector:field.selector});
      shapes.push(...lines.map(b=>({kind:'text-line',...b,w:b.right-b.x,h:b.bottom-b.y})));
     }
     for(const shape of shapes){
      const delta=round(shape[axis]+shape[size]/2-referenceCenter-offset),value={selector:field.selector,axis:config.axis,reference:config.reference||'logo',kind:shape.kind,delta,tolerancePx:tolerance};
      alignment.push(value);
      if(Math.abs(delta)>tolerance)issue('merchant-declared-alignment',value);
     }
    }
   }
  }
  if(selectors.requireMerchantAlignment&&group.alignment?.length)for(const [field,element] of [['name',name],['count',count]])if(element){
   const mapped=alignmentFields.filter(value=>value.element===element||value.element.contains(element));
   if(!mapped.length)failures.push({rule:'merchant-alignment-role-mapping',group:group.name,field,text:name.textContent});
   else if(!mapped.some(value=>value.axis==='center-y'||value.text))failures.push({rule:'merchant-alignment-text-mapping',group:group.name,field,text:name.textContent});
  }
  return{card:cb,logo:lb,name:nb,text:name.textContent,...(count?{count:measure(count)}:{}),...(compactText?{compactText}:{}),...(group.alignment?{alignment}:{})};
 };
 const merchantCards=all(selectors.merchantCards||'main [data-detail-recommendations] a[href*="/stores/"]:not([href$="/stores/index.html"]):not([href$="/stores/"]),main [data-side-merchant],main [data-coupon-module="recommended-stores"] a[href*="/stores/"]:not([href$="/stores/index.html"]):not([href$="/stores/"]),main .sidebar-stores a[data-merchant-id]').map(card=>inspectMerchant(card));
 const merchantGroups=(selectors.merchantGroups||[]).map(group=>{
  const cards=all(group.cards),measured=cards.map(card=>inspectMerchant(card,group));
  if(selectors.requireMerchantAlignment&&cards.length&&!group.alignment?.length)failures.push({rule:'merchant-alignment-group-mapping',group:group.name});
  if(selectors.requireMerchantAlignment&&!cards.length&&group.expectedCount!==0)failures.push({rule:'merchant-alignment-group-coverage',group:group.name});
  if((group.required!==false&&group.expectedCount!==0&&!cards.length)||(Number.isInteger(group.expectedCount)&&cards.length!==group.expectedCount)||(Number.isInteger(group.minimumCount)&&cards.length<group.minimumCount))failures.push({rule:'merchant-group-coverage',group:group.name,actual:cards.length,expected:group.expectedCount,minimum:group.minimumCount});
  let spacing=null;
  if(group.spacing){
   const config=group.spacing,issue=(rule,detail={})=>failures.push({rule,group:group.name,...detail});
   const gap=config.minimumGapPx,inset=config.minimumInsetPx;
   if(!config.container||!Number.isFinite(gap)||gap<=0||!Number.isFinite(inset)||inset<0)issue('merchant-spacing-mapping');
   else{
    const hosts=cards.map(card=>card.closest(config.container)),gaps=[],insets=[];
    if(hosts.some(host=>!host))issue('merchant-spacing-container-coverage');
    // Compare projected rows/columns, not DOM neighbours: grid siblings can share a row.
    for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){
     if(!hosts[i]||hosts[i]!==hosts[j])continue;
     const a=box(cards[i]),b=box(cards[j]);
     const overlapX=Math.min(a.right,b.right)-Math.max(a.x,b.x),overlapY=Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y);
     for(const [axis,overlap,separation] of [['y',overlapX,Math.max(a.y,b.y)-Math.min(a.bottom,b.bottom)],['x',overlapY,Math.max(a.x,b.x)-Math.min(a.right,b.right)]])if(overlap>1){
      const value={items:[i,j],axis,gap:round(separation)};gaps.push(value);
      if(separation<gap-.1)issue('merchant-card-gap',{...value,minimum:gap});
     }
    }
    for(const host of new Set(hosts.filter(Boolean))){
     const hb=box(host),style=getComputedStyle(host),fields=[...cards.filter(card=>host.contains(card)),...(config.insetFields?[...host.querySelectorAll(config.insetFields)].filter(visible):[])];
     if(config.insetFields&&!host.querySelector(config.insetFields))issue('merchant-spacing-inset-field-coverage');
     for(const field of new Set(fields)){
      const fb=box(field),value={text:field.textContent.trim(),left:round(fb.x-hb.x-parseFloat(style.borderLeftWidth)),right:round(hb.right-fb.right-parseFloat(style.borderRightWidth)),top:round(fb.y-hb.y-parseFloat(style.borderTopWidth)),bottom:round(hb.bottom-fb.bottom-parseFloat(style.borderBottomWidth))};insets.push(value);
      if(['left','right','top','bottom'].some(side=>value[side]<inset-.1))issue('merchant-panel-inset',{...value,minimum:inset});
     }
    }
    spacing={minimumGapPx:gap,minimumInsetPx:inset,gaps,insets};
   }
  }
  return{name:group.name,count:cards.length,cards:measured,...(spacing?{spacing}:{})};
 });
 if(selectors.requireMerchantAlignment&&!selectors.merchantGroups?.length)failures.push({rule:'merchant-alignment-group-coverage'});
 if((selectors.requireMerchantCards||scope.querySelector('[data-detail-recommendations],[data-coupon-module="recommended-stores"]'))&&!merchantCards.length)failures.push({rule:'missing-merchant-cards'});
 let listState=null;
 if(selectors.listState){
  const state=selectors.listState,cards=all(state.cards),ids=cards.map(card=>card.getAttribute(state.idAttribute||'data-offer-id'));
  if(ids.some(id=>!id)||new Set(ids).size!==ids.length)failures.push({rule:'list-state-id-coverage',ids});
  if(Array.isArray(state.expectedVisibleIds)&&JSON.stringify(ids)!==JSON.stringify(state.expectedVisibleIds))failures.push({rule:'list-visible-id-mismatch',actual:ids,expected:state.expectedVisibleIds});
  const counter=state.counter&&all(state.counter)[0]?.textContent.trim().replace(/\s+/g,' ');
  if(typeof state.expectedCounterText==='string'&&counter!==state.expectedCounterText)failures.push({rule:'list-counter-mismatch',actual:counter,expected:state.expectedCounterText});
  listState={name:state.name,visibleIds:ids,visibleCount:cards.length,counter};
 }
 const inspectColumns=config=>{
  const side=all(config.sidebar||'main aside')[0],primary=config.primary?document.querySelector(config.primary):side?.previousElementSibling;
  let result=null;
  const children=primary?[...primary.children].filter(visible):[],sideChildren=side?[...side.children].filter(visible):[];
  if(!side||!children.length||!sideChildren.length)failures.push({rule:'missing-column-balance-role',group:config.name});
  else{
   const sb=box(side),first=box(children[0]),tail=config.sharedTail&&document.querySelector(config.sharedTail),tb=tail&&box(tail);
   const isTwoColumn=first.right<=sb.x+2,spans=isTwoColumn&&!!tb&&tb.w>0&&tb.x<=first.x+1&&tb.right>=sb.right-1;
   if(config.fixedPrimaryColumn&&isTwoColumn&&children.some(e=>box(e).right>sb.x+1))failures.push({rule:'primary-content-crosses-sidebar',group:config.name});
   const primaryFlow=children.filter(e=>config.fixedPrimaryColumn||!spans||e!==tail),primaryEnd=Math.max(...primaryFlow.map(e=>box(e).bottom)),sidebarEnd=Math.max(...sideChildren.map(e=>box(e).bottom));
   const threshold=config.reviewThresholdPx??500,gap=round(Math.abs(primaryEnd-sidebarEnd));
   result={name:config.name,isTwoColumn,primaryEnd:round(primaryEnd),sidebarEnd:round(sidebarEnd),gap,sharedTailSpansColumns:spans,reviewThresholdPx:threshold};
   if(isTwoColumn&&gap>threshold)failures.push({rule:'column-end-gap-needs-review',...result});
  }
  return result;
 };
 const columnBalance=selectors.columnBalance?inspectColumns(selectors.columnBalance):null;
 const columnBalances=(selectors.columnBalances||[]).map(inspectColumns);
 let unavailableState=null;
 if(selectors.unavailableState){
  const config=selectors.unavailableState,panel=all(config.container)[0],message=panel?.querySelector(config.message||'h1'),action=panel?.querySelector(config.action||'a[href]');
  if(!panel||!message?.textContent.trim())failures.push({rule:'missing-unavailable-state'});
  if(!action||!visible(action))failures.push({rule:'missing-unavailable-store-action'});
  if(main||all(config.forbiddenClaim).length)failures.push({rule:'unavailable-has-main-claim'});
  const normalize=p=>p?.split(/[?#]/)[0].replace(/index\.html$/,'').replace(/\/$/,'');
  const expected=normalize(config.expectedStorePath),href=normalize(action?.getAttribute('href'));
  if(!expected)failures.push({rule:'missing-unavailable-expected-destination'});
  else if(!href?.endsWith(expected))failures.push({rule:'unavailable-store-destination',expectedStorePath:config.expectedStorePath,actualHref:action?.getAttribute('href')});
  if(action&&visible(action)){const a=measure(action);if(a.box.w<43.9||a.box.h<43.9||a.size<14)failures.push({rule:'unavailable-action-hit-and-type',value:a});}
  unavailableState={message:message?.textContent.trim(),action:action&&measure(action),expectedStorePath:config.expectedStorePath};
 }
 return{kind:'actual-browser-role-measurements',viewport:{width:innerWidth,height:innerHeight,contentWidth:document.documentElement.clientWidth},url:location.href,roles,storeHeading,images,rows,recommendationBoundaries,couponTextGroups,topicNavigation,merchantCards,merchantGroups,hiddenElements,listState,columnBalance,columnBalances,unavailableState,failures,mainHeight:roles.main?.[0]?.box.h,spacing:{betweenRows:rows.slice(1).map((r,i)=>round(r.box.y-rows[i].box.bottom)),sections:roles.sections?.map(m=>m.box)},limits:'Numbers are necessary evidence; actual pixels, states, clipboard and independent review remain separate.'};
}

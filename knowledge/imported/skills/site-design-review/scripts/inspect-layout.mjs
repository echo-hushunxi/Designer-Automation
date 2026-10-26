// Read-only browser measurements. Internal clipping can exist while the document
// itself fits the viewport. Findings are review candidates, not aesthetic verdicts.
export function inspectLayout(document, getStyle, options = {}) {
  const view=document.defaultView, samples=[],limit=80;
  const walker=document.createTreeWalker(document.body,4);
  let node,examined=0,candidateCount=0;
  const selector=element=>element.id?'#'+CSS.escape(element.id):element.tagName.toLowerCase()+[...element.classList].slice(0,3).map(name=>'.'+CSS.escape(name)).join('');
  while((node=walker.nextNode())) {
    const element=node.parentElement;
    if(!node.textContent.trim()||!element||element.closest('script,style,svg,[hidden]')||!element.getClientRects().length)continue;
    const style=getStyle(element);
    if(style.visibility!=='visible'||Number(style.opacity)===0)continue;
    examined++;
    const range=document.createRange();range.selectNodeContents(node);
    const rects=[...range.getClientRects()].filter(rect=>rect.width>0&&rect.height>0);
    const reasons=new Set();
    let clipper=null;
    for(let parent=element;parent&&parent!==document.body;parent=parent.parentElement) {
      const pstyle=getStyle(parent),bounds=parent.getBoundingClientRect();
      if(['hidden','clip'].includes(pstyle.overflowX)&&rects.some(rect=>rect.left<bounds.left-1||rect.right>bounds.right+1)) {reasons.add('clipped-horizontal-text');clipper=selector(parent);}
      if(['hidden','clip'].includes(pstyle.overflowY)&&rects.some(rect=>rect.top<bounds.top-1||rect.bottom>bounds.bottom+1)) {reasons.add('clipped-vertical-text');clipper=selector(parent);}
    }
    // Hit samples catch text hidden behind a sibling CTA. Offscreen text and
    // intentionally pointer-transparent content remain outside this probe.
    if(style.pointerEvents!=='none') for(const rect of rects.slice(0,3)) {
      const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
      if(x<0||y<0||x>=view.innerWidth||y>=view.innerHeight)continue;
      const hit=document.elementFromPoint(x,y);
      if(hit&&!element.contains(hit)&&!hit.contains(element))reasons.add('text-covered-at-sample');
    }
    if(reasons.size) {
      candidateCount++;
      if(samples.length<limit)samples.push({selector:selector(element),text:node.textContent.trim().slice(0,120),reasons:[...reasons],clipper});
    }
  }

  const viewportWidth=document.documentElement.clientWidth, measurements=[], failures=[], stabilitySnapshots={}, pending=[];
  const visible=e=>{const r=e.getBoundingClientRect(),s=getStyle(e);return r.width>0&&r.height>0&&s.visibility==='visible'&&Number(s.opacity)!==0&&e.checkVisibility?.({checkOpacity:true,checkVisibilityCSS:true})!==false;};
  const fail=(id,reason,detail={})=>failures.push({id,reason,...detail});
  const nodes=(query,id,root=document,optional=false)=>{
    if(typeof query!=='string'||!query.trim()){fail(id,'missing-selector');return [];}
    let all;try{all=[...root.querySelectorAll(query)];}catch{fail(id,'invalid-selector',{selector:query});return [];}
    const shown=all.filter(visible);
    if(!shown.length&&!optional)fail(id,all.length?'hidden-required-elements':'missing-required-elements',{selector:query});
    return shown;
  };
  const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  const glyphRects=e=>{
    const walk=document.createTreeWalker(e,4),out=[];let n;
    while((n=walk.nextNode())){
      if(!n.textContent.trim()||!visible(n.parentElement))continue;
      const range=document.createRange();range.selectNodeContents(n);
      for(const r of range.getClientRects()){
        let a={left:r.left,right:r.right,top:r.top,bottom:r.bottom};
        for(let p=n.parentElement;p;p=p.parentElement){
          const s=getStyle(p),b=box(p);
          if(['hidden','clip','auto','scroll'].includes(s.overflowX)){a.left=Math.max(a.left,b.left);a.right=Math.min(a.right,b.right);}
          if(['hidden','clip','auto','scroll'].includes(s.overflowY)){a.top=Math.max(a.top,b.top);a.bottom=Math.min(a.bottom,b.bottom);}
        }
        if(a.right>a.left&&a.bottom>a.top)out.push(a);
      }
    }
    return out;
  };
  const checkValue=(id,metric,value,range)=>{
    measurements.push({id,metric,value});
    if(!Array.isArray(range)||range.length!==2||!range.every(Number.isFinite)||range[0]>range[1]){fail(id,'invalid-budget',{metric});return;}
    const tolerance=Number.isFinite(options.tolerance)?Math.max(0,Math.min(options.tolerance,2)):0.75;
    if(value<range[0]-tolerance||value>range[1]+tolerance)fail(id,'outside-budget',{metric,value,expected:range});
  };
  const readableCharacters=e=>{
    const bounds=box(e),s=getStyle(e),end=bounds.right-(e.scrollWidth>e.clientWidth+1?parseFloat(s.fontSize)||0:0);
    const walk=document.createTreeWalker(e,4);let n,total=0,shown=0;
    while((n=walk.nextNode())){let offset=0;for(const character of n.textContent){const next=offset+character.length;if(character.trim()){
      total++;const range=document.createRange();range.setStart(n,offset);range.setEnd(n,next);const r=range.getBoundingClientRect();
      if(r.width>0&&r.left>=bounds.left-0.75&&r.right<=end+0.75&&Math.min(r.bottom,bounds.bottom)-Math.max(r.top,bounds.top)>=Math.min(r.height,bounds.height)*0.8)shown++;
    }offset=next;}}
    return {total,shown};
  };
  const checks=Array.isArray(options.checks)?options.checks:[];
  let applicable=0;
  for(const c of checks){
    if(view.innerWidth<(c.minViewport??0)||view.innerWidth>(c.maxViewport??Infinity))continue;
    applicable++;
    const id=c.id||'unnamed-check', selected=nodes(c.selector,id,document,c.optional===true||c.type==='rail-controls');
    if(c.expectedCount!==undefined&&selected.length!==c.expectedCount)fail(id,'count-mismatch',{expected:c.expectedCount,actual:selected.length});
    if(c.type==='summary'){
      const heights=[];
      for(const card of selected){
        heights.push(box(card).height);
        const titles=nodes(c.title,id,card);
        if(titles.length!==1)fail(id,'summary-title-count',{actual:titles.length});
        for(const title of titles){
          const s=getStyle(title),r=box(title),lh=parseFloat(s.lineHeight),parent=box(card);
          if(s.whiteSpace!=='nowrap'||s.textOverflow!=='ellipsis'||!['hidden','clip'].includes(s.overflowX))fail(id,'summary-needs-single-line-ellipsis');
          if(!Number.isFinite(lh)||Math.abs(r.height-lh)>0.75)fail(id,'summary-reserved-or-wrapped-line',{height:r.height,lineHeight:lh});
          if(r.left<parent.left-0.75||r.right>parent.right+0.75||r.top<parent.top-0.75||r.bottom>parent.bottom+0.75)fail(id,'summary-title-outside-card');
          if(c.minVisibleCharacters!==undefined){
            if(!Number.isInteger(c.minVisibleCharacters)||c.minVisibleCharacters<1)fail(id,'invalid-readable-capacity');
            else{const capacity=readableCharacters(title);measurements.push({id,metric:'visible-summary-characters',value:capacity.shown,total:capacity.total});if(!capacity.total||capacity.shown<Math.min(capacity.total,c.minVisibleCharacters))fail(id,'unrecognizable-summary',{...capacity,minimum:c.minVisibleCharacters});}
          }
          // A block nested inside a clipped parent can silently wrap or hard-cut
          // its own text, even when the parent's ellipsis declaration is correct.
          const walk=document.createTreeWalker(title,4);let textNode;
          while((textNode=walk.nextNode()))if(textNode.textContent.trim()){
            const carrier=textNode.parentElement,cs=getStyle(carrier);
            if(carrier===title||cs.display==='inline'||cs.display==='contents')continue;
            if(cs.whiteSpace!=='nowrap'||box(carrier).height>lh+0.75||carrier.scrollWidth>carrier.clientWidth+1&&(cs.textOverflow!=='ellipsis'||!['hidden','clip'].includes(cs.overflowX)))fail(id,'nested-summary-text-not-ellipsized');
          }
        }
      }
      if(heights.length){measurements.push({id,metric:'family-height-spread',value:Math.max(...heights)-Math.min(...heights)});if(Math.max(...heights)-Math.min(...heights)>0.75)fail(id,'content-dependent-card-height');}
    }else if(c.type==='topic'){
      for(const card of selected){
        const icons=nodes(c.icon,id,card),labels=nodes(c.label,id,card);
        if(icons.length!==1||labels.length!==1){fail(id,'topic-role-count');continue;}
        const icon=box(icons[0]),label=box(labels[0]),parent=box(card);
        const left=label.left>=icon.right-0.75&&Math.abs((label.top+label.bottom-icon.top-icon.bottom)/2)<=Math.max(label.height,icon.height)/2;
        const above=label.top>=icon.bottom-0.75&&icon.left>=parent.left&&icon.right<=parent.right;
        const gap=left?label.left-icon.right:above?label.top-icon.bottom:Infinity;
        if(!left&&!above)fail(id,'topic-icon-must-be-left-or-above');
        if(!Number.isFinite(c.maximumGapPx)||c.maximumGapPx<0||gap>c.maximumGapPx+0.75)fail(id,'topic-group-disconnected',{gap,maximum:c.maximumGapPx});
        if(getStyle(labels[0]).textAlign!==(above?'center':'left'))fail(id,above?'topic-label-not-centered':'topic-label-not-left-aligned');
        if(above&&Math.abs((label.left+label.right-parent.left-parent.right)/2)>0.75)fail(id,'topic-label-slot-not-centered');
        const labelStyle=getStyle(labels[0]);
        if(labelStyle.textOverflow==='ellipsis'||!['none','unset',''].includes(labelStyle.webkitLineClamp))fail(id,'topic-label-must-remain-full');
        const walk=document.createTreeWalker(labels[0],4);let textNode;
        while((textNode=walk.nextNode()))if(textNode.textContent.trim()){
          const range=document.createRange();range.selectNodeContents(textNode);
          for(const r of range.getClientRects())if(r.width&&r.height){
            if(r.left<label.left-0.75||r.right>label.right+0.75||r.top<label.top-0.75||r.bottom>label.bottom+0.75)fail(id,'topic-label-text-outside-slot');
            for(let ancestor=textNode.parentElement;ancestor;ancestor=ancestor.parentElement){const s=getStyle(ancestor),b=box(ancestor);if(['hidden','clip'].includes(s.overflowX)&&(r.left<b.left-0.75||r.right>b.right+0.75)||['hidden','clip'].includes(s.overflowY)&&(r.top<b.top-0.75||r.bottom>b.bottom+0.75))fail(id,'topic-label-clipped-by-ancestor');}
          }
        }
        const iconOffset=above?(icon.left+icon.right-parent.left-parent.right)/2:(icon.top+icon.bottom-label.top-label.bottom)/2;
        if(Math.abs(iconOffset)>0.75)fail(id,'topic-icon-not-centered',{axis:above?'center-x':'center-y',offset:iconOffset});
        for(const r of[icon,label])if(r.left<parent.left-0.75||r.right>parent.right+0.75||r.top<parent.top-0.75||r.bottom>parent.bottom+0.75)fail(id,'topic-role-outside-card');
        measurements.push({id,metric:'icon-label-gap',value:Number.isFinite(gap)?gap:null});
      }
    }else if(c.type==='stability'){
      const records=[],keys=new Set();
      for(const [index,card]of selected.entries()){
        const key=c.keyAttribute?card.getAttribute(c.keyAttribute):String(index);
        if(!key||keys.has(key)){fail(id,'missing-or-duplicate-stability-key',{key});continue;}keys.add(key);
        const r=box(card),fields={};
        for(const field of c.fields||[]){
          const found=nodes(field,id,card);if(found.length!==1){fail(id,'stability-field-count',{field,actual:found.length});continue;}
          const f=box(found[0]);fields[field]={left:f.left-r.left,top:f.top-r.top,width:f.width,height:f.height};
        }
        records.push({key,left:r.left+view.scrollX,top:r.top+view.scrollY,width:r.width,height:r.height,fields});
      }
      const snapshot={viewportWidth:view.innerWidth,layoutWidth:viewportWidth,records};stabilitySnapshots[id]=snapshot;
      const before=options.stabilityBaseline?.[id];
      if(!before){pending.push({id,reason:'stability-baseline-required'});continue;}
      if(before.viewportWidth!==view.innerWidth){fail(id,'stability-viewport-mismatch');continue;}
      const delta=Math.min(1,Math.max(0,c.tolerancePx??0.75));
      if(Math.abs(before.layoutWidth-viewportWidth)>delta)fail(id,'scrollbar-width-shift');
      const sameOrder=JSON.stringify(before.records.map(r=>r.key))===JSON.stringify(records.map(r=>r.key));
      let compared=0;
      for(const current of records){
        const previous=before.records.find(r=>r.key===current.key);if(!previous)continue;compared++;
        // Filtering may reorder entities; surviving cards retain their capacity
        // and field tracks. Unchanged order additionally preserves page position.
        for(const metric of sameOrder?['left','top','width','height']:['width','height'])if(Math.abs(previous[metric]-current[metric])>delta)fail(id,'card-geometry-shift',{key:current.key,metric,before:previous[metric],after:current[metric]});
        for(const field of c.fields||[]){const a=previous.fields[field],b=current.fields[field];if(!a||!b){fail(id,'stability-field-coverage-changed',{field});continue;}for(const metric of['left','top','width','height'])if(Math.abs(a[metric]-b[metric])>delta)fail(id,'field-geometry-shift',{key:current.key,field,metric,before:a[metric],after:b[metric]});}
      }
      if(!compared)pending.push({id,reason:'no-comparable-stability-entities'});
      else measurements.push({id,metric:'stable-entities-compared',value:compared});
      if(document.documentElement.scrollWidth>viewportWidth+1)fail(id,'unexpected-horizontal-overflow');
    }else if(c.type==='packing'){
      for(const parent of selected){
        const cards=nodes(c.items,id,parent,c.empty===true);if(c.empty===true&&!cards.length)continue;const rects=cards.map(box),p=box(parent),s=getStyle(parent);
        const available=p.width-(parseFloat(s.paddingLeft)||0)-(parseFloat(s.paddingRight)||0)-(parseFloat(s.borderLeftWidth)||0)-(parseFloat(s.borderRightWidth)||0);
        if(available<(c.minHostWidth??0)||available>(c.maxHostWidth??Infinity)){measurements.push({id,metric:'packing-host-outside-scope',value:available});continue;}
        if(!Number.isFinite(c.minReadableWidth)||c.minReadableWidth<=0||!Number.isFinite(c.gap)||c.gap<0||c.maxColumns!==undefined&&(!Number.isInteger(c.maxColumns)||c.maxColumns<1)||c.maxItemWidth!==undefined&&(!Number.isFinite(c.maxItemWidth)||c.maxItemWidth<=0)){fail(id,'invalid-packing-budget');continue;}
        const capacity=Math.max(1,Math.min(cards.length,c.maxColumns??Infinity,Math.floor((available+c.gap)/(c.minReadableWidth+c.gap))));
        const first=rects[0],columns=first?rects.filter(r=>Math.abs(r.top-first.top)<=1).length:0;
        measurements.push({id,metric:'packing-columns',value:columns,capacity,available});
        if(columns<capacity)fail(id,'sparse-packing',{columns,capacity,available});
        for(const [i,r]of rects.entries()){
          if(r.width<Math.min(available,c.minReadableWidth)-1)fail(id,'packing-item-too-narrow',{index:i,width:r.width,minReadableWidth:c.minReadableWidth});
          if(c.maxItemWidth)checkValue(id,i+'.item-width',r.width,[0,c.maxItemWidth]);
        }
        // Measure painted card edges, including incomplete rows. CSS gap alone
        // misses space-between and capped cards sitting inside stretched tracks.
        if(c.gapRange){
          const rows=[];for(const r of rects){let row=rows.find(row=>Math.abs(row[0].top-r.top)<=1);if(!row)rows.push(row=[]);row.push(r);}
          for(const [ri,row]of rows.entries()){row.sort((a,b)=>a.left-b.left);for(let i=1;i<row.length;i++)checkValue(id,ri+'.visible-gap-'+i,row[i].left-row[i-1].right,c.gapRange);}
        }
      }
    }else if(c.type==='image-fit'){
      for(const image of selected){
        if(c.conventionalFrame){
          const frames=[image,...(c.frame&&image.closest(c.frame)?[image.closest(c.frame)]:[])];
          for(const frame of frames){const style=getStyle(frame),corners=['borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius'].map(k=>style[k]);
            measurements.push({id,metric:'media-frame-inspected',value:1,corners});
            if(new Set(corners).size>1||style.clipPath!=='none'||style.maskImage&&style.maskImage!=='none')fail(id,'unconventional-media-frame',{corners,clipPath:style.clipPath,maskImage:style.maskImage});}
        }
        const r=box(image),s=getStyle(image),width=r.width-(parseFloat(s.paddingLeft)||0)-(parseFloat(s.paddingRight)||0)-(parseFloat(s.borderLeftWidth)||0)-(parseFloat(s.borderRightWidth)||0),height=r.height-(parseFloat(s.paddingTop)||0)-(parseFloat(s.paddingBottom)||0)-(parseFloat(s.borderTopWidth)||0)-(parseFloat(s.borderBottomWidth)||0);
        const loaded=image.complete&&image.naturalWidth>0,nw=loaded?image.naturalWidth:Number(image.getAttribute('width')),nh=loaded?image.naturalHeight:Number(image.getAttribute('height'));
        if(width<=0||height<=0)fail(id,'image-space-not-reserved');
        if(c.requireLoaded&&!loaded)fail(id,'image-not-loaded');
        if(nw>0&&nh>0&&height>0){const error=Math.abs(width/height-nw/nh)/(nw/nh);measurements.push({id,metric:'image-ratio-error',value:error,loaded});if(c.fitMode==='cover'){if(s.objectFit!=='cover')fail(id,'cover-crop-not-proportional',{objectFit:s.objectFit});}else if(c.fitMode==='contain'){if(s.objectFit!=='contain')fail(id,'full-image-needs-contain',{objectFit:s.objectFit});}else if(error>(c.toleranceRatio??0.01)&&!(c.contentVisibility==='full'&&s.objectFit==='contain'))fail(id,'image-ratio-mismatch',{actual:width/height,expected:nw/nh});
          if(c.contentVisibility==='full'){
            const coverScale=Math.max(width/nw,height/nh),retained=s.objectFit==='cover'?width*height/(nw*nh*coverScale*coverScale):1;
            measurements.push({id,metric:'image-content-retained',value:retained});
            if(retained<0.99)fail(id,'image-content-cropped',{retained});
            if(!['contain','scale-down'].includes(s.objectFit)&&error>0.01&&s.objectFit!=='cover')fail(id,'image-content-distorted');
            const scale=s.objectFit==='contain'||s.objectFit==='scale-down'?Math.min(width/nw,height/nh):width/nw,pw=nw*scale,ph=nh*scale;
            const painted={left:r.left+(r.width-pw)/2,right:r.left+(r.width+pw)/2,top:r.top+(r.height-ph)/2,bottom:r.top+(r.height+ph)/2};
            for(let parent=image.parentElement;parent;parent=parent.parentElement){const ps=getStyle(parent),p=box(parent);if(['hidden','clip'].includes(ps.overflowX)&&(painted.left<p.left-1||painted.right>p.right+1)||['hidden','clip'].includes(ps.overflowY)&&(painted.top<p.top-1||painted.bottom>p.bottom+1))fail(id,'image-content-clipped-by-ancestor');}
          }
        }
        else if(!loaded)fail(id,'image-ratio-not-reserved');
        if(c.balanceWith){const card=c.card?image.closest(c.card):image.parentElement,copy=card?.querySelector(c.balanceWith);if(!copy||!visible(copy))fail(id,'missing-reading-copy');else{const b=box(copy);measurements.push({id,metric:'reading-height-delta',value:r.height-b.height});if(Math.abs(r.height-b.height)>1||Math.abs(r.top-b.top)>1)fail(id,'reading-image-copy-height-mismatch',{image:[r.top,r.height],copy:[b.top,b.height]});}}
        if(c.minimumCardWidthRatio){const card=image.closest(c.card),copy=card?.querySelector(c.stackedCopy);if(!card||!copy)fail(id,'missing-stacked-reading-group');else{const cr=box(card),cs=getStyle(card),inner=cr.width-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0)-(parseFloat(cs.borderLeftWidth)||0)-(parseFloat(cs.borderRightWidth)||0),copyBox=box(copy);if(r.width<inner*c.minimumCardWidthRatio-1||copyBox.width<inner*c.minimumCardWidthRatio-1)fail(id,'stacked-reading-underuses-card-width',{image:r.width,copy:copyBox.width,available:inner});}}
        if(c.frame){const frame=image.closest(c.frame);if(!frame)fail(id,'missing-image-frame');else{const f=box(frame),fs=getStyle(frame),fw=f.width-(parseFloat(fs.paddingLeft)||0)-(parseFloat(fs.paddingRight)||0)-(parseFloat(fs.borderLeftWidth)||0)-(parseFloat(fs.borderRightWidth)||0),fh=f.height-(parseFloat(fs.paddingTop)||0)-(parseFloat(fs.paddingBottom)||0)-(parseFloat(fs.borderTopWidth)||0)-(parseFloat(fs.borderBottomWidth)||0);if(Math.abs(fw-r.width)>1||Math.abs(fh-r.height)>1)fail(id,'image-frame-mismatch',{frame:[fw,fh],image:[r.width,r.height]});}}
      }
    }else if(c.type==='row-alignment'){
      for(const card of selected){
        const groups=Object.entries(c.roles||{}).map(([role,selector])=>({role,elements:[...card.querySelectorAll(selector)].filter(visible)}));
        if(groups.length<2||groups.some(g=>g.elements.length!==1)){fail(id,'row-alignment-role-missing');continue;}
        const cr=box(card),roles=groups.map(g=>({role:g.role,box:box(g.elements[0])})),reference=roles.find(g=>g.role===c.reference)||roles[0],center=r=>(r.top+r.bottom)/2;
        for(const role of roles){const delta=center(role.box)-center(reference.box);measurements.push({id,metric:'row-role-center-delta',role:role.role,value:delta});if(Math.abs(delta)>(c.tolerancePx??2))fail(id,'row-role-axis-mismatch',{role:role.role,delta});if(c.minimumInsetPx!==undefined&&Math.min(role.box.top-cr.top,cr.bottom-role.box.bottom)<c.minimumInsetPx-1)fail(id,'row-role-missing-vertical-inset',{role:role.role});}
      }
    }else if(c.type==='action-flow'){
      for(const card of selected){
        const actions=[...card.querySelectorAll(c.action)].filter(visible),content=[...card.querySelectorAll(c.content)].filter(visible);
        if(!actions.length){if(c.mode!=='whole-card'||!card.matches('a[href],[role=link]'))fail(id,'missing-offer-action');continue;}
        if(!content.length){fail(id,'missing-offer-content');continue;}
        const cr=box(card),cs=getStyle(card),innerWidth=cr.width-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0)-(parseFloat(cs.borderLeftWidth)||0)-(parseFloat(cs.borderRightWidth)||0);
        for(const action of actions){const a=box(action),fields=content.map(box),overlaps=fields.some(f=>Math.min(a.bottom,f.bottom)-Math.max(a.top,f.top)>1),fullFooter=a.width>=innerWidth*.85,media=c.media?[...card.querySelectorAll(c.media)].filter(visible).map(box):[],lastField=fields.reduce((last,f)=>f.bottom>last.bottom?f:last,fields[0]),stackedFooter=c.mode==='stacked-footer'&&c.rationale?.trim()&&Math.abs(a.left-lastField.left)<=1&&a.top-lastField.bottom>=0&&a.top-lastField.bottom<=12,balancedMedia=media.some(m=>a.top>=m.top-4&&a.bottom<=m.bottom+4&&fields.filter(f=>Math.min(f.bottom,m.bottom)-Math.max(f.top,m.top)>1).every(f=>f.right<=m.left+1||f.left>=m.right-1));
          measurements.push({id,metric:'offer-action-flow',value:a.height,overlapsContentRow:overlaps,fullFooter,balancedMedia,stackedFooter});
          if(a.width<44||a.height<44||!(action.getAttribute('aria-label')||action.textContent).trim())fail(id,'offer-action-unusable');
          if(content.flatMap(glyphRects).some(f=>Math.min(a.right,f.right)-Math.max(a.left,f.left)>1&&Math.min(a.bottom,f.bottom)-Math.max(a.top,f.top)>1))fail(id,'offer-content-collides-with-action');
          if(!overlaps&&!fullFooter&&!balancedMedia&&!stackedFooter)fail(id,'orphan-partial-action-row',{action:[a.width,a.top,a.bottom],innerWidth,content:fields.map(f=>[f.top,f.bottom])});
        }
      }
    }else if(c.type==='rail-controls'){

      // A display:contents group has no box: inspect its actual buttons instead.
      const groups=[...document.querySelectorAll(c.selector)].filter(e=>!e.hidden&&getStyle(e).display!=='none');
      if(!groups.length&&c.optional!==true)fail(id,'missing-required-rail-controls');
      for(const group of groups){const buttons=[...group.querySelectorAll('button')].filter(visible);
        if(buttons.length!==2){fail(id,'rail-needs-two-controls',{actual:buttons.length});continue;}
        const rails=buttons.map(b=>document.getElementById(b.getAttribute('aria-controls')));
        if(!rails[0]||rails[0]!==rails[1]){fail(id,'rail-controls-missing-target');continue;}
        const rail=box(rails[0]),[left,right]=buttons.map(box);
        measurements.push({id,metric:'rail-control-placement',value:1});
        if(left.right>rail.left+1||right.left<rail.right-1||Math.abs((left.top+left.bottom-rail.top-rail.bottom)/2)>1||Math.abs((right.top+right.bottom-rail.top-rail.bottom)/2)>1)fail(id,'rail-controls-own-row-or-overlap-content');
        for(const button of buttons){const r=box(button);if(r.width<44||r.height<44||!button.getAttribute('aria-label'))fail(id,'rail-control-unusable');}
      }
    }else if(c.type==='heading-action'){
      for(const heading of selected){const title=heading.querySelector(c.title||'h2'),link=heading.querySelector(c.action||'a[href]');
        if(!title||!link){fail(id,'heading-action-missing-content');continue;}
        const a=box(title),b=box(link),label=link.querySelector(c.label||'.mobile-heading-label'),icon=[...link.querySelectorAll(c.icon||'svg')].find(e=>visible(e)&&!e.closest('.mobile-heading-label'));
        measurements.push({id,metric:'mobile-heading-action-inspected',value:1});
        if(a.right>b.left+1||Math.min(a.bottom,b.bottom)<=Math.max(a.top,b.top)||b.width<44||b.height<44)fail(id,'heading-action-wraps-or-cramps-title');
        if(!link.getAttribute('aria-label')?.trim()||!icon||!visible(icon)||!label||getStyle(label).display==='contents'||box(label).width<0.5||box(label).height<0.5||box(label).width>1.1||box(label).height>1.1||getStyle(label).overflow!=='hidden')fail(id,'heading-action-needs-named-icon-only');
      }
    }else if(c.type==='action-shape'){
      for(const control of selected){
        measurements.push({id,metric:'action-outline-inspected',value:1});
        for(const pseudo of [null,...(c.pseudos||[])]){const s=pseudo?view.getComputedStyle(control,pseudo):getStyle(control);if(pseudo&&['none','normal',''].includes(s.content))continue;
          if(s.clipPath&&s.clipPath!=='none'||s.maskImage&&s.maskImage!=='none')fail(id,'unrecognizable-action-outline',{pseudo,clipPath:s.clipPath,maskImage:s.maskImage});}
      }
    }else if(c.type==='grid'){
      for(const parent of selected){
        const cards=nodes(c.items,id,parent,c.empty===true),rects=cards.map(box);
        if(c.expectedItems!==undefined&&cards.length!==c.expectedItems)fail(id,'item-count-mismatch',{expected:c.expectedItems,actual:cards.length});
        for(let i=0;i<rects.length;i++){
          const a=rects[i];
          const right=rects.filter((b,j)=>j!==i&&b.left>=a.left&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1).sort((x,y)=>x.left-y.left)[0];
          const below=rects.filter((b,j)=>j!==i&&b.top>a.top+1&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1).sort((x,y)=>x.top-y.top)[0];
          if(right&&c.horizontalGap)checkValue(id,'item-'+i+'.horizontal-gap',right.left-a.right,c.horizontalGap);
          if(below&&c.verticalGap)checkValue(id,'item-'+i+'.vertical-gap',below.top-a.bottom,c.verticalGap);
          for(const metric of ['width','height'])if(c[metric])checkValue(id,'item-'+i+'.'+metric,a[metric],c[metric]);
        }
      }
    }else if(c.type==='alignment'||c.type==='distance'){
      const other=nodes(c.with,id,document,c.optional===true);
      if(selected.length!==other.length){fail(id,'pair-count-mismatch',{first:selected.length,second:other.length});continue;}
      selected.forEach((e,i)=>{
        const a=box(e),b=box(other[i]);
        if(c.type==='alignment'){
          const axis=c.axis||'left';
          if(!['left','right','top','bottom','center-x','center-y'].includes(axis)){fail(id,'invalid-axis');return;}
          const coordinate=r=>axis==='center-x'?(r.left+r.right)/2:axis==='center-y'?(r.top+r.bottom)/2:r[axis];
          checkValue(id,i+'.'+axis+'-offset',coordinate(b)-coordinate(a),c.range);
        }else checkValue(id,i+'.distance',c.axis==='x'?b.left-a.right:b.top-a.bottom,c.range);
      });
    }else if(c.type==='separation'){
      for(const parent of selected){
        const aa=nodes(c.first,id,parent),bb=nodes(c.second,id,parent);
        for(const a of aa.map(box))for(const b of bb.flatMap(e=>[box(e),...glyphRects(e)])){
          const overlapX=Math.min(a.right,b.right)-Math.max(a.left,b.left),overlapY=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
          if(overlapX>0.75&&overlapY>0.75)fail(id,'regions-overlap',{overlapX,overlapY});
          measurements.push({id,metric:'region-separation',value:Math.max(b.left-a.right,a.left-b.right,b.top-a.bottom,a.top-b.bottom)});
        }
      }
    }else{
      selected.forEach((e,i)=>{
        const r=box(e),s=getStyle(e);
        if(c.type==='gutter'){
          checkValue(id,i+'.left-gutter',r.left,c.range);
          checkValue(id,i+'.right-gutter',viewportWidth-r.right,c.range);
        }else if(c.type==='box'){
          for(const metric of ['width','height'])if(c[metric])checkValue(id,i+'.'+metric,r[metric],c[metric]);
        }else if(c.type==='typography'){
          if(c.textAlign&&s.textAlign!==c.textAlign)fail(id,'wrong-text-alignment',{actual:s.textAlign,expected:c.textAlign});
          if(c.fontFamilyIncludes&&!s.fontFamily.toLowerCase().includes(c.fontFamilyIncludes.toLowerCase()))fail(id,'wrong-information-font',{actual:s.fontFamily,expected:c.fontFamilyIncludes});
          for(const metric of ['fontSize','lineHeight'])if(c[metric]){
            const value=parseFloat(s[metric]);
            if(!Number.isFinite(value))fail(id,'unmeasurable-style',{metric,actual:s[metric]});
            else checkValue(id,i+'.'+metric,value,c[metric]);
          }
          if(c.width)checkValue(id,i+'.text-track-width',r.width,c.width);
          if(c.maxLines){
            const lh=parseFloat(s.lineHeight);
            if(!Number.isFinite(lh))fail(id,'unmeasurable-line-capacity');
            else checkValue(id,i+'.text-slot-height',r.height,[0,c.maxLines*lh]);
          }
        }else fail(id,'unknown-check-type',{type:c.type});
      });
    }
  }
  return {documentWidth:document.documentElement.scrollWidth,viewportWidth:view.innerWidth,layoutWidth:viewportWidth,viewportHeight:view.innerHeight,
    rootOverflow:document.documentElement.scrollWidth>viewportWidth+1,examined,candidateCount,samples,truncated:candidateCount>limit,
    stabilitySnapshots,
    budget:{status:failures.length?'fail':pending.length?'not-run':applicable&&measurements.length?'measured':'not-run',applicable,measurements,failures,pending,
      reason:applicable?'Declared geometry measured; independent pixel review and route coverage still required.':'No applicable layout budget; spacing/alignment coverage is not-run.'},
    note:'Internal clipping/occlusion are review candidates. Intentional scroll, overlays and clamping need judgment; absence is not a visual pass.'};
}

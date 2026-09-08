(()=>{
  'use strict';
  const cfg=window.LW_CONFIG||{};
  const supported=Object.keys(cfg.languages||{fr:{}});
  const fallback=cfg.default||'fr';
  const storageKey='lastwar2245.lang';
  const sidebarKey='lastwar2245.sidebarCollapsed';
  const mobileMq=window.matchMedia('(max-width:880px)');
  const qs=()=>new URLSearchParams(location.search);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function normalize(v){v=(v||'').toLowerCase().split('-')[0];return supported.includes(v)?v:null}
  function resolve(){return normalize(qs().get('lang'))||normalize(localStorage.getItem(storageKey))||normalize(navigator.language)||fallback}
  function currentLang(){return normalize(document.documentElement.lang)||resolve()}
  function ui(lang){return cfg.uiStrings?.[lang]||cfg.uiStrings?.fr||{}}
  function urlFor(lang,hash=location.hash){const u=new URL(location.href);u.searchParams.set('lang',lang);u.hash=hash||'';return u.pathname+u.search+u.hash}
  function shareUrl(lang,section=''){
    const base=(location.protocol==='file:'&&cfg.publicBaseUrl)?new URL(cfg.publicBaseUrl):new URL(location.href);
    base.searchParams.set('lang',lang);base.hash=section?`#${section}`:'';return base.href;
  }

  function setLang(lang,push=true){
    lang=normalize(lang)||fallback;
    localStorage.setItem(storageKey,lang);document.documentElement.lang=lang;
    document.querySelectorAll('[data-lang-template]').forEach(t=>{t.hidden=t.dataset.langTemplate!==lang});
    document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
    const nav=document.querySelector(`#nav-${lang}`), content=document.querySelector(`#content-${lang}`);
    if(nav)document.querySelector('#sidebarNav').innerHTML=nav.innerHTML;
    if(content)document.querySelector('#contentRoot').innerHTML=content.innerHTML;
    const fullLong=document.querySelector('#fullPrintBtn .print-label-long'),fullShort=document.querySelector('#fullPrintBtn .print-label-short');
    if(fullLong)fullLong.textContent=ui(lang).full_pdf||'PDF / Print guide';if(fullShort)fullShort.textContent=ui(lang).print_short||'Print';
    const exp=document.querySelector('#expandAll span'),col=document.querySelector('#collapseAll span');
    if(exp)exp.textContent=ui(lang).expand||'Expand all';if(col)col.textContent=ui(lang).collapse||'Collapse all';
    const label=document.querySelector('.level-label');if(label)label.textContent=ui(lang).level||'Level';
    const versionLabel=document.querySelector('#versionLabel'),updatedLabel=document.querySelector('#updatedLabel');
    if(versionLabel)versionLabel.textContent=ui(lang).site_version||'Site version';if(updatedLabel)updatedLabel.textContent=ui(lang).updated||'Updated';
    wireFolding();buildSidebarToc(lang);wireInternalLinks(lang);wireSectionObserver();refreshShareWidgets(document.querySelector('#contentRoot'),lang);
    if(push)history.replaceState({lang},'',urlFor(lang));
    const title=cfg.titles?.[lang];if(title)document.title=title;
    document.body.classList.remove('menu-open');
    if(location.hash)requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start'}));
  }

  function wireInternalLinks(lang){
    document.querySelectorAll('a[href]').forEach(a=>{
      if(a.hasAttribute('data-keep-href'))return;
      const raw=a.getAttribute('href');if(!raw||/^(https?:|mailto:|tel:)/i.test(raw))return;
      if(raw.startsWith('#')){a.setAttribute('href',urlFor(lang,raw));return}
      try{const u=new URL(raw,location.href),path=u.pathname.toLowerCase();if(u.origin===location.origin&&!/\.(svg|png|jpg|jpeg|webp|zip|json|css|js|pdf)$/i.test(path)){u.searchParams.set('lang',lang);a.href=u.pathname+u.search+u.hash}}catch{}
    });
  }

  function iconUse(icon,cls='nav-icon'){
    return `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="assets/svg/sprite.svg#${icon||'ui-day-sheet'}"></use></svg>`;
  }
  function headingLabel(h){
    const span=h.querySelector(':scope > span');return (span?.textContent||h.textContent||'').replace(/^[▾▸]\s*/,'').trim();
  }
  function labelKey(v){
    return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi,' ').trim();
  }
  function tocTarget(h){
    if(h.dataset.tocTarget)return h.dataset.tocTarget;
    const day=h.closest('.day-flow-item[id]');if(day&&h.hasAttribute('data-toc-day'))return day.id;
    const sub=h.closest('.guide-subsection[id]');if(sub){const first=sub.querySelector('h1,h2,h3,h4,h5,h6');if(first===h)return sub.id}
    return h.id;
  }
  function headingTree(headings){
    const root={level:0,children:[]},stack=[root];
    headings.forEach(h=>{
      const level=headingLevel(h),node={level,h,children:[]};
      while(stack.length>1&&stack[stack.length-1].level>=level)stack.pop();
      stack[stack.length-1].children.push(node);stack.push(node);
    });
    return root.children;
  }
  function renderTocNodes(nodes,lang){
    if(!nodes.length)return'';
    return `<ul class="toc-list">${nodes.map(node=>{
      const h=node.h,id=tocTarget(h),label=headingLabel(h),has=node.children.length>0;
      return `<li class="toc-item toc-level-${node.level}" data-toc-level="${node.level}"><div class="toc-row">${has?'<button class="toc-toggle" type="button" data-toc-toggle aria-expanded="true" aria-label="Replier / déplier">▾</button>':'<span class="toc-spacer"></span>'}<a class="toc-link" href="${urlFor(lang,'#'+id)}">${esc(label)}</a></div>${renderTocNodes(node.children,lang)}</li>`;
    }).join('')}</ul>`;
  }
  function buildSidebarToc(lang){
    const nav=document.querySelector('#sidebarNav');if(!nav)return;let out='';
    document.querySelectorAll('#contentRoot .content-section').forEach(section=>{
      const sid=section.id,label=section.dataset.navLabel||sid,icon=section.dataset.sectionIcon||'ui-day-sheet';
      let headings=[...section.querySelectorAll('h1:not([data-toc-ignore]),h2:not([data-toc-ignore]),h3:not([data-toc-ignore]),h4:not([data-toc-ignore]),h5:not([data-toc-ignore]),h6:not([data-toc-ignore])')];
      if(headings.length){const hk=labelKey(headingLabel(headings[0])),lk=labelKey(label);if(hk===lk||hk.includes(lk)||lk.includes(hk))headings=headings.slice(1)}
      const counts={};headings.forEach(h=>{const lvl=headingLevel(h);counts[lvl]=(counts[lvl]||0)+1;if(!h.id)h.id=`${sid}-h${lvl}-${counts[lvl]}`});
      const tree=headingTree(headings),has=tree.length>0;
      out+=`<div class="toc-section" data-toc-section="${esc(sid)}"><div class="toc-section-row">${has?'<button class="toc-toggle toc-section-toggle" type="button" data-toc-toggle aria-expanded="true" aria-label="Replier / déplier">▾</button>':'<span class="toc-spacer"></span>'}<a class="nav-link toc-root-link" href="${urlFor(lang,'#'+sid)}">${iconUse(icon,'nav-icon')}<span>${esc(label)}</span></a></div>${renderTocNodes(tree,lang)}</div>`;
    });
    nav.innerHTML=out;
  }

  function headingLevel(h){return parseInt(h.tagName.slice(1),10)}
  function setHeadingState(h,fold){
    const level=headingLevel(h);h.classList.toggle('folded',fold);h.setAttribute('aria-expanded',String(!fold));
    if(h.dataset.foldContainer==='day'){
      const day=h.closest('.day-flow-item');if(day)day.classList.toggle('day-collapsed',fold);return;
    }
    let n=h.nextElementSibling;
    while(n){if(/^H[1-6]$/.test(n.tagName)&&headingLevel(n)<=level)break;n.classList.toggle('folded-content',fold);n=n.nextElementSibling}
  }
  function refreshLevelButtons(){
    document.querySelectorAll('[data-toggle-level]').forEach(btn=>{
      const level=btn.dataset.toggleLevel,hs=[...document.querySelectorAll(`#contentRoot h${level}.fold-heading`)];
      btn.classList.toggle('active',hs.length>0&&hs.every(h=>h.classList.contains('folded')));
    });
  }
  function wireFolding(){
    document.querySelectorAll('#contentRoot h1,#contentRoot h2,#contentRoot h3,#contentRoot h4,#contentRoot h5,#contentRoot h6').forEach(h=>{
      h.classList.add('fold-heading');h.setAttribute('role','button');h.setAttribute('tabindex','0');h.setAttribute('aria-expanded','true');
      const toggle=()=>{setHeadingState(h,!h.classList.contains('folded'));refreshLevelButtons()};
      h.onclick=toggle;h.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}};
    });refreshLevelButtons();
  }
  function toggleLevel(level){
    const hs=[...document.querySelectorAll(`#contentRoot h${level}.fold-heading`)];if(!hs.length)return;
    const fold=!hs.every(h=>h.classList.contains('folded'));hs.forEach(h=>setHeadingState(h,fold));
    document.querySelectorAll(`#sidebarNav .toc-item[data-toc-level="${level}"]`).forEach(li=>{li.classList.toggle('toc-collapsed',fold);li.querySelector(':scope > .toc-row [data-toc-toggle]')?.setAttribute('aria-expanded',String(!fold))});
    refreshLevelButtons();
  }

  let sectionObserver;
  function wireSectionObserver(){
    sectionObserver?.disconnect();const sections=[...document.querySelectorAll('.content-section,.day-flow-item')];if(!('IntersectionObserver'in window))return;
    sectionObserver=new IntersectionObserver(entries=>{const v=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!v)return;const id=v.target.id;document.querySelectorAll('#sidebarNav .nav-link,#sidebarNav .toc-link').forEach(a=>a.classList.toggle('active',a.hash===`#${id}`))},{rootMargin:'-18% 0px -65% 0px',threshold:[0,.1,.35,.6]});
    sections.forEach(s=>sectionObserver.observe(s));
  }

  function qrSvg(text,cellSize=4,margin=2){
    if(typeof qrcode!=='function'||!text)return'';
    const qr=qrcode(0,'M');qr.addData(String(text),'Byte');qr.make();return qr.createSvgTag(cellSize,margin);
  }
  function hydrateDynamicQr(root=document,lang=currentLang()){
    root.querySelectorAll?.('[data-qr-section],[data-qr-url]').forEach(el=>{
      const section=el.dataset.qrSection||'',url=el.dataset.qrUrl||shareUrl(lang,section),svg=qrSvg(url,4,2);if(!svg)return;
      el.dataset.qrUrl=url;el.innerHTML=svg;const node=el.querySelector('svg');if(node){node.setAttribute('role','img');node.setAttribute('aria-label','QR code');node.removeAttribute('width');node.removeAttribute('height')}
      if(el.tagName==='A')el.href=url;
    });
  }
  function refreshShareWidgets(root=document,lang=currentLang()){
    root.querySelectorAll?.('[data-share-section]').forEach(footer=>{
      const section=footer.dataset.shareSection,url=shareUrl(lang,section);
      const txt=footer.querySelector('[data-share-url-text]');if(txt)txt.textContent=url;
      const open=footer.querySelector('[data-share-open]');if(open)open.href=url;
      const copy=footer.querySelector('[data-copy-section]');if(copy)copy.dataset.copyUrl=url;
      const share=footer.querySelector('[data-web-share-section]');if(share)share.dataset.webShare=url;
      const qr=footer.querySelector('[data-qr-section]');if(qr)qr.dataset.qrUrl=url;
    });hydrateDynamicQr(root,lang);
  }
  function prepareExportFragment(fragment,lang){
    fragment.querySelectorAll?.('[data-print-url-section]').forEach(el=>el.textContent=shareUrl(lang,el.dataset.printUrlSection||''));
    fragment.querySelectorAll?.('[data-qr-section]').forEach(el=>el.dataset.qrUrl=shareUrl(lang,el.dataset.qrSection||''));
    hydrateDynamicQr(fragment,lang);return fragment;
  }

  async function copyText(text,btn){
    try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
    if(btn){btn.classList.add('copied');setTimeout(()=>btn.classList.remove('copied'),1200)}
  }

  function printMarkup(lang,section){
    if(section!=='full'){
      const tpl=document.getElementById(`print-${lang}-${section}`);return tpl?{title:tpl.dataset.printTitle||document.title,html:tpl.innerHTML,section}:null;
    }
    const order=cfg.printOrder||[],body=order.map(id=>document.getElementById(`print-${lang}-${id}`)?.innerHTML||'').join('');if(!body)return null;
    const title=ui(lang).full_pdf||'PDF / Print guide',url=shareUrl(lang,'');
    const cover=`<header class="print-book-cover"><div class="print-kicker">LastWar2245</div><h1>${esc(title)}</h1><div class="print-url">${esc(url)}</div><div class="print-qr print-cover-qr dynamic-qr" data-qr-url="${esc(url)}"></div></header>`;
    return{title,html:`<article class="print-book">${cover}${body}</article>`,section:'full'};
  }
  function runtimeMarkup(data,lang){
    const tpl=document.createElement('template');tpl.innerHTML=data.html;prepareExportFragment(tpl.content,lang);return tpl.innerHTML;
  }

  function fitDailySheet(doc){
    const sheet=doc.querySelector?.('.print-day-sheet'),body=sheet?.querySelector('.print-day-body'),footer=sheet?.querySelector('.print-footer');
    if(!sheet||!body||!footer)return;
    body.style.transform='';body.style.width='';
    const bodyTop=body.offsetTop,footerTop=footer.offsetTop,available=Math.max(240,footerTop-bodyTop-8),needed=Math.max(body.scrollHeight,body.getBoundingClientRect().height);
    if(needed<=available)return;
    const scale=Math.max(.76,Math.min(1,available/needed));
    body.style.transformOrigin='top left';body.style.transform=`scale(${scale})`;body.style.width=`${100/scale}%`;
    sheet.dataset.fitScale=scale.toFixed(3);
  }

  function openPrintTemplate(section='full'){
    const lang=currentLang(),data=printMarkup(lang,section);if(!data)return;const printable=runtimeMarkup(data,lang),frame=document.createElement('iframe');
    frame.className='print-frame';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';document.body.appendChild(frame);
    const doc=frame.contentDocument,base=new URL('.',location.href).href;doc.open();doc.write(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${esc(base)}"><title>${esc(data.title)}</title><style>${cfg.printCss||''}</style></head><body><main class="print-root">${printable}</main></body></html>`);doc.close();
    const cleanup=()=>setTimeout(()=>frame.remove(),300),run=()=>setTimeout(()=>{try{fitDailySheet(doc);frame.contentWindow.focus();frame.contentWindow.addEventListener('afterprint',cleanup,{once:true});frame.contentWindow.print();setTimeout(cleanup,6000)}catch{cleanup()}},220);
    if(doc.readyState==='complete')run();else frame.addEventListener('load',run,{once:true});
  }

  function status(msg,error=false){
    document.querySelector('.png-export-status')?.remove();const n=document.createElement('div');n.className=`png-export-status${error?' error':''}`;n.textContent=msg;document.body.appendChild(n);setTimeout(()=>n.remove(),error?5000:2600);
  }

  let galleryItems=[],galleryIndex=0;
  function galleryDialog(){return document.querySelector('#galleryLightbox')}
  function updateGallery(index){
    if(!galleryItems.length)return;galleryIndex=(index+galleryItems.length)%galleryItems.length;const item=galleryItems[galleryIndex];
    const img=document.querySelector('#galleryLightboxImage'),cap=document.querySelector('#galleryLightboxCaption');
    if(img){img.src=item.dataset.gallerySrc||item.href||'';img.alt=item.dataset.galleryTitle||item.querySelector('img')?.alt||''}
    if(cap)cap.textContent=item.dataset.galleryTitle||item.querySelector('figcaption')?.textContent||'';
  }
  function openGallery(item){
    const dlg=galleryDialog();if(!dlg||typeof dlg.showModal!=='function')return false;
    const group=item.dataset.galleryGroup||'default';galleryItems=[...document.querySelectorAll(`[data-gallery-open][data-gallery-group="${CSS.escape(group)}"]`)];
    galleryIndex=Math.max(0,galleryItems.indexOf(item));updateGallery(galleryIndex);dlg.showModal();document.body.classList.add('lightbox-open');return true;
  }
  function closeGallery(){const dlg=galleryDialog();if(dlg?.open)dlg.close();document.body.classList.remove('lightbox-open')}
  function stepGallery(delta){if(galleryDialog()?.open)updateGallery(galleryIndex+delta)}

  let dayViewerIds=[],dayViewerIndex=0;
  function dayViewerDialog(){return document.querySelector('#dayViewer')}
  function normalizeViewerClone(clone){
    clone.removeAttribute('id');clone.removeAttribute('data-section-id');clone.classList.remove('day-collapsed');
    clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
    clone.querySelectorAll('.folded').forEach(n=>n.classList.remove('folded'));
    clone.querySelectorAll('.folded-content').forEach(n=>n.classList.remove('folded-content'));
    clone.querySelectorAll('[aria-expanded="false"]').forEach(n=>n.setAttribute('aria-expanded','true'));
    clone.querySelector('.day-next')?.remove();
    return clone;
  }
  function renderDayViewer(index){
    const dlg=dayViewerDialog(),host=document.querySelector('#dayViewerBody');if(!dlg||!host||!dayViewerIds.length)return;
    dayViewerIndex=(index+dayViewerIds.length)%dayViewerIds.length;const id=dayViewerIds[dayViewerIndex],src=document.getElementById(id);if(!src)return;
    const clone=normalizeViewerClone(src.cloneNode(true));host.replaceChildren(clone);refreshShareWidgets(host,currentLang());
    dlg.dataset.day=id;dlg.setAttribute('aria-label',clone.querySelector('.day-card-title')?.textContent?.trim()||'Récap quotidien');
    host.scrollTop=0;
  }
  function openDayViewer(id){
    const dlg=dayViewerDialog();if(!dlg||typeof dlg.showModal!=='function')return false;
    dayViewerIds=[...document.querySelectorAll('.day-flow-item[id]')].map(n=>n.id);const idx=dayViewerIds.indexOf(id);if(idx<0)return false;
    renderDayViewer(idx);dlg.showModal();document.body.classList.add('day-viewer-open');return true;
  }
  function closeDayViewer(){const dlg=dayViewerDialog();if(dlg?.open)dlg.close();document.body.classList.remove('day-viewer-open')}
  function stepDayViewer(delta){if(dayViewerDialog()?.open)renderDayViewer(dayViewerIndex+delta)}
  function exportFrame(data,lang){
    const printable=runtimeMarkup(data,lang),frame=document.createElement('iframe');
    frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-100000px;top:0;width:794px;height:1200px;border:0;opacity:0;pointer-events:none;z-index:-1';document.body.appendChild(frame);
    const doc=frame.contentDocument,base=new URL('.',location.href).href;doc.open();doc.write(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><base href="${esc(base)}"><style>${cfg.printCss||''} html,body{width:210mm;margin:0!important;padding:0!important;overflow:visible!important}.print-root{width:210mm}</style></head><body><main class="print-root">${printable}</main></body></html>`);doc.close();
    return frame;
  }
  async function waitFrame(frame){
    await new Promise(resolve=>{if(frame.contentDocument?.readyState==='complete')resolve();else frame.addEventListener('load',resolve,{once:true})});
    try{await frame.contentDocument.fonts?.ready}catch{};await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  }
  async function exportSvg(section,quiet=false){
    const lang=currentLang(),data=printMarkup(lang,section);if(!data)return false;let frame;
    try{
      frame=exportFrame(data,lang);await waitFrame(frame);const node=frame.contentDocument.querySelector('.print-day-sheet,.print-sheet');if(!node)throw new Error('Template image introuvable');
      const width=Math.ceil(node.getBoundingClientRect().width||794),height=Math.ceil(Math.max(node.scrollHeight,node.getBoundingClientRect().height||1123));
      const clone=node.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
      const serialized=new XMLSerializer().serializeToString(clone),svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>${cfg.printCss||''}</style>${serialized}</div></foreignObject></svg>`;
      const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`lastwar2245-${section}-${lang}.svg`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2500);if(!quiet)status('SVG généré.');return true;
    }catch(err){console.error(err);if(!quiet)status('Impossible de générer le SVG.',true);return false}finally{frame?.remove()}
  }
  async function exportImageJpg(section){
    const lang=currentLang(),data=printMarkup(lang,section);if(!data)return;status('Génération de l’image JPG…');let frame;
    try{
      if(typeof html2canvas!=='function')throw new Error('html2canvas indisponible');
      frame=exportFrame(data,lang);await waitFrame(frame);fitDailySheet(frame.contentDocument);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const node=frame.contentDocument.querySelector('.print-day-sheet,.print-sheet');if(!node)throw new Error('Template image introuvable');
      const canvas=await html2canvas(node,{backgroundColor:'#ffffff',scale:2,useCORS:true,allowTaint:false,logging:false,foreignObjectRendering:false,removeContainer:true});
      const jpg=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('JPG indisponible')),'image/jpeg',0.94));
      const a=document.createElement('a');a.href=URL.createObjectURL(jpg);a.download=`lastwar2245-${section}-${lang}.jpg`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2500);status('Image JPG générée.');
    }catch(err){console.error(err);status('JPG non pris en charge ici : création du SVG à la place…',true);await exportSvg(section,true)}finally{frame?.remove()}
  }



  function syncTopbarHeight(){const top=document.querySelector('.topbar');if(top)document.documentElement.style.setProperty('--topbar-h',`${Math.ceil(top.getBoundingClientRect().height)}px`)}
  function applySidebarState(){
    const btn=document.querySelector('#menuToggle');
    if(mobileMq.matches){document.body.classList.remove('sidebar-collapsed');if(btn)btn.setAttribute('aria-expanded',String(document.body.classList.contains('menu-open')))}
    else{document.body.classList.remove('menu-open');const collapsed=localStorage.getItem(sidebarKey)==='1';document.body.classList.toggle('sidebar-collapsed',collapsed);if(btn)btn.setAttribute('aria-expanded',String(!collapsed))}
  }
  function toggleSidebar(){
    const btn=document.querySelector('#menuToggle');
    if(mobileMq.matches){document.body.classList.toggle('menu-open');if(btn)btn.setAttribute('aria-expanded',String(document.body.classList.contains('menu-open')))}
    else{const c=document.body.classList.toggle('sidebar-collapsed');localStorage.setItem(sidebarKey,c?'1':'0');if(btn)btn.setAttribute('aria-expanded',String(!c))}
  }

  document.addEventListener('click',async e=>{
    const langBtn=e.target.closest('.lang-btn');if(langBtn){e.preventDefault();setLang(langBtn.dataset.lang,true);return}
    if(e.target.closest('#menuToggle')){toggleSidebar();return}
    if(e.target.closest('#expandAll')){document.querySelectorAll('#contentRoot .fold-heading.folded').forEach(h=>setHeadingState(h,false));document.querySelectorAll('#sidebarNav .toc-collapsed').forEach(n=>n.classList.remove('toc-collapsed'));document.querySelectorAll('#sidebarNav [data-toc-toggle]').forEach(b=>b.setAttribute('aria-expanded','true'));refreshLevelButtons();return}
    if(e.target.closest('#collapseAll')){document.querySelectorAll('#contentRoot .fold-heading:not(.folded)').forEach(h=>setHeadingState(h,true));document.querySelectorAll('#sidebarNav .toc-item,#sidebarNav .toc-section').forEach(n=>n.classList.add('toc-collapsed'));document.querySelectorAll('#sidebarNav [data-toc-toggle]').forEach(b=>b.setAttribute('aria-expanded','false'));refreshLevelButtons();return}
    const toc=e.target.closest('[data-toc-toggle]');if(toc){const box=toc.closest('.toc-item,.toc-section');if(box){const folded=box.classList.toggle('toc-collapsed');toc.setAttribute('aria-expanded',String(!folded))}return}
    const lvl=e.target.closest('[data-toggle-level]');if(lvl){toggleLevel(lvl.dataset.toggleLevel);return}
    const copy=e.target.closest('[data-copy-section]');if(copy){await copyText(copy.dataset.copyUrl||shareUrl(currentLang(),copy.dataset.copySection),copy);status(ui(currentLang()).link_copied||'Lien copié.');return}
    const share=e.target.closest('[data-web-share-section]');if(share){
      const data={title:share.dataset.shareTitle||document.title,url:share.dataset.webShare||shareUrl(currentLang(),share.dataset.webShareSection)};
      if(navigator.share){
        try{await navigator.share(data);status(ui(currentLang()).shared||'Partage effectué.')}catch(err){if(err?.name!=='AbortError'){await copyText(data.url,share);status(ui(currentLang()).link_copied||'Lien copié.')}}
      }else{await copyText(data.url,share);status(ui(currentLang()).link_copied||'Lien copié.')}return
    }
    const dayGallery=e.target.closest('[data-day-gallery-open]');if(dayGallery&&openDayViewer(dayGallery.dataset.dayGalleryOpen)){e.preventDefault();return}
    const gallery=e.target.closest('[data-gallery-open]');if(gallery&&openGallery(gallery)){e.preventDefault();return}
    if(e.target.closest('[data-gallery-close]')){closeGallery();return}
    if(e.target.closest('[data-gallery-prev]')){stepGallery(-1);return}
    if(e.target.closest('[data-gallery-next]')){stepGallery(1);return}
    if(e.target.closest('[data-day-viewer-close]')){closeDayViewer();return}
    if(e.target.closest('[data-day-viewer-prev]')){stepDayViewer(-1);return}
    if(e.target.closest('[data-day-viewer-next]')){stepDayViewer(1);return}
    const pr=e.target.closest('[data-print-section]');if(pr){openPrintTemplate(pr.dataset.printSection);return}
    const image=e.target.closest('[data-export-image]');if(image){await exportImageJpg(image.dataset.exportImage);return}
    if(e.target.closest('[data-print-full]')){openPrintTemplate('full');return}
    if(mobileMq.matches&&e.target.closest('#sidebarNav a'))document.body.classList.remove('menu-open');
    if(mobileMq.matches&&document.body.classList.contains('menu-open')&&!e.target.closest('.sidebar')&&!e.target.closest('#menuToggle')&&!e.target.closest('.topbar'))document.body.classList.remove('menu-open');
  });

  window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(id)document.getElementById(id)?.scrollIntoView({block:'start'})});
  window.addEventListener('popstate',()=>setLang(resolve(),false));
  window.addEventListener('resize',syncTopbarHeight,{passive:true});
  mobileMq.addEventListener?.('change',applySidebarState);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){document.body.classList.remove('menu-open');closeGallery();closeDayViewer()}
    if(e.key==='ArrowLeft'&&dayViewerDialog()?.open){stepDayViewer(-1);return}
    if(e.key==='ArrowRight'&&dayViewerDialog()?.open){stepDayViewer(1);return}
    if(e.key==='ArrowLeft'&&galleryDialog()?.open)stepGallery(-1);
    if(e.key==='ArrowRight'&&galleryDialog()?.open)stepGallery(1);
  });
  document.addEventListener('DOMContentLoaded',()=>{
    syncTopbarHeight();const top=document.querySelector('.topbar');if(top&&'ResizeObserver'in window)new ResizeObserver(syncTopbarHeight).observe(top);
    const dlg=galleryDialog();if(dlg){dlg.addEventListener('close',()=>document.body.classList.remove('lightbox-open'));dlg.addEventListener('click',e=>{if(e.target===dlg)closeGallery()})}
    const dayDlg=dayViewerDialog();if(dayDlg){dayDlg.addEventListener('close',()=>document.body.classList.remove('day-viewer-open'));dayDlg.addEventListener('click',e=>{if(e.target===dayDlg)closeDayViewer()})}
    applySidebarState();setLang(resolve(),false);
  });
})();

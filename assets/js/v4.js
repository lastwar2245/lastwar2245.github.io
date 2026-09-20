(()=>{
'use strict';

const H='h1,h2,h3,h4,h5,h6';
const TEXT={
  fr:{copied:'Lien copié.',shared:'Partage ouvert.',image:'Image JPG générée.',imageErr:"Impossible de générer l’image.",qr:'QR',print:'Préparation du PDF…'},
  en:{copied:'Link copied.',shared:'Share opened.',image:'JPG image generated.',imageErr:'Unable to generate the image.',qr:'QR',print:'Preparing PDF…'},
  de:{copied:'Link kopiert.',shared:'Teilen geöffnet.',image:'JPG-Bild erstellt.',imageErr:'Bild konnte nicht erstellt werden.',qr:'QR',print:'PDF wird vorbereitet…'},
  es:{copied:'Enlace copiado.',shared:'Compartir abierto.',image:'Imagen JPG generada.',imageErr:'No se pudo generar la imagen.',qr:'QR',print:'Preparando PDF…'},
  it:{copied:'Link copiato.',shared:'Condivisione aperta.',image:'Immagine JPG generata.',imageErr:"Impossibile generare l'immagine.",qr:'QR',print:'Preparazione PDF…'},
  pt:{copied:'Ligação copiada.',shared:'Partilha aberta.',image:'Imagem JPG gerada.',imageErr:'Não foi possível gerar a imagem.',qr:'QR',print:'A preparar PDF…'},
  uk:{copied:'Посилання скопійовано.',shared:'Відкрито меню поширення.',image:'JPG створено.',imageErr:'Не вдалося створити зображення.',qr:'QR',print:'Підготовка PDF…'}
};

function lang(){return (document.documentElement.lang||'fr').toLowerCase().split('-')[0]}
function t(k){return (TEXT[lang()]||TEXT.fr)[k]||TEXT.fr[k]||k}
function lvl(h){return Number(h.tagName.slice(1))}
function setFold(h,fold){
  h.classList.toggle('folded',fold);
  h.setAttribute('aria-expanded',String(!fold));
  let n=h.nextElementSibling;
  while(n){
    if(/^H[1-6]$/.test(n.tagName)&&lvl(n)<=lvl(h))break;
    n.classList.toggle('folded-content',fold);
    n=n.nextElementSibling
  }
}
function wireFold(){
  document.querySelectorAll('.v4-section '+H).forEach(h=>{
    h.classList.add('fold-heading');
    h.setAttribute('tabindex','0');
    h.setAttribute('aria-expanded','true');
    const toggle=()=>setFold(h,!h.classList.contains('folded'));
    h.addEventListener('click',toggle);
    h.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}
    })
  })
}

function resourceFilters(){
  const root=document.querySelector('#resources');
  if(!root)return;
  const langEl=root.querySelector('[data-source-filter="lang"]'),
        topic=root.querySelector('[data-source-filter="topic"]'),
        cat=root.querySelector('[data-source-filter="category"]'),
        search=root.querySelector('[data-source-filter="search"]'),
        count=root.querySelector('[data-source-count]'),
        cards=[...root.querySelectorAll('[data-source-card]')];
  const apply=()=>{
    let n=0;
    const lv=(langEl?.value||'').toLowerCase(),
          tv=(topic?.value||'').toLowerCase(),
          cv=(cat?.value||'').toLowerCase(),
          q=(search?.value||'').trim().toLowerCase();
    cards.forEach(c=>{
      const ls=(c.dataset.sourceLangs||'').toLowerCase().split(/\s+/),
            ts=(c.dataset.sourceTopics||'').toLowerCase().split(/\s+/),
            cc=(c.dataset.sourceCategory||'').toLowerCase(),
            ss=(c.dataset.sourceSearch||'').toLowerCase();
      const ok=(!lv||ls.includes(lv)||ls.includes('multi'))&&
               (!tv||ts.includes(tv))&&(!cv||cc===cv)&&(!q||ss.includes(q));
      c.hidden=!ok;if(ok)n++
    });
    if(count)count.textContent=n
  };
  [langEl,topic,cat].forEach(x=>x&&x.addEventListener('change',apply));
  search&&search.addEventListener('input',apply);
  apply()
}

function cleanPageUrl(){
  const u=new URL(location.href);
  if(u.hash==='#')u.hash='';
  return u.href
}
function sectionUrl(section){
  const u=new URL(location.href);
  u.hash=section?`#${section}`:'';
  return u.href
}
function status(msg,error=false){
  document.querySelector('.share-status')?.remove();
  const el=document.createElement('div');
  el.className=`share-status${error?' error':''}`;
  el.setAttribute('role','status');
  el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),error?4500:2200)
}
async function copyText(value,btn){
  try{
    if(navigator.clipboard&&window.isSecureContext){
      await navigator.clipboard.writeText(value)
    }else{
      throw new Error('clipboard fallback')
    }
  }catch{
    const ta=document.createElement('textarea');
    ta.value=value;
    ta.setAttribute('readonly','');
    ta.style.cssText='position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove()
  }
  if(btn){
    btn.classList.add('copied');
    setTimeout(()=>btn.classList.remove('copied'),1200)
  }
}
async function shareData(data,btn){
  if(navigator.share){
    try{
      await navigator.share(data);
      status(t('shared'));
      return
    }catch(err){
      if(err?.name==='AbortError')return
    }
  }
  await copyText(data.url,btn);
  status(t('copied'))
}

function qrSvg(text,cellSize=3,margin=1){
  if(typeof qrcode!=='function'||!text)return'';
  try{
    const qr=qrcode(0,'M');
    qr.addData(String(text),'Byte');
    qr.make();
    return qr.createSvgTag(cellSize,margin)
  }catch{return''}
}
function hydrateShareWidgets(root=document){
  root.querySelectorAll?.('[data-share-section]').forEach(bar=>{
    const section=bar.dataset.shareSection||'';
    const url=sectionUrl(section);
    const open=bar.querySelector('[data-share-open]');
    const copy=bar.querySelector('[data-copy-section]');
    const share=bar.querySelector('[data-web-share-section]');
    const qr=bar.querySelector('[data-qr-section]');
    if(open)open.href=url;
    if(copy)copy.dataset.copyUrl=url;
    if(share)share.dataset.webShare=url;
    if(qr){
      qr.href=url;
      qr.dataset.qrUrl=url;
      const svg=qrSvg(url,3,1);
      if(svg){
        qr.innerHTML=svg;
        const node=qr.querySelector('svg');
        if(node){
          node.removeAttribute('width');
          node.removeAttribute('height');
          node.setAttribute('role','img');
          node.setAttribute('aria-label','QR code')
        }
      }else{
        qr.textContent=t('qr');
        qr.classList.add('qr-fallback')
      }
    }
  })
}

function daySummary(section){
  return document.querySelector(`.day-flow-item[data-section-id="${section}"]`)
}
function dayDetails(section){
  return document.getElementById(`${section}-details`)
}
function printableClone(node){
  const clone=node.cloneNode(true);
  clone.querySelectorAll('.day-share-compact,.next-day-link,[data-share-section]').forEach(n=>n.remove());
  clone.querySelectorAll('.folded').forEach(n=>n.classList.remove('folded'));
  clone.querySelectorAll('.folded-content').forEach(n=>n.classList.remove('folded-content'));
  clone.querySelectorAll('[aria-expanded="false"]').forEach(n=>n.setAttribute('aria-expanded','true'));
  clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
  clone.removeAttribute?.('id');
  return clone
}
function printSection(section){
  const summary=daySummary(section),details=dayDetails(section);
  if(!summary&&!details)return;
  document.querySelector('.print-section-host')?.remove();
  const host=document.createElement('div');
  host.className='print-section-host';
  if(summary)host.appendChild(printableClone(summary));
  if(details)host.appendChild(printableClone(details));
  document.body.appendChild(host);
  document.body.classList.add('section-printing');
  status(t('print'));
  let cleaned=false;
  const cleanup=()=>{
    if(cleaned)return;
    cleaned=true;
    document.body.classList.remove('section-printing');
    host.remove();
    window.removeEventListener('afterprint',cleanup)
  };
  window.addEventListener('afterprint',cleanup,{once:true});
  setTimeout(()=>{
    try{window.print()}finally{setTimeout(cleanup,5000)}
  },80)
}

async function exportImage(section,btn){
  const summary=daySummary(section);
  const target=summary?.querySelector('.day-visual')||summary;
  if(!target){status(t('imageErr'),true);return}
  if(typeof html2canvas!=='function'){status(t('imageErr'),true);return}
  try{
    const canvas=await html2canvas(target,{
      backgroundColor:'#08111f',
      scale:Math.min(2,window.devicePixelRatio||1.5),
      useCORS:true,
      allowTaint:false,
      logging:false,
      removeContainer:true
    });
    const blob=await new Promise((resolve,reject)=>
      canvas.toBlob(b=>b?resolve(b):reject(new Error('blob')),'image/jpeg',0.94)
    );
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`lastwar2245-${lang()}-${section}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),2500);
    if(btn){btn.classList.add('copied');setTimeout(()=>btn.classList.remove('copied'),1200)}
    status(t('image'))
  }catch(err){
    console.error(err);
    status(t('imageErr'),true)
  }
}

function wireActions(){
  hydrateShareWidgets();

  document.querySelector('[data-copy-page]')?.addEventListener('click',async e=>{
    await copyText(cleanPageUrl(),e.currentTarget);
    status(t('copied'))
  });
  document.querySelector('[data-share-page]')?.addEventListener('click',async e=>{
    await shareData({title:document.title,url:cleanPageUrl()},e.currentTarget)
  });

  document.addEventListener('click',async e=>{
    const copy=e.target.closest('[data-copy-section]');
    if(copy){
      e.preventDefault();
      await copyText(copy.dataset.copyUrl||sectionUrl(copy.dataset.copySection),copy);
      status(t('copied'));
      return
    }

    const share=e.target.closest('[data-web-share-section]');
    if(share){
      e.preventDefault();
      await shareData({
        title:share.dataset.shareTitle||document.title,
        url:share.dataset.webShare||sectionUrl(share.dataset.webShareSection)
      },share);
      return
    }

    const pr=e.target.closest('[data-print-section]');
    if(pr){
      e.preventDefault();
      printSection(pr.dataset.printSection);
      return
    }

    const img=e.target.closest('[data-export-image]');
    if(img){
      e.preventDefault();
      await exportImage(img.dataset.exportImage,img);
      return
    }
  })
}

document.addEventListener('DOMContentLoaded',()=>{
  wireFold();
  resourceFilters();
  wireActions();

  document.querySelector('[data-expand-all]')?.addEventListener('click',()=>{
    document.querySelectorAll('.fold-heading.folded').forEach(h=>setFold(h,false))
  });
  document.querySelector('[data-collapse-all]')?.addEventListener('click',()=>{
    document.querySelectorAll('.fold-heading:not(.folded)').forEach(h=>setFold(h,true))
  });

  // Opening a shared day link must land on the correct daily card.
  if(location.hash&&location.hash!=='#'){
    const id=decodeURIComponent(location.hash.slice(1));
    const target=document.getElementById(id);
    if(target)setTimeout(()=>target.scrollIntoView({block:'start'}),0)
  }
})
})();

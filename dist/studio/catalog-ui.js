import {PRESETS,CATALOG_CATEGORIES,createPreset,filterPresets} from './catalog-library.mjs?v=cad18';
export function installCatalogLibrary({root,searchInput,categoryRoot,thumbnail,onAdd}){
 let category='Все',queue=[],pending=false;const images=new Map();
 const pump=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;const job=queue.shift();if(job&&job.img.isConnected){const value=images.get(job.p.id)||thumbnail(createPreset(job.p.id));images.set(job.p.id,value);job.img.src=value;}if(queue.length)pump();});};
 const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){observer.unobserve(e.target);const p=PRESETS.find(p=>p.id===e.target.dataset.thumbnail);queue.push({p,img:e.target});pump();}},{root:root.closest('.library'),rootMargin:'180px'});
 categoryRoot.style.flexWrap='wrap';categoryRoot.style.gap='5px';
 categoryRoot.replaceChildren();
 const count=document.createElement('p');count.className='panel-note';count.style.margin='10px 16px';root.before(count);
 for(const name of CATALOG_CATEGORIES){const b=document.createElement('button');b.textContent=name;b.dataset.catalogCategory=name;b.onclick=()=>{category=name;render();};categoryRoot.append(b);}
 function render(){
  const items=filterPresets({category,search:searchInput.value});count.textContent=`${items.length} из ${PRESETS.length} конфигураций`;observer.disconnect();queue=[];root.replaceChildren();
  for(const b of categoryRoot.children)b.setAttribute('aria-pressed',String(b.dataset.catalogCategory===category));
  for(const p of items){const b=document.createElement('button');b.className='catalog-item';b.dataset.catalogPreset=p.id;b.setAttribute('aria-label','Добавить '+p.name);b.title=p.description;
   const img=document.createElement('img');img.dataset.thumbnail=p.id;if(images.has(p.id))img.src=images.get(p.id);img.alt=p.name;observer.observe(img);
   const plus=document.createElement('span');plus.className='add';plus.textContent='+';const name=document.createElement('strong');name.textContent=p.name;const size=document.createElement('small');size.textContent=`${p.config.width} × ${p.config.height} × ${p.config.depth} мм`;
   b.append(img,plus,name,size);root.append(b);
  }
  if(!items.length){const p=document.createElement('p');p.className='panel-note';p.textContent='Ничего не найдено. Измените название или категорию.';root.append(p);}
 }
 root.onclick=e=>{const b=e.target.closest('[data-catalog-preset]');if(b)onAdd(b.dataset.catalogPreset);};searchInput.oninput=render;
 render();return {render,refreshThumbnails(){images.clear();render();}};
}

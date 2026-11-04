import {HANDLE_MODELS,HINGE_MODELS,hardwareKind,hardwareSelection} from './hardware-library.mjs?v=cad18';
import {cleanDetails} from './details.mjs?v=cad18';

const drawings={
 bar:'<path d="M17 35v-8h46v8M23 35v8m34-8v8"/>',
 rail:'<path d="M13 29h54" stroke-width="8"/><path d="M23 32v13m34-13v13"/>',
 knob:'<circle cx="40" cy="29" r="12"/><path d="M35 41v6h10v-6"/>',
 cup:'<path d="M17 39a23 21 0 0 1 46 0Z"/><path d="M24 39a16 12 0 0 1 32 0"/>',
 profile:'<path d="M12 24h56v10H20v9h-8Z"/>',
 none:'<rect x="24" y="15" width="32" height="38" rx="2"/><path d="m17 51 46-42"/>',
 standard:'<circle cx="23" cy="32" r="12"/><path d="M33 24h22v17H33m22-21h10v25H55"/><circle cx="39" cy="32" r="2"/>',
 'soft-close':'<circle cx="22" cy="32" r="12"/><path d="M33 24h23v18H33m23-23h10v27H56"/><rect x="34" y="28" width="19" height="8" rx="3"/>',
 'wide-angle':'<circle cx="17" cy="32" r="11"/><path d="m28 26 15-7 14 13-14 8-15-7m29-9h11v23H57"/><circle cx="43" cy="26" r="3"/>'
};
function icon(id){return `<svg viewBox="0 0 80 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${drawings[id]||''}</svg>`;}

// Call render() from the inspector render cycle, after advanced.render().
export function installHardware({scene,current,advanced,commit,toast}){
 if(!document.querySelector('link[data-hardware-styles]')){
  const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./hardware-ui.css',import.meta.url).href;link.dataset.hardwareStyles='';document.head.append(link);
 }
 const root=document.createElement('section');root.className='hardware-replacements';root.hidden=true;
 root.innerHTML='<div class="hardware-heading"><h3>Заменить фурнитуру</h3><span class="hardware-scope">Эта деталь</span></div><p class="hardware-current" aria-live="polite"></p><div class="hardware-cards" role="group" aria-label="Модель фурнитуры"></div><button type="button" class="hardware-inherit">Ручка как у модуля</button><p class="hardware-note">Обобщённые модели. Присадку и совместимость креплений уточните у мастера.</p>';
 document.querySelector('#part-settings').prepend(root);
 const mount=document.createElement('div');mount.className='hardware-mount';root.append(mount);
 mount.addEventListener('change',e=>{const key=e.target.dataset.mount,m=current(),part=selected();if(!key||!m||m.locked||!part)return;const value=e.target.type==='number'?Number(e.target.value):e.target.value;
  if(e.target.type==='number'&&(!e.target.validity.valid||e.target.value===''))return;
  m.details=cleanDetails({...m.details,[part.id]:{...m.details?.[part.id],[key]:value}});scene.updateModule(m);scene.setPart(part.id);commit();render();});
 const cards=root.querySelector('.hardware-cards'),status=root.querySelector('.hardware-current'),inherit=root.querySelector('.hardware-inherit');
 let renderedKind=null;
 const selected=()=>scene.parts().find(p=>p.id===advanced.selectedPart());
 function render(){
  const m=current(),part=selected(),kind=hardwareKind(part);root.hidden=!m||!kind||m.type==='cad-reference';if(root.hidden)return;
  const models=kind==='handle'?HANDLE_MODELS:HINGE_MODELS,value=hardwareSelection(m,part);
  root.querySelector('h3').textContent=kind==='handle'?'Заменить ручку':'Заменить петлю';
  status.textContent=`Сейчас: ${models.find(v=>v.id===value)?.name||'Как у модуля'}`;
  if(renderedKind!==kind){
   cards.replaceChildren();
   for(const model of models){
    const button=document.createElement('button');button.type='button';button.className='hardware-card';button.dataset.hardwareModel=model.id;button.innerHTML=icon(model.icon);
    const name=document.createElement('strong');name.textContent=model.name;
    const description=document.createElement('span');description.textContent=model.description;
    button.append(name,description);cards.append(button);
   }
   renderedKind=kind;
  }
  for(const button of cards.children){button.setAttribute('aria-pressed',String(button.dataset.hardwareModel===value));button.disabled=!!m.locked;}
  const detail=m.details?.[part.id]||{};
  mount.replaceChildren();
  const field=(label,key,type,value,options)=>{const l=document.createElement('label');l.textContent=label;const input=document.createElement(type==='select'?'select':'input');input.dataset.mount=key;
   if(type==='select'){for(const [v,text] of options){const opt=document.createElement('option');opt.value=v;opt.textContent=text;input.append(opt);}}else{input.type='number';[input.min,input.max,input.step]=options;}
   input.value=value;input.disabled=!!m.locked;l.append(input);mount.append(l);};
  if(kind==='handle'&&['bar','rail'].includes(value)){
   field('Расстояние между винтами, мм','handleSpacing','number',detail.handleSpacing??128,[32,640,1]);
   field('Длина ручки, мм','handleLength','number',detail.handleLength??160,[32,800,1]);
   field('Направление','handleOrientation','select',detail.handleOrientation||'horizontal',[['horizontal','Горизонтально'],['vertical','Вертикально']]);
   field('Положение','mountSide','select',detail.mountSide||'center',[['left','Слева'],['center','По центру'],['right','Справа']]);
  }
  if(kind==='handle'&&value!=='none'&&value!=='profile'){
   const parent=scene.exploder.entries.find(e=>e.node.userData.partId===part.id)?.node?.parent;
   field('Высота от низа фасада, мм','mountHeight','number',detail.mountHeight??Math.round((scene.parts().find(p=>p.id==='door-'+part.id.split('-').at(-1))?.baseSize.height||current().height-100)*.82),[10,2900,1]);
  }
  if(kind==='hinge')field('Центр чашки от края, мм','hingeCupOffset','number',detail.hingeCupOffset??26,[20.5,30,.5]);
  inherit.hidden=kind!=='handle';inherit.disabled=!!m.locked||!m.details?.[part.id]?.handle||m.details[part.id].handle==='inherit';
 }
 function apply(value){
  const m=current(),part=selected(),kind=hardwareKind(part);if(!m||m.locked||!kind)return;
  const models=kind==='handle'?HANDLE_MODELS:HINGE_MODELS;if(value!==null&&!models.some(v=>v.id===value))return;
  m.details||={};const detail={...m.details[part.id]};if(value===null)delete detail[kind];else detail[kind]=value;
  m.details=cleanDetails({...m.details,[part.id]:detail});scene.updateModule(m);scene.setPart(part.id);commit();render();
  toast(kind==='handle'?'Ручка заменена':'Петля заменена');
 }
 cards.addEventListener('click',e=>{const button=e.target.closest('[data-hardware-model]');if(button)apply(button.dataset.hardwareModel);});
 inherit.addEventListener('click',()=>apply(null));
 render();return {render};
}

// Art-directed finishes: scan-based surfaces and physically parameterized coatings.
// Names describe appearance, not a manufacturer's certified product.
const wood=(id,name,type,color,roughness)=>({id,name,category:'Дерево',type,color,roughness,clearcoat:.16,clearcoatRoughness:.35,description:'Натуральный шпон · скан поверхности · масштаб в метрах'});
const enamel=(id,name,color,roughness,clearcoat)=>({id,name,category:'Эмаль',type:'paint',color,roughness,clearcoat,clearcoatRoughness:roughness<.2?.08:.4,description:roughness<.2?'Глянцевая эмаль · выраженные отражения':'Матовая / сатиновая эмаль · мягкий блик'});
const stone=(id,name,type,roughness)=>({id,name,category:'Камень',type,color:'#ffffff',roughness,clearcoat:roughness<.3?.45:.08,clearcoatRoughness:.12,description:'Скан камня · прожилки в физическом масштабе'});
const metal=(id,name,color,roughness,brushed=false)=>({id,name,category:'Металл',type:'metal',color,roughness,brushed,anisotropy:brushed?.65:0,description:brushed?'Сатинирование · направленный микрорельеф':'Полированный металл · отражения окружения'});
const glass=(id,name,color,roughness,fluted=false)=>({id,name,category:'Стекло',type:'glass',color,roughness,fluted,transmission:.95,description:fluted?'Рифление 8 мм · преломление и толщина 6 мм':'Преломление · толщина 6 мм · мягкая тонировка'});
export const MATERIALS=[
 wood('oak-natural','Дуб · натуральный','oak','#ffffff',.44),
 wood('oak-honey','Дуб · медовый','oak','#e7c595',.38),
 wood('oak-smoked','Дуб · копчёный','oak','#968172',.52),
 wood('walnut-natural','Орех · натуральный','walnut','#ffffff',.42),
 wood('walnut-dark','Орех · тёмный','walnut','#ad9681',.46),
 wood('walnut-satin','Орех · сатиновый лак','walnut','#ffffff',.25),
 enamel('enamel-ivory','Эмаль · молочная','#e5e1d5',.48,.08),
 enamel('enamel-sage','Эмаль · шалфей','#939d80',.5,.08),
 enamel('enamel-graphite','Эмаль · графит','#383e3c',.46,.08),
 enamel('enamel-clay','Эмаль · глина','#b47e67',.48,.08),
 enamel('enamel-white-gloss','Глянец · белый','#f5f3ec',.12,1),
 enamel('enamel-black-gloss','Глянец · чёрный','#202422',.1,1),
 stone('marble-honed','Мрамор · матовый','marble',.5),
 stone('marble-polished','Мрамор · полированный','marble',.18),
 stone('stone-grey','Серый камень · матовый','darkstone',.48),
 stone('stone-polished','Серый камень · полированный','darkstone',.18),
 metal('chrome-polished','Хром · полированный','#eceeea',.12),
 metal('steel-brushed','Сталь · шлифованная','#c5c9c7',.32,true),
 metal('brass-brushed','Латунь · шлифованная','#d4b77b',.3,true),
 metal('metal-graphite','Металл · графит','#555958',.34,true),
 {...metal('zinc-satin','Цинк · крепёж','#d4d8d9',.4),microtexture:'zinc',description:'Сатиновое цинковое покрытие · мелкая неоднородность поверхности'},
 {id:'plastic-abs',name:'ABS · чёрный матовый',category:'Полимеры',type:'plastic',color:'#26292b',roughness:.58,clearcoat:0,microtexture:'polymer',description:'Матовый формованный пластик · мелкое зерно'},
 {id:'rubber-black',name:'Резина · чёрная',category:'Полимеры',type:'rubber',color:'#191b1c',roughness:.88,clearcoat:0,microtexture:'rubber',description:'Эластомер · широкий слабый блик · зернистая поверхность'},
 glass('glass-clear','Стекло · прозрачное','#f4faf8',.035),
 glass('glass-smoke','Стекло · дымчатое','#79837e',.06),
 glass('glass-frosted','Стекло · матовое','#e1e8e4',.38),
 glass('glass-fluted','Стекло · рифлёное','#eff6f1',.09,true),
];
export const MATERIAL_BY_ID=Object.fromEntries(MATERIALS.map(m=>[m.id,Object.freeze(m)]));
export const materialExists=id=>Object.hasOwn(MATERIAL_BY_ID,id);
export const materialName=id=>MATERIAL_BY_ID[id]?.name||'';
export const textureAsset=type=>({oak:'oak_veneer_01',walnut:'walnut_veneer_02',marble:'Marble012',darkstone:'grey_cartago_03'})[type];
export function materialSettings(id,overrides={}){
 const p=MATERIAL_BY_ID[id];if(!p)return null;
 return {...p,color:overrides.color??p.color,roughness:overrides.roughness??p.roughness,
  textureScale:overrides.textureScale??1,grain:overrides.grain??0,
  textureOffsetX:overrides.textureOffsetX??0,textureOffsetY:overrides.textureOffsetY??0};
}
export function applyMaterial(modules,sourceId,partId,partKind,scope,material,partsByModule){
 if(material&&!materialExists(material))return 0;
 let count=0;
 for(const m of modules){
  if(m.locked||(scope!=='matching'&&m.id!==sourceId))continue;
  if(['front','body','top','handle'].includes(scope)){m[scope+'Material']=material;m[scope+'Roughness']=null;count++;continue;}
  const targets=scope==='matching'?(partsByModule(m)||[]).filter(p=>p.kind===partKind).map(p=>p.id):[partId];
  for(const id of targets){if(!id)continue;m.details||={};m.details[id]||={};const d=m.details[id];
   // Choosing a complete finish resets the previous optical tweaks, never geometry or mechanisms.
   for(const key of ['finish','color','roughness'])delete d[key];
   if(material)d.material=material;else delete d.material;
   count++;
  }
 }
 return count;
}

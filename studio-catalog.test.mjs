import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {CATALOG,normalizeModule,makePreset,parseProject} from './dist/studio/model.mjs';
const library=await import('./dist/studio/catalog-library.mjs').catch(()=>({}));

test('catalog configurations produce independent, schema-compatible editable modules',()=>{
 assert.equal(typeof library.createPreset,'function');
 assert.ok(library.PRESETS.length>=30);
 const ids=new Set(),signatures=new Set();
 for(const p of library.PRESETS){
  assert.ok(!ids.has(p.id));ids.add(p.id);
  const m=library.createPreset(p.id),again=library.createPreset(p.id);
  assert.notEqual(m.id,again.id);
  assert.ok(CATALOG.some(c=>c.type===m.type));
  assert.deepEqual(normalizeModule(m),m);
  const signature=JSON.stringify([m.type,m.width,m.height,m.depth,m.doors,m.drawers,m.shelves,m.sections,m.style,m.mechanism]);
  assert.ok(!signatures.has(signature),`Duplicate configuration: ${p.id}`);signatures.add(signature);
  m.details.bottom={visible:false};assert.deepEqual(again.details,{});
 }
 const project=makePreset('empty');project.modules=library.PRESETS.map(p=>library.createPreset(p.id));
 assert.deepEqual(parseProject(JSON.stringify(project)),project);
 assert.throws(()=>library.createPreset('missing'));
});

test('search finds dimensions and multiword descriptions within selected room category',()=>{
 assert.equal(typeof library.filterPresets,'function');
 assert.ok(library.filterPresets({category:'Кухня',search:'600 нижний'}).length>0);
 assert.ok(library.filterPresets({category:'Кабинет',search:'книг'}).length>0);
 assert.ok(library.filterPresets({category:'Прихожая'}).every(p=>p.category==='Прихожая'));
 assert.deepEqual(library.filterPresets({search:'несуществующий предмет'}),[]);
 assert.deepEqual(library.filterPresets({category:'unknown'}),[]);
});

test('every catalog configuration builds finite geometry with its advertised shelves and fronts',async()=>{
 assert.equal(typeof library.createPreset,'function');
 registerHooks({resolve(specifier,context,next){return next(specifier==='three'?new URL('./dist/vendor/three.module.js',import.meta.url).href:specifier,context);}});
 const THREE=await import('./dist/vendor/three.module.js');
 // Geometry validation only: browser image decoding is not involved.
 THREE.TextureLoader.prototype.load=function(){return new THREE.Texture();};
 const {buildModule,partList}=await import('./dist/studio/furniture.js');
 for(const p of library.PRESETS){
  const m=library.createPreset(p.id),root=buildModule(m),parts=partList(root);
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
  assert.ok([size.x,size.y,size.z].every(n=>Number.isFinite(n)&&n>0),p.id);
  root.traverse(o=>{if(o.isMesh)assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite),p.id);});
  if(['drawers','dresser'].includes(m.type))assert.equal(parts.filter(p=>p.kind==='drawer').length,m.drawers,p.id);
  else if(!['fridge','oven'].includes(m.type)){
   assert.equal(parts.filter(p=>/^door-\d+$/.test(p.id)).length,m.type==='open'?0:m.doors,p.id);
   assert.equal(parts.filter(p=>/^shelf-\d+$/.test(p.id)).length,m.type==='sink'?0:m.shelves*m.sections,p.id);
  }
 }
});

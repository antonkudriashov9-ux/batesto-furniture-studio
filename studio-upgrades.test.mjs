import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){return next(s==='three'?new URL('./dist/vendor/three.module.js',import.meta.url).href:s,c);}});
const THREE=await import('./dist/vendor/three.module.js');THREE.TextureLoader.prototype.load=function(){return new THREE.Texture();};
const {buildModule,partList}=await import('./dist/studio/furniture.js');
const {createModule,makePreset,parseProject}=await import('./dist/studio/model.mjs');
const {checkOpenings}=await import('./dist/studio/opening-check.js');
const {ExplodedAssembly}=await import('./dist/studio/exploded-view.js');
const find=(root,id)=>{let node;root.traverse(o=>{if(o.isGroup&&o.userData.partId===id)node=o;});return node;};
test('all six new constructions expose unique editable parts and distinct geometry',()=>{
 const signatures=new Set();for(const type of ['corner','bottle','dishwasher','appliance-tower','internal-drawers','baskets']){
  const m=createModule(type),root=buildModule(m),parts=partList(root),ids=parts.map(p=>p.id);assert.equal(new Set(ids).size,ids.length,type+' duplicate part identifiers');
  assert.ok(parts.length>8);const signature=JSON.stringify(parts.map(p=>[p.id,p.baseSize]));assert.ok(!signatures.has(signature),type);signatures.add(signature);
  const p=makePreset('empty');p.modules=[m];assert.equal(parseProject(JSON.stringify(p)).modules[0].type,type);
 }
});
test('mount spacing and orientation change handle geometry and survive export',()=>{
 const m=createModule('base');m.details={'handle-0':{handle:'bar',handleSpacing:96,handleOrientation:'vertical',mountSide:'left'},'hinge-0-top':{hingeCupOffset:24}};
 const root=buildModule(m),h=find(root,'handle-0'),size=new THREE.Box3().setFromObject(h).getSize(new THREE.Vector3());assert.ok(size.y>size.x*2);
 const p=makePreset('empty');p.modules=[m];assert.deepEqual(parseProject(JSON.stringify(p)).modules[0].details,m.details);
});
test('node disassembly hides other meshes, leaves its root fixed and restores visibility',()=>{
 const m=createModule('drawers'),root=buildModule(m),node=find(root,'door-0'),e=new ExplodedAssembly(),base=node.position.clone(),hidden=find(root,'side-left');e.active=true;e.bind(root);e.setScope('door-0');e.setAmount(1);
 assert.deepEqual(node.position,base);let outside=0;hidden.traverse(o=>{if(o.isMesh){assert.equal(o.visible,false);outside++;}});assert.ok(outside>0);
 assert.ok(e.entries.some(p=>e.inScope(p.node)&&p.node.position.distanceTo(p.base)>.01));e.reset();hidden.traverse(o=>{if(o.isMesh)assert.equal(o.visible,true);});assert.deepEqual(node.position,base);
});
test('opening check detects obstacle ahead of drawer without mutating the project',async()=>{
 const p=makePreset('empty'),drawer=createModule('drawers'),obstacle=createModule('base');drawer.x=0;drawer.z=0;obstacle.x=0;obstacle.z=1050;p.modules=[drawer,obstacle];const before=JSON.stringify(p);const result=await checkOpenings(p);
 assert.ok(result.warnings.some(w=>w.moduleId===drawer.id&&w.partId==='door-0'),JSON.stringify(result));assert.equal(JSON.stringify(p),before);
});
test('opening check finds a swinging front near a room edge and respects cancellation',async()=>{
 const p=makePreset('empty'),m=createModule('base');m.z=p.room.depth/2-m.depth/2-80;p.modules=[m];const result=await checkOpenings(p);assert.ok(result.warnings.some(w=>w.moduleId===m.id));
 const c=new AbortController();c.abort();await assert.rejects(checkOpenings(p,{signal:c.signal}),{name:'AbortError'});
});
test('unobstructed isolated cabinet has no external opening warning',async()=>{const p=makePreset('empty');p.modules=[createModule('base')];assert.equal((await checkOpenings(p)).warnings.length,0);});

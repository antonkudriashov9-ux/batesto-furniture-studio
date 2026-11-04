import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){return next(specifier==='three'?new URL('./dist/vendor/three.module.js',import.meta.url).href:specifier,context);}});
const THREE=await import('./dist/vendor/three.module.js');
THREE.TextureLoader.prototype.load=function(){return new THREE.Texture();};
const {buildModule,partList}=await import('./dist/studio/furniture.js');
const {createModule,makePreset,parseProject}=await import('./dist/studio/model.mjs');
const {cleanDetails}=await import('./dist/studio/details.mjs');
const part=(root,id)=>{let found;root.traverse(o=>{if(o.isGroup&&o.userData.partId===id)found=o;});return found;};

test('hinge and handle replacements survive project roundtrip with existing overrides',()=>{
 const p=makePreset('empty'),m=createModule('base');p.modules=[m];
 m.details={'hinge-0-top':{hinge:'soft-close',material:'steel-brushed',width:63,x:7,roughness:.41},'handle-0':{handle:'cup',handleLength:192,color:'#aabbcc',y:12}};
 assert.deepEqual(parseProject(JSON.stringify(p)).modules[0].details,m.details);
 assert.equal(cleanDetails({'hinge-0-top':{hinge:'untrusted'}})['hinge-0-top'].hinge,undefined);
});

test('three hinge replacements build distinct geometry under stable part IDs',()=>{
 const m=createModule('base'),signatures=[];let ids;
 for(const hinge of ['standard','soft-close','wide-angle']){
  m.details={'hinge-0-top':{hinge}};const g=buildModule(m),p=part(g,'hinge-0-top');
  const nextIds=partList(g).map(p=>p.id);if(ids)assert.deepEqual(nextIds,ids);ids=nextIds;
  const meshes=[];p.traverse(o=>{if(o.isMesh)meshes.push([o.geometry.type,o.geometry.attributes.position.count,...o.position.toArray()]);});
  signatures.push(JSON.stringify(meshes));
  assert.equal(part(g,'hinge-0-bottom').userData.hardwareModel,'standard');
  assert.equal(p.userData.hardwareModel,hinge);
 }
 assert.equal(new Set(signatures).size,3);
});

test('replacement hinge respects custom dimensions, material, offsets and visibility',()=>{
 const m=createModule('base');m.details={'hinge-0-top':{hinge:'wide-angle',width:78,height:45,depth:28,material:'enamel-clay',roughness:.7,x:9,visible:false}};
 const g=buildModule(m),p=part(g,'hinge-0-top'),size=new THREE.Box3().setFromObject(p).getSize(new THREE.Vector3());
 for(const [axis,value] of [['x',78],['y',45],['z',28]])assert.ok(Math.abs(size[axis]*1000-value)<.001);
 assert.equal(p.visible,false);
 m.details['hinge-0-top'].x=0;const baseline=part(buildModule(m),'hinge-0-top');assert.ok(Math.abs(p.position.x-baseline.position.x-.009)<1e-9);
 p.traverse(o=>{if(o.isMesh){assert.equal(o.material.userData.profile,'enamel-clay');assert.equal(o.material.roughness,.7);}});
});

test('all handle replacements preserve IDs and hidden handles remain selectable',()=>{
 const m=createModule('base');const signatures=[];
 for(const handle of ['bar','rail','knob','cup','profile','none']){
  m.details={'handle-0':{handle}};const g=buildModule(m),p=part(g,'handle-0');
  assert.ok(partList(g).some(p=>p.id==='handle-0'));
  const meshes=[];p.traverse(o=>{if(o.isMesh)meshes.push([o.geometry.type,o.geometry.parameters,o.position.toArray()]);});signatures.push(JSON.stringify(meshes));
  if(handle==='none')assert.equal(p.children.length,0);
 }
 assert.equal(new Set(signatures).size,6);
});

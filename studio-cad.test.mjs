import test from 'node:test';import assert from 'node:assert/strict';import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){return next(s==='three'?new URL('./dist/vendor/three.module.js',import.meta.url).href:s,c);}});
const THREE=await import('./dist/vendor/three.module.js');THREE.TextureLoader.prototype.load=()=>new THREE.Texture();
const {buildModule,partList}=await import('./dist/studio/furniture.js');const {createModule,normalizeModule}=await import('./dist/studio/model.mjs');const {CAD_REFERENCE:data}=await import('./dist/studio/cad-reference.js');
test('CAD data has valid solid volume, indices, unique ids and declared provenance',()=>{assert.equal(data.manufacturer,null);assert.equal(data.units,'metres');const ids=new Set();for(const p of data.parts){assert.ok(!ids.has(p.id));ids.add(p.id);assert.ok(p.volume>0);const geo=data.geometries[p.geometry];assert.ok(geo.vertices.every(Number.isFinite));assert.ok(geo.indices.every(i=>Number.isInteger(i)&&i>=0&&i<geo.vertices.length/3));}assert.ok(ids.size>40);});
const find=(g,id)=>{let target;g.traverse(o=>{if(o.isGroup&&o.userData.partId===id)target=o;});return target;};
test('CAD drawer telescopic stages travel 0, half and full distance; geometry size remains stable',()=>{const m=createModule('cad-reference'),a=buildModule(m),b=buildModule({...m,open:100});for(let stage=0;stage<3;stage++){const id='runner-0-left-'+stage;assert.ok(Math.abs(find(b,id).position.z-find(a,id).position.z-stage*.225)<1e-8);}assert.deepEqual(partList(a).find(p=>p.id==='drawer-0').baseSize,partList(b).find(p=>p.id==='drawer-0').baseSize);});
test('fixed reference dimensions cannot be silently stretched by project import',()=>{const m=normalizeModule({...createModule('cad-reference'),width:900,height:1400});assert.equal(m.width,600);assert.equal(m.height,870);});

test('rolling cages and balls follow adjacent-stage mean travel; all small hardware is selectable',()=>{
 const a=buildModule(createModule('cad-reference')),b=buildModule({...createModule('cad-reference'),open:100});
 for(const id of ['cage-0-left-0--1','ball-0-left-0--1-0','cage-0-right-1-1','ball-0-right-1-1-5']){
  const p=data.parts.find(p=>p.id===id);assert.ok(p);assert.ok(Math.abs(find(b,id).position.z-find(a,id).position.z-.45*p.motion)<1e-8);
  assert.ok(partList(a).some(p=>p.id===id));
 }
});
test('carcass and facade holes are real openings in the mesh, not dark surface decals',()=>{
 const a=buildModule(createModule('cad-reference'));
 const testRay=(id,origin,direction)=>{const g=find(a,id);g.updateWorldMatrix(true,true);return new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(g,true);};
 assert.equal(testRay('side-right',[.35,.109,.22],[-1,0,0]).length,0);
 assert.ok(testRay('side-right',[.35,.14,.22],[-1,0,0]).length>0);
 assert.equal(testRay('face-0',[.064,.222+.244*.32,.4],[0,0,-1]).length,0);
 assert.ok(testRay('face-0',[.04,.222+.244*.32,.4],[0,0,-1]).length>0);
});
test('CAD fasteners use distinct finishes and share immutable buffers but independent UVs',()=>{
 const a=buildModule(createModule('cad-reference'));
 const mesh=id=>find(a,id).children.find(o=>o.isMesh);
 assert.equal(mesh('screw-0-0').material.userData.profile,'zinc-satin');
 assert.equal(mesh('handle-0').material.userData.profile,'chrome-polished');
 assert.equal(mesh('leg-0-0-pad').material.userData.profile,'rubber-black');
 assert.equal(mesh('screw-0-0').geometry.attributes.position,mesh('screw-1-0').geometry.attributes.position);
 assert.notEqual(mesh('screw-0-0').geometry.attributes.uv,mesh('screw-1-0').geometry.attributes.uv);
 const m=createModule('cad-reference');m.details={'screw-0-0':{material:'brass-brushed'}};
 assert.equal(find(buildModule(m),'screw-0-0').children.find(o=>o.isMesh).material.userData.profile,'brass-brushed');
});

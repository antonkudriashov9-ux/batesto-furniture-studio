import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){return next(specifier==='three'?new URL('./dist/vendor/three.module.js',import.meta.url).href:specifier,context);}});
const THREE=await import('./dist/vendor/three.module.js');
const pbr=await import('./dist/studio/pbr.js');
// Geometry tests do not need decoded pixels; bypass only browser image IO.
THREE.TextureLoader.prototype.load=function(){return new THREE.Texture();};
const {buildModule,partList}=await import('./dist/studio/furniture.js');
const {createModule}=await import('./dist/studio/model.mjs');
const {normalizeRoom}=await import('./dist/studio/details.mjs');
const {proRoomGeometry}=await import('./dist/studio/room-pro-render.js');
const part=(root,id)=>{let found;root.traverse(o=>{if(o.isGroup&&o.userData.partId===id)found=o;});return found;};
test('resizing a part preserves physical grain density and does not compound UV changes',()=>{
 const g=new THREE.Group(),m=pbr.box(g,.6,.8,.02,0,0,0,pbr.pbr('paint'),false);
 const uv=Array.from(m.geometry.attributes.uv.array);g.scale.x=2;
 assert.equal(typeof pbr.refreshPhysicalUV,'function');pbr.refreshPhysicalUV(g);
 const scaled=Array.from(m.geometry.attributes.uv.array);
 const n=m.geometry.attributes.normal;
 for(let i=0;i<n.count;i++)if(Math.abs(n.getZ(i))>.9){assert.ok(Math.abs(scaled[i*2]-uv[i*2]*2)<1e-6);assert.equal(scaled[i*2+1],uv[i*2+1]);}
 pbr.refreshPhysicalUV(g);assert.deepEqual(Array.from(m.geometry.attributes.uv.array),scaled);
 g.scale.x=1;pbr.refreshPhysicalUV(g);assert.deepEqual(Array.from(m.geometry.attributes.uv.array),uv);
});
test('explicit per-part legacy finish overrides module profile and does not paint hinges',()=>{
 const m=createModule('base');m.frontMaterial='oak-natural';m.details['door-0']={finish:'paint',color:'#ff0000'};
 const g=buildModule(m),door=part(g,'door-0');let front;
 door.traverse(o=>{if(o.isMesh&&o.userData.partId==='door-0')front=o;});
 assert.equal(front.material.userData.type,'paint');assert.equal(front.material.color.getHexString(),'ff0000');
 const hinge=part(g,'hinge-0-top');assert.equal(hinge.children[0].material.metalness,1);
});
test('refrigerator shelves and carcass accept independent material profiles',()=>{
 const m=createModule('fridge');m.details['fridge-shelf-1']={material:'enamel-ivory'};m.details['appliance-body']={material:'steel-brushed'};
 const g=buildModule(m);assert.equal(part(g,'fridge-shelf-1').children[0].material.userData.profile,'enamel-ivory');
 assert.equal(part(g,'appliance-body').children[0].material.userData.profile,'steel-brushed');
});
test('opening does not change part dimensions used by the size editor',()=>{
 const m=createModule('base');const closed=partList(buildModule(m));m.open=100;const opened=partList(buildModule(m));
 assert.deepEqual(opened.find(p=>p.id==='door-0').baseSize,closed.find(p=>p.id==='door-0').baseSize);
});
test('module roughness override affects inherited profiles, not an independently selected detail profile',()=>{
 const m=createModule('base');m.frontMaterial='enamel-ivory';m.frontRoughness=.8;
 let g=buildModule(m),mesh;part(g,'door-0').traverse(o=>{if(o.isMesh&&o.userData.partId==='door-0')mesh=o;});assert.equal(mesh.material.roughness,.8);
 m.details['door-0']={material:'enamel-white-gloss'};g=buildModule(m);part(g,'door-0').traverse(o=>{if(o.isMesh&&o.userData.partId==='door-0')mesh=o;});assert.equal(mesh.material.roughness,.12);
});
test('physical offsets also apply to legacy wood, without requiring a library profile',()=>{
 const m=createModule('base');m.front='oak';m.details['door-0']={textureOffsetX:183,textureOffsetY:-183};
 const g=buildModule(m);let mesh;part(g,'door-0').traverse(o=>{if(o.isMesh&&o.userData.partId==='door-0')mesh=o;});
 assert.ok(Math.abs(mesh.material.map.offset.x-.1)<1e-6);assert.ok(Math.abs(mesh.material.map.offset.y+.1)<1e-6);
});
test('polygon room renders library wall finish and backsplash without covering a window',()=>{
 const r=normalizeRoom({width:5000,depth:4000,height:2800,wallProfile:'enamel-clay',backsplash:'marble',backsplashProfile:'marble-polished',openings:[{id:'test-window',type:'window',wallIndex:0,offset:1500,width:1000,sill:1000,height:900}]});
 const root=new THREE.Group();proRoomGeometry(root,r,{});const splash=[],walls=[];
 root.traverse(o=>{if(o.isMesh&&o.userData.surface==='backsplash')splash.push(o);if(o.isMesh&&o.material.userData.profile==='enamel-clay')walls.push(o);});
 assert.ok(splash.length>0);assert.ok(walls.length>0);
 for(const mesh of splash){assert.equal(mesh.material.userData.profile,'marble-polished');const bounds=new THREE.Box3().setFromObject(mesh);assert.ok(!(bounds.min.x<-0.001&&bounds.max.x>-.999&&bounds.min.y<1.9&&bounds.max.y>1.001),'backsplash must not cover window');}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanDetails} from './dist/studio/details.mjs';
import {createModule,makePreset,parseProject} from './dist/studio/model.mjs';
import {applyMaterial,materialSettings} from './dist/studio/material-library.mjs';

test('material settings and edge treatment survive project round trip without losing part transforms',()=>{
 const p=makePreset('empty'),m=createModule('base');p.modules.push(m);
 m.frontMaterial='oak-natural';m.handleMaterial='brass-brushed';m.grainMatch=true;
 m.frontRoughness=.7;p.room.floorProfile='stone-grey';p.room.wallProfile='enamel-ivory';
 m.details['door-0']={material:'walnut-natural',edgeMaterial:'enamel-ivory',edgeThickness:1.5,textureOffsetX:120,textureOffsetY:-80,x:20,width:750};
 const copy=parseProject(JSON.stringify(p)).modules[0];
 assert.equal(copy.frontMaterial,'oak-natural');assert.equal(copy.handleMaterial,'brass-brushed');assert.equal(copy.grainMatch,true);
 assert.equal(copy.frontRoughness,.7);assert.equal(parseProject(JSON.stringify(p)).room.floorProfile,'stone-grey');
 assert.deepEqual(copy.details['door-0'],m.details['door-0']);
});
test('batch finish application respects locked modules and preserves mechanics and geometry',()=>{
 const a=createModule('base'),b=createModule('base');b.locked=true;
 a.details['door-0']={width:700,open:62,color:'#ff0000',roughness:.1};
 assert.equal(applyMaterial([a,b],a.id,'door-0','door','matching','oak-natural',()=>[{id:'door-0',kind:'door'},{id:'handle-0',kind:'handle'}]),1);
 assert.deepEqual(a.details['door-0'],{width:700,open:62,material:'oak-natural'});
 assert.equal(b.details['door-0'],undefined);assert.equal(a.details['handle-0'],undefined);
 assert.equal(materialSettings('oak-natural').color,'#ffffff');
 assert.equal(materialSettings('oak-natural',{color:'#bb8877'}).color,'#bb8877');
});
test('untrusted material overrides cannot add arbitrary IDs or out of range edge and texture values',()=>{
 const d=cleanDetails({'door-0':{material:'unknown',edgeMaterial:'<script>',edgeThickness:90,textureOffsetX:Infinity,textureOffsetY:-100000}})['door-0'];
 assert.deepEqual(d,{});
});

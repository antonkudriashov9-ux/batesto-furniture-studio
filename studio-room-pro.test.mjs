import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePolygon,pointInPolygon,roomVertices,clampOpening,calibratePlan,normalizeRoomExtensions,roomDiagnostics,effectiveOpenings} from './dist/studio/room-pro.mjs';
import {normalizeRoom} from './dist/studio/details.mjs';

const l=[{x:0,z:0},{x:4000,z:0},{x:4000,z:2000},{x:2000,z:2000},{x:2000,z:4000},{x:0,z:4000}];
test('accepts either winding of a simple L and rejects crossed, duplicate and zero area outlines',()=>{
  assert.equal(validatePolygon(l).valid,true);
  assert.equal(validatePolygon([...l].reverse()).valid,true);
  assert.equal(validatePolygon([{x:0,z:0},{x:1000,z:1000},{x:0,z:1000},{x:1000,z:0}]).valid,false);
  assert.equal(validatePolygon([{x:0,z:0},{x:1000,z:0},{x:1000,z:0},{x:0,z:1000}]).valid,false);
  assert.equal(validatePolygon([{x:0,z:0},{x:500,z:0},{x:1000,z:0}]).valid,false);
});
test('inside checks respect concave notch and include wall boundary',()=>{
  assert.equal(pointInPolygon({x:500,z:3500},l),true);
  assert.equal(pointInPolygon({x:3000,z:3000},l),false);
  assert.equal(pointInPolygon({x:2000,z:3000},l),true);
});
test('opening remains inside its wall and room height even for hostile input',()=>{
  const o=clampOpening({width:99999,height:99999,sill:9999,offset:-100,type:'window'},1600,2400);
  assert.ok(o.width<=1600&&o.offset>=0&&o.offset+o.width<=1600);
  assert.ok(o.height>=100&&o.sill+o.height<=2400);
  assert.equal(clampOpening({sill:900,type:'door'},2000,2400).sill,0);
});
test('two point calibration computes mm per pixel and rejects coincident points',()=>{
  assert.equal(calibratePlan({x:0,y:0},{x:300,y:400},2500).mmPerPixel,5);
  assert.throws(()=>calibratePlan({x:2,y:2},{x:2,y:2},1000));
  assert.throws(()=>calibratePlan({x:0,y:0},{x:2,y:2},0));
});
test('normalization roundtrips all room extensions without retaining unsafe image URLs',()=>{
  const raw={vertices:l,openings:[{wallIndex:0,type:'window',width:800,height:600,sill:900,offset:300}],wallFinishes:[{wallIndex:0,color:'#123456',material:'oak'}],obstacles:[{id:'a',x:100,z:200,width:300,depth:400,height:2000,type:'column'}],services:[{type:'socket',label:'Розетка',x:100,y:900,z:0}],planImage:{src:'https://host/private.png',mmPerPixel:5}};
  const normalized=normalizeRoom(raw);
  assert.deepEqual(normalized.vertices,l);
  assert.equal(normalized.wallFinishes[0].color,'#123456');
  assert.equal(normalized.openings[0].width,800);
  assert.equal(normalized.obstacles[0].width,300);
  assert.equal(normalized.services[0].label,'Розетка');
  assert.equal(normalized.planImage,null);
  assert.equal(normalizeRoom({}).width,5000);
  assert.equal(roomVertices(normalizeRoom({})).length,4);
  assert.equal(normalizeRoomExtensions({vertices:[{x:0,z:0}]}).vertices,null);
});
test('legacy openings are converted along correct directed walls and explicit openings coexist',()=>{
  const r=normalizeRoom({window:true,windowWidth:1000,windowX:200,door:true,doorWidth:800,doorZ:400,openings:[{wallIndex:1,type:'opening',offset:200,width:600,height:2000}]});
  const ops=effectiveOpenings(r);
  assert.equal(ops.length,3);
  assert.equal(ops.find(o=>o.id==='legacy-window').offset,2200);
  assert.equal(ops.find(o=>o.id==='legacy-door').wallIndex,3);
  assert.equal(ops.find(o=>o.id==='legacy-door').offset,1200);
});
test('room diagnostics catches concave exits, column collisions and overlapping openings',()=>{
  const r=normalizeRoom({vertices:l,obstacles:[{id:'c',x:500,z:500,width:600,depth:600,height:2800}],openings:[{wallIndex:0,offset:0,width:1200,height:2000},{wallIndex:0,offset:500,width:1000,height:2000}]});
  const modules=[{id:'outside',name:'A',x:3000,z:3000,y:0,width:600,depth:600,height:800,rotation:0},{id:'hit',name:'B',x:500,z:500,y:0,width:600,depth:600,height:800,rotation:0}];
  const warnings=roomDiagnostics(r,modules);
  assert.ok(warnings.some(w=>w.code==='outside'&&w.moduleId==='outside'));
  assert.ok(warnings.some(w=>w.code==='obstacle'&&w.moduleId==='hit'));
  assert.ok(warnings.some(w=>w.code==='openings-overlap'));
});

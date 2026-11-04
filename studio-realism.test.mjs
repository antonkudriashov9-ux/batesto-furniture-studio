import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRoom} from './dist/studio/details.mjs';
import {makePreset,parseProject} from './dist/studio/model.mjs';

test('lighting choices survive project export and import without changing furniture',()=>{
  const p=makePreset('straight');
  p.room.lighting='warm'; p.room.environmentRotation=135; p.room.environmentIntensity=.9;
  const restored=parseProject(JSON.stringify(p));
  assert.equal(restored.room.lighting,'warm');
  assert.equal(restored.room.environmentRotation,135);
  assert.equal(restored.room.environmentIntensity,.9);
  assert.deepEqual(restored.modules,p.modules);
});
test('invalid lighting import cannot create non-finite or negative lighting',()=>{
  const r=normalizeRoom({lighting:'unknown',environmentRotation:Infinity,environmentIntensity:-5});
  assert.equal(r.lighting,'studio');
  assert.equal(r.environmentRotation,0);
  assert.equal(r.environmentIntensity,0);
});


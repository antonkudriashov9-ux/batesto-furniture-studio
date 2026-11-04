import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDimensions, buildBrief, restoreDraft} from './dist/project.mjs';
test('rejects blank, nonfinite and implausible dimensions',()=>{for(const width of ['',0,-1,Infinity,'bad',12000])assert.ok(validateDimensions({width,height:2600,depth:600}));assert.equal(validateDimensions({width:3200,height:2600,depth:600}),'');});
test('brief carries dimensions, layout, finish and selected extras',()=>{const t=buildBrief({type:'Кухня',layout:'Угловая',width:3200,height:2600,depth:600,finish:'Орех',extras:['Подсветка'],city:'Липецк',name:'Антон',notes:'Без верхних шкафов',budget:'Обсудим'}); for(const s of ['3200','2600','600','Угловая','Орех','Подсветка','Липецк','Без верхних шкафов'])assert.ok(t.includes(s));});
test('corrupt or obsolete saved data does not break configurator',()=>{assert.equal(restoreDraft('{'),null);assert.equal(restoreDraft('{"version":99}'),null);assert.equal(restoreDraft('{"version":2,"project":{"type":"<script>"}}'),null);});

import * as THREE from 'three';
import {buildModule} from './furniture.js?v=cad18';
import {roomVertices,polygonInside} from './room-pro.mjs?v=cad18';
const bounds=o=>new THREE.Box3().setFromObject(o);
function dispose(root){root.traverse(o=>o.geometry?.dispose());}
function pose(m,open,ids=[]){const details=structuredClone(m.details||{});for(const d of Object.values(details))d.open=open;for(const id of ids)details[id]={...details[id],open};return {...m,open,details};}
function nodeMap(root){const map=new Map();root.traverse(o=>{if(o.isGroup&&o.userData.partId)map.set(o.userData.partId,o);});return map;}
function overlap(a,b){return a.clone().expandByScalar(-.003).intersectsBox(b);}
// Sampled world bounds: intentionally conservative, not a machining clearance solver.
export async function checkOpenings(project,{onProgress=()=>{},signal}={}){
 const modules=project.modules.filter(m=>m.visible!==false),roots=[],warnings=[],room=roomVertices(project.room);
 try{
  for(const m of modules){if(signal?.aborted)throw new DOMException('Проверка отменена','AbortError');roots.push(buildModule(pose(m,0)));await new Promise(resolve=>setTimeout(resolve,0));}
  const obstacles=roots.map((r,i)=>({box:bounds(r),id:modules[i].id,name:modules[i].name}));
  for(const o of project.room.obstacles||[]){const mesh=new THREE.Mesh(new THREE.BoxGeometry(o.width/1000,o.height/1000,o.depth/1000));mesh.position.set(o.x/1000,o.height/2000,o.z/1000);mesh.rotation.y=o.rotation*Math.PI/180;obstacles.push({box:bounds(mesh),id:o.id,name:'выступ / колонна'});mesh.geometry.dispose();mesh.material.dispose();}
  for(let i=0;i<modules.length;i++){
   if(signal?.aborted)throw new DOMException('Проверка отменена','AbortError');
   const m=modules[i],root=roots[i],closed=nodeMap(root),ids=[...closed].filter(([,n])=>['door','drawer'].includes(n.userData.kind)).map(([id])=>id),opened=buildModule(pose(m,100,ids)),open=nodeMap(opened);
   try{for(const [id,node] of closed){
    if(!['door','drawer'].includes(node.userData.kind)||!open.has(id)||node.visible===false)continue;
    const moving=node.children.find(o=>o.userData.restPose)||node,openNode=open.get(id),end=openNode.children.find(o=>o.userData.restPose)||openNode,position=moving.position.clone(),quaternion=moving.quaternion.clone();
    if(position.distanceTo(end.position)<.0001&&quaternion.angleTo(end.quaternion)<.0001)continue;
    const start=bounds(node),baseline=new Set(obstacles.filter(o=>o.id!==m.id&&overlap(start,o.box)).map(o=>o.id));
    let found;
    for(let step=1;step<=20&&!found;step++){
     const ratio=step/20;moving.position.lerpVectors(position,end.position,ratio);moving.quaternion.slerpQuaternions(quaternion,end.quaternion,ratio);root.updateWorldMatrix(true,true);
     const box=bounds(node),poly=[[box.min.x,box.min.z],[box.max.x,box.min.z],[box.max.x,box.max.z],[box.min.x,box.max.z]].map(([x,z])=>({x:x*1000,z:z*1000}));
     const obstacle=obstacles.find(o=>o.id!==m.id&&!baseline.has(o.id)&&overlap(box,o.box));
     const outside=box.min.y<-.003||box.max.y>project.room.height/1000+.003||!polygonInside(poly,room);
     if(obstacle||outside)found={moduleId:m.id,partId:id,percent:step*5,message:`${m.name} · ${node.userData.label||id}: при открывании ${step*5}% возможно пересечение ${obstacle?'с «'+obstacle.name+'»':'с границей комнаты'}.`};
    }
    moving.position.copy(position);moving.quaternion.copy(quaternion);root.updateWorldMatrix(true,true);if(found)warnings.push(found);
   }}finally{dispose(opened);}
   onProgress(i+1,modules.length);await new Promise(resolve=>setTimeout(resolve,0));
  }
  return {warnings,checked:modules.length,samples:20};
 }finally{roots.forEach(dispose);}
}

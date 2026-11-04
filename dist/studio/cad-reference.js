import * as THREE from 'three';
import data from '../assets/cad/reference-600.mjs?v=cad18';
import {physicalUV,refreshPhysicalUV,libraryMaterial} from './pbr.js?v=cad18';
export const CAD_REFERENCE=data;
// Reuse immutable vertex/index/normal buffers for identical CAD solids. UVs stay
// per instance because detail scale and physical texture placement are editable.
const buffers=new Map();
function partGeometry(p){
 let source=buffers.get(p.geometry);
 if(!source){const geo=data.geometries[p.geometry];source=new THREE.BufferGeometry();source.setAttribute('position',new THREE.Float32BufferAttribute(geo.vertices,3));source.setIndex(geo.indices);source.computeVertexNormals();buffers.set(p.geometry,source);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',source.attributes.position);geometry.setAttribute('normal',source.attributes.normal);geometry.setIndex(source.index);geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(source.attributes.position.count*2),2));return physicalUV(geometry,new THREE.Vector3(...p.position));
}
export function buildCADReference(m,{makePart,partMat}){
 const root=new THREE.Group();root.userData.moduleId=m.id;root.name=m.name;
 function add(parent,p,travel=0){return makePart(parent,m,p.id,p.label,p.kind,(g,o)=>{
  g.userData.materialHandled=true;g.userData.cadSource='Batesto / OCCT';
  const geometry=partGeometry(p);
  const finishes={metal:'steel-brushed',chrome:'chrome-polished',zinc:'zinc-satin',dark:'plastic-abs',rubber:'rubber-black'};
  const material=finishes[p.finish]?libraryMaterial(o.material||(p.kind==='handle'&&m.handleMaterial)||finishes[p.finish],o):partMat(m,p.id,p.finish);
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);g.position.fromArray(p.position);
  g.userData.restPose={position:g.position.clone().add(new THREE.Vector3(0,0,travel)),quaternion:g.quaternion.clone()};
 });}
 for(const p of data.parts.filter(p=>p.drawer===null))add(root,p);
 for(let i=0;i<3;i++){
  const id='drawer-'+i,travel=(m.details?.[id]?.open??m.open)/100*.45;
  makePart(root,m,id,'Ящик '+(i+1),'drawer',g=>{for(const p of data.parts.filter(p=>p.drawer===i))add(g,p,travel*p.motion);});
 }
 refreshPhysicalUV(root);root.traverse(o=>{if(o.userData.restPose)o.position.copy(o.userData.restPose.position);});
 root.position.set(m.x/1000,m.y/1000,m.z/1000);root.rotation.y=m.rotation*Math.PI/180;root.visible=m.visible;return root;
}

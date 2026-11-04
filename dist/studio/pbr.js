import * as THREE from 'three';
import {RoundedBoxGeometry} from '../vendor/RoundedBoxGeometry.js';
import {materialSettings} from './material-library.mjs?v=cad18';
const loader=new THREE.TextureLoader(),baseMaps=new Map(),materials=new Map();
const assets={oak:'oak_veneer_01',walnut:'walnut_veneer_02',woodfloor:'wood_floor',marble:'Marble012',darkstone:'grey_cartago_03',concrete:'concrete_floor_02',plaster:'white_plaster_02',tile:'marble_01'};
// Physical scan widths in metres, from Poly Haven metadata (Marble012 uses a 1 m design scale).
const scanWidths={oak:1.83,walnut:1,woodfloor:1.7,marble:1,darkstone:.93,concrete:2,plaster:1,tile:1.5};
export const assetLoads=[];
const textureCopies=new Map();
function baseMap(asset,kind){const key=asset+kind;if(baseMaps.has(key))return baseMaps.get(key);const t=loader.load(`../assets/pbr/${asset}_${kind}.jpg`,()=>{for(const copy of textureCopies.get(key)||[])copy.needsUpdate=true;});t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(kind==='diff')t.colorSpace=THREE.SRGBColorSpace;baseMaps.set(key,t);return t;}
export function pbr(type='paint',color='#ffffff',roughness=.5,scale=1,rotation=0,profile={}){const key=JSON.stringify([type,color,roughness,scale,rotation,profile]);if(materials.has(key))return materials.get(key);const options={color,roughness,metalness:type==='metal'?1:0,envMapIntensity:1};if(type==='glass'){Object.assign(options,{color:color==='#ffffff'?'#f4faf8':color,roughness:profile.id?roughness:.06,transmission:.94,thickness:.006,ior:1.5,transparent:true,opacity:1,metalness:0,depthWrite:false,attenuationColor:'#c7ded5',attenuationDistance:.6});}if(type==='paint'){options.clearcoat=.08;options.clearcoatRoughness=.45;}if(type==='lacquer'){options.roughness=Math.max(.08,roughness*.38);options.clearcoat=1;options.clearcoatRoughness=.08;}if(type==='plastic'){options.roughness=Math.max(.18,roughness*.65);options.clearcoat=.35;options.clearcoatRoughness=.2;}const mat=new THREE.MeshPhysicalMaterial(options);const asset=assets[type];if(asset){for(const [kind,prop] of [['diff','map'],['nor_gl','normalMap'],['rough','roughnessMap']]){if(type==='plaster'&&kind==='diff')continue;const base=baseMap(asset,kind),tex=new THREE.Texture();tex.source=base.source;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=8;tex.colorSpace=base.colorSpace;const copies=textureCopies.get(asset+kind)||[];copies.push(tex);textureCopies.set(asset+kind,copies);if(base.image)tex.needsUpdate=true;tex.repeat.setScalar(scale/scanWidths[type]);tex.center.set(0,0);tex.rotation=(rotation+(type==='walnut'?90:0))*Math.PI/180;mat[prop]=tex;}mat.normalScale.setScalar(type==='plaster'?.045:type==='marble'?.07:.16);mat.roughness=Math.min(1,roughness*1.5);mat.clearcoat=['oak','walnut','woodfloor','marble','darkstone'].includes(type)?.15:0;mat.clearcoatRoughness=.35;}if(profile.id){mat.roughness=asset?Math.min(1,roughness*1.5):roughness;mat.clearcoat=profile.clearcoat??0;mat.clearcoatRoughness=profile.clearcoatRoughness??.35;if(profile.anisotropy)mat.anisotropy=profile.anisotropy;if(profile.brushed||profile.fluted){const tex=microNormal(profile.fluted?'fluted':'brushed');mat.normalMap=tex;mat.normalScale.setScalar(profile.fluted?.55:.16);}if(type==='glass'){mat.attenuationColor.set(color);mat.attenuationDistance=profile.id==='glass-smoke'?.025:.6;mat.transmission=profile.transmission??.95;}}if(profile.microtexture){const maps=microSurface(profile.microtexture);mat.normalMap=maps.normal.clone();mat.roughnessMap=maps.roughness.clone();mat.normalScale.setScalar(profile.microtexture==='rubber'?.12:.07);mat.roughness=Math.min(1,roughness*1.1);}for(const tex of [mat.map,mat.normalMap,mat.roughnessMap])if(tex&&!profile.brushed&&!profile.fluted)tex.offset.set((profile.textureOffsetX||0)/1000*scale/(scanWidths[type]||1),(profile.textureOffsetY||0)/1000*scale/(scanWidths[type]||1));mat.userData={type,scale,rotation,profile:profile.id,cached:true};materials.set(key,mat);return mat;}
// Physical-size UVs keep grain density consistent between differently sized parts.
export function physicalUV(geo,offset=new THREE.Vector3(),scale=new THREE.Vector3(1,1,1)){geo.userData.physicalOffset=offset.clone();const pos=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;for(let i=0;i<pos.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));if(ny>nx&&ny>nz)uv.setXY(i,(pos.getX(i)+offset.x)*scale.x,(pos.getZ(i)+offset.z)*scale.z);else if(nx>nz)uv.setXY(i,(pos.getZ(i)+offset.z)*scale.z,(pos.getY(i)+offset.y)*scale.y);else uv.setXY(i,(pos.getX(i)+offset.x)*scale.x,(pos.getY(i)+offset.y)*scale.y);}uv.needsUpdate=true;return geo;}
export function box(parent,w,h,d,x,y,z,mat,rounded=true){const geo=physicalUV(rounded?new RoundedBoxGeometry(Math.max(.001,w),Math.max(.001,h),Math.max(.001,d),2,Math.min(.0015,w/8,h/8,d/8)):new THREE.BoxGeometry(Math.max(.001,w),Math.max(.001,h),Math.max(.001,d)),new THREE.Vector3(x,y,z));const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=mat.userData.type!=='glass';o.receiveShadow=true;parent.add(o);return o;}
export function cyl(parent,r,h,x,y,z,mat,axis='y'){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),mat);mesh.position.set(x,y,z);if(axis==='x')mesh.rotation.z=Math.PI/2;if(axis==='z')mesh.rotation.x=Math.PI/2;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export function finishMaterial(key,color,roughness=.5,scale=1,rotation=0,settings={}){if(key==='oak'||key==='walnut')return pbr(key,settings.color||'#ffffff',roughness,scale,rotation,settings);return pbr('paint',color,roughness,scale,rotation,settings);}

const microMaps=new Map();
function microNormal(kind){
 if(microMaps.has(kind))return microMaps.get(kind);
 const size=256,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4;
  // Tangent-space periodic microstructure. No random per-frame noise.
  const nx=kind==='fluted'?Math.sin(x/size*Math.PI*16)*.65:0;
  const ny=kind==='brushed'?Math.sin(y*2.399)*.13+Math.sin(y*.73)*.06:0;
  data[i]=Math.round(128+nx*127);data[i+1]=Math.round(128+ny*127);data[i+2]=Math.round(128+Math.sqrt(1-nx*nx-ny*ny)*127);data[i+3]=255;
 }
 const tex=new THREE.DataTexture(data,size,size);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
 // Eight flutes per tile: tile width 64 mm -> 8 mm pitch.
 tex.repeat.set(kind==='fluted'?15.625:1,kind==='fluted'?1:120);
 tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.anisotropy=8;tex.needsUpdate=true;microMaps.set(kind,tex);return tex;
}
export function libraryMaterial(id,overrides={}){const p=materialSettings(id,overrides);return p?pbr(p.type,p.color,p.roughness,p.textureScale,p.grain,p):null;}
export function refreshPhysicalUV(root){
 root.updateWorldMatrix(true,true);
 root.traverse(o=>{if(!o.isMesh||!o.geometry.userData.physicalOffset)return;
  const scale=o.getWorldScale(new THREE.Vector3());
  physicalUV(o.geometry,o.geometry.userData.physicalOffset,scale);
 });
}
export function offsetPhysicalUV(root,offset){root.traverse(o=>{const origin=o.geometry?.userData.physicalOffset;if(origin){origin.add(offset);physicalUV(o.geometry,origin);}});}

// Deterministic, tileable micrograin in a 32 mm physical tile. Mipmaps prevent
// sparkling when a small fastener or polymer part is seen from across the room.
const surfaceMaps=new Map();
function microSurface(kind){
 if(surfaceMaps.has(kind))return surfaceMaps.get(kind);
 const size=128,height=new Float32Array(size*size);let seed=173;
 for(let i=0;i<height.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;height[i]=seed/4294967296;}
 const normal=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
 const at=(x,y)=>height[((y+size)%size)*size+(x+size)%size];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4,nx=(at(x-1,y)-at(x+1,y))*.35,ny=(at(x,y-1)-at(x,y+1))*.35;
  normal.set([128+Math.round(nx*127),128+Math.round(ny*127),Math.round(128+Math.sqrt(1-nx*nx-ny*ny)*127),255],i);
  const value=Math.round(210+at(x,y)*45);rough.set([value,value,value,255],i);
 }
 const texture=bytes=>{const t=new THREE.DataTexture(bytes,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.setScalar(31.25);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=8;t.needsUpdate=true;return t;};
 const maps={normal:texture(normal),roughness:texture(rough)};surfaceMaps.set(kind,maps);return maps;
}

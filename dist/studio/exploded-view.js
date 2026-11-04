import * as THREE from 'three';
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
// cubic-bezier(.77,0,.175,1): deliberate, reversible spatial transition.
function ease(t){if(t<=0)return 0;if(t>=1)return 1;let lo=0,hi=1,u=t;for(let i=0;i<16;i++){u=(lo+hi)/2;const x=3*(1-u)**2*u*.77+3*(1-u)*u*u*.175+u**3;if(x<t)lo=u;else hi=u;}return 3*(1-u)*u*u+u**3;}
function separation(id,kind,index,count,size,layout){
 const v=new THREE.Vector3(),s=Math.max(.55,Math.min(1.2,size));
 if(layout==='layers'){v.z=(kind==='handle'?.65:kind==='hardware'?.35:kind==='door'||kind==='drawer'?.65:kind==='worktop'?.15:-.25)*s;if(kind==='worktop')v.y=s*.4;if(id.includes('left'))v.x=-s*.5;if(id.includes('right'))v.x=s*.5;return v;}
 // CAD joints separate along their insertion axes, clear of their mating panel.
 if(id.startsWith('confirmat-')||id.includes('-dowel-')){v.x=(id.includes('left')?-1:1)*s*1.1;return v;}
 if(id.startsWith('worktop-screw-')){v.y=-s*.4;return v;}
 if(id.startsWith('leg-')){v.y=-s*(id.includes('-screw-')?.25:id.endsWith('-plate')?.3:id.endsWith('-spindle')?.65:id.endsWith('-foot')?.8:id.endsWith('-pad')?.95:.5);return v;}
 if(id.startsWith('face-')){v.z=s*.5;return v;}
 if(id.startsWith('screw-')||id.startsWith('front-screw-')){v.z=-s*.45;return v;}
 if(id.startsWith('ball-')||id.startsWith('cage-')){v.x=(id.includes('left')?-1:1)*s*(id.startsWith('ball-')?1.22:1.07);return v;}
 if(id.includes('runner')){v.x=(id.includes('left')?-1:1)*s*.95;v.z=s*.12;return v;}
 if(id.includes('left'))v.x=-s*.65;else if(id.includes('right'))v.x=s*.65;
 else if(id==='back'||id.endsWith('-back'))v.z=-s*.45;
 else if(id==='worktop')v.y=s*.65;
 else if(id==='carcass-top')v.y=s*.3;
 else if(id==='bottom'||id.endsWith('-bottom'))v.y=-s*.3;
 else if(id==='plinth'||kind==='support')v.y=-s*.5;
 else if(kind==='door'||kind==='drawer')v.z=s*.8;
 else if(kind==='handle')v.z=s*.32;
 else if(kind==='hardware'){v.x=id.includes('top')?-s*.2:s*.2;v.z=-s*.25;}
 else if(kind==='insert'){v.z=s*.3;}
 else if(kind==='shelf'){v.x=s*.4;v.z=s*.2;}
 else if(kind==='light')v.z=s*.5;
 else {v.x=(index%2?1:-1)*s*.35;v.z=s*.3;}
 return v;
}
export class ExplodedAssembly{
 constructor(){this.scopeId=null;this.visibility=new Map();this.amount=0;this.level='assemblies';this.active=false;this.layout='spatial';this.entries=[];this.root=null;this.animation=null;this.showGuides=true;this.guides=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:'#93a68a',transparent:true,opacity:.3,dashSize:.035,gapSize:.025,depthWrite:false}));this.guides.visible=false;}
 restore(){for(const e of this.entries)e.node.position.copy(e.base);}
 bind(root){this.restoreVisibility();this.restore();this.root=root;this.entries=[];if(!root){this.guides.visible=false;return;}
  root.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.isEmpty()?.8:bounds.getSize(new THREE.Vector3()).length()*.5;
  const nodes=[];root.traverse(o=>{if(o.isGroup&&o.userData.partId)nodes.push(o);});
  for(let i=0;i<nodes.length;i++){const node=nodes[i],b=new THREE.Box3().setFromObject(node),center=b.isEmpty()?node.getWorldPosition(new THREE.Vector3()):b.getCenter(new THREE.Vector3());
   let parent=node.parent,nested=false;while(parent&&parent!==root){if(parent.userData.partId)nested=true;parent=parent.parent;}
   const stage=nested?.55:['door','drawer'].includes(node.userData.kind)?0:.2;
   this.entries.push({node,nested,stage,base:node.position.clone(),anchor:node.worldToLocal(center.clone()),origin:center.clone(),offset:separation(node.userData.partId,node.userData.kind,i,nodes.length,size,this.layout)});
  }
  this.guides.geometry.dispose();this.guides.geometry=new THREE.BufferGeometry();this.guides.geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(this.entries.length*6),3));this.apply();
 }
 restoreVisibility(){for(const [node,visible] of this.visibility)node.visible=visible;this.visibility.clear();}
 scopeNode(){return this.entries.find(e=>e.node.userData.partId===this.scopeId)?.node||null;}
 inScope(node){const scope=this.scopeNode();if(!scope)return true;for(let p=node;p;p=p.parent)if(p===scope)return true;return false;}
 setScope(id){this.restoreVisibility();this.scopeId=this.entries.some(e=>e.node.userData.partId===id)?id:null;this.level=this.scopeId?'parts':this.level;this.apply();}
 setLevel(level){this.level=level==='parts'?'parts':'assemblies';this.apply();}
 setLayout(layout){this.layout=layout==='layers'?'layers':'spatial';this.bind(this.root);}
 setAmount(value){this.animation=null;this.amount=clamp(value);this.apply();}
 animateTo(value,now=performance.now(),reduced=false){this.tick(now);const to=clamp(value);if(reduced){this.setAmount(to);return;}this.animation={from:this.amount,to,start:now,duration:1100};}
 tick(now){if(!this.animation)return false;const a=this.animation,t=clamp((now-a.start)/a.duration);this.amount=t===1?a.to:a.from+(a.to-a.from)*ease(t);this.apply();if(t===1)this.animation=null;return true;}
 apply(){const scope=this.scopeNode();if(scope&&!this.visibility.size)this.root.traverse(o=>{if(o.isMesh)this.visibility.set(o,o.visible);});if(scope)for(const [o,visible] of this.visibility)o.visible=visible&&this.inScope(o);
  for(const e of this.entries){const stage=scope?(e.node.parent===scope?0:.35):e.stage;const eligible=scope?e.node!==scope&&this.inScope(e.node):!(this.level==='assemblies'&&e.nested);e.node.position.copy(e.base).addScaledVector(e.offset,eligible?ease(clamp((this.amount-stage)/(1-stage))):0);}this.root?.updateWorldMatrix(true,true);const pos=this.guides.geometry.attributes.position;
  if(pos)for(let i=0;i<this.entries.length;i++){const e=this.entries[i],end=this.inScope(e.node)?e.node.localToWorld(e.anchor.clone()):e.origin;pos.setXYZ(i*2,e.origin.x,e.origin.y,e.origin.z);pos.setXYZ(i*2+1,end.x,end.y,end.z);}if(pos){pos.needsUpdate=true;this.guides.geometry.computeBoundingSphere();this.guides.computeLineDistances();}this.guides.visible=this.active&&this.showGuides&&this.amount>.001;
 }
 reset(){this.restoreVisibility();this.scopeId=null;this.restore();this.amount=0;this.animation=null;this.active=false;this.entries=[];this.root=null;this.guides.visible=false;}
 assembled(callback){const amount=this.amount;this.restore();this.root?.updateWorldMatrix(true,true);try{return callback();}finally{this.amount=amount;this.apply();}}
}

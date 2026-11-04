import * as THREE from 'three';
import {HDRLoader} from '../vendor/addons/loaders/HDRLoader.js';
import {EffectComposer} from '../vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from '../vendor/addons/postprocessing/RenderPass.js';
import {GTAOPass} from '../vendor/addons/postprocessing/GTAOPass.js';
import {OutputPass} from '../vendor/addons/postprocessing/OutputPass.js';

// Editor helpers and transparent glass must not become solid AO occluders.
class FurnitureAO extends GTAOPass {
  _overrideVisibility(){
    super._overrideVisibility();
    this.scene.traverse(o=>{
      if(o.visible&&(o.isSprite||o.renderOrder>=8||o.material?.transparent)){
        o.visible=false;this._visibilityCache.push(o);
      }
    });
  }
}

export class RealisticRenderer {
  constructor(studio){
    this.studio=studio;this.enabled=true;this.width=0;this.height=0;
    const {renderer,scene,camera}=studio;
    const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4});
    this.composer=new EffectComposer(renderer,target);
    this.composer.setPixelRatio(1);
    this.beauty=new RenderPass(scene,camera);
    this.ao=new FurnitureAO(scene,camera,1,1,undefined,{radius:.45,thickness:.5,distanceFallOff:1,scale:1.3,samples:16,screenSpaceRadius:false},{radius:4});
    this.ao.blendIntensity=.8;
    this.composer.addPass(this.beauty);
    this.composer.addPass(this.ao);
    this.composer.addPass(new OutputPass());
    this.status='Студийное освещение загружается…';
    new HDRLoader().load('../assets/pbr/studio_small_09_1k.hdr',texture=>{
      const generator=new THREE.PMREMGenerator(renderer);
      const next=generator.fromEquirectangular(texture);
      // Keep CPU HDR pixels for the thumbnail renderer's independent WebGL context.
      studio.hdrSource=texture.clone();
      texture.dispose();generator.dispose();
      studio.environmentTarget?.dispose();
      studio.environmentTarget=next;scene.environment=next.texture;
      this.status='HDRI · Studio Small 09 / Poly Haven';this.updateStatus();
      studio.dirty=true;studio.onTexturesReady?.();
    },undefined,()=>{this.status='Базовое студийное освещение';this.updateStatus();studio.dirty=true;});
  }
  updateStatus(){const el=document.querySelector('#lighting-status');if(el)el.textContent=this.status;}
  render(){
    const s=this.studio,r=s.renderer;
    if(!this.enabled||s.view!=='3d'){r.render(s.scene,s.camera);return;}
    const size=r.getDrawingBufferSize(new THREE.Vector2());
    if(size.x!==this.width||size.y!==this.height){this.width=size.x;this.height=size.y;this.composer.setSize(size.x,size.y);}
    this.beauty.camera=s.camera;this.ao.camera=s.camera;
    this.composer.render();
  }
}

export function applyLighting(s,r){
  const presets={studio:{sun:'#fff7eb',fill:'#dfe9ff',sky:'#ffffff',key:.72,ambient:.24,fillPower:.2},daylight:{sun:'#fff1dc',fill:'#c5dcff',sky:'#e8f1ff',key:1,ambient:.25,fillPower:.22},warm:{sun:'#ffd3a0',fill:'#cbd8ed',sky:'#ffe7ce',key:.48,ambient:.12,fillPower:.08}};
  const p=presets[r.lighting]||presets.studio;
  s.sun.color.set(p.sun);s.sun.intensity=r.sun*p.key;
  s.fill.color.set(p.fill);s.fill.intensity=p.fillPower;
  s.hemisphere.color.set(p.sky);s.hemisphere.intensity=p.ambient;
  s.scene.environmentIntensity=r.environmentIntensity??.85;
  s.scene.environmentRotation.y=(r.environmentRotation||0)*Math.PI/180;
  s.renderer.toneMappingExposure=r.exposure;
  const span=Math.max(r.width,r.depth)/1000*.7;
  Object.assign(s.sun.shadow.camera,{left:-span,right:span,top:span,bottom:-span});
  s.sun.shadow.camera.updateProjectionMatrix();
}

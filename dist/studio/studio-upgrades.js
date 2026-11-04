import * as THREE from 'three';
import {CAD_REFERENCE} from './cad-reference.js?v=cad18';
import {checkOpenings} from './opening-check.js?v=cad18';
export function installStudioUpgrades({scene,current,getProject,advanced,easy,inspectorTab,showPanel,toast,select}){
 const $=s=>document.querySelector(s),link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./studio-upgrades.css?v=cad18',import.meta.url).href;document.head.append(link);
 const nav=document.createElement('nav');nav.id='workflow';nav.setAttribute('aria-label','Шаги создания проекта');
 const steps=['Комната','Мебель','Отделка','Детали','Проверка'];
 steps.forEach((text,i)=>{const b=document.createElement('button');b.type='button';b.textContent=(i+1)+' '+text;b.onclick=()=>go(i);nav.append(b);});
 $('.library').prepend(nav);
 const cadInfo=document.createElement('section');cadInfo.className='cad-reference-info';cadInfo.innerHTML='<strong>Эталон CAD · 600 × 870 × 600 мм</strong><p>Сборка собственной разработки: резьбовой крепёж, присадочные отверстия, пазы, шканты, шарики направляющих и составные опоры. Выберите «Разобрать», затем «Все детали», чтобы рассмотреть крепёж.</p><a href="../assets/cad/reference-600.step.zip?v=cad18" download>Скачать сборку STEP · ZIP</a><a href="../assets/cad/reference-600.glb?v=cad18" download>Скачать 3D-модель GLB</a><small>Файлы содержат исходный эталон: изменения в редакторе в них не включены. Не является проверенным проектом для производства.</small>';
 cadInfo.querySelector('strong').append(' · '+CAD_REFERENCE.parts.length+' деталей');$('#module-pane').prepend(cadInfo);const showCAD=()=>cadInfo.hidden=current()?.type!=='cad-reference';const cadSelect=scene.select.bind(scene);scene.select=(...args)=>{const result=cadSelect(...args);showCAD();return result;};showCAD();

 const hint=document.createElement('p');hint.className='workflow-hint';hint.textContent='Начните с комнаты или сразу выбирайте мебель.';nav.after(hint);
 function go(i){for(const [j,b] of [...nav.children].entries())b.setAttribute('aria-current',i===j?'step':'false');
  if(i!==3&&scene.exploder.active){scene.endExploded();easy.render();}
  if(i===0){inspectorTab('room');showPanel('inspector');hint.textContent='Задайте размеры, окна, двери и отделку комнаты.';}
  if(i===1){inspectorTab('module');showPanel('library');$('#search').focus();hint.textContent='Добавьте мебель из каталога. Выбирайте модуль в сцене, чтобы изменить размеры.';}
  if(i===2){if(!current()){toast('Выберите мебель в сцене');return;}inspectorTab('module');showPanel('inspector');$('[data-material-open="front"]').click();hint.textContent='Выберите материал фасада, корпуса и столешницы. Каждая деталь может иметь свою отделку.';}
  if(i===3){easy.start();hint.textContent='Выберите деталь и замените её. Для одного ящика или фасада нажмите «Только этот узел».';}
  if(i===4){dialog.showModal();hint.textContent='Проверьте размещение и пространство для открывания.';}
 }
 const tools=document.createElement('div');tools.className='detail-inspect-actions';tools.innerHTML='<button id="upgrade-inspect">Рассмотреть крупно</button><button id="upgrade-inspect-exit" hidden>Вернуть обычный вид</button>';
 $('#part-settings').prepend(tools);
 let faded=[],cameraFrame=0,savedCamera=null;
 function clearInspection(restoreCamera=false){cancelAnimationFrame(cameraFrame);for(const [mesh,material,clones] of faded){mesh.material=material;clones.forEach(m=>m.dispose());}faded=[];
  if(restoreCamera&&savedCamera){scene.camera.position.copy(savedCamera.position);scene.controls.target.copy(savedCamera.target);scene.controls.minDistance=savedCamera.minDistance;scene.controls.update();}
  if(savedCamera)scene.controls.minDistance=savedCamera.minDistance;savedCamera=null;$('#upgrade-inspect-exit').hidden=true;scene.dirty=true;
 }
 const findPart=id=>{let result;scene.groups.get(scene.selected)?.traverse(o=>{if(o.isGroup&&o.userData.partId===id)result=o;});return result;};
 function inspect(){const target=findPart(advanced.selectedPart());if(!target){toast('Сначала выберите деталь');return;}clearInspection();
  if(scene.view!=='3d')scene.setView('3d');savedCamera={position:scene.camera.position.clone(),target:scene.controls.target.clone(),minDistance:scene.controls.minDistance};
  const inside=o=>{for(let p=o;p;p=p.parent)if(p===target)return true;return false;};
  scene.furniture.traverse(o=>{if(!o.isMesh||inside(o))return;for(let parent=o;parent;parent=parent.parent)if(!parent.visible)return;const original=o.material,clones=(Array.isArray(original)?original:[original]).map(m=>{const c=m.clone();c.transparent=true;c.opacity=.10;c.depthWrite=false;return c;});o.material=Array.isArray(original)?clones:clones[0];faded.push([o,original,clones]);});
  const b=new THREE.Box3().setFromObject(target),center=b.getCenter(new THREE.Vector3()),size=Math.max(.10,b.getSize(new THREE.Vector3()).length()),dir=scene.camera.position.clone().sub(scene.controls.target).normalize(),distance=size/(2*Math.sin(THREE.MathUtils.degToRad(scene.camera.fov/2)))*1.3*Math.max(1,scene.host.clientHeight/Math.max(240,scene.host.clientHeight-($('#disassembly-toolbar').hidden?0:$('#disassembly-toolbar').clientHeight)-50));center.y+=scene.exploder.active?size*.3:0;
  const end=center.clone().addScaledVector(dir,distance),start=performance.now(),from=scene.camera.position.clone(),fromTarget=scene.controls.target.clone(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:450;
  scene.controls.minDistance=.08;scene.controls.update();$('#upgrade-inspect-exit').hidden=false;
  function frame(now){const t=duration?Math.min(1,(now-start)/duration):1,k=1-(1-t)**3;scene.camera.position.lerpVectors(from,end,k);scene.controls.target.lerpVectors(fromTarget,center,k);scene.controls.update();scene.dirty=true;if(t<1)cameraFrame=requestAnimationFrame(frame);}cameraFrame=requestAnimationFrame(frame);
 }
 $('#upgrade-inspect').onclick=inspect;$('#upgrade-inspect-exit').onclick=()=>clearInspection(true);
 scene.renderer.domElement.addEventListener('pointerdown',()=>cancelAnimationFrame(cameraFrame));
 // Never leave cloned translucent materials on geometry about to be rebuilt/disposed.
 for(const method of ['setProject','updateModule','setPart','endExploded','setView']){const original=scene[method].bind(scene);scene[method]=(...args)=>{clearInspection();return original(...args);};}
 const originalSelect=scene.select.bind(scene);scene.select=(...args)=>{if(args[0]!==scene.selected)clearInspection();return originalSelect(...args);};
 const nodebar=document.createElement('div');nodebar.className='node-controls';nodebar.innerHTML='<div><button id="node-scope">Только этот узел</button><button id="node-all">Весь модуль</button></div><div><button id="node-prev" aria-label="Предыдущий этап разборки">←</button><output id="node-stage" aria-live="polite">Сборка → узлы → детали</output><button id="node-next" aria-label="Следующий этап разборки">→</button></div>';
 $('#disassembly-toolbar').append(nodebar);
 const viewOptions=document.createElement('details');viewOptions.className='disassembly-view-options';const summary=document.createElement('summary');summary.textContent='Вид разборки';viewOptions.append(summary,$('.disassembly-options'),$('#disassembly-layout'));$('#disassembly-toolbar').append(viewOptions);

 const stageValues=[0,.35,.65,1],stageNames=['Собранный вид','Фасады и узлы','Корпус и наполнение','Все детали'];
 function stageLabel(){const value=scene.exploder.amount,index=stageValues.reduce((best,v,i)=>Math.abs(v-value)<Math.abs(stageValues[best]-value)?i:best,0);$('#node-stage').textContent=stageNames[index];$('#node-prev').disabled=value<.001&&!scene.exploder.animation;$('#node-next').disabled=value>.999&&!scene.exploder.animation;}
 function step(direction){const v=scene.exploder.animation?.to??scene.exploder.amount,index=direction>0?stageValues.findIndex(n=>n>v+.01):stageValues.findLastIndex(n=>n<v-.01);if(index<0)return;scene.exploder.setLevel('parts');$('#disassembly-level').value='parts';scene.exploder.animateTo(stageValues[index],performance.now(),matchMedia('(prefers-reduced-motion: reduce)').matches);scene.dirty=true;}
 $('#node-prev').onclick=()=>step(-1);$('#node-next').onclick=()=>step(1);
 $('#node-scope').onclick=()=>{let target=findPart(advanced.selectedPart());while(target&&!['door','drawer'].includes(target.userData.kind))target=target.parent;if(!target||!target.userData.partId){toast('Выберите фасад, ящик или его ручку');return;}scene.exploder.setScope(target.userData.partId);scene.exploder.setAmount(0);$('#disassembly-level').value='parts';scene.frameExploded();scene.exploder.animateTo(1,performance.now(),matchMedia('(prefers-reduced-motion: reduce)').matches);scene.dirty=true;toast('Разбираем: '+(target.userData.label||'выбранный узел'));};
 $('#node-all').onclick=()=>{scene.exploder.setScope(null);scene.frameExploded();scene.dirty=true;};
 const onFrame=scene.onExplodedFrame;scene.onExplodedFrame=()=>{onFrame?.();stageLabel();};
 const dialog=document.createElement('dialog');dialog.id='opening-dialog';dialog.innerHTML='<button id="opening-close" class="dialog-close" aria-label="Закрыть проверку">×</button><span class="eyebrow">ПРОВЕРКА ПРОЕКТА</span><h2>Есть место для открывания?</h2><p>Проверим движение фасадов и ящиков в 20 положениях относительно другой мебели, выступов и границ комнаты.</p><p class="opening-limit">Это предварительная проверка по габаритам: она может отмечать лишние пересечения. Зазоры внутри одного шкафа, одновременное открывание и проёмы в стенах не учитываются. Перед изготовлением нужна проверка конструктора.</p><div class="opening-actions"><button id="opening-static">Проверить размещение</button><button id="opening-run">Проверить открывание</button><button id="opening-cancel" hidden>Остановить</button></div><p id="opening-progress" role="status"></p><div id="opening-results"></div>';
 document.body.append(dialog);let controller;
 $('#opening-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>controller?.abort());dialog.addEventListener('cancel',()=>controller?.abort());$('#opening-cancel').onclick=()=>controller?.abort();
 $('#opening-static').onclick=()=>{dialog.close();$('#warnings-open').click();};
 $('#opening-run').onclick=async()=>{controller=new AbortController();const active=controller;$('#opening-run').disabled=true;$('#opening-cancel').hidden=false;$('#opening-results').replaceChildren();$('#opening-progress').textContent='Подготовка…';
  try{const result=await checkOpenings(structuredClone(getProject()),{signal:active.signal,onProgress:(n,total)=>$('#opening-progress').textContent=`Проверено ${n} из ${total}`});if(active.signal.aborted)return;
   $('#opening-progress').textContent=`Проверено модулей: ${result.checked}. Возможных пересечений: ${result.warnings.length}.`;
   if(!result.warnings.length){const p=document.createElement('p');p.textContent='По габаритам внешних препятствий не найдено. Ограничения проверки указаны выше.';$('#opening-results').append(p);}
   for(const warning of result.warnings){const b=document.createElement('button');b.dataset.openingResult='';b.textContent=warning.message+' Показать →';b.onclick=()=>{dialog.close();select(warning.moduleId);advanced.selectPart(warning.partId);scene.focusPart();showPanel('inspector');};$('#opening-results').append(b);}
  }catch(error){$('#opening-progress').textContent=error.name==='AbortError'?'Проверка остановлена':'Не удалось выполнить проверку: '+error.message;}finally{$('#opening-run').disabled=false;$('#opening-cancel').hidden=true;if(controller===active)controller=null;}
 };
 return {clearInspection};
}

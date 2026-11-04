import * as THREE from 'three';
import {box,cyl,pbr,libraryMaterial,refreshPhysicalUV} from './pbr.js?v=cad18';
export const EXTRA_TYPES=['corner','bottle','dishwasher','appliance-tower','internal-drawers','baskets'];
export function buildExtra(m,{makePart,front,partMat}){
 const g=new THREE.Group(),w=m.width/1000,h=m.height/1000,d=m.depth/1000,t=m.thickness/1000,l=m.legs/1000,tt=m.type==='appliance-tower'?0:m.topThickness/1000,top=h-tt,ch=top-l;
 g.name=m.name;g.userData.moduleId=m.id;
 const panel=(id,label,ww,hh,dd,x,y,z,kind='panel',material)=>makePart(g,m,id,label,kind,p=>box(p,ww,hh,dd,x,y,z,material||partMat(m,id,kind==='worktop'?'top':'body')));
 const metal=libraryMaterial('steel-brushed'),dark=pbr('paint','#202725',.3);
 const wireBasket=(parent,id,y,bw,bd)=>makePart(parent,m,id,'Выдвижная корзина '+(Number(id.split('-').at(-1))+1),'interior',p=>{for(let i=0;i<8;i++)cyl(p,.0028,bw,0,y,-bd/2+i*bd/7,metal,'x');for(const x of [-bw/2,bw/2]){for(const yy of [y,y+.14])cyl(p,.003,bd,x,yy,0,metal,'z');for(const z of [-bd/2,0,bd/2])cyl(p,.003,.14,x,y+.07,z,metal);}for(const z of [-bd/2,bd/2])cyl(p,.003,bw,0,y+.14,z,metal,'x');});
 if(m.type==='corner'){
  const a=Math.min(.55,w*.58),b=Math.min(.55,d*.58);
  panel('side-left','Левая боковина',t,ch,d,-w/2+t/2,l+ch/2,0);
  panel('side-right','Правая боковина',t,ch,b,w/2-t/2,l+ch/2,-d/2+b/2);
  panel('back','Задняя стенка',w,ch,.008,0,l+ch/2,-d/2+.004);
  panel('return','Внутренняя боковина',t,ch,d-b,-w/2+a-t/2,l+ch/2,b/2);
  for(const [id,y,hh,kind] of [['bottom',l+t/2,t,'panel'],['worktop',h-tt/2,tt,'worktop']]){
   panel(id+'-left',id==='bottom'?'Дно · левое крыло':'Столешница · левое крыло',a,hh,d,-w/2+a/2,y,0,kind);
   panel(id+'-right',id==='bottom'?'Дно · правое крыло':'Столешница · правое крыло',w-a,hh,b,a/2,y,-d/2+b/2,kind);
  }
  front(g,m,0,a,ch, -w/2+a/2,l+ch/2,d/2+.013);
  front(g,m,1,w-a,ch,a/2,l+ch/2,-d/2+b+.013);
 }else{
  panel('side-left','Левая боковина',t,ch,d,-w/2+t/2,l+ch/2,0);panel('side-right','Правая боковина',t,ch,d,w/2-t/2,l+ch/2,0);
  panel('bottom','Дно корпуса',w-2*t,t,d,0,l+t/2,0);panel('back','Задняя стенка',w-2*t,ch,.008,0,l+ch/2,-d/2+.004);
  panel('carcass-top','Верх корпуса',w-2*t,t,d,0,top-t/2,0);
  if(tt)panel('worktop','Столешница',w,tt,d+.025,0,h-tt/2,.0125,'worktop');
  if(['bottle','baskets'].includes(m.type)){
   const assembly=makePart(g,m,'pullout-0',m.type==='bottle'?'Бутылочница':'Блок выдвижных корзин','drawer',p=>{const face=front(p,{...m,open:0,details:{...m.details,'door-0':{...m.details?.['door-0'],open:0}}},0,w,ch,0,l+ch/2,d/2+.013);for(let i=0;i<3;i++)wireBasket(p,'basket-'+i,l+.08+i*(ch-.25)/3,w-.09,d-.09);for(const x of [-1,1])makePart(p,m,'runner-'+(x<0?'left':'right'),'Направляющая корзины','hardware',q=>box(q,.012,.035,d-.08,x*(w/2-.035),l+.04,0,metal));});
   assembly.position.z+=(m.details?.['pullout-0']?.open??m.open)/100*d*.75;
  }else if(m.type==='internal-drawers'){
   front(g,m,0,w,ch,0,l+ch/2,d/2+.013);
   for(let i=0;i<m.drawers;i++)front(g,{...m,front:'ivory',frontMaterial:'',handle:'none',open:0},i+1,w-.07,(ch-.12)/m.drawers,0,l+.06+(i+.5)*(ch-.12)/m.drawers,d/2-.045,true,'drawer');
  }else if(m.type==='dishwasher'){
   panel('dishwasher-inner','Внутренняя камера',w-.07,ch-.07,.012,0,l+ch/2,-d/2+.03,'appliance',metal);
   front(g,{...m,mechanism:'drop'},0,w,ch,0,l+ch/2,d/2+.013);
   for(let i=0;i<2;i++){const p=makePart(g,m,'rack-'+i,'Корзина посудомойки '+(i+1),'drawer',q=>wireBasket(q,'rack-wire-'+i,l+.12+i*ch*.45,w-.10,d-.12));p.position.z+=(m.details?.['rack-'+i]?.open??0)/100*d*.65;}
   makePart(g,m,'dishwasher-controls','Панель управления','appliance',p=>{box(p,w-.07,.035,.012,0,top-.04,d/2+.025,dark);for(let i=0;i<4;i++)cyl(p,.003,.002,-w*.3+i*.025,top-.04,d/2+.032,pbr('paint',m.applianceOn?'#99b77b':'#555b51'),'z');});
  }else if(m.type==='appliance-tower'){
   const base=l+ch*.32,oh=Math.min(.60,ch*.30);panel('oven-shelf','Полка под духовку',w-2*t,t,d-.02,0,base,0,'shelf');
   makePart(g,m,'oven-cavity','Камера духовки','appliance',p=>{box(p,w-.07,oh,.02,0,base+oh/2,-d/2+.03,dark);for(const x of [-1,1])box(p,.015,oh,d-.07,x*(w/2-.04),base+oh/2,0,metal);for(let i=0;i<7;i++)cyl(p,.002,w-.10,0,base+.1,-d/2+.08+i*(d-.16)/6,metal,'x');});
   front(g,{...m,mechanism:'drop',front:'graphite',frontMaterial:'',style:'glass',handle:'rail'},0,w,oh,0,base+oh/2,d/2+.013);
   makePart(g,m,'oven-controls','Управление духовкой','appliance',p=>{box(p,w-.07,.04,.015,0,base+oh-.025,d/2+.025,dark);for(const x of [-1,1])cyl(p,.012,.012,x*w*.32,base+oh-.025,d/2+.04,metal,'z');box(p,.10,.016,.002,0,base+oh-.025,d/2+.034,pbr('paint',m.applianceOn?'#98c3ac':'#1a211e'));});
   front(g,m,1,w,base-l-.025,0,l+(base-l)/2,d/2+.013);const upper=top-base-oh-.025;front(g,m,2,w,upper,0,base+oh+.025+upper/2,d/2+.013);
  }
 }
 if(l>0)makePart(g,m,'legs','Регулируемые опоры','support',p=>{for(const x of [-1,1])for(const z of [-1,1])cyl(p,.024,l,x*(w/2-.05),l/2,z*(d/2-.06),dark);});
 if(m.type==='internal-drawers')g.traverse(o=>{if(o.userData.label){o.userData.label=o.userData.label.replace(/^Ящик (\d+)/,(_,n)=>'Ящик '+(Number(n)-1));if(o.userData.kind==='handle'&&o.userData.partId!=='handle-0')o.userData.label='Внутренняя ручка '+o.userData.partId.split('-').at(-1);}});
 refreshPhysicalUV(g);g.traverse(o=>{if(o.userData.restPose){o.position.copy(o.userData.restPose.position);o.quaternion.copy(o.userData.restPose.quaternion);}});g.position.set(m.x/1000,m.y/1000,m.z/1000);g.rotation.y=m.rotation*Math.PI/180;g.visible=m.visible;return g;
}

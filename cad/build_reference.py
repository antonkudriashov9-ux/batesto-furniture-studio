"""Original Batesto concept, millimetres. CadQuery 2.6.1 / OCCT.
No manufacturer geometry or compatibility claim. Regenerate, do not scale a STEP.
"""
import argparse,json
from functools import lru_cache
from zipfile import ZipFile, ZIP_DEFLATED
from pathlib import Path
import cadquery as cq

parser=argparse.ArgumentParser();parser.add_argument('--width',type=int,default=600);args=parser.parse_args()
W=args.width;H=870;D=600;T=18;L=100;TOP=38;N=3
assert 450<=W<=1000
out=Path(__file__).resolve().parents[1]/'dist/assets/cad';out.mkdir(parents=True,exist_ok=True)
assembly=cq.Assembly(name=f'Batesto_reference_{W}');parts=[]
def slab(w,h,d,r=.6):
 return cq.Workplane('XY').box(w,h,d).edges().fillet(min(r,w/5,h/5,d/5))
def add(id,label,kind,shape,pos=(0,0,0),drawer=None,motion=0,finish='body'):
 solid=shape.val();assert solid.isValid(),id
 loc=cq.Location(cq.Vector(*pos));assembly.add(shape,name=id,loc=loc,color=cq.Color(*({'metal':(.55,.58,.6),'chrome':(.8,.82,.84),'zinc':(.65,.68,.7),'rubber':(.05,.055,.06),'front':(.45,.32,.19),'body':(.76,.67,.53),'top':(.88,.87,.83),'dark':(.12,.14,.15)}[finish])))
 vertices,triangles=solid.tessellate(.25,.5 if id.startswith('ball-') else .3)
 parts.append(dict(id=id,label=label,kind=kind,position=[v/1000 for v in pos],drawer=drawer,motion=motion,finish=finish,vertices=[round(v/1000,7) for p in vertices for v in p.toTuple()],indices=[i for t in triangles for i in t],volume=solid.Volume()))
ch=H-L-TOP;dh=ch/N
# Head starts at z=0, shaft points +Z. Thread is a swept helix, not stacked rings.
@lru_cache(None)
def screw(diameter,length,head=8,hexagonal=False):
 r=diameter/2; pitch=3 if diameter>=7 else 1.6; start=16 if diameter>=7 else 5
 core=cq.Workplane('XY').circle(r-.65).extrude(length-.8)
 helix=cq.Wire.makeHelix(pitch,length-start-1,r-.65)
 tooth=cq.Workplane('XZ').polyline([(r-.8,0),(r,pitch*.23),(r-.8,pitch*.46)]).close().sweep(helix,isFrenet=True).translate((0,0,start))
 core=core.union(tooth).union(cq.Workplane('XY').circle(r).extrude(start))
 cap=cq.Workplane('XY').circle(head/2).workplane(offset=2.5).circle(r).loft()
 recess=cq.Workplane('XY').polygon(6,4.62).extrude(1.8) if hexagonal else cq.Workplane('XY').rect(1.2,5).extrude(1.4).union(cq.Workplane('XY').rect(5,1.2).extrude(1.4))
 return core.union(cap).cut(recess)
def axis_x(shape,sign):return shape.rotate((0,0,0),(0,1,0),90*sign)
def bore_x(radius,length,x,y,z):return cq.Workplane('YZ').circle(radius).extrude(length).translate((x,y,z))
def bore_z(radius,length,x,y,z):return cq.Workplane('XY').circle(radius).extrude(length).translate((x,y,z))
def bore_y(radius,length,x,y,z):return cq.Workplane('XZ').circle(radius).extrude(-length).translate((x,y,z))

# Carcass: aligned clearance / pilot bores, countersinks and captured rear panel.
joint_y=[L+T/2,L+ch-T/2];joint_z=[-220,220]
bottoms={}
for key,yy in [('bottom',joint_y[0]),('carcass-top',joint_y[1])]:
 p=slab(W-2*T,T,D-12)
 # Rear panel in a 6.4 mm wide groove, 5 mm engagement.
 p=p.cut(cq.Workplane('XY').box(W,10,6.4).translate((0,(1 if key=='bottom' else -1)*9,-281)))
 for sign in [-1,1]:
  for zz in joint_z:p=p.cut(bore_x(2.6,40,sign*(W/2-T)- (40 if sign>0 else 0),0,zz-3))
 if key=='bottom':
  for sx in [-1,1]:
   for sz in [-1,1]:
    for xx in [-22,22]:
     for zz in [-18,18]:p=p.cut(bore_y(1.6,14,sx*(W/2-50)+xx,-9,sz*(D/2-90)+zz-3))
 else:
  for xx in [-(W/2-90),W/2-90]:
   for zz in [-180,180]:p=p.cut(bore_y(2.2,20,xx,-10,zz-3))
 bottoms[key]=p
for sign,name,label in [(-1,'left','Левая'),(1,'right','Правая')]:
 sx=sign*(W-T)/2;sy=L+ch/2;p=slab(T,ch,D)
 p=p.cut(cq.Workplane('XY').box(10,ch+2,6.4).translate((-sign*9,0,-278)))
 for yy in joint_y:
  for zz in joint_z:
   p=p.cut(bore_x(3.6,T+2,-T/2-1,yy-sy,zz))
   countersink=cq.Workplane('XY').circle(5.2).workplane(offset=2.7).circle(3.6).loft()
   p=p.cut(axis_x(countersink,-sign).translate((sign*T/2,yy-sy,zz)))
   add(f'confirmat-{name}-{int(yy)}-{zz}','Конфирмат · 7 × 50 · шестигранный шлиц','hardware',axis_x(screw(7,50,10,True),-sign),(sign*W/2,yy,zz),finish='zinc')
 # Blind pilot holes at the three outer runner mounting slots.
 for i in range(N):
  ry=L+(i+.5)*dh-dh*.2
  for zz in [-130,45,220]:p=p.cut(bore_x(1.6,14,-9 if sign>0 else -5,ry-sy,zz))
 add('side-'+name,label+' боковина · присадка и паз','panel',p,(sx,sy,0))
for key,label,yy in [('bottom','Дно корпуса',joint_y[0]),('carcass-top','Верх корпуса',joint_y[1])]:add(key,label+' · присадка','panel',bottoms[key],(0,yy,3))
add('back','Задняя стенка · в пазах 6,4 мм','panel',slab(W-2*T+8,ch-2*T+8,6,.2),(0,L+ch/2,-278))
top=slab(W,TOP,D+25,1.2)
for xx in [-(W/2-90),W/2-90]:
 for zz in [-180,180]:
  top=top.cut(bore_y(1.6,16,xx,-TOP/2,zz-12.5))
  add(f'worktop-screw-{xx}-{zz}','Столешница · крепёжный винт 3 × 30','hardware',screw(3,30,6).rotate((0,0,0),(1,0,0),-90),(xx,L+ch-T-2.5,zz),finish='zinc')
add('worktop','Столешница · радиус кромки 1,2 мм','worktop',top,(0,H-TOP/2,12.5),finish='top')
add('plinth','Цоколь','panel',slab(W-2,L-2,16),(0,L/2,D/2-50))
# Each foot is a plate, hollow stem, adjustable spindle and elastomer pad.
for ix,x in enumerate([-1,1]):
 for iz,zs in enumerate([-1,1]):
  px=x*(W/2-50);pz=zs*(D/2-90);prefix=f'leg-{ix}-{iz}'
  plate=slab(64,5,56,1)
  for xx in [-22,22]:
   for zz in [-18,18]:
    plate=plate.cut(cq.Workplane('XZ').center(xx,zz).circle(2.2).extrude(8,both=True))
    add(prefix+f'-screw-{xx}-{zz}','Опора · винт монтажной площадки 3 × 16','hardware',screw(3,16,6).rotate((0,0,0),(1,0,0),-90),(px+xx,92.5,pz+zz),finish='zinc')
  add(prefix+'-plate','Опора · монтажная площадка с отверстиями','support',plate,(px,97.5,pz),finish='dark')
  stem=cq.Workplane('XZ').circle(17).circle(9).extrude(60)
  add(prefix,'Опора · полый корпус','support',stem,(px,95,pz),finish='dark')
  spindle=cq.Workplane('XZ').circle(8.5).extrude(70)
  add(prefix+'-spindle','Опора · регулировочный стержень','hardware',spindle,(px,85,pz),finish='zinc')
  add(prefix+'-foot','Опора · рифлёная пятка','support',cq.Workplane('XZ').polygon(20,48).extrude(12),(px,15,pz),finish='dark')
  add(prefix+'-pad','Опора · резиновая подошва','support',cq.Workplane('XZ').circle(23).extrude(3),(px,3,pz),finish='rubber')

# Slotted nested C channels. Each wall is 1 mm; stages have separate clearances.
@lru_cache(None)
def channel(width,height,length):
 result=slab(width,height,length,.3).cut(cq.Workplane('XY').box(width,height-2,length+2).translate((1,0,0)))
 for zz in [-length*.35,0,length*.35]:result=result.cut(cq.Workplane('YZ').center(0,zz).slot2D(12,4,90).extrude(width+4,both=True))
 return result
handle=slab(160,10,10,2).translate((0,0,35))
for xx in [-64,64]:
 post=cq.Workplane('XY').center(xx,0).circle(5).extrude(35).cut(bore_z(1.7,12,xx,0,0))
 handle=handle.union(post)
for i in range(N):
 y=L+(i+.5)*dh;iw=W-2*T-26;ih=dh*.65;length=500;z=45;by=-ih/2+16;ry=y-dh*.2
 face=slab(W-4,dh-4,20,1)
 for xx in [-64,64]:face=face.cut(bore_z(2.2,30,xx,dh*.32,-15))
 for xx in [-(iw/2-89),iw/2-89]:
  for yy in [-45,45]:face=face.cut(bore_z(1.6,14,xx,yy,-10))
 add(f'face-{i}',f'Фасад ящика {i+1} · отверстия ручки и крепления','panel',face,(0,y,313),i,1,'front')
 add(f'drawer-{i}-bottom',f'Ящик {i+1} · дно 8 мм в пазах','interior',slab(iw-16,8,length-16,.2),(0,y+by,z),i,1)
 for sign,name,side_label in [(-1,'left','левая'),(1,'right','правая')]:
  side=slab(12,ih,length)
  side=side.cut(cq.Workplane('XY').box(8.4,8.4,length+2).translate((-sign*6,by,0)))
  for zz in [-244,244]:
   for yy in [-40,40]:
    side=side.cut(bore_x(3.1,14,-7,yy,zz))
    dowel=cq.Workplane('YZ').circle(3).extrude(24).edges('%Circle').chamfer(.4)
    add(f'drawer-{i}-dowel-{name}-{zz}-{yy}',f'Ящик {i+1} · шкант 6 × 24','hardware',dowel,(sign*(iw/2-12)-12,y+yy,z+zz),i,1)
  for zz in [-164.5,0,164.5]:side=side.cut(bore_x(1.4,10,-4 if sign>0 else -6,-dh*.2,zz))
  add(f'drawer-{i}-{name}',f'Ящик {i+1} · {side_label} боковина с пазом','interior',side,(sign*(iw-12)/2,y,z),i,1)
  for j,(cw,hh,ll) in enumerate([(12,42,500),(8,30,485),(4,20,470)]):
   shape=channel(cw,hh,ll)
   if sign>0:shape=shape.mirror('YZ')
   add(f'runner-{i}-{name}-{j}',f'Ящик {i+1} · {side_label} направляющая · ступень {j+1}','hardware',shape,(sign*(W/2-T-6-j*2),ry,z),i,j*.5,'metal')
  # Screws are attached only to their respective fixed / moving stage.
  for stage,span,xx,direction in [(0,175,W/2-T-3.5,-sign),(2,164.5,W/2-T-8,sign)]:
   for k,zz in enumerate([-span,0,span] if stage==0 else [-span,span]):
    axis=-direction
    add(f'runner-screw-{i}-{name}-{stage}-{k}',f'Направляющая · крепёж {side_label} · ступень {stage+1}','hardware',axis_x(screw(3,12,5.5),axis),(sign*xx,ry,z+zz),i,stage/2,'zinc')
  # Two rolling interfaces: ball separators move at mean adjacent-stage speed.
  for track in range(2):
   for row in [-1,1]:
    bx=sign*(W/2-T-2.5-track*4);ball_y=ry+row*(16.5-track*4.5)
    cage=slab(1,5,108,.2)
    for k in range(6):cage=cage.cut(bore_x(1.6,3,-1.5,0,-45+k*18))
    add(f'cage-{i}-{name}-{track}-{row}','Направляющая · сепаратор шариков','hardware',cage,(bx,ball_y,z),i,.25+track*.5,'dark')
    for k in range(6):add(f'ball-{i}-{name}-{track}-{row}-{k}','Направляющая · стальной шарик Ø 2,9 мм','hardware',cq.Workplane('XY').sphere(1.45),(bx,ball_y,z-45+k*18),i,.25+track*.5,'chrome')
  for end in [-1,1]:add(f'stop-{i}-{name}-{end}','Направляющая · эластичный ограничитель','hardware',slab(7,8,5,.8),(sign*(W/2-T-6),ry,z+end*247),i,0,'rubber')
 for key,zz in [('back',-244),('inner-front',244)]:
  panel=slab(iw-24,ih,12)
  panel=panel.cut(cq.Workplane('XY').box(iw,8.4,8.4).translate((0,by,(-1 if key=='inner-front' else 1)*6)))
  for sign in [-1,1]:
   for yy in [-40,40]:panel=panel.cut(bore_x(3.1,13,sign*(iw-24)/2-(13 if sign>0 else 0),yy,0))
  if key=='inner-front':
   for xx in [-(iw/2-89),iw/2-89]:
    for yy in [-45,45]:
     panel=panel.cut(bore_z(2,14,xx,yy,-7))
     add(f'front-spacer-{i}-{xx}-{yy}','Фасад · дистанционная втулка 8 мм','hardware',cq.Workplane('XY').circle(6).circle(2).extrude(8),(xx,y+yy,295),i,1,'dark')
     add(f'front-screw-{i}-{xx}-{yy}','Фасад · крепёжный винт 3 × 30','hardware',screw(3,30,6),(xx,y+yy,280.5),i,1,'zinc')
  add(f'drawer-{i}-{key}',f'Ящик {i+1} · '+('задняя стенка' if key=='back' else 'внутренняя передняя стенка'),'interior',panel,(0,y,z+zz),i,1)
 add(f'handle-{i}',f'Ручка {i+1} · межосевое 128 мм','handle',handle,(0,y+dh*.32,323),i,1,'chrome')
 for j,xx in enumerate([-64,64]):add(f'screw-{i}-{j}',f'Винт ручки {i+1}.{j+1} · резьба и крестовой шлиц','hardware',screw(4,30),(xx,y+dh*.32,300.5),i,1,'zinc')
step=out/f'reference-{W}.step'
assembly.save(str(step))
# The detailed STEP exceeds the static host's individual-file size limit.
# Distribute a lossless ZIP; the exact STEP solids are unchanged after extraction.
with ZipFile(out/f'reference-{W}.step.zip','w',ZIP_DEFLATED,compresslevel=9) as archive:archive.write(step,step.name)
step.unlink()
assembly.loc=cq.Location((0,0,0),(1,0,0),90) # source already uses Y-up; cancel exporter conversion
assembly.save(str(out/f'reference-{W}.glb'),tolerance=.25,angularTolerance=.3)
assembly.loc=cq.Location()
triangle_count=sum(len(p['indices'])//3 for p in parts)
geometries=[];geometry_ids={}
for part in parts:
 geo={key:part.pop(key) for key in ['vertices','indices']};key=json.dumps(geo,separators=(',',':'))
 if key not in geometry_ids:geometry_ids[key]=len(geometries);geometries.append(geo)
 part['geometry']=geometry_ids[key]
data=dict(name='Batesto CAD reference',author='Batesto project',manufacturer=None,units='metres',dimensions=[W,H,D],cadUnits='millimetres',toleranceMm=.25,parts=parts,geometries=geometries)
(out/f'reference-{W}.mjs').write_text('export default '+json.dumps(data,separators=(',',':'),ensure_ascii=False)+';',encoding='utf-8')
print(json.dumps({'width':W,'parts':len(parts),'triangles':triangle_count,'uniqueGeometries':len(geometries),'valid':True}))

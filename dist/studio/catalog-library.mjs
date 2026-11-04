import {createModule,normalizeModule} from './model.mjs?v=cad18';

// These are editable configurations of the existing geometry, not new
// construction types. Project files continue to store ordinary modules.
export const CATALOG_CATEGORIES=Object.freeze(['Все','Кухня','Хранение','Гостиная','Прихожая','Кабинет']);
const finishes={
 sage:{front:'sage',frontMaterial:'enamel-sage',body:'oak',bodyMaterial:'oak-natural'},
 ivory:{front:'ivory',frontMaterial:'enamel-ivory',body:'oak',bodyMaterial:'oak-natural'},
 oak:{front:'oak',frontMaterial:'oak-natural',body:'oak',bodyMaterial:'oak-natural'},
 walnut:{front:'walnut',frontMaterial:'walnut-natural',body:'walnut',bodyMaterial:'walnut-natural'},
 graphite:{front:'graphite',frontMaterial:'enamel-graphite',body:'walnut',bodyMaterial:'walnut-natural'},
 clay:{front:'clay',frontMaterial:'enamel-clay',body:'oak',bodyMaterial:'oak-natural'}
};
const entry=(id,name,category,type,dimensions,description,finish,config={})=>Object.freeze({
 id,name,category,type,description,
 config:Object.freeze({width:dimensions[0],height:dimensions[1],depth:dimensions[2],...finishes[finish],...config})
});
export const PRESETS=Object.freeze([
 entry('cad-reference-600','Эталон CAD · три ящика','Кухня','cad-reference',[600,870,600],'Точная твердотельная CAD-сборка. Собственная геометрия, не модель производителя.','oak',{drawers:3,doors:0,shelves:0,topMaterial:'marble-honed',handleMaterial:'steel-brushed'}),
 entry('kitchen-corner','Угловой Г-образный шкаф','Кухня','corner',[900,870,900],'Два крыла корпуса и две независимые дверцы','oak',{shelves:0}),
 entry('kitchen-bottle','Бутылочница 250','Кухня','bottle',[250,870,600],'Три проволочные корзины на выдвижном блоке','ivory',{shelves:0}),
 entry('kitchen-dishwasher','Встроенная посудомойка','Кухня','dishwasher',[600,870,600],'Откидной фасад, камера и две корзины','sage',{shelves:0}),
 entry('kitchen-tower','Колонна с духовкой','Кухня','appliance-tower',[600,2300,600],'Духовка на уровне рук, верхний и нижний шкафы','graphite',{shelves:0}),
 entry('kitchen-internal','Шкаф с внутренними ящиками','Кухня','internal-drawers',[600,870,600],'Распашная дверь и три внутренних ящика','oak',{shelves:0,drawers:3}),
 entry('kitchen-baskets','Выдвижные корзины','Кухня','baskets',[600,870,600],'Три проволочные корзины с общим фасадом','ivory',{shelves:0}),
 entry('kitchen-base-400','Нижний шкаф 400','Кухня','base',[400,870,600],'Один фасад, одна полка, столешница','sage',{doors:1,shelves:1}),
 entry('kitchen-base-600','Нижний шкаф 600','Кухня','base',[600,870,600],'Один рамочный фасад, две полки','ivory',{doors:1,shelves:2,style:'frame',handle:'knob'}),
 entry('kitchen-base-800','Нижний шкаф 800','Кухня','base',[800,870,600],'Два фасада, две секции с полками','oak',{doors:2,sections:2,shelves:1,handle:'profile'}),
 entry('kitchen-drawers-600','Три ящика 600','Кухня','drawers',[600,870,600],'Три равных ящика, полное выдвижение','sage',{drawers:3,handle:'profile'}),
 entry('kitchen-drawers-900','Два ящика 900','Кухня','drawers',[900,870,600],'Два глубоких ящика, полное выдвижение','graphite',{drawers:2,handle:'rail'}),
 entry('kitchen-sink-600','Мойка 600','Кухня','sink',[600,870,600],'Один фасад, чаша и смеситель','ivory',{doors:1,shelves:0}),
 entry('kitchen-sink-800','Мойка 800','Кухня','sink',[800,870,600],'Два фасада, чаша и смеситель','sage',{doors:2,shelves:0,topMaterial:'stone-grey'}),
 entry('kitchen-oven-600','Духовка и панель','Кухня','oven',[600,870,600],'Духовой шкаф с варочной панелью','graphite',{shelves:0,topMaterial:'stone-grey'}),
 entry('kitchen-wall-400','Навесной шкаф 400','Кухня','wall',[400,720,350],'Один фасад и две полки; подъём 1450 мм','ivory',{doors:1,shelves:2}),
 entry('kitchen-wall-800','Навесной шкаф 800','Кухня','wall',[800,720,350],'Два стеклянных фасада и две полки','oak',{doors:2,shelves:2,style:'glass',handle:'knob'}),
 entry('kitchen-wall-lift','Горизонтальный верх','Кухня','wall',[1000,400,350],'Один подъёмный фасад; подъём 1450 мм','ivory',{doors:1,shelves:1,mechanism:'lift',handle:'profile'}),
 entry('kitchen-pantry-450','Узкий пенал 450','Кухня','tall',[450,2300,600],'Один высокий фасад, пять полок','oak',{doors:1,shelves:5}),
 entry('kitchen-pantry-600','Пенал для запасов','Кухня','tall',[600,2300,600],'Два высоких фасада, шесть полок','ivory',{doors:2,shelves:6,style:'frame',handle:'knob'}),
 entry('kitchen-fridge-700','Холодильник 700','Кухня','fridge',[700,2000,700],'Габаритный макет с двумя дверцами','ivory',{handle:'rail',shelves:0}),
 entry('kitchen-island-1400','Остров 1400','Кухня','island',[1400,900,800],'Два фасада, две секции, рабочая поверхность','oak',{doors:2,sections:2,shelves:1,handle:'none',topMaterial:'marble-honed'}),
 entry('kitchen-island-1800','Остров 1800','Кухня','island',[1800,900,900],'Три реечных фасада и три секции','walnut',{doors:3,sections:3,shelves:1,style:'slat',handle:'none',topMaterial:'marble-polished'}),
 entry('storage-wardrobe-800','Одностворчатый шкаф','Хранение','wardrobe',[800,2300,600],'Один фасад и штанга для одежды','ivory',{doors:1,shelves:0}),
 entry('storage-wardrobe-1200','Шкаф для одежды','Хранение','wardrobe',[1200,2400,600],'Два распашных фасада и штанга','oak',{doors:2,shelves:0,handle:'rail'}),
 entry('storage-wardrobe-1800','Раздвижной шкаф','Хранение','wardrobe',[1800,2400,650],'Три раздвижных фасада и штанга','graphite',{doors:3,shelves:0,mechanism:'slide',handle:'profile'}),
 entry('storage-rack-1200','Секционный стеллаж','Хранение','open',[1200,2200,400],'Две открытые секции, по пять полок','oak',{doors:0,shelves:5,sections:2,legs:0}),
 entry('storage-dresser-900','Комод на пять ящиков','Хранение','dresser',[900,1100,450],'Пять равных ящиков для вещей','clay',{drawers:5,legs:80,top:'oak',topMaterial:'oak-natural'}),
 entry('living-console-1800','Низкая тумба 1800','Гостиная','bench',[1800,500,400],'Три закрытые секции с полками','walnut',{doors:3,shelves:1,sections:3,handle:'none',legs:60,top:'oak',topMaterial:'walnut-natural'}),
 entry('living-display-900','Шкаф-витрина','Гостиная','tall',[900,1600,400],'Два стеклянных фасада и четыре полки','walnut',{doors:2,shelves:4,style:'glass',handle:'knob',legs:80}),
 entry('living-rack-low','Низкий стеллаж','Гостиная','open',[1200,900,350],'Две открытые секции, по две полки','oak',{doors:0,shelves:2,sections:2,legs:60}),
 entry('living-dresser-1400','Широкий комод','Гостиная','dresser',[1400,800,450],'Три широких ящика с реечными фасадами','walnut',{drawers:3,style:'slat',handle:'none',legs:80,top:'oak',topMaterial:'walnut-natural'}),
 entry('living-cabinet-800','Шкаф для посуды','Гостиная','tall',[800,1500,400],'Два рамочных фасада и три полки','ivory',{doors:2,shelves:3,style:'frame',handle:'knob',legs:80}),
 entry('hall-shoes-800','Тумба с полками','Прихожая','bench',[800,700,350],'Два распашных фасада, две обычные полки','ivory',{doors:2,shelves:2,legs:60,top:'oak',topMaterial:'oak-natural'}),
 entry('hall-bench-1200','Низкая тумба 1200','Прихожая','bench',[1200,450,400],'Два фасада и одна полка; жёсткая верхняя панель','oak',{doors:2,shelves:1,legs:60,top:'oak',topMaterial:'oak-natural'}),
 entry('hall-rack-450','Узкий стеллаж','Прихожая','open',[450,2000,350],'Открытая колонна с шестью полками','walnut',{doors:0,shelves:6,legs:60}),
 entry('hall-wardrobe-900','Шкаф для верхней одежды','Прихожая','wardrobe',[900,2200,600],'Два фасада и штанга для плечиков','graphite',{doors:2,shelves:0,handle:'rail'}),
 entry('hall-cabinet-600','Компактная тумба','Прихожая','bench',[600,650,400],'Один фасад и одна полка','clay',{doors:1,shelves:1,handle:'knob',legs:80,top:'oak',topMaterial:'oak-natural'}),
 entry('office-bookcase-800','Книжный стеллаж','Кабинет','open',[800,2000,350],'Пять открытых полок для книг','walnut',{doors:0,shelves:5,legs:0}),
 entry('office-files-800','Шкаф для документов','Кабинет','tall',[800,2000,400],'Два фасада, пять полок для папок','ivory',{doors:2,shelves:5,legs:60,handle:'profile'}),
 entry('office-drawers-450','Тумба на три ящика','Кабинет','dresser',[450,650,500],'Три ящика для канцелярии','graphite',{drawers:3,legs:60,handle:'profile',top:'oak',topMaterial:'walnut-natural'}),
 entry('office-rack-1200','Стеллаж для папок','Кабинет','open',[1200,1200,350],'Две открытые секции, по три полки','oak',{doors:0,shelves:3,sections:2,legs:0}),
 entry('office-wall-1000','Навесной шкаф кабинета','Кабинет','wall',[1000,600,300],'Два фасада, две полки; подъём 1450 мм','ivory',{doors:2,shelves:2,handle:'none'})
]);

const byId=new Map(PRESETS.map(p=>[p.id,p]));
export function createPreset(id){
 const preset=byId.get(id);
 if(!preset)throw new Error('Неизвестная конфигурация мебели');
 return normalizeModule({...createModule(preset.type),...preset.config,name:preset.name});
}
export function filterPresets({category='Все',search=''}={}){
 const words=String(search).trim().toLocaleLowerCase('ru').replaceAll('ё','е').split(/\s+/).filter(Boolean);
 return PRESETS.filter(p=>{
  if(category!=='Все'&&p.category!==category)return false;
  const haystack=`${p.name} ${p.category} ${p.description} ${p.config.width} ${p.config.height} ${p.config.depth}`.toLocaleLowerCase('ru').replaceAll('ё','е');
  return words.every(word=>haystack.includes(word));
 });
}

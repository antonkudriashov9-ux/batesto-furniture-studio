// Generic visual models; no manufacturer-specific drilling or compatibility data.
export const HANDLE_MODELS=Object.freeze([
 {id:'bar',name:'Скоба',description:'Тонкая перекладина на двух опорах',icon:'bar'},
 {id:'rail',name:'Рейлинг',description:'Толстая перекладина с выступающими концами',icon:'rail'},
 {id:'knob',name:'Кнопка',description:'Круглая ручка на одной опоре',icon:'knob'},
 {id:'cup',name:'Ракушка',description:'Дугообразный захват',icon:'cup'},
 {id:'profile',name:'Торцевой профиль',description:'Линейный захват вдоль верхнего края',icon:'profile'},
 {id:'none',name:'Без ручки',description:'Убрать внешнюю ручку с фасада',icon:'none'}
]);
export const HINGE_MODELS=Object.freeze([
 {id:'standard',name:'Стандартная',description:'Чашка и короткое плечо петли',icon:'standard'},
 {id:'soft-close',name:'С доводчиком',description:'Плечо с корпусом демпфера',icon:'soft-close'},
 {id:'wide-angle',name:'Широкого открытия',description:'Удлинённое шарнирное плечо',icon:'wide-angle'}
]);
export function hardwareKind(part){return part?.kind==='handle'?'handle':/^hinge-\d+-(top|bottom)$/.test(part?.id||'')?'hinge':null;}
export function hardwareSelection(module,part){const kind=hardwareKind(part),o=module?.details?.[part?.id]||{};return kind==='handle'?(o.handle&&o.handle!=='inherit'?o.handle:module.handle):kind==='hinge'?(HINGE_MODELS.some(v=>v.id===o.hinge)?o.hinge:'standard'):null;}

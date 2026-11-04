// Blob downloads also work in embedded browsers that reject data: URL downloads.
export function downloadPNG(dataURL,name){
  if(!dataURL.startsWith('data:image/png;base64,'))throw Error('Не удалось сформировать PNG');
  const bytes=Uint8Array.from(atob(dataURL.slice(dataURL.indexOf(',')+1)),c=>c.charCodeAt(0));
  const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);
  try{a.click();}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
}

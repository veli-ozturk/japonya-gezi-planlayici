// Gezi günlüğü: notlar KV'de tek JSON dizi ('journal'), fotoğraflar ayrı anahtarda ('jphoto:<id>', ham JPEG).
// Erişim kontrolü functions/_middleware.js içinde. Fotoğraf telefonda küçültülüp gönderilir.
// shortcut: KV ücretsiz planda günde ~1000 yazma; iki kişilik günlük için yeterli, çok fotoğrafta R2'ye geç.
const DOC='journal',ID=/^[\w-]{8,40}$/,MAX_PHOTO=700_000;
export const WRITERS=['Ali','Ayşe'];
const read=async kv=>JSON.parse(await kv.get(DOC)||'[]');
const bad=msg=>new Response(msg,{status:400});

export function validateEntry(b){
  if(!b||typeof b!=='object')return 'Geçersiz veri';
  if(typeof b.id!=='string'||!ID.test(b.id))return 'Kimlik geçersiz';
  if(typeof b.date!=='string'||!/^2037-(10|11|12)-\d\d$/.test(b.date))return 'Tarih geçersiz';
  if(!WRITERS.includes(b.who))return 'Kişi geçersiz';
  if(typeof b.text!=='string'||b.text.length>1000)return 'Not en fazla 1000 karakter';
  if(b.photo!=null&&(typeof b.photo!=='string'||!b.photo.startsWith('data:image/jpeg;base64,')))return 'Fotoğraf JPEG olmalı';
  if(!b.text.trim()&&!b.photo)return 'Not veya fotoğraf gerekli';
  return null;
}
const decode=d=>Uint8Array.from(atob(d.slice(d.indexOf(',')+1)),c=>c.charCodeAt(0));

export async function onRequest({request,env}){
  const url=new URL(request.url),kv=env.CHECKS;
  if(request.method==='GET'){
    const pid=url.searchParams.get('photo');
    if(pid!=null){if(!ID.test(pid))return bad('Kimlik geçersiz');const img=await kv.get('jphoto:'+pid,'arrayBuffer');return img?new Response(img,{headers:{'content-type':'image/jpeg','cache-control':'private, max-age=31536000, immutable'}}):new Response(null,{status:404})}
    return Response.json(await read(kv),{headers:{'cache-control':'no-store'}});
  }
  if(request.method==='POST'){
    let b;try{b=await request.json()}catch{return bad('Geçersiz JSON')}
    const err=validateEntry(b);if(err)return bad(err);
    const list=await read(kv);if(list.some(x=>x.id===b.id))return Response.json(list);
    if(b.photo){const bytes=decode(b.photo);if(bytes.length>MAX_PHOTO)return bad('Fotoğraf çok büyük');await kv.put('jphoto:'+b.id,bytes)}
    list.push({id:b.id,date:b.date,who:b.who,text:b.text.trim(),photo:!!b.photo,t:Date.now()});
    await kv.put(DOC,JSON.stringify(list));return Response.json(list);
  }
  if(request.method==='DELETE'){
    const id=url.searchParams.get('id');if(!id||!ID.test(id))return bad('Kimlik geçersiz');
    const list=await read(kv),next=list.filter(x=>x.id!==id);
    if(list.find(x=>x.id===id)?.photo)await kv.delete('jphoto:'+id);
    await kv.put(DOC,JSON.stringify(next));return Response.json(next);
  }
  return new Response(null,{status:405});
}

// Ortak harcama listesi: KV'de tek JSON dizi. Erişim kontrolü functions/_middleware.js içinde.
// shortcut: aynı anda iki kayıt yarışırsa biri kaybolabilir (KV son yazan kazanır); iki kişi için yeterli.
// Fiş fotoğrafı ayrı anahtarda ('rphoto:<id>', ham JPEG); harcamada receipt:true olur.
const DOC='expenses',MAX_PHOTO=700_000,ID=/^[\w-]{8,40}$/;
export const CATS=['Yemek','Ulaşım','Alışveriş','Gezi','Konaklama','Diğer'],WHO=['Ali','Ayşe'],METHOD=['Kart','Nakit','ICOCA'];
const read=async kv=>JSON.parse(await kv.get(DOC)||'[]');
const bad=msg=>new Response(msg,{status:400});

export function validate(b){
  if(!b||typeof b!=='object')return 'Geçersiz veri';
  if(!Number.isInteger(b.amount)||b.amount<1||b.amount>10_000_000)return 'Tutar 1–10.000.000 yen arası tam sayı olmalı';
  if(!CATS.includes(b.cat)||!WHO.includes(b.who)||!METHOD.includes(b.method))return 'Kategori, kişi veya ödeme geçersiz';
  if(typeof b.date!=='string'||!/^2037-(10|11)-\d\d$/.test(b.date))return 'Tarih geçersiz';
  if(b.note!=null&&(typeof b.note!=='string'||b.note.length>80))return 'Not en fazla 80 karakter';
  if(typeof b.taxfree!=='boolean')return 'Tax-free alanı geçersiz';
  if(typeof b.id!=='string'||!/^[\w-]{8,40}$/.test(b.id))return 'Kimlik geçersiz';
  return null;
}

export async function onRequest({request,env}){
  const list=await read(env.CHECKS),url=new URL(request.url),rid=url.searchParams.get('receipt');
  if(rid!=null){
    if(!ID.test(rid))return bad('Kimlik geçersiz');
    if(request.method==='GET'){const img=await env.CHECKS.get('rphoto:'+rid,'arrayBuffer');return img?new Response(img,{headers:{'content-type':'image/jpeg','cache-control':'private, max-age=31536000, immutable'}}):new Response(null,{status:404})}
    if(request.method!=='POST')return new Response(null,{status:405});
    const x=list.find(e=>e.id===rid);if(!x)return bad('Harcama bulunamadı');
    let b;try{b=await request.json()}catch{return bad('Geçersiz JSON')}
    if(typeof b?.photo!=='string'||!b.photo.startsWith('data:image/jpeg;base64,'))return bad('Fotoğraf JPEG olmalı');
    const bytes=Uint8Array.from(atob(b.photo.slice(b.photo.indexOf(',')+1)),c=>c.charCodeAt(0));if(bytes.length>MAX_PHOTO)return bad('Fotoğraf çok büyük');
    await env.CHECKS.put('rphoto:'+rid,bytes);x.receipt=true;await env.CHECKS.put(DOC,JSON.stringify(list));return Response.json(list);
  }
  if(request.method==='GET')return Response.json(list,{headers:{'cache-control':'no-store'}});
  if(request.method==='POST'){
    let b;try{b=await request.json()}catch{return bad('Geçersiz JSON')}
    const err=validate(b);if(err)return bad(err);
    // İstemci kimliği tekrar gönderilirse (çevrimdışı kuyruk) çift kayıt oluşmaz.
    if(!list.some(x=>x.id===b.id))list.push({id:b.id,amount:b.amount,cat:b.cat,who:b.who,method:b.method,date:b.date,note:(b.note??'').trim(),taxfree:b.taxfree});
    await env.CHECKS.put(DOC,JSON.stringify(list));return Response.json(list);
  }
  if(request.method==='DELETE'){
    const id=new URL(request.url).searchParams.get('id');
    if(!id||!/^[\w-]{8,40}$/.test(id))return bad('Kimlik geçersiz');
    const next=list.filter(x=>x.id!==id);if(list.find(x=>x.id===id)?.receipt)await env.CHECKS.delete('rphoto:'+id);await env.CHECKS.put(DOC,JSON.stringify(next));return Response.json(next);
  }
  return new Response(null,{status:405});
}

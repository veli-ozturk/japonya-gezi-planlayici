// Ortak hediye listesi: KV'de tek JSON dizi. Erişim kontrolü functions/_middleware.js içinde.
// shortcut: aynı anda iki kayıt yarışırsa biri kaybolabilir (KV son yazan kazanır); iki kişi için yeterli.
const DOC='gifts',ID=/^[\w-]{8,40}$/;
export const BUYERS=['Ali','Ayşe'];
const read=async kv=>JSON.parse(await kv.get(DOC)||'[]');
const bad=msg=>new Response(msg,{status:400});

export function validateGift(b){
  if(!b||typeof b!=='object')return 'Geçersiz veri';
  if(typeof b.id!=='string'||!ID.test(b.id))return 'Kimlik geçersiz';
  if(typeof b.who!=='string'||!b.who.trim()||b.who.length>40)return 'Kime: 1–40 karakter';
  if(typeof b.item!=='string'||b.item.length>80)return 'Hediye en fazla 80 karakter';
  if(b.budget!=null&&(!Number.isInteger(b.budget)||b.budget<0||b.budget>1_000_000))return 'Bütçe 0–1.000.000 yen arası tam sayı';
  if(b.buyer!=null&&!BUYERS.includes(b.buyer))return 'Alacak kişi geçersiz';
  if(typeof b.done!=='boolean')return 'Alındı alanı geçersiz';
  return null;
}

export async function onRequest({request,env}){
  const list=await read(env.CHECKS);
  if(request.method==='GET')return Response.json(list,{headers:{'cache-control':'no-store'}});
  if(request.method==='POST'){
    let b;try{b=await request.json()}catch{return bad('Geçersiz JSON')}
    const err=validateGift(b);if(err)return bad(err);
    const g={id:b.id,who:b.who.trim(),item:b.item.trim(),budget:b.budget??null,buyer:b.buyer??null,done:b.done};
    // Aynı kimlik güncellenir (alındı işareti, düzenleme); yoksa eklenir.
    const i=list.findIndex(x=>x.id===g.id);if(i<0)list.push(g);else list[i]=g;
    await env.CHECKS.put(DOC,JSON.stringify(list));return Response.json(list);
  }
  if(request.method==='DELETE'){
    const id=new URL(request.url).searchParams.get('id');
    if(!id||!ID.test(id))return bad('Kimlik geçersiz');
    const next=list.filter(x=>x.id!==id);await env.CHECKS.put(DOC,JSON.stringify(next));return Response.json(next);
  }
  return new Response(null,{status:405});
}

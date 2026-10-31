// Ortak alışveriş tikleri: Cloudflare Pages Function, KV'de tek JSON belge.
// Erişim kontrolü functions/_middleware.js içinde (özel bağlantı + çerez).
// shortcut: aynı saniyede iki tik yarışırsa biri kaybolabilir ve KV yayılımı ~60 sn sürebilir; iki kişi için yeterli, çok kullanıcıda Durable Object'e geç.
const DOC='checks';
const read=async kv=>JSON.parse(await kv.get(DOC)||'{}');

export async function onRequest({request,env}){
  if(request.method==='GET')return Response.json(await read(env.CHECKS),{headers:{'cache-control':'no-store'}});
  if(request.method!=='POST')return new Response(null,{status:405});
  let body;try{body=await request.json()}catch{return new Response('Geçersiz JSON',{status:400})}
  if(!body||typeof body.key!=='string'||!/^[\w-]{1,40}$/.test(body.key)||typeof body.value!=='boolean')return new Response('Geçersiz veri',{status:400});
  const state=await read(env.CHECKS);
  if(body.value)state[body.key]=true;else delete state[body.key];
  await env.CHECKS.put(DOC,JSON.stringify(state));
  return Response.json(state);
}

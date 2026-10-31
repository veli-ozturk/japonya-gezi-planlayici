// İki telefonda ortak ayarlar (bütçe, kur, valiz hakkı): KV'de tek JSON belge. Erişim kontrolü functions/_middleware.js içinde.
const DOC='settings';
// Her alan için izin verilen aralık; dışındaki değer reddedilir.
export const LIMITS={budgetDay:[0,1_000_000],budgetTotal:[0,20_000_000],rate:[0.05,2],bagKg:[1,300],bagL:[0,1000]};
export async function onRequest({request,env}){
  const cur=JSON.parse(await env.CHECKS.get(DOC)||'{}');
  if(request.method==='GET')return Response.json(cur,{headers:{'cache-control':'no-store'}});
  if(request.method!=='POST')return new Response(null,{status:405});
  let b;try{b=await request.json()}catch{return new Response('Geçersiz JSON',{status:400})}
  if(!b||typeof b!=='object'||!Object.keys(b).length)return new Response('Geçersiz veri',{status:400});
  for(const [k,v] of Object.entries(b)){const l=LIMITS[k];if(!l||typeof v!=='number'||!Number.isFinite(v)||v<l[0]||v>l[1])return new Response('Geçersiz alan: '+k,{status:400})}
  const next={...cur,...b};await env.CHECKS.put(DOC,JSON.stringify(next));return Response.json(next);
}

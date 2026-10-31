// Ortak KV listesi: tek JSON dizi; GET liste, POST ekle/güncelle (aynı id), DELETE ?id=. Doğrulama çağırana ait.
// shortcut: aynı anda iki yazma yarışırsa biri kaybolabilir (KV son yazan kazanır); iki kişi için yeterli.
export const ID=/^[\w-]{8,40}$/;
export const str=(v,max,min=0)=>typeof v==='string'&&v.trim().length>=min&&v.length<=max;
export const optDate=v=>v==null||(typeof v==='string'&&/^2037-(10|11|12)-\d\d$/.test(v));
export const optTime=v=>v==null||(typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v));
export function kvList(doc,validate,clean){
  return async function onRequest({request,env}){
    const kv=env.CHECKS,list=JSON.parse(await kv.get(doc)||'[]');
    if(request.method==='GET')return Response.json(list,{headers:{'cache-control':'no-store'}});
    if(request.method==='POST'){
      let b;try{b=await request.json()}catch{return new Response('Geçersiz JSON',{status:400})}
      const err=!b||typeof b!=='object'?'Geçersiz veri':typeof b.id!=='string'||!ID.test(b.id)?'Kimlik geçersiz':validate(b);
      if(err)return new Response(err,{status:400});
      const x=clean(b),i=list.findIndex(y=>y.id===x.id);if(i<0)list.push(x);else list[i]=x;
      await kv.put(doc,JSON.stringify(list));return Response.json(list);
    }
    if(request.method==='DELETE'){
      const id=new URL(request.url).searchParams.get('id');if(!id||!ID.test(id))return new Response('Kimlik geçersiz',{status:400});
      const next=list.filter(x=>x.id!==id);await kv.put(doc,JSON.stringify(next));return Response.json(next);
    }
    return new Response(null,{status:405});
  };
}

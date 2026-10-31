// Bot bilgi paketi: statik bilgi.txt, sunulurken ortak tiklerle (KV checks) birleştirilir; böylece tamamlanan işler "YAPILDI" görünür.
// [[ana|yedek…]] satır başı: ana anahtar tikliyse YAPILDI; yalnız bağlı olduğu iş tikliyse GEREK KALMADI.
export function annotate(text,checks){
  return text.replace(/^\[\[([^\]]+)\]\] (.*)$/gm,(_,keys,line)=>{const [own,...deps]=keys.split('|');return checks[own]?`✅ YAPILDI: ${line}`:deps.some(k=>checks[k])?`☑️ GEREK KALMADI (diğer yoldan yapıldı): ${line}`:`⏳ YAPILACAK: ${line}`});
}
export async function onRequest({request,env}){
  const res=await env.ASSETS.fetch(request);if(!res.ok)return res;
  let checks={};try{checks=JSON.parse(await env.CHECKS.get('checks')||'{}')}catch{}
  return new Response(annotate(await res.text(),checks),{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
}

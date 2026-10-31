// Genel arama dizini: derlenmiş sayfalardan bölüm başlıkları ve kimlikli kartlar/satırlar çıkarılır.
// Kayıt: {t: başlık, s: kısa metin, p: sayfa adı, h: "sayfa.html#id"}
const decode=s=>s.replace(/<[^>]+>/g,' ').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const attr=(a,n)=>(a.match(new RegExp(`\\b${n}="([^"]*)"`))||[])[1];

// extra: derlemede hazırlanmış ek kayıtlar (ör. ürün → hangi gün, hangi mağaza).
export function searchIndex(out,labels,extra=[]){
  const seen=new Set(),list=[];
  const add=(t,s,file,id)=>{t=decode(t);if(!t||seen.has(id+'|'+t))return;seen.add(id+'|'+t);list.push({t,s:decode(s??'').slice(0,160),p:labels[file]??file,h:`${file}#${id}`})};
  for(const [file,html] of Object.entries(out)){
    if(!file.endsWith('.html')||file==='tamamlananlar.html')continue;
    const main=(html.match(/<main>([\s\S]*)<\/main>/)||[])[1]??'';
    for(const m of main.matchAll(/<section id="([^"]+)"[^>]*>\s*<h2>([\s\S]*?)<\/h2>/g))add(m[2],'Bölüm',file,m[1]);
    for(const m of main.matchAll(/<details id="([^"]+)"[^>]*>\s*<summary>([\s\S]*?)<\/summary>/g))add(m[2],'Bölüm',file,m[1]);
    for(const m of main.matchAll(/<(article|tr|li|div)\b([^>]*)>/g)){
      const id=attr(m[2],'id');if(!id)continue;
      const end=main.indexOf(`</${m[1]}>`,m.index),rest=main.slice(m.index,end<0?m.index+1500:end),title=(rest.match(/<h3>([\s\S]*?)<\/h3>/)||rest.match(/<p class="eyebrow">([\s\S]*?)<\/p>/)||rest.match(/<b>([\s\S]*?)<\/b>/)||[])[1];
      const ds=attr(m[2],'data-search');if(!title||(!ds&&!/^(ja-|day-)/.test(id)))continue;
      const day=id.match(/^day-2037-(\d\d)-(\d\d)$/);
      add(day?`${+day[2]} ${day[1]==='10'?'Ekim':'Kasım'} · ${decode(title)}`:title,ds??'',file,id);
    }
  }
  for(const e of extra){const ex=list.find(x=>x.h===`${e.f}#${e.id}`&&x.t===decode(e.t));if(ex)ex.s=(decode(e.s)+' — '+ex.s).slice(0,200);else add(e.t,e.s,e.f,e.id)}
  return list;
}

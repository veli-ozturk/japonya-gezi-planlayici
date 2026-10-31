// Tarayıcı konsolunda (yerel sunucuda herhangi bir sayfada) çalıştır: filtreli sayfalarda her seçeneği dener.
// Rapor: zero = 0 sonuç veren seçenek; leak = seçili boyut bilgisi olmadan görünen satır. İkisi de boş olmalı.
(async()=>{sessionStorage.clear();const pages=["program","program-tokyo","oneriler","oneriler-ozel","oneriler-yemek","oneriler-dukkan","gezi","gezi-tarihi","gezi-takvim","alisveris","alisveris-yiyecek","alisveris-giyim","alisveris-ev","alisveris-liste","alisveris-hediye","magazalar","instagram"];const out={};
for(const p of pages){const f=document.createElement('iframe');f.style.cssText='width:1200px;height:800px';document.body.append(f);await new Promise(r=>{f.onload=r;f.src='/'+p+'.html?v='+Date.now()});await new Promise(r=>setTimeout(r,500));const d=f.contentDocument;const s0=d.getElementById('search');if(!s0||s0.closest('.filters').hidden){f.remove();continue}
 const vis=()=>[...d.querySelectorAll('.filterable')].filter(e=>!e.classList.contains('hide'));const res={zero:[],leak:[]};
 for(const s of [...d.querySelectorAll('.filters select')].filter(s=>!s.hidden)){const k=s.id.slice(2);for(const o of [...s.options].slice(1)){s.value=o.value;s.dispatchEvent(new Event('change'));const v=vis();if(!v.length)res.zero.push(s.id+'='+o.value);if(v.some(e=>e.dataset[k]==null))res.leak.push(s.id+'='+o.value)}s.value='';s.dispatchEvent(new Event('change'))}
 if(res.zero.length||res.leak.length)out[p]=res;f.remove()}
console.log(Object.keys(out).length?out:'Filtreler temiz');return out})();

// Sayfa davranışı: arama/filtre (varsa), "Bugün" bağlantısı ve ana sayfa geri sayımı. Tik senkronu checks.js içinde.
// Filtre: bir boyut seçiliyse yalnız o veri alanını taşıyan satırlar elenir (ör. günlük program şehirle süzülür, türle süzülmez).
const search=$('search');
if(search){
  const rows=[...document.querySelectorAll('.filterable')],bar=search.closest('.filters');
  // Sayfada süzülecek satır yoksa filtre çubuğu gizlenir (ör. Hediyeler alt sayfası).
  if(!rows.length)bar.hidden=true;
  const match=(d,k,v)=>k==='score'?+d[k]>=+v:d[k]===v;
  const f=Object.fromEntries(['city','type','tier','score','kind','must','list','cat','price','value'].map(k=>[k,$('f-'+k)]).filter(([,e])=>e));
  // Bu sayfada hiç sonucu olmayan seçenekler kaldırılır; seçenek kalmazsa ya da tek seçenek bütün satırları kapsıyorsa seçici gizlenir.
  for(const [k,s] of Object.entries(f)){[...s.options].slice(1).forEach(o=>{if(!rows.some(e=>match(e.dataset,k,o.value)))o.remove()});if(s.options.length<2||(s.options.length===2&&rows.every(e=>match(e.dataset,k,s.options[1].value)))){s.hidden=true;delete f[k]}}
  // Filtre seçimi her alt sayfada ayrı saklanır (bir alt sayfadaki kategori diğerini boşaltmasın).
  const filterKey='japonya-gezi-filter-'+location.pathname;
  // Bir boyut seçiliyse o bilgiyi taşımayan satır da elenir; tamamlanıp gizlenenler sayılmaz.
  const filter=()=>{const q=search.value.toLocaleLowerCase('tr-TR'),hideDone=document.body.classList.contains('hide-done');let shown=0;rows.forEach(e=>{const d=e.dataset;const ok=d.search.toLocaleLowerCase('tr-TR').includes(q)&&Object.entries(f).every(([k,s])=>!s.value||(d[k]!=null&&match(d,k,s.value)));e.classList.toggle('hide',!ok);if(ok&&!(hideDone&&e.classList.contains('is-done')))shown++});const fc=$('f-count');fc.textContent=`${shown} sonuç`;// Sayfa kutusu yalnız bu sekmede arar; boşsa tüm siteye yönlendir.
  if(!shown&&q.trim().length>=2&&$('gsearch-q')){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='Tüm sitede ara →';b.onclick=()=>{const g=$('gsearch-q');g.value=search.value;g.focus();g.dispatchEvent(new Event('input'))};fc.append(' · bu sekmede yok. ',b)}try{sessionStorage.setItem(filterKey,JSON.stringify({q:search.value,...Object.fromEntries(Object.entries(f).map(([k,s])=>[k,s.value]))}))}catch{}};
  try{const saved=JSON.parse(sessionStorage.getItem(filterKey)||'{}');search.value=saved.q??'';Object.entries(f).forEach(([k,s])=>{const v=saved[k]??'';s.value=[...s.options].some(o=>o.value===v)?v:''})}catch{}
  // Bu telefonun sahibi (ana sayfada seçilir): sayfaya bu oturumda ilk girişte kendi listesiyle açılır.
  {let me=null;try{me=localStorage.getItem('jp26-me')}catch{}let first=true;try{first=!sessionStorage.getItem(filterKey)}catch{}if(first&&me&&f.list&&[...f.list.options].some(o=>o.value===me))f.list.value=me}
  const sehir=new URLSearchParams(location.search).get('sehir');if(sehir&&f.city&&[...f.city.options].some(o=>o.value===sehir))f.city.value=sehir;
  [search,...Object.values(f)].forEach(e=>e.addEventListener(e===search?'input':'change',filter));$('reset').addEventListener('click',()=>{search.value='';Object.values(f).forEach(s=>s.value='');filter()});document.addEventListener('checks',filter);filter();
}
// Japonya saatiyle bugünün tarihi; gezi sırasında programdaki güne, öncesinde geri sayıma bağlanır.
const today=new Date(Date.now()+9*36e5).toISOString().slice(0,10),todayDay=$('day-'+today),todayLink=$('today-link');
// Program iki alt sayfa: bugün diğer sayfadaysa bağlantı oraya gider.
const dayPage=d=>d>='2037-11-17'?'program-tokyo.html':'program.html';
if(todayLink&&today>='2037-11-09'&&today<='2037-11-24'){todayLink.href=(todayDay?'':dayPage(today))+'#day-'+today;todayLink.hidden=false;todayDay&&todayLink.addEventListener('click',()=>todayDay.querySelectorAll('details').forEach(d=>d.open=true))}
const countdown=$('countdown'),todayBox=$('today-box');
if(countdown){const days=Math.ceil((Date.parse('2037-11-08T14:10:00+03:00')-Date.now())/864e5);if(days>0)countdown.textContent=`Yola çıkışa ${days} gün · 8 Kasım 14.10 İstanbul → Guangzhou → Kansai`;else if(today<='2037-11-24'&&today>='2037-11-09'){countdown.textContent='Japonya’dasınız';todayBox.hidden=false;todayBox.innerHTML=`<a class="button" href="program.html#day-${today}">Bugünün programı →</a>`}else if(today<'2037-11-09')countdown.textContent='Yoldasınız: Guangzhou aktarması';}
// Tema düğmesi: otomatik (telefonun ayarı) → koyu → açık; seçim bu tarayıcıda saklanır.
const themeBtn=$('theme-toggle');
if(themeBtn){const root=document.documentElement,order=['','dark','light'],label={'':'otomatik',dark:'koyu',light:'açık'};const set=t=>{if(t)root.dataset.theme=t;else delete root.dataset.theme;themeBtn.setAttribute('aria-label','Tema: '+label[t]);themeBtn.title='Tema: '+label[t];try{t?localStorage.setItem('jp26-theme',t):localStorage.removeItem('jp26-theme')}catch{}};set(root.dataset.theme??'');themeBtn.addEventListener('click',()=>set(order[(order.indexOf(root.dataset.theme??'')+1)%3]))}
// Tamamlananlar sayfası: işaretli anahtarları kayıttan etiketiyle listeler; "Geri aç" tiki kaldırır.
const doneList=$('done-list');
if(doneList){const reg=JSON.parse($('registry').textContent),pages=JSON.parse($('page-labels').textContent);const draw=()=>{const done=reg.filter(r=>state[r.key]);if(!done.length){doneList.innerHTML='<p class="meta">Henüz tamamlanan yok.</p>';return}const groups={};done.forEach(r=>(groups[r.href.split('#')[0]]??=[]).push(r));doneList.replaceChildren(...Object.entries(groups).map(([page,rows])=>{const sec=document.createElement('section');const h=document.createElement('h2');h.textContent=`${pages[page]??page} (${rows.length})`;const ul=document.createElement('ul');ul.className='checklist';rows.forEach(r=>{const li=document.createElement('li');const a=document.createElement('a');a.href=r.href;a.textContent=r.label;const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='Geri aç';b.addEventListener('click',()=>setCheck(r.key,false));li.append(a,b);ul.append(li)});sec.append(h,ul);return sec}))};document.addEventListener('checks',draw);draw()}
// Sol menü (telefon): ☰ çekmeceyi açar; arka plana, bağlantıya veya Esc'e basınca kapanır.
const menuBtn=$('menu-btn'),scrim=$('scrim');
if(menuBtn){const set=open=>{document.body.classList.toggle('menu-open',open);menuBtn.setAttribute('aria-expanded',open);menuBtn.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç');scrim.hidden=!open};menuBtn.addEventListener('click',()=>set(!document.body.classList.contains('menu-open')));scrim.addEventListener('click',()=>set(false));$('side').addEventListener('click',e=>{if(e.target.closest('a'))set(false)});document.addEventListener('keydown',e=>{if(e.key==='Escape')set(false)})}

// Çevrimdışı çalışma: servis çalışanı sayfaları ve görselleri telefona kaydeder.
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
// Hava durumu (Open-Meteo, anahtarsız): yaklaşık 16 gün ileriyi gösterir; sonuç 3 saat bu telefonda saklanır.
const WX={0:['☀','Açık'],1:['🌤','Az bulutlu'],2:['⛅','Parçalı bulutlu'],3:['☁','Kapalı'],45:['🌫','Sisli'],48:['🌫','Sisli'],51:['🌦','Çisenti'],53:['🌦','Çisenti'],55:['🌧','Çisenti'],61:['🌧','Hafif yağmur'],63:['🌧','Yağmur'],65:['🌧','Kuvvetli yağmur'],71:['🌨','Kar'],73:['🌨','Kar'],75:['🌨','Kar'],80:['🌦','Sağanak'],81:['🌧','Sağanak'],82:['⛈','Kuvvetli sağanak'],95:['⛈','Fırtına']};
const CITY={Osaka:[34.6937,135.5023],Kyoto:[35.0116,135.7681],Nara:[34.6851,135.8048],Tokyo:[35.6812,139.7671]};
async function forecast(city){const k='jp26-wx-'+city;try{const c=JSON.parse(localStorage.getItem(k)||'null');if(c&&Date.now()-c.t<3*36e5)return c.d}catch{}const [la,lo]=CITY[city]??CITY.Tokyo;const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=16`);if(!r.ok)throw 0;const j=await r.json();const d={};j.daily.time.forEach((t,i)=>j.daily.temperature_2m_max[i]!=null&&(d[t]=[j.daily.weather_code[i],Math.round(j.daily.temperature_2m_max[i]),Math.round(j.daily.temperature_2m_min[i]),j.daily.precipitation_probability_max[i]]));try{localStorage.setItem(k,JSON.stringify({t:Date.now(),d}))}catch{}return d}
const wxText=w=>{const [ic,tx]=WX[w[0]]??['🌡','Hava'];return `${ic} ${tx} · ${w[1]}° / ${w[2]}°${w[3]!=null?` · yağış %${w[3]}`:''}`};
async function fillWeather(){const els=[...document.querySelectorAll('[data-wx-date]')];if(!els.length)return;for(const city of [...new Set(els.map(e=>e.dataset.wxCity))]){let d={};try{d=await forecast(city)}catch{}for(const e of els.filter(x=>x.dataset.wxCity===city)){const w=d[e.dataset.wxDate];e.textContent=w?wxText(w):'Hava tahmini o günden ~16 gün önce görünür.';e.classList.toggle('wx-rain',!!w&&w[3]>=60);const day=e.closest('.route'),ban=day?.querySelector('.rain-banner');if(ban){const rain=!!w&&w[3]>=60;day.classList.toggle('rainy',rain);ban.hidden=!rain;if(rain)ban.textContent=`☔ Yağmur bekleniyor (%${w[3]}). Şemsiye alın; aşağıdaki “Yağarsa” planı en üste alındı.`}}}}
fillWeather();
const trDate=d=>`${Number(d.slice(8))} ${d.slice(5,7)==='10'?'Ekim':'Kasım'}`;
// Ana sayfa "Bugün": gezi sırasında o günün şimdiki ve sıradaki durağı; öncesinde yaklaşan yapılacaklar.
const tripEl=$('trip-data'),todayCard=$('bugun');
if(tripEl&&todayCard){const tripData=JSON.parse(tripEl.textContent),now=new Date(Date.now()+9*36e5).toISOString(),date=now.slice(0,10),hm=now.slice(11,16),day=tripData.days[date];
  const show=()=>{if(day){const cur=day.hourly.find(h=>h[0]<=hm&&h[1]>hm),next=day.hourly.find(h=>h[0]>hm);todayCard.innerHTML=`<p class="eyebrow">Bugün · ${trDate(date)}</p><h2>${day.title}</h2>${cur?`<p><b>Şimdi:</b> ${cur[0]}–${cur[1]} ${cur[3]}</p>`:''}${next?`<p><b>Sıradaki:</b> ${next[0]} ${next[3]}${next[4]?` · <a href="https://www.google.com/maps/search/?api=1&query=${next[4].join(',')}" target="_blank" rel="noopener">Google Maps’te yol tarifi</a>`:''}</p>`:''}<p class="wx" data-wx-date="${date}" data-wx-city="${day.city}"></p>${(pts=>pts.length?`<div class="day-map" data-stops="${JSON.stringify(pts).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></div>`:'')(day.hourly.filter(h=>h[4]&&h[2]!=='Ulaşım').map(h=>[h[0],h[3],...h[4]]).filter((p,i,l)=>!i||p[2]!==l[i-1][2]||p[3]!==l[i-1][3]))}<a href="${dayPage(date)}#day-${date}">Günün programı</a>`;todayCard.hidden=false;fillWeather();return}
    const open=tripData.reminders.filter(t=>!document.querySelector(`[data-key=todo-${t.id}]`)?.checked&&![].concat(t.skipIf??[]).some(k=>document.querySelector(`[data-key=todo-${k}]`)?.checked)).slice(0,3);todayCard.hidden=!open.length||date>'2037-11-24';todayCard.innerHTML=`<p class="eyebrow">Yaklaşanlar</p><h2>Sıradaki işler</h2><ul class="facts">${open.map(t=>`<li><b>${trDate(t.date)}</b> · ${t.title}</li>`).join('')}</ul><a href="#yapilacaklar">Tüm takvim</a>`};
  show();document.addEventListener('checks',()=>{if(!day)show()})}
{const today=new Date(Date.now()+3*36e5).toISOString().slice(0,10);document.querySelectorAll('[data-due]').forEach(li=>{li.classList.toggle('due-past',li.dataset.due<today);li.classList.toggle('due-today',li.dataset.due===today)})}
// Pratik: dokununca Japonca okur (telefonun Japonca sesi varsa).
document.querySelectorAll('.speak').forEach(b=>b.addEventListener('click',()=>{if(!('speechSynthesis' in window))return alert('Bu telefonda sesli okuma yok; yazıyı gösterin.');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(b.dataset.say);u.lang='ja-JP';u.rate=.85;const v=speechSynthesis.getVoices().find(v=>v.lang.startsWith('ja'));if(v)u.voice=v;speechSynthesis.speak(u)}));
// Ortak ayarlar (bütçe, kur, valiz hakkı): sunucudan gelir, telefonda saklanır; internetsiz değişiklik bağlantı gelince gönderilir.
const SK='jp26-settings',SPK='jp26-settings-pending',jget=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d}catch{return d}},jput=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const settings=()=>({...jget(SK,{}),...jget(SPK,{})});
async function syncSettings(){try{const p=jget(SPK,{});if(Object.keys(p).length){const r=await fetch('/api/settings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(p)});if(r.ok||r.status===400)jput(SPK,{});if(r.ok)jput(SK,await r.json())}const r=await fetch('/api/settings',{cache:'no-store'});if(r.ok)jput(SK,await r.json())}catch{}document.dispatchEvent(new Event('settings'))}
document.querySelectorAll('[data-setting]').forEach(el=>{const show=()=>{const v=settings()[el.dataset.setting];if(v!=null&&document.activeElement!==el)el.value=v};show();document.addEventListener('settings',show);el.addEventListener('change',()=>{const v=+el.value;if(el.value!==''&&Number.isFinite(v)){jput(SPK,{...jget(SPK,{}),[el.dataset.setting]:v});document.dispatchEvent(new Event('settings'));syncSettings()}})});
if(document.querySelector('[data-setting]')){syncSettings();window.addEventListener('online',syncSettings)}
const fmt=n=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:0}).format(n);
// Harcama defteri: KV'de ortak; internet yokken eklenenler kuyrukta bekler ve bağlantı gelince gönderilir.
// Foto telefonda küçültülür (en uzun kenar max px, JPEG %80): günlük ve fiş fotoğrafı.
const shrink=(file,max=1600)=>new Promise((ok,no)=>{const img=new Image();img.onload=()=>{const k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(img.src);ok(c.toDataURL('image/jpeg',.8))};img.onerror=no;img.src=URL.createObjectURL(file)});
const expForm=$('exp-form');
if(expForm){const EK='jp26-exp',PK='jp26-exp-pending',RK='jp26-rcpt-pending';const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch{return []}},put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const clean=s=>String(s).replace(/[<>&"]/g,'');
  expForm.date.value=new Date(Date.now()+9*36e5).toISOString().slice(0,10);
  // Güncel kur (ECB, Frankfurter): 12 saat telefonda saklanır; elle kur girilmediyse o kullanılır.
  let fx=jget('jp26-fx',null);
  const fxNote=()=>{const st=settings(),el=$('fx-note');if(!el)return;if(st.rate==null&&fx&&document.activeElement!==$('exp-rate'))$('exp-rate').value=fx.rate.toFixed(4);el.innerHTML=fx?`Güncel kur (${trDate(fx.date)}, Avrupa Merkez Bankası): ¥1 = ${fx.rate.toLocaleString('tr-TR',{maximumFractionDigits:4})} TL${st.rate!=null&&Math.abs(st.rate-fx.rate)>0.0005?` · şu an elle girilen kur kullanılıyor <button type="button" class="link-button" id="fx-use">Güncel kuru kullan</button>`:''}`:'Güncel kur alınamadı; planlama kuru kullanılıyor.'};
  (async()=>{await 0;if(!fx||Date.now()-fx.t>12*36e5){try{const r=await fetch('https://api.frankfurter.dev/v1/latest?base=JPY&symbols=TRY');const j=await r.json();if(j.rates?.TRY){fx={t:Date.now(),rate:j.rates.TRY,date:j.date};jput('jp26-fx',fx)}}catch{}}draw()})();
  document.addEventListener('click',e=>{if(e.target.id==='fx-use'&&fx){jput(SPK,{...jget(SPK,{}),rate:+fx.rate.toFixed(4)});document.dispatchEvent(new Event('settings'));syncSettings()}});
  const draw=()=>{fxNote();const st=settings(),rate=st.rate??fx?.rate??+$('exp-rate').value,list=[...get(EK),...get(PK).map(x=>({...x,pending:true}))].sort((a,b)=>b.date.localeCompare(a.date));const sum=f=>list.filter(f).reduce((n,x)=>n+x.amount,0),tot=sum(()=>true);
    const group=key=>Object.entries(list.reduce((m,x)=>(m[x[key]]=(m[x[key]]??0)+x.amount,m),{})).sort((a,b)=>b[1]-a[1]);
    const today=new Date(Date.now()+9*36e5).toISOString().slice(0,10),spentToday=sum(x=>x.date===today),daysLeft=Math.max(1,Math.round((Date.parse('2037-11-24')-Date.parse(today<'2037-11-09'?'2037-11-09':today))/864e5)+1);
    const bar=(used,limit,label)=>{const pct=Math.min(100,Math.round(used/limit*100)),over=used>limit;return `<div class="tile card budget${over?' over':''}"><b>${label}</b><span>¥${fmt(used)} / ¥${fmt(limit)}${over?` · <strong>¥${fmt(used-limit)} aşıldı</strong>`:` · kalan ¥${fmt(limit-used)}`}</span><span class="bar" role="img" aria-label="Yüzde ${pct}"><i style="width:${pct}%"></i></span></div>`};
    // 1 Kasım 2037'dan itibaren tax-free iade usulü: vergi (%10 dahil fiyatın 10/110'u) çıkışta geri alınır.
    const tf=sum(x=>x.taxfree);
    $('exp-summary').innerHTML=`${st.budgetDay?bar(spentToday,st.budgetDay,'Bugünkü bütçe'):''}${st.budgetTotal?bar(tot,st.budgetTotal,'Toplam bütçe')+(today<='2037-11-24'&&tot<st.budgetTotal?`<div class="tile card"><b>Günlük kalan</b><span>${daysLeft} gün için günde ~¥${fmt((st.budgetTotal-tot)/daysLeft)}</span></div>`:''):''}<div class="tile card"><b>¥${fmt(tot)}</b><span>≈ ${fmt(tot*rate)} TL toplam</span></div>${[['who','Kişi'],['cat','Kategori'],['method','Ödeme']].map(([k,t])=>`<div class="tile card"><b>${t}</b><span>${group(k).map(([n,v])=>`${clean(n)}: ¥${fmt(v)}`).join('<br>')||'—'}</span></div>`).join('')}<div class="tile card"><b>Tax-free</b><span>${list.filter(x=>x.taxfree).length} fiş · ¥${fmt(tf)}<br>Tahmini iade ≈ ¥${fmt(tf*10/110)} (çıkışta, fişler ve pasaportla)</span></div>`;
    $('exp-list').innerHTML=list.length?[...new Set(list.map(x=>x.date))].map(d=>`<h3>${trDate(d)} · ¥${fmt(sum(x=>x.date===d))}</h3><ul class="checklist">${list.filter(x=>x.date===d).map(x=>`<li class="exp-row"><span><b>¥${fmt(x.amount)}</b> · ${clean(x.cat)} · ${clean(x.who)} · ${clean(x.method)}${x.taxfree?' · tax-free':''}${x.receipt?` · <a href="/api/expenses?receipt=${clean(x.id)}" target="_blank" rel="noopener">📎 fiş</a>`:jget(RK,{})[x.id]?' · 📎 fiş gönderilecek':''}${x.note?`<small>${clean(x.note)}</small>`:''}${x.pending?'<small>İnternet gelince gönderilecek</small>':''}</span><button type="button" class="secondary" data-del="${clean(x.id)}">Sil</button></li>`).join('')}</ul>`).join(''):'<p class="meta">Henüz harcama yok.</p>';expReport(list,rate)};
  document.addEventListener('settings',draw);
  const sync=async()=>{for(const x of get(PK)){try{const r=await fetch('/api/expenses',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});if(r.status===400){put(PK,get(PK).filter(y=>y.id!==x.id));$('exp-status').textContent='Bir kayıt reddedildi: '+await r.text();continue}if(!r.ok)break;put(EK,await r.json());put(PK,get(PK).filter(y=>y.id!==x.id))}catch{break}}
    // Fiş fotoğrafı, harcama sunucuya ulaştıktan sonra gönderilir (bekleyen fotoğraflar telefonda {id:dataURL}).
    for(const [id,photo] of Object.entries(jget(RK,{}))){if(!get(EK).some(x=>x.id===id))continue;try{const r=await fetch('/api/expenses?receipt='+id,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({photo})});if(!r.ok&&r.status!==400)break;const {[id]:_,...rest}=jget(RK,{});jput(RK,rest);if(r.ok)put(EK,await r.json());else $('exp-status').textContent='Fiş fotoğrafı reddedildi: '+await r.text()}catch{break}}
    try{const r=await fetch('/api/expenses',{cache:'no-store'});if(r.ok)put(EK,await r.json())}catch{}draw()};
  expForm.addEventListener('submit',async e=>{e.preventDefault();const f=expForm,x={id:crypto.randomUUID(),amount:Math.round(+f.amount.value),cat:f.cat.value,who:f.who.value,method:f.method.value,date:f.date.value,note:f.note.value.trim(),taxfree:f.taxfree.checked};if(!(x.amount>=1))return;const file=f.receipt.files[0];if(file){try{jput(RK,{...jget(RK,{}),[x.id]:await shrink(file,1280)})}catch{$('exp-status').textContent='Fotoğraf okunamadı; harcama fotoğrafsız eklendi.'}f.receipt.value=''}put(PK,[...get(PK),x]);f.amount.value='';f.note.value='';f.taxfree.checked=false;$('exp-status').textContent='Eklendi.';draw();sync()});
  $('exp-list').addEventListener('click',async e=>{const id=e.target.dataset.del;if(!id||!confirm('Bu harcama iki telefondan da silinsin mi?'))return;put(PK,get(PK).filter(x=>x.id!==id));try{const r=await fetch('/api/expenses?id='+encodeURIComponent(id),{method:'DELETE'});if(!r.ok)throw 0;put(EK,await r.json())}catch{alert('Silmek için internet gerekli.')}draw()});
  window.addEventListener('online',sync);draw();sync();setInterval(sync,60000)}
// Harita: Leaflet + OpenStreetMap; türe göre renk, süzme, şehre atlama ve "Konumum".
const mapEl=$('map');
if(mapEl&&!window.L)mapEl.innerHTML='<p class="meta" style="padding:16px">Harita internet ister; bağlantı gelince sayfayı yenileyin.</p>';
if(mapEl&&window.L){const data=JSON.parse($('map-data').textContent),COL={Gezi:'#c4511b',Yemek:'#b02a5c',Mağaza:'#2c6d86',Otel:'#2f6a3a'};const map=L.map(mapEl).setView([35.1,136.9],7);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap',crossOrigin:true}).addTo(map);
  const layers={};for(const m of data){layers[m.type]??=L.layerGroup().addTo(map);const a=document.createElement('div');a.innerHTML=`<b></b><br>${m.type} · ${m.city}<br><a href="${m.href}">Ayrıntı</a> · <a href="https://www.google.com/maps/search/?api=1&query=${m.ll.join(',')}" target="_blank" rel="noopener">Google Maps</a>`;a.querySelector('b').textContent=m.name;L.circleMarker(m.ll,{radius:7,color:'#fff',weight:2,fillColor:COL[m.type]??'#555',fillOpacity:.95}).bindPopup(a).addTo(layers[m.type])}
  const box=$('map-filters');box.innerHTML=Object.keys(layers).map(t=>`<label><input type="checkbox" checked data-layer="${t}"> <span class="dot" style="background:${COL[t]??'#555'}"></span>${t} (${data.filter(m=>m.type===t).length})</label>`).join('')+[['Osaka','34.675,135.5,13'],['Kyoto','35.0,135.76,12'],['Nara','34.685,135.83,14'],['Tokyo','35.68,139.74,12']].map(([n,c])=>`<button type="button" class="secondary" data-fly="${c}">${n}</button>`).join('')+'<button type="button" class="secondary" id="locate">Konumum</button><button type="button" id="near">📍 Yakınımdakiler</button>';
  box.addEventListener('change',e=>{const t=e.target.dataset.layer;if(t)e.target.checked?map.addLayer(layers[t]):map.removeLayer(layers[t])});
  box.addEventListener('click',e=>{if(e.target.id==='locate')map.locate({setView:true,maxZoom:15});if(e.target.id==='near')nearMe();const f=e.target.dataset.fly;if(f){const [a,b,z]=f.split(',').map(Number);map.setView([a,b],z)}});
  map.on('locationfound',e=>L.circleMarker(e.latlng,{radius:8,color:'#fff',weight:3,fillColor:'#1a73e8',fillOpacity:1}).addTo(map).bindPopup('Buradasınız').openPopup());
  // Yakınımdakiler: konuma en yakın 12 yer (3 km içinde), kuş uçuşu mesafe ve ~12 dk/km yürüme tahmini.
  function nearMe(){const out=$('near-list');out.hidden=false;out.textContent='Konum alınıyor…';if(!navigator.geolocation){out.textContent='Bu tarayıcı konum vermiyor.';return}
    navigator.geolocation.getCurrentPosition(p=>{const me=[p.coords.latitude,p.coords.longitude],km=([a,b])=>Math.hypot((a-me[0])*111,(b-me[1])*111*Math.cos(me[0]*Math.PI/180));
      // Şimdi ne yapsam?: Japonya saatine göre açık olanlar önce (kapanmak üzere olanlar uyarıyla), sonra saati bilinmeyenler, kapalılar en sonda.
      const j=new Date(Date.now()+9*36e5),st=m=>m.o?openState(m.o,j.getUTCDay(),j.getUTCHours()*60+j.getUTCMinutes()):'unknown',RANK={open:0,soon:1,unknown:2,closed:3},TAG={open:'✅ Şimdi açık',soon:'⏳ 1 saat içinde kapanır',unknown:'❔ Saat bilinmiyor',closed:'⛔ Şu an kapalı'};
      const near=data.filter(m=>m.type!=='Otel').map(m=>[m,km(m.ll),st(m)]).filter(([,d])=>d<=3).sort((x,y)=>RANK[x[2]]-RANK[y[2]]||x[1]-y[1]).slice(0,15);map.setView(me,15);L.circleMarker(me,{radius:8,color:'#fff',weight:3,fillColor:'#1a73e8',fillOpacity:1}).addTo(map);
      out.innerHTML=near.length?`<h3>Yakınınızda (${near.length}) · Japonya saati ${j.toISOString().slice(11,16)}</h3><p class="meta">Açık/kapalı bilgisi kayıtlı saatlerden tahmindir; tatil ve özel günleri kontrol edin.</p><ul class="checklist">${near.map(([m,d,s])=>`<li class="gift near-${s}"><span><b>${m.name.replace(/[<>&]/g,'')}</b> · ${m.type} · ${d<1?Math.round(d*1000)+' m':d.toFixed(1)+' km'} (~${Math.max(1,Math.round(d*12))} dk yürüme)<small>${TAG[s]}${m.hs?' · '+m.hs.replace(/[<>&]/g,''):''}</small><small><a href="${m.href}">Ayrıntı</a> · <a href="https://www.google.com/maps/search/?api=1&query=${m.ll.join(',')}" target="_blank" rel="noopener">Google Maps</a></small></span></li>`).join('')}</ul>`:'<p class="meta">3 km içinde listedeki yerlerden yok. Haritayı kaydırıp bakın.</p>'},()=>{out.textContent='Konum alınamadı; tarayıcıda konum iznini açın.'},{enableHighAccuracy:true,timeout:15000})}
  if(location.hash==='#yakin')nearMe();
  map.on('locationerror',()=>alert('Konum alınamadı; tarayıcıda konum iznini açın.'));
  // Günün rotası: seçilen günün durakları numaralı ve sırayla; seçim varken diğer noktalar gizlenir.
  const routes=JSON.parse($('day-routes').textContent),rl=L.layerGroup().addTo(map),sel=$('map-day');
  const showDay=d=>{rl.clearLayers();for(const g of Object.values(layers))d?map.removeLayer(g):map.addLayer(g);box.querySelectorAll('[data-layer]').forEach(c=>{c.checked=!d;c.disabled=!!d});if(d&&routes[d])drawRoute(L,map,routes[d],rl);else map.setView([35.1,136.9],7)};
  sel.addEventListener('change',()=>showDay(sel.value));
  const today=new Date(Date.now()+9*36e5).toISOString().slice(0,10);if(routes[today]){sel.value=today;showDay(today)}}
// Program kartındaki "Bugün alınacaklar": Alışveriş sayfasında alındı işaretlenen ürünün üstü çizilir.
// checks.js ilk apply() bu betikten önce çalışır; bu yüzden mevcut durumla da bir kez çağrılır.
const onChecks=f=>{document.addEventListener('checks',e=>f(e.detail));f(state)};
onChecks(s=>document.querySelectorAll('[data-bought]').forEach(li=>li.classList.toggle('bought',!!s[li.dataset.bought])));
// Valiz ağırlığı: alındı işaretlenen ürünlerin yaklaşık kilosu, ortak valiz hakkına (bagKg) göre.
const bagData=$('bag-data')&&JSON.parse($('bag-data').textContent);
if(bagData){const draw=()=>{const s=state,lim=settings().bagKg??100,got=Object.entries(bagData).filter(([k])=>s[k]).sort((a,b)=>b[1][0]-a[1][0]),kg=got.reduce((n,[,v])=>n+v[0],0),pct=Math.min(100,Math.round(kg/lim*100));
  $('bag-sum').innerHTML=`Alınanlar ≈ <b>${kg.toFixed(1)} kg</b> / ${lim} kg hak · ${got.length} ürün${kg>lim*.8?' · <strong>Hakkın %80\x27ini geçti; ağır olanları kargoya verin veya bavul ekleyin.</strong>':''}`;
  $('bag-bar').style.width=pct+'%';
  {const cap=(settings().bagL??60)-got.reduce((n,[,v])=>n+Math.min(0,v[2]??0),0),vol=got.reduce((n,[,v])=>n+Math.max(0,v[2]??0),0),el=$('bag-vol');if(el)el.innerHTML=`Hacim ≈ <b>${Math.round(vol)} L</b> / boş yer ${Math.round(cap)} L${s['buy-bavul']?' (yeni bavul +90 L dahil)':''}${vol>cap*.9?' · <strong>Yer yetmeyecek gibi: ek bavul alın ya da 16 Kasım kargosuna ağırlık verin.</strong>':''}`}$('bag-card').classList.toggle('over',kg>lim*.8);
  $('bag-list').innerHTML=got.map(([,v])=>`<li>${v[0].toFixed(1)} kg · ${v[1].replace(/[<>&]/g,'')}</li>`).join('')||'<li>Henüz alındı işaretlenen ürün yok.</li>'};
  onChecks(draw);document.addEventListener('settings',draw)}
// Android Chrome: "Uygulamayı yükle" düğmesi, tarayıcı izin verince görünür.
{let ev;const btn=$('install-btn');window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();ev=e;if(btn)btn.hidden=false});btn?.addEventListener('click',async()=>{if(!ev)return;ev.prompt();await ev.userChoice;ev=null;btn.hidden=true})}
// Mobilde alt sekmeler yatay kayar: seçili sekmeyi görünür yap.
{const b=document.querySelector('.subtabs b');if(b)b.parentElement.scrollLeft=b.offsetLeft-b.parentElement.offsetLeft-16}
// Mobil menü: geçerli sayfanın alt sayfaları ve bölümleri menüde, sayfa adının altında alt alta (kayan şerit yerine).
{const cur=document.querySelector('#side b[aria-current]'),tabs=[...document.querySelectorAll('.subtabs a,.subtabs b')],chips=[...document.querySelectorAll('.chips a')];
  if(cur&&(tabs.length||chips.length)){const box=document.createElement('div');box.className='nav-sub';
    const add=(el,cls)=>{const a=document.createElement(el.tagName==='B'?'b':'a');a.textContent=el.textContent;if(el.tagName!=='B')a.href=el.getAttribute('href');a.className=cls;box.append(a)};
    if(tabs.length)tabs.forEach(t=>{add(t,'nav-sub1');if(t.tagName==='B')chips.forEach(c=>add(c,'nav-sub2'))});else chips.forEach(c=>add(c,'nav-sub2'));
    cur.after(box);const sub=document.querySelector('.subtabs b'),bar=document.querySelector('.topbar b');if(sub&&bar)bar.textContent+=' · '+sub.textContent}}
// Menü açılınca geçerli sayfa görünsün.
menuBtn?.addEventListener('click',()=>{const side=$('side'),cur=side?.querySelector('b[aria-current]');if(cur&&document.body.classList.contains('menu-open'))side.scrollTop=cur.offsetTop-60});
// Genel arama (mobil alt çubuk): search.json ilk dokunuşta yüklenir; Türkçe harf farkı gözetmeden kelime kelime eşleşir.
{const box=$('gsearch'),inp=$('gsearch-q'),res=$('gsearch-res');let idx=null;
  const norm=s=>s.toLocaleLowerCase('tr-TR').replace(/ı/g,'i').normalize('NFD').replace(/[̀-ͯ]/g,'');
  const h=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const load=async()=>{if(idx)return;try{idx=(await (await fetch('search.json')).json()).map(e=>({...e,nt:norm(e.t),n:' '+norm(e.t+' '+e.s+' '+e.p).replace(/[^a-z0-9]+/g,' ')}))}catch{idx=[]}};
  const run=()=>{const q=norm(inp.value.trim());if(q.length<2){res.hidden=true;return}// Türkçe ek farkı (bıçak/bıçağı): 5+ harfli kelimede son harf esnek.
    // Eş anlamlılar: listede kısaltmayla geçen ürünler.
    const SYN={playstation:'ps5',plestation:'ps5',nintendo:'switch',airpods:'kulaklik'};
    const words=q.split(/\s+/).map(w=>SYN[w]??w).map(w=>w.length>=5?w.slice(0,-1):w);
    const hits=idx.filter(e=>words.every(w=>e.n.includes(' '+w))).map(e=>[e,(e.nt.startsWith(q)?3:0)+(e.nt.includes(q)?2:0)+(e.s==='Bölüm'?1:0)+(e.s.startsWith('📅')?2:0)]).sort((a,b)=>b[1]-a[1]).slice(0,40).map(x=>x[0]);
    res.innerHTML=hits.length?hits.map(e=>`<a href="${h(e.h)}"><b>${h(e.t)}</b><small>${h(e.p)}${e.s==='Bölüm'?' · bölüm':e.s?' · '+h(e.s.slice(0,80)):''}</small></a>`).join(''):'<p class="meta">Sonuç yok. Başka bir kelime deneyin.</p>';res.hidden=false};
  if(inp){inp.addEventListener('focus',load);inp.addEventListener('input',async()=>{await load();run()});inp.addEventListener('keydown',e=>{if(e.key==='Enter')res.querySelector('a')?.click();if(e.key==='Escape'){res.hidden=true;inp.blur()}});
    res.addEventListener('click',e=>{if(e.target.closest('a')){res.hidden=true;inp.blur()}});
    document.addEventListener('click',e=>{if(!box.contains(e.target))res.hidden=true})}}
// Bağlantıyla gelinen hedef görünür olsun: filtreyle gizlenmişse aç, katlanmış kutuyu aç, kısa vurgula.
{const reveal=()=>{const id=decodeURIComponent(location.hash.slice(1));const t=id&&document.getElementById(id);if(!t)return;t.classList.remove('hide');let d=t.closest('details');while(d){d.open=true;d=d.parentElement.closest('details')}if(t.tagName==='DETAILS')t.open=true;t.scrollIntoView({block:'start'});t.classList.add('flash');setTimeout(()=>t.classList.remove('flash'),1600)};
  window.addEventListener('hashchange',reveal);if(location.hash)setTimeout(reveal,50)}
// Hediye listesi: KV'de ortak; internetsiz değişiklikler kuyrukta bekler (aynı kimliğin son hâli gönderilir).
const giftForm=$('gift-form');
if(giftForm){const GK='jp26-gifts',GP='jp26-gifts-pending',cur=()=>jget(GK,[]),pend=()=>jget(GP,{});
  const h=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const view=()=>{const p=pend(),map=new Map(cur().map(g=>[g.id,g]));for(const [id,g] of Object.entries(p))g===null?map.delete(id):map.set(id,g);return [...map.values()]};
  const draw=()=>{const list=view();if(!list.length){$('gift-list').innerHTML='<p class="meta">Henüz hediye yok.</p>';return}
    const by=list.reduce((m,g)=>((m[g.who]??=[]).push(g),m),{});
    $('gift-list').innerHTML=Object.entries(by).sort((a,b)=>a[0].localeCompare(b[0],'tr')).map(([who,gs])=>{const b=gs.reduce((n,g)=>n+(g.budget??0),0),done=gs.filter(g=>g.done).length;return `<h3>${h(who)} <small class="meta">${done}/${gs.length} alındı${b?` · bütçe ¥${fmt(b)}`:''}</small></h3><ul class="checklist">${gs.map(g=>`<li class="gift${g.done?' bought':''}"><label><input type="checkbox" data-gift="${h(g.id)}"${g.done?' checked':''}> <span>${h(g.item)||'(hediye seçilmedi)'}${g.budget?` · ¥${fmt(g.budget)}`:''}${g.buyer?` · ${h(g.buyer)} alacak`:''}${pend()[g.id]!==undefined?'<small>İnternet gelince gönderilecek</small>':''}</span></label><button type="button" class="secondary" data-gift-del="${h(g.id)}">Sil</button></li>`).join('')}</ul>`}).join('')+`<p class="meta">Toplam hediye bütçesi: ¥${fmt(list.reduce((n,g)=>n+(g.budget??0),0))}</p>`};
  const sync=async()=>{for(const [id,g] of Object.entries(pend())){try{const r=g===null?await fetch('/api/gifts?id='+encodeURIComponent(id),{method:'DELETE'}):await fetch('/api/gifts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(g)});if(r.status===400){$('gift-status').textContent='Reddedildi: '+await r.text()}else if(!r.ok)break;else jput(GK,await r.json());const p=pend();delete p[id];jput(GP,p)}catch{break}}try{const r=await fetch('/api/gifts',{cache:'no-store'});if(r.ok)jput(GK,await r.json())}catch{}draw()};
  const save=g=>{jput(GP,{...pend(),[g.id]:g});draw();sync()};
  giftForm.addEventListener('submit',e=>{e.preventDefault();const f=giftForm,b=f.budget.value===''?null:Math.round(+f.budget.value);save({id:crypto.randomUUID(),who:f.who.value.trim(),item:f.item.value.trim(),budget:b,buyer:f.buyer.value||null,done:false});f.item.value='';f.budget.value='';$('gift-status').textContent='Eklendi.'});
  $('gift-list').addEventListener('change',e=>{const id=e.target.dataset.gift;if(!id)return;const g=view().find(x=>x.id===id);if(g)save({...g,done:e.target.checked})});
  $('gift-list').addEventListener('click',e=>{const id=e.target.dataset.giftDel;if(id&&confirm('Bu hediye iki telefondan da silinsin mi?')){jput(GP,{...pend(),[id]:null});draw();sync()}});
  window.addEventListener('online',sync);draw();sync();setInterval(sync,60000)}
// Günün haritası: Leaflet gerekince yüklenir (internet ister); duraklar numaralı, sırayla çizgiyle bağlı.
let leaflet=null;const loadL=()=>window.L?Promise.resolve(window.L):leaflet??=new Promise((ok,no)=>{const c=document.createElement('link');c.rel='stylesheet';c.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';c.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';c.crossOrigin='';document.head.append(c);const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';s.crossOrigin='';s.onload=()=>ok(window.L);s.onerror=()=>{leaflet=null;no()};document.head.append(s)});
// Program kartları, Bugün kutusu ve Harita sayfası ortak: verilen haritaya günün rotasını çizer.
function drawRoute(L,map,pts,group=map){pts.forEach(([t,n,la,lo],i)=>{const p=document.createElement('div');p.innerHTML=`<b>${i+1}. </b><br>${t}<br><a target="_blank" rel="noopener">Google Maps’te aç</a>`;p.querySelector('b').append(n);p.querySelector('a').href=`https://www.google.com/maps/search/?api=1&query=${la},${lo}`;L.marker([la,lo],{icon:L.divIcon({className:'map-num',html:String(i+1),iconSize:[26,26]})}).bindPopup(p).addTo(group)});
  L.polyline(pts.map(p=>[p[2],p[3]]),{color:'#c4511b',weight:3,dashArray:'6 6'}).addTo(group);map.fitBounds(pts.map(p=>[p[2],p[3]]),{padding:[24,24],maxZoom:16})}
async function dayMap(box,pts){if(box.dataset.ready)return;box.dataset.ready='1';box.textContent='Harita yükleniyor…';let L;try{L=await loadL()}catch{box.textContent='Harita internet ister; bağlantı gelince sayfayı yenileyin.';delete box.dataset.ready;return}
  box.textContent='';const map=L.map(box,{scrollWheelZoom:false});L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap',crossOrigin:true}).addTo(map);drawRoute(L,map,pts)}
// Gün kartında harita, kart ekrana gelince kendiliğinden açılır; düğme gizler/gösterir.
{const toggle=(b,open)=>{const box=b.nextElementSibling;box.hidden=!open;b.textContent=open?'🗺 Haritayı gizle':'🗺 Günün haritası';if(open)dayMap(box,JSON.parse(b.dataset.stops))};
  const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);toggle(e.target,true)}}),{rootMargin:'150px'}):null;
  document.querySelectorAll('.day-map-btn').forEach(b=>io?.observe(b));
  document.addEventListener('click',e=>{const b=e.target.closest('.day-map-btn');if(!b)return;io?.unobserve(b);toggle(b,b.nextElementSibling.hidden)});
  document.querySelectorAll('.day-map[data-stops]').forEach(box=>dayMap(box,JSON.parse(box.dataset.stops)))}
// Gezi günlüğü: fotoğraf telefonda en fazla 1600 px, JPEG %80'e küçültülür; liste gün gün (anı sayfası).
const jForm=$('journal-form');
if(jForm){const JK='jp26-journal',h=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const q=new URLSearchParams(location.search).get('d'),today=new Date(Date.now()+9*36e5).toISOString().slice(0,10);
  const pick=q||today;if([...jForm.date.options].some(o=>o.value===pick))jForm.date.value=pick;
  const days=Object.fromEntries([...jForm.date.options].map(o=>[o.value,o.textContent]));
  const draw=()=>{const list=jget(JK,[]).sort((a,b)=>a.date.localeCompare(b.date)||a.t-b.t);if(!list.length){$('journal-list').innerHTML='<p class="meta">Henüz not yok.</p>';return}
    $('journal-list').innerHTML=[...new Set(list.map(e=>e.date))].map(d=>`<article class="card journal-day" id="j-${d}"><h3>${h(days[d]??d)}</h3>${list.filter(e=>e.date===d).map(e=>`<figure class="journal-entry">${e.photo?`<img src="/api/journal?photo=${encodeURIComponent(e.id)}" loading="lazy" alt="${h(e.who)} fotoğrafı, ${h(days[d]??d)}">`:''}<figcaption>${e.text?`<p>${h(e.text)}</p>`:''}<small>${h(e.who)} · ${new Date(e.t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tokyo'})} JST <button type="button" class="link-button" data-jdel="${h(e.id)}">Sil</button></small></figcaption></figure>`).join('')}</article>`).join('')};
  const load=async()=>{try{const r=await fetch('/api/journal',{cache:'no-store'});if(r.ok)jput(JK,await r.json())}catch{}draw()};
  jForm.addEventListener('submit',async e=>{e.preventDefault();const f=jForm,st=$('journal-status'),btn=f.querySelector('button[type=submit]');
    if(!navigator.onLine){st.textContent='Eklemek için internet gerekiyor; bağlantı gelince tekrar deneyin.';return}
    btn.disabled=true;st.textContent='Kaydediliyor…';
    try{const photo=f.photo.files[0]?await shrink(f.photo.files[0]):null;const r=await fetch('/api/journal',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),date:f.date.value,who:f.who.value,text:f.text.value,photo})});
      if(!r.ok){st.textContent='Kaydedilemedi: '+await r.text();return}jput(JK,await r.json());f.text.value='';f.photo.value='';st.textContent='Kaydedildi.';draw();$('j-'+f.date.value)?.scrollIntoView({block:'start'})}
    catch{st.textContent='Kaydedilemedi; bağlantıyı kontrol edin.'}finally{btn.disabled=false}});
  $('journal-list').addEventListener('click',async e=>{const id=e.target.dataset.jdel;if(!id||!confirm('Bu not (ve fotoğrafı) iki telefondan da silinsin mi?'))return;try{const r=await fetch('/api/journal?id='+encodeURIComponent(id),{method:'DELETE'});if(r.ok){jput(JK,await r.json());draw()}}catch{alert('Silmek için internet gerekli.')}});
  draw();load()}
// Ortak KV listeleri (yapılacaklar, rezervasyonlar): telefonda saklanır, internetsiz değişiklik kuyrukta bekler.
function kvClient(api){const K='jp26-'+api,P=K+'-pending',pend=()=>jget(P,{}),subs=[];
  const view=()=>{const m=new Map(jget(K,[]).map(x=>[x.id,x]));for(const [id,x] of Object.entries(pend()))x===null?m.delete(id):m.set(id,x);return [...m.values()]};
  const emit=()=>subs.forEach(f=>f(view()));
  const sync=async()=>{for(const [id,x] of Object.entries(pend())){try{const r=x===null?await fetch(`/api/${api}?id=${encodeURIComponent(id)}`,{method:'DELETE'}):await fetch('/api/'+api,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)});if(!r.ok&&r.status!==400)break;if(r.ok)jput(K,await r.json());const p=pend();delete p[id];jput(P,p)}catch{break}}try{const r=await fetch('/api/'+api,{cache:'no-store'});if(r.ok)jput(K,await r.json())}catch{}emit()};
  const put=(id,x)=>{jput(P,{...pend(),[id]:x});emit();sync()};
  window.addEventListener('online',sync);setTimeout(sync,0);
  return {view,sync,on:f=>{subs.push(f);f(view())},save:x=>put(x.id,x),del:id=>put(id,null),pending:id=>pend()[id]!==undefined}}
{const esc2=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const tl=$('todo-list'),rl=$('res-list'),cards=document.querySelectorAll('.day-res');
  if(tl){const c=kvClient('todos'),f=$('todo-form');
    c.on(list=>{tl.innerHTML=list.sort((a,b)=>(a.done-b.done)||(a.due??'9').localeCompare(b.due??'9')).map(x=>`<li class="gift${x.done?' bought':''}"><label><input type="checkbox" data-todo="${esc2(x.id)}"${x.done?' checked':''}> <span>${esc2(x.text)}${x.due?` · <b>${trDate(x.due)}</b>`:''}${x.who?` · ${esc2(x.who)}`:''}${c.pending(x.id)?'<small>İnternet gelince gönderilecek</small>':''}</span></label><button type="button" class="secondary" data-todo-del="${esc2(x.id)}">Sil</button></li>`).join('')||'<li class="meta">Henüz yok.</li>'});
    f.addEventListener('submit',e=>{e.preventDefault();c.save({id:crypto.randomUUID(),text:f.text.value.trim(),due:f.due.value||null,who:f.who.value||null,done:false});f.text.value='';f.due.value=''});
    tl.addEventListener('change',e=>{const id=e.target.dataset.todo,x=id&&c.view().find(y=>y.id===id);if(x)c.save({...x,done:e.target.checked})});
    tl.addEventListener('click',e=>{const id=e.target.dataset.todoDel;if(id&&confirm('Silinsin mi?'))c.del(id)})}
  if(rl||cards.length){const c=kvClient('reservations'),f=$('res-form');
    const line=x=>`${x.time?`<b>${x.time}</b> `:''}${esc2(x.title)}${x.place?` · ${esc2(x.place)}`:''}${x.note?`<small>${esc2(x.note)}</small>`:''}`;
    c.on(list=>{list.sort((a,b)=>(a.date+(a.time??'')).localeCompare(b.date+(b.time??'')));
      if(rl)rl.innerHTML=list.map(x=>`<li class="gift"><span><b>${trDate(x.date)}</b> · ${line(x)}${c.pending(x.id)?'<small>İnternet gelince gönderilecek</small>':''}</span><button type="button" class="secondary" data-res-del="${esc2(x.id)}">Sil</button></li>`).join('')||'<li class="meta">Henüz rezervasyon yok.</li>';
      cards.forEach(d=>{const xs=list.filter(x=>x.date===d.dataset.date);d.hidden=!xs.length;d.innerHTML=xs.length?`<p class="tip"><b>📅 Rezervasyon:</b> ${xs.map(line).join('<br>')}</p>`:''})});
    if(f){f.addEventListener('submit',e=>{e.preventDefault();c.save({id:crypto.randomUUID(),date:f.date.value,time:f.time.value||null,title:f.title.value.trim(),place:f.place.value.trim(),note:f.note.value.trim()});f.title.value='';f.place.value='';f.note.value='';f.time.value=''});
      rl.addEventListener('click',e=>{const id=e.target.dataset.resDel;if(id&&confirm('Silinsin mi?'))c.del(id)})}}}
// Kargo gönderileri: takip numarası Yamato takip sayfasına bağlanır.
{const sl=$('ship-list'),f=$('ship-form');if(sl){const c=kvClient('shipments'),e2=s=>String(s??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  c.on(list=>{sl.innerHTML=list.sort((a,b)=>a.date.localeCompare(b.date)).map(x=>`<li class="gift"><span><b>${trDate(x.date)}</b> · ${e2(x.from)} → ${e2(x.to)}${x.note?` · ${e2(x.note)}`:''}${x.tracking?`<small><a href="https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number00=1&number01=${x.tracking}" target="_blank" rel="noopener">Yamato’da takip et (${x.tracking})</a></small>`:''}${c.pending(x.id)?'<small>İnternet gelince gönderilecek</small>':''}</span><button type="button" class="secondary" data-ship-del="${e2(x.id)}">Sil</button></li>`).join('')||'<li class="meta">Henüz gönderi yok.</li>'});
  f.addEventListener('submit',e=>{e.preventDefault();const t=f.tracking.value.replace(/\D/g,'');c.save({id:crypto.randomUUID(),date:f.date.value,from:f.from.value.trim(),to:f.to.value.trim(),tracking:t||null,note:f.note.value.trim()});f.tracking.value='';f.note.value=''});
  sl.addEventListener('click',e=>{const id=e.target.dataset.shipDel;if(id&&confirm('Silinsin mi?'))c.del(id)})}}
// Harcama raporu ve tax-free fişleri (harcama listesi her çizildiğinde güncellenir).
function expReport(list,rate){const e2=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const tf=list.filter(x=>x.taxfree),groups={};for(const x of tf)(groups[x.date+'|'+(x.note||'(mağaza yazılmamış)')]??=[]).push(x);
  if($('tf-list'))$('tf-list').innerHTML=tf.length?`<ul class="checklist">${Object.entries(groups).sort().map(([k,xs])=>{const [d,store]=k.split('|'),sum=xs.reduce((n,x)=>n+x.amount,0);return `<li><span><b>${trDate(d)}</b> · ${e2(store)} · ¥${fmt(sum)} → iade ≈ ¥${fmt(sum*10/110)}${sum<5500?' <strong>· ¥5.000 (vergisiz) altı, iade olmayabilir</strong>':''}${xs.filter(x=>x.receipt).map(x=>` · <a href="/api/expenses?receipt=${encodeURIComponent(x.id)}" target="_blank" rel="noopener">📎 fiş</a>`).join('')}</span></li>`}).join('')}</ul><p><b>Toplam:</b> ${tf.length} fiş · ¥${fmt(tf.reduce((n,x)=>n+x.amount,0))} → tahmini iade ≈ ¥${fmt(tf.reduce((n,x)=>n+x.amount,0)*10/110)}</p>`:'<p class="meta">Henüz tax-free fiş yok.</p>';
  const box=$('exp-report');if(!box)return;if(!list.length){box.innerHTML='<p class="meta">Harcama ekledikçe burada gün, kategori ve kişi bazında özet çıkar.</p>';return}
  const by=k=>Object.entries(list.reduce((m,x)=>(m[x[k]]=(m[x[k]]??0)+x.amount,m),{})).sort((a,b)=>k==='date'?a[0].localeCompare(b[0]):b[1]-a[1]);
  const bars=(rows,label=r=>e2(r))=>{const max=Math.max(...rows.map(r=>r[1]));return `<ul class="report-bars">${rows.map(([n,v])=>`<li><span>${label(n)}</span><i style="width:${Math.max(2,Math.round(v/max*100))}%"></i><b>¥${fmt(v)}</b></li>`).join('')}</ul>`};
  const total=list.reduce((n,x)=>n+x.amount,0);
  box.innerHTML=`<p><b>Toplam ¥${fmt(total)}</b> ≈ ${fmt(total*rate)} TL · günlük ortalama ¥${fmt(total/new Set(list.map(x=>x.date)).size)}</p><h3>Günlere göre</h3>${bars(by('date'),trDate)}<h3>Kategoriye göre</h3>${bars(by('cat'))}<h3>Kişiye göre</h3>${bars(by('who'))}<h3>Ödeme türüne göre</h3>${bars(by('method'))}`;
  $('exp-csv').onclick=()=>{const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;const csv='﻿'+[['Tarih','Kişi','Kategori','Ödeme','Tutar (¥)','TL (kur '+rate+')','Tax-free','Not'],...list.map(x=>[x.date,x.who,x.cat,x.method,x.amount,Math.round(x.amount*rate),x.taxfree?'evet':'',x.note])].map(r=>r.map(q).join(';')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='japonya-harcamalar.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}}
// Yen ↔ TL çevirici: ortak ayardaki kur, yoksa son alınan güncel kur (12 saat önbellek), yoksa planlama kuru.
{const jy=$('fx-jpy'),tr=$('fx-try');if(jy){let fx=jget('jp26-fx',null);const rate=()=>settings().rate??fx?.rate??0.317,f2=n=>n.toLocaleString('tr-TR',{maximumFractionDigits:0});
  const show=src=>{const r=rate();if(src==='jpy'){const y=+jy.value;tr.value=y?Math.round(y*r):''}else{const t=+tr.value;jy.value=t?Math.round(t/r):''}const y=+jy.value;$('fx-out').innerHTML=y?`<b>¥${f2(y)} ≈ ${f2(y*r)} TL</b>${y>=5500?`<br>Tax-free iade ≈ ¥${f2(y*10/110)} (≈ ${f2(y*10/110*r)} TL) · vergi dahil fiyattan`:''}`:'';$('fx-rate').textContent=`Kur: ¥1 = ${r.toLocaleString('tr-TR',{maximumFractionDigits:4})} TL · ${settings().rate!=null?'Harcama sayfasındaki ortak kur':fx?`güncel kur (${trDate(fx.date)})`:'planlama kuru'}`};
  jy.addEventListener('input',()=>show('jpy'));tr.addEventListener('input',()=>show('try'));show('jpy');
  if(!fx||Date.now()-fx.t>12*36e5)fetch('https://api.frankfurter.dev/v1/latest?base=JPY&symbols=TRY').then(r=>r.json()).then(j=>{if(j.rates?.TRY){fx={t:Date.now(),rate:j.rates.TRY,date:j.date};jput('jp26-fx',fx);show('jpy')}}).catch(()=>{});
  document.addEventListener('settings',()=>show('jpy'))}}
// Hazırlık durumu (ana sayfa): dört kontrol listesinin ortak tiklerden yüzdesi ve sıradaki açık işler.
{const box=$('prep'),pd=$('prep-data');if(box&&pd){const groups=JSON.parse(pd.textContent);
  onChecks(s=>{let done=0,all=0;const open=[];const rows=groups.map(([name,href,items])=>{const d=items.filter(([k])=>s[k]).length;done+=d;all+=items.length;items.filter(([k])=>!s[k]).slice(0,2).forEach(([,t])=>open.push([t,href]));const pct=Math.round(d/items.length*100);return `<li><a href="${href}">${name}</a><span class="bar"><i style="width:${pct}%"></i></span><b>${d}/${items.length}</b></li>`});
    const pct=Math.round(done/all*100);box.innerHTML=`<p class="prep-total"><b>%${pct}</b> hazır · ${done}/${all} iş</p><ul class="prep-list">${rows.join('')}</ul>${open.length?`<p class="meta"><b>Sıradaki açık işler:</b> ${open.slice(0,4).map(([t,h])=>`<a href="${h}">${t.replace(/[<>&]/g,'')}</a>`).join(' · ')}</p>`:'<p>Her şey hazır, iyi yolculuklar!</p>'}`;
    $('hazirlik').hidden=new Date(Date.now()+9*36e5).toISOString().slice(0,10)>'2037-11-24'})}}
// "Bu telefon kimin?": seçim yalnız bu telefonda; formlardaki "kim" alanlarını önceden doldurur.
{const getMe=()=>{try{return localStorage.getItem('jp26-me')}catch{return null}};
  const mark=()=>document.querySelectorAll('[data-me]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.me===getMe()));
  document.addEventListener('click',e=>{const b=e.target.closest('[data-me]');if(!b)return;try{localStorage.setItem('jp26-me',b.dataset.me)}catch{}mark()});mark();
  const me=getMe();if(me)for(const sel of ['#exp-form [name=who]','#journal-form [name=who]','#todo-form [name=who]','#gift-form [name=buyer]']){const el=document.querySelector(sel);if(el&&[...el.options].some(o=>o.value===me))el.value=me}}
// Program sayfaları: üstte yapışkan gün çubuğu; gezide bugünün kartına kendiliğinden gider.
{const days=[...document.querySelectorAll('article.route[id^="day-2037-"]')];
  if(days.length>=3){const WD=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'],today='day-'+new Date(Date.now()+9*36e5).toISOString().slice(0,10);
    const nav=document.createElement('nav');nav.className='day-jump';nav.setAttribute('aria-label','Güne git');
    nav.innerHTML=days.map(a=>{const d=a.id.slice(4);return `<a href="#${a.id}"${a.id===today?' aria-current="date"':''}><b>${Number(d.slice(8))}</b><small>${WD[new Date(d+'T12:00:00Z').getUTCDay()]}</small></a>`}).join('');
    days[0].parentNode.insertBefore(nav,days[0]);
    const t=document.getElementById(today);if(t&&!location.hash)setTimeout(()=>t.scrollIntoView({block:'start'}),300);}}
// Ana sayfa: yapılacaklardan yalnız sıradaki 5 tanesi; gerisi düğmeyle açılır.
{const ul=document.querySelector('#yapilacaklar ul.todo');if(ul){const btn=document.createElement('button');btn.type='button';btn.className='secondary more-btn';let all=false;ul.after(btn);
  const fit=()=>{const open=[...ul.children].filter(li=>!li.classList.contains('is-done'));open.forEach((li,i)=>li.classList.toggle('more-hidden',!all&&i>=5));btn.hidden=open.length<=5;btn.textContent=all?'Daha az göster':`Tümünü göster (${open.length})`};
  btn.addEventListener('click',()=>{all=!all;fit()});document.addEventListener('checks',fit);fit()}}
// Ana sayfa: seçili kişiye göre karşılama; seçim yapıldıysa "Bu telefon kimin?" kartı küçülür; uygulama olarak açıldıysa kurulum kartı gizlenir.
{const me=(()=>{try{return localStorage.getItem('jp26-me')}catch{return null}})();
  const card=$('ben');if(card&&me)card.classList.add('me-set');
  document.addEventListener('click',e=>{if(e.target.closest('[data-me]'))card?.classList.add('me-set')});
  if(matchMedia('(display-mode: standalone)').matches||navigator.standalone){const u=$('uygulama');if(u)u.hidden=true}
  const h=new Date().getHours(),hi=h<11?'Günaydın':h<18?'Merhaba':'İyi akşamlar';
  const g=$('greet');if(g&&me)g.textContent=`${hi} ${me} 👋`}
// Mobilde filtre seçicileri "Filtreler" düğmesinin arkasında; arama kutusu ve sonuç sayısı hep görünür.
document.querySelectorAll('.filters').forEach(box=>{const extra=[...box.children].filter(el=>el.matches('select,label,button')&&!el.hidden);if(extra.length<2)return;
  extra.forEach(el=>el.classList.add('filter-extra'));const btn=document.createElement('button');btn.type='button';btn.className='secondary filter-toggle';box.querySelector('#search')?.after(btn);
  const label=()=>{const on=extra.filter(el=>el.tagName==='SELECT'&&el.value).map(el=>el.selectedOptions[0].textContent);btn.textContent=box.classList.contains('collapsed')?(on.length?'Filtre: '+on.join(', ')+' ▾':'Filtreler ▾'):'Filtreleri gizle ▴';btn.setAttribute('aria-expanded',!box.classList.contains('collapsed'))};
  box.classList.add('collapsed');btn.addEventListener('click',()=>{box.classList.toggle('collapsed');label()});box.addEventListener('change',label);setTimeout(label,0)});
// Ana sayfa saatleri: Japonya (UTC+9) ve Türkiye (UTC+3); ikisinde de yaz saati yok, fark hep 6 saat.
{const els=document.querySelectorAll('[data-clock]');if(els.length){const DAY=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const tick=()=>{const at=h=>new Date(Date.now()+h*36e5);els.forEach(el=>el.textContent=at(+el.dataset.clock).toISOString().slice(11,16));const j=at(9),t=at(3),d=document.querySelector('[data-clock-day]');if(d)d.textContent=j.getUTCDate()!==t.getUTCDate()?`Japonya’da ${DAY[j.getUTCDay()]}, Türkiye’de ${DAY[t.getUTCDay()]}`:`İkisinde de ${DAY[j.getUTCDay()]}`};
  tick();setInterval(tick,20000)}}
// Her Google Maps bağlantısının yanına Apple Haritalar bağlantısı (sonradan eklenen listeler dahil).
{const addApple=root=>root.querySelectorAll?.('a[href*="google.com/maps"]:not([data-apple])').forEach(a=>{a.dataset.apple='1';const t=a.textContent.trim(),r=appleMapsUrl(a.dataset.ll?'https://www.google.com/maps/search/?api=1&query='+a.dataset.ll:a.href,t&&!/google|konum|harita|rota|pin|ayrıntı/i.test(t)?t:(a.closest('article,li,tr')?.querySelector('h3,b')?.textContent.trim()||'Konum'));if(!r)return;
  const x=document.createElement('a');x.href=r.url;x.target='_blank';x.rel='noopener';x.className='apple-map'+(a.classList.contains('button-link')?' button-link secondary-link':'');x.textContent=r.first?' Apple Haritalar (ilk durağa)':' Apple Haritalar';
  if(a.classList.contains('button-link'))a.after(x);else a.after(document.createTextNode(' · '),x)});
  addApple(document);new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>n.nodeType===1&&addApple(n.matches?.('a')?n.parentNode:n)))).observe(document.body,{childList:true,subtree:true})}

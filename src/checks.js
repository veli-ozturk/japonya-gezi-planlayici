const key='japonya-gezi-checks',api='/api/checks';let state={};try{state=JSON.parse(localStorage.getItem(key)||'{}')}catch{}const checks=document.querySelectorAll('.check');const $=id=>document.getElementById(id);
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
// Tamamlananlar varsayılan olarak her sayfada gizlenir; 'göster' tercihi yalnız bu telefonda saklanır.
const showDone=()=>{try{return localStorage.getItem('jp26-show-done')==='1'}catch{return false}};
// Tikler tüm sayfalarda ortak; sayaç yalnız o sayfadaki kutuları sayar. 'checks' olayı filtre ve Tamamlananlar listesine haber verir.
function apply(){checks.forEach(e=>{e.checked=!!state[e.dataset.key];const box=e.closest('tr,article,li');box.classList.toggle('checked',e.checked);box.classList.toggle('is-done',e.checked||!!e.dataset.skip?.split(' ').some(k=>state[k]))});document.body.classList.toggle('hide-done',!showDone());const n=[...checks].filter(e=>e.checked).length,p=$('progress'),t=$('done-toggle');if(p){p.hidden=!checks.length;if(checks.length)p.textContent=`Tamamlanan: ${n}/${checks.length}`}if(t){t.hidden=!n;t.textContent=showDone()?'Tamamlananları gizle':`Tamamlananları göster (${n})`}document.dispatchEvent(new CustomEvent('checks',{detail:state}))}
// İnternetsiz atılan tikler kuyrukta bekler; bağlantı gelince gönderilir ve sunucu çekişinde kaybolmaz.
const pendKey='jp26-pending';const pending=()=>{try{return JSON.parse(localStorage.getItem(pendKey)||'{}')}catch{return {}}};const setPending=o=>{try{localStorage.setItem(pendKey,JSON.stringify(o))}catch{}};
const send=(k,v)=>fetch(api,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:k,value:v})}).then(r=>{if(!r.ok)throw 0});
async function flush(){const q=pending();for(const [k,v] of Object.entries(q)){try{await send(k,v);const now=pending();delete now[k];setPending(now)}catch{return}}}
function setCheck(k,v){if(v)state[k]=true;else delete state[k];apply();save();setPending({...pending(),[k]:v});flush()}
apply();checks.forEach(e=>e.addEventListener('change',()=>setCheck(e.dataset.key,e.checked)));
$('done-toggle')?.addEventListener('click',()=>{try{localStorage.setItem('jp26-show-done',showDone()?'0':'1')}catch{}apply()});
// Cloudflare'de /api/checks iki telefonun ortak tiklerini tutar; yerel dosyada istek başarısız olur ve yalnız bu tarayıcı kullanılır.
async function pull(){await flush();try{const r=await fetch(api,{cache:'no-store'});if(r.ok){state=await r.json();for(const [k,v] of Object.entries(pending())){if(v)state[k]=true;else delete state[k]}apply();save()}}catch{}}
window.addEventListener('online',()=>pull());
pull();setInterval(pull,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull()});
const printOpen=[];window.addEventListener('beforeprint',()=>{document.querySelectorAll('details').forEach(e=>{printOpen.push([e,e.open]);e.open=true})});window.addEventListener('afterprint',()=>{printOpen.splice(0).forEach(([e,open])=>e.open=open)});

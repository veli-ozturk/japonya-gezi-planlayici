// Telegram botunun (cihazdaki /jp komutu) okuduğu düz metin bilgi paketi: docs/bilgi.txt.
// Site gibi özel bağlantı/çerezle korunur; rezervasyon kodu, PIN, pasaport yazılmaz (veri dosyalarında da yok).
// page(id): bölümün site adresi (anahtarsız); bot cevabın sonuna koyar.
export function bilgiText({trip,transport,pratik,plan,picks,hours,mustbuy,travel,emergency},page=()=>null){
  const S=id=>{const u=page(id);return u?['SAYFA: '+u]:[]};
  const L=[],TH=pratik.tokyoHotel??{};
  const item=Object.fromEntries(mustbuy.categories.flatMap(c=>c.items.map(i=>[i.id,i.name])));
  L.push('JAPONYA GEZİSİ 2037 — Ali ve Ayşe. Saatler JST. TL dönüşümü 0,317 planlama kuru.');
  L.push(`Osaka oteli: ${trip.hotel.name}, ${trip.hotel.address} (9–17 Kasım).`);
  if(TH.name)L.push(`Tokyo oteli: ${TH.name}, ${TH.address} (17–24 Kasım). ${TH.access??''} ${TH.stay??''}`);
  L.push('','UÇUŞLAR',...S('ucuslar'),...travel.flights.map(f=>`${f.date} ${f.flight} ${f.fromName} ${f.dep} → ${f.toName} ${f.arr}${f.arrDate&&f.arrDate!==f.date?' ('+f.arrDate+')':''}`));
  for(const d of Object.keys(trip.hourly).sort()){
    const p=plan.days[d]??{};L.push('',`== ${d} ==`,...S('day-'+d));
    for(const h of trip.hourly[d])L.push(`${h[0]}–${h[1]} ${h[2]}: ${h[3]} — ${h[4]}${h[5]?' ('+h[5]+')':''}`);
    if(p.buy?.length)L.push('Alınacaklar: '+p.buy.map(([id,where])=>`${item[id]??id} @ ${where}`).join('; '));
    if(p.alt?.length)L.push('Alternatifler: '+p.alt.join(' | '));
    if(p.meet)L.push('Buluşma: '+p.meet);
    if(p.rain)L.push('Yağmurda: '+p.rain);
    for(const l of transport.legs.filter(l=>l.date===d))L.push(`Rota ${l.from} → ${l.to} (${l.duration}): ${l.steps.map(s=>`${s[0]} ${s[1]}→${s[2]} ${s[3]} ${s[4]}`).join(' / ')}${l.note?' — '+l.note:''}`);
  }
  L.push('','ÖNERİLER (yer · şehir/semt · gün · saat)',...picks.picks.map(x=>{const h=hours.places['pick-'+x.id];return `${x.name} [${x.type}] · ${x.city}/${x.area??''} · ${x.day??'-'} · ${x.when??''}${h?.hours?' · açık '+h.hours:''}${h?.closed?' · kapalı '+h.closed:''} — ${x.why??''}${page('pick-'+x.id)?' | SAYFA: '+page('pick-'+x.id):''}`}));
  // [[anahtar|...]]: functions/bilgi.txt.js sunarken tik durumuna göre YAPILDI işaretler.
  L.push('','HATIRLATMALAR',...pratik.reminders.map(r=>{const u=r.link&&page(r.link.split('#')[1]??'');return `[[${['todo-'+r.id,...[].concat(r.skipIf??[]).map(k=>'todo-'+k)].join('|')}]] ${r.date} ${r.title}: ${r.detail??''}${u?' | SAYFA: '+u:''}`}));
  L.push('','VALİZ VE KARGO',...S('takkyubin'),...travel.luggage.facts);
  L.push('','HAVALİMANI ADIMLARI',...travel.airports.flatMap(a=>[`# ${a.title} (${a.when})`,...S(a.id),...a.steps.map(s=>`${s[0]} ${s[1]} — ${s[2]??''}`)]));
  L.push('','ACİL NUMARALAR',...S('acil'),...emergency.numbers.map(n=>`${n.name}: ${n.number} — ${n.note??''}`));
  return L.join('\n')+'\n';
}

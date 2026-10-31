// Uzun sayfaları alt sayfalara böler: <main> içindeki üst düzey <section id> blokları SUBPAGES'e göre dağıtılır,
// bölüm dışındaki içerik (filtreler, notlar) her alt sayfada kalır. Sonra tüm sitedeki "sayfa.html#id" bağlantıları yeni dosyaya çevrilir.
export const SUBPAGES={
  'program.html':[['program.html','Osaka · Kyoto · Nara (9–16)',['konaklama','rota-osaka']],['program-tokyo.html','Tokyo (17–24)',['rota-tokyo']]],
  'gezi.html':[['gezi.html','Görülecek yerler',['yerler']],['gezi-tarihi.html','Tarihi yerler',['tarihi']],['gezi-takvim.html','Takvim ve rota',['takvim','harita']]],
  'oneriler.html':[['oneriler.html','Gezi',['gezi-oneri']],['oneriler-ozel.html','Özel deneyim',['ozel','secenekler']],['oneriler-yemek.html','Yemek',['yemek-oneri']],['oneriler-dukkan.html','Dükkân',['dukkan-oneri']]],
  'alisveris.html':[['alisveris.html','Eczane ve kozmetik',['degerli','valiz-agirlik','kat-eczane']],['alisveris-yiyecek.html','Yiyecek ve hediyelik',['kat-atistirmalik','kat-hediyelik']],['alisveris-giyim.html','Giyim ve aksesuar',['kat-giyim','kat-aksesuar']],['alisveris-ev.html','Elektronik, mutfak, kırtasiye',['kat-elektronik','kat-mutfak','kat-kirtasiye']],['alisveris-liste.html','Ana liste',['urun']],['alisveris-hediye.html','Hediyeler',['hediyeler']],['magazalar.html','Mağazalar',['magaza','outlet']]],
  'yolculuk.html':[['yolculuk.html','Uçuş ve yol',['ucuslar','cin','havalimani','yol','otopark','shinkansen','kurallar','kontrol']],['valiz.html','Valiz',['valiz','takkyubin','valiz-agirlik','valiz-listesi']]]
};
const owner=(subs,id)=>subs.find(([,,ids])=>ids.some(x=>x.endsWith('-')?id.startsWith(x):id===x));

// <main> gövdesini üst düzey parçalara ayırır: [{id|null, html}]
function topLevel(body){
  const parts=[];let i=0;
  while(i<body.length){
    const at=body.indexOf('<section',i);
    if(at<0){parts.push({id:null,html:body.slice(i)});break}
    if(at>i)parts.push({id:null,html:body.slice(i,at)});
    let depth=0,j=at;const re=/<section\b|<\/section>/g;re.lastIndex=at;let m;
    while((m=re.exec(body))){depth+=m[0]==='</section>'?-1:1;if(!depth){j=re.lastIndex;break}}
    const html=body.slice(at,j);parts.push({id:(html.match(/^<section[^>]*\bid="([^"]+)"/)||[])[1]??null,html});i=j;
  }
  return parts;
}

export function splitPages(out){
  const moved={};// 'sayfa.html#id' -> 'yeni.html'
  for(const [file,subs] of Object.entries(SUBPAGES)){
    const html=out[file],m=html.match(/<main>([\s\S]*)<\/main>/);const parts=topLevel(m[1]);
    for(const [sub,label,ids] of subs){
      const mine=parts.filter(p=>!p.id||owner(subs,p.id)?.[0]===sub);
      for(const p of parts)if(p.id&&owner(subs,p.id)?.[0]===sub)for(const [,id] of p.html.matchAll(/\bid="([^"]+)"/g))moved[`${file}#${id}`]=sub;
      const tabs=`<nav class="subtabs" aria-label="Alt sayfalar">${subs.map(([f,l])=>f===sub?`<b aria-current="page">${l}</b>`:`<a href="${f}">${l}</a>`).join('')}</nav>`;
      let page=html.replace(m[0],`<main>${mine.map(p=>p.html).join('')}</main>`).replace(/<div class="chips">([\s\S]*?)<\/div>/,(_,c)=>{const keep=c.replace(/<a href="#([^"]+)">[^<]*<\/a>/g,(a,id)=>mine.some(p=>p.id===id)?a:'');return tabs+((keep.match(/<a /g)||[]).length>1?`<div class="chips">${keep}</div>`:'')});
      if(!page.includes('class="subtabs"'))page=page.replace('<main>',tabs+'<main>');
      out[sub]=page;
    }
  }
  // Bağlantıları yeni yerlerine çevir: başka sayfalardan "x.html#id" ve alt sayfa içinden "#id".
  const linkRe=new RegExp(`(?<![\\w-])(${Object.keys(SUBPAGES).map(f=>f.replace('.','\\.')).join('|')})#([\\w-]+)`,'g');
  for(const f of Object.keys(out)){
    const parent=Object.entries(SUBPAGES).find(([,subs])=>subs.some(([s])=>s===f))?.[0];
    out[f]=out[f].replace(linkRe,(a,p,id)=>moved[`${p}#${id}`]?`${moved[`${p}#${id}`]}#${id}`:a);
    if(parent)out[f]=out[f].replace(/href="#([\w-]+)"/g,(a,id)=>{const t=moved[`${parent}#${id}`];return t&&t!==f?`href="${t}#${id}"`:a});
  }
  return out;
}

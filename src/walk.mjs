// Günlük yürüme tahmini (kaba): duraklar arası ≤2,5 km bacak yürünür (kuş uçuşu ×1,3 sokak payı),
// daha uzak bacak toplu taşıma sayılır (istasyon içi/çıkış ~0,8 km). Büyük alanların içindeki gezinti ve günlük taban ayrıca eklenir.
// shortcut: gerçek rota değil, kuş uçuşu tahmin; adım sayarı verisi gelirse onunla kalibre et.
const SITES=[[/Fushimi Inari/i,4,'Fushimi Inari basamakları'],[/Kiyomizu|Sannenzaka|Ninenzaka/i,2,'Kiyomizu ve Sannenzaka yokuşu'],[/Nara Park|Todaiji|Kasuga/i,3,'Kasuga yolu hafif yokuş'],[/Bambu|Arashiyama|Tenryuji/i,2.5,null],[/Kinkakuji/i,1,null],[/Osaka Kalesi/i,2.5,'Kale yokuşu ve merdivenler'],[/Ueno Park/i,2,null],[/Meiji Jingu/i,2,null],[/outlet|Gotemba|ASICS/i,4,null],[/Sensoji|Nakamise/i,1,null],[/Akihabara|PCSHOP|Dospara|GIGA/i,3,null],[/Harajuku|Shibuya/i,2,null],[/Nishiki/i,1,null],[/Shinsekai|Otaroad|Den Den/i,1.5,null],[/bit pazarı|Flea|Oedo|MOTTAINAI/i,1.5,null]];
// Taban: istasyon koridorları, dükkân içi; havalimanı/Shinkansen günlerinde daha az.
const baseOf=names=>names.some(n=>/Havalimanı|Shin-Osaka|check-in|Kansai/i.test(n))?1.5:2.5;
const km=([a,b],[c,d])=>Math.hypot((a-c)*111,(b-d)*91);
export function walkEstimate(pts,stopNames){
  let total=baseOf(stopNames);for(let i=1;i<pts.length;i++){const d=km(pts[i-1],pts[i]);total+=d<=2.5?d*1.3:0.8}
  const hills=[];const seen=new Set();
  for(const n of stopNames)for(const [re,add,hill] of SITES)if(re.test(n)&&!seen.has(re.source)){seen.add(re.source);total+=add;if(hill)hills.push(hill)}
  const k=Math.round(total*2)/2;
  return {km:k,level:k<8?'hafif':k<=13?'orta':'ağır',hills};
}

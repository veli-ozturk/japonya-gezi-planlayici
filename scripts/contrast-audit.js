// Tarayıcıda çalışır: görünen metinlerin yazı/arka plan kontrastını WCAG oranıyla ölçer.
(async()=>{
const parse=c=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(/[ ,/]+/).filter(Boolean).map(Number);return {r:p[0],g:p[1],b:p[2],a:p[3]??1}};
const lum=({r,g,b})=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
const ratio=(a,b)=>{const L1=lum(a),L2=lum(b);return (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05)};
const blend=(top,bot)=>({r:top.r*top.a+bot.r*(1-top.a),g:top.g*top.a+bot.g*(1-top.a),b:top.b*top.a+bot.b*(1-top.a),a:1});
const onImage=el=>el.closest('.hero2,.pages,.topbar,footer');
const bgOf=el=>{const layers=[];for(let e=el;e&&e!==document.documentElement;e=e.parentElement){const c=parse(getComputedStyle(e).backgroundColor);if(c&&c.a>0){layers.push(c);if(c.a>=.99)break}}let base=null;for(let i=layers.length-1;i>=0;i--){base=base?blend(layers[i],base):(layers[i].a>=.99?layers[i]:null)}return base};
const bad=[];let n=0;
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
const seen=new Set();
while(walker.nextNode()){const t=walker.currentNode;if(!t.textContent.trim())continue;const el=t.parentElement;if(seen.has(el))continue;seen.add(el);if(el.closest('script,style,[hidden],.hide,option'))continue;const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;const cs=getComputedStyle(el);if(cs.visibility==='hidden'||+cs.opacity===0)continue;n++;
  if(onImage(el))continue;
  const bg=bgOf(el);const fg=parse(cs.color);if(!bg){bad.push(['ARKA PLAN YOK (görsel üstünde)',el.tagName,el.className,t.textContent.trim().slice(0,40)]);continue}
  const c=ratio(blend(fg,bg),bg);const size=parseFloat(cs.fontSize),bold=+cs.fontWeight>=700;const need=(size>=24||(size>=18.66&&bold))?3:4.5;
  if(c<need)bad.push([c.toFixed(2),el.tagName,el.className,t.textContent.trim().slice(0,40)]);}
const uniq=[...new Map(bad.map(b=>[b.slice(0,3).join('|'),b])).values()];
return {kontrolEdilen:n,sorun:uniq.length,ornek:uniq.slice(0,12)};
})()

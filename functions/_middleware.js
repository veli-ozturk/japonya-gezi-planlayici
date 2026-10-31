// Tüm site (sayfa, indirmeler, /api) özel bağlantıyla korunur: ?k=<anahtar> bir kez açılınca 1 yıllık çerez bırakır.
// Kodda yalnız anahtarın SHA-256 özeti durur. Anahtarı değiştirmek: yeni rastgele anahtar üret, özeti buraya (veya KEY_HASH ortam değişkenine) yaz, yeniden yayınla; eski bağlantı ve çerezler geçersiz olur.
const KEY_HASH='0000000000000000000000000000000000000000000000000000000000000000'; // kendi anahtarınızın SHA-256 özetini KEY_HASH ortam değişkenine yazın
const COOKIE='jp26';
const hex=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
async function valid(key,hash){if(!key)return false;const h=await hex(key);let d=h.length^hash.length;for(let i=0;i<h.length;i++)d|=h.charCodeAt(i)^hash.charCodeAt(i);return d===0}
// Ana ekrana eklenen uygulamanın çerez kutusu Safari'den ayrıdır; çerezi yoksa bağlantıyı buraya yapıştırarak girer.
const deny=msg=>new Response(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Japonya 2037</title><style>body{font:17px system-ui,sans-serif;background:#17161b;color:#f4f1ea;margin:0;padding:32px 20px;max-width:480px}input,button{font:inherit;width:100%;box-sizing:border-box;padding:14px;border-radius:12px;margin-top:12px}input{border:1px solid #555;background:#232129;color:#f4f1ea}button{border:0;background:#f08a4b;color:#17161b;font-weight:700}</style></head><body><h1>Japonya 2037</h1><p>${msg}</p><form method="get" action="/"><label for="k">Size gönderilen özel bağlantıyı (veya anahtarı) yapıştırın:</label><input id="k" name="k" autocomplete="off" autocapitalize="off" spellcheck="false" required><button type="submit">Giriş</button></form></body></html>`,{status:401,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
// Yapıştırılan tam bağlantıdan anahtarı çıkarır (…?k=ANAHTAR).
const keyOf=v=>{v=v.trim();const i=v.lastIndexOf('k=');return i>=0&&/^https?:\/\//.test(v)?decodeURIComponent(v.slice(i+2).split(/[&#\s]/)[0]):v};

// iOS ana ekran ikonunu çerezsiz indirir; 401 alırsa logo yerine harf gösterir. İkonlar ve manifest özel bilgi içermez.
const PUBLIC=new Set(['/icon-180.png','/icon-192.png','/icon-512.png','/apple-touch-icon.png','/apple-touch-icon-precomposed.png','/manifest.webmanifest']);

export async function onRequest({request,env,next}){
  const hash=env.KEY_HASH||KEY_HASH,url=new URL(request.url),key=url.searchParams.get('k');
  if(PUBLIC.has(url.pathname)&&key===null)return next();
  if(key!==null){
    const k=keyOf(key);
    if(!await valid(k,hash))return deny('Bağlantı geçersiz.');
    // Anahtarı adres çubuğundan ve geçmişten temizlemek için parametresiz adrese yönlendir.
    url.searchParams.delete('k');
    return new Response(null,{status:302,headers:{location:url.pathname+url.search,'set-cookie':`${COOKIE}=${k}; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax`,'cache-control':'no-store'}});
  }
  const cookie=(request.headers.get('cookie')||'').split(/;\s*/).find(c=>c.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if(await valid(cookie,hash))return next();
  return deny('Bu sayfa özel bağlantıyla açılır. Size gönderilen bağlantıyı bu telefonda bir kez açın.');
}

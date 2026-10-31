import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// Site çok sayfalı: kontroller tüm sayfaların birleşik HTML'i üzerinde.
const dir=new URL('../docs/',import.meta.url);
const html=fs.readdirSync(dir).filter(n=>n.endsWith('.html')).map(n=>fs.readFileSync(new URL(n,dir),'utf8')).join('\n');
test('Rehberdeki indirmeler ve bölüm bağlantıları var',()=>{for(const [,raw]of html.matchAll(/href="([^"]+)"/g)){if(raw.startsWith('downloads/'))assert.ok(fs.existsSync(new URL('../docs/'+raw,import.meta.url)),raw);if(raw.startsWith('#'))assert.ok(html.includes('id="'+raw.slice(1)+'"'),raw);}});
test('Rota düğmeleri başlangıç ve bitiş içerir; tablo kaynakları korunur',()=>{let count=0;for(const [,raw]of html.matchAll(/href="([^"]+)"/g)){const href=raw.replaceAll('&amp;','&');if(href.startsWith('https://www.google.com/maps/dir/')){const u=new URL(href);assert.ok(u.searchParams.get('origin'));assert.ok(u.searchParams.get('destination'));count++;}}assert.ok(count>=70);assert.ok(html.includes('Örnek Otel Shinsaibashi'));assert.ok(html.includes('ICOCA'));assert.ok(html.includes('Green Bell'));assert.ok(html.includes('Shichimiya'));assert.ok(html.includes('Cocokarafine'));});

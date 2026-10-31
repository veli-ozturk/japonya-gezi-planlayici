import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const txt=fs.readFileSync(new URL('../docs/bilgi.txt',import.meta.url),'utf8');
const trip=JSON.parse(fs.readFileSync(new URL('../data/trip.json',import.meta.url)));
test('Bot bilgi paketi her günü ve otelleri içerir, gizli bilgi taşımaz',()=>{
  for(const d of Object.keys(trip.hourly))assert.ok(txt.includes(`== ${d} ==`),d);
  assert.match(txt,/Tokyo oteli: Örnek Otel Ueno/);
  assert.doesNotMatch(txt,/PİNs*:|Onay nos*:|Check-in numarasıs+[A-Z0-9]{6,}/i);
});

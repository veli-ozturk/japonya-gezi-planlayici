import test from 'node:test';
import assert from 'node:assert/strict';
import {annotate} from '../functions/bilgi.txt.js';
test('Bilgi paketi tik durumunu yazar',()=>{
  const t='[[todo-a]] 2037-10-28 Otel\n[[todo-b|todo-a]] 2037-11-17 Yedek\n[[todo-c]] 2037-11-20 Diğer\nnormal satır';
  const o=annotate(t,{'todo-a':true});
  assert.match(o,/✅ YAPILDI: 2037-10-28 Otel/);assert.match(o,/GEREK KALMADI.*Yedek/);assert.match(o,/⏳ YAPILACAK: 2037-11-20 Diğer/);assert.match(o,/\nnormal satır$/);
});

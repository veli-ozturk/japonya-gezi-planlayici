// Ortak yapılacaklar (kullanıcının eklediği): {id,text,due,who,done}. Son tarihli olanlar sabah Telegram'ında hatırlatılır.
import {kvList,str,optDate} from '../../shared/kvlist.js';
export const validateTodo=b=>!str(b.text,120,1)?'Yapılacak 1–120 karakter':!optDate(b.due)?'Tarih geçersiz':b.who!=null&&!['Ali','Ayşe'].includes(b.who)?'Kişi geçersiz':typeof b.done!=='boolean'?'Tamamlandı alanı geçersiz':null;
export const onRequest=kvList('todos',validateTodo,b=>({id:b.id,text:b.text.trim(),due:b.due??null,who:b.who??null,done:b.done}));

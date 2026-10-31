// Kargo (takkyubin) gönderileri: {id,date,from,to,tracking,note}. Takip numarası Yamato’da 12 hane.
import {kvList,str,optDate} from '../../shared/kvlist.js';
export const validateShip=b=>!optDate(b.date)||b.date==null?'Tarih gerekli':!str(b.from,60,1)||!str(b.to,60,1)?'Nereden/nereye 1–60 karakter':b.tracking!=null&&!/^\d{10,12}$/.test(b.tracking)?'Takip numarası 10–12 rakam':b.note!=null&&!str(b.note,120)?'Not en fazla 120 karakter':null;
export const onRequest=kvList('shipments',validateShip,b=>({id:b.id,date:b.date,from:b.from.trim(),to:b.to.trim(),tracking:b.tracking??null,note:(b.note??'').trim()}));

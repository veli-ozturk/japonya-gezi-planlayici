// Rezervasyonlar: {id,date,time,title,place,note}. Rezervasyon/bilet kodu girilmez (not alanı kısa tutulur).
// Gün kartında görünür; Telegram: o sabah ve bir önceki akşam hatırlatılır.
import {kvList,str,optDate,optTime} from '../../shared/kvlist.js';
export const validateRes=b=>!optDate(b.date)||b.date==null?'Tarih gerekli':!optTime(b.time)?'Saat SS:DD olmalı':!str(b.title,80,1)?'Başlık 1–80 karakter':b.place!=null&&!str(b.place,120)?'Yer en fazla 120 karakter':b.note!=null&&!str(b.note,200)?'Not en fazla 200 karakter':null;
export const onRequest=kvList('reservations',validateRes,b=>({id:b.id,date:b.date,time:b.time??null,title:b.title.trim(),place:(b.place??'').trim(),note:(b.note??'').trim()}));

if(document.getElementById('route-planner')){
const routeForm=document.getElementById('route-planner');
const routeFrom=document.getElementById('route-from');
const routeTo=document.getElementById('route-to');
if(routeTo.options.length>1)routeTo.selectedIndex=1;
routeForm.addEventListener('submit',event=>{
  event.preventDefault();
  if(routeFrom.value===routeTo.value){routeTo.setCustomValidity('Başlangıçtan farklı bir varış seç.');routeTo.reportValidity();return;}
  routeTo.setCustomValidity('');
  const params=new URLSearchParams({api:'1',origin:routeFrom.value,destination:routeTo.value,travelmode:document.getElementById('route-mode').value});
  window.open('https://www.google.com/maps/dir/?'+params,'_blank','noopener,noreferrer');
});
// Apple Haritalar (iPhone/Apple Watch): aynı başlangıç–varış ve ulaşım türü.
document.getElementById('route-apple')?.addEventListener('click',()=>{if(routeFrom.value===routeTo.value)return routeForm.requestSubmit();window.open(appleMapsUrl('https://www.google.com/maps/dir/?'+new URLSearchParams({origin:routeFrom.value,destination:routeTo.value,travelmode:document.getElementById('route-mode').value})).url,'_blank','noopener,noreferrer')});
routeTo.addEventListener('change',()=>routeTo.setCustomValidity(''));
routeFrom.addEventListener('change',()=>routeTo.setCustomValidity(''));
}

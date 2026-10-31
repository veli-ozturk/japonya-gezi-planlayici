export function mapUrl(query){return 'https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query});}
export function directionsUrl(origin,destination,mode='transit',waypoints=[]){
  if(!origin||!destination)throw new Error('Rota için başlangıç ve bitiş gerekli');
  if(!['walking','transit','driving','bicycling'].includes(mode))throw new Error('Geçersiz rota türü');
  // Public Maps URLs: no API key. Transit does not support waypoint routing.
  if(waypoints.length&&mode==='transit')throw new Error('Toplu taşımada ara durak olmaz');
  const p={api:'1',origin,destination,travelmode:mode};if(waypoints.length)p.waypoints=waypoints.slice(0,9).join('|');
  return 'https://www.google.com/maps/dir/?'+new URLSearchParams(p);
}
export function anchor(value){return String(value).replace(/[^a-zA-Z0-9_-]/g,'-');}

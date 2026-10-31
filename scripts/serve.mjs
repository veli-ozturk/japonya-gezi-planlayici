import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../docs');
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}const data=await fs.readFile(target);const type={'.html':'text/html; charset=utf-8','.csv':'text/csv; charset=utf-8','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.zip':'application/zip','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json','.js':'text/javascript'}[path.extname(target)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type});res.end(data);}catch{res.writeHead(404);res.end('Bulunamadı');}});
server.listen(4173,'127.0.0.1',()=>console.log('Yerel rehber: http://127.0.0.1:4173'));

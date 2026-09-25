// Local-only test server. /__test__/ simulates GitHub; no real credentials are used.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const records = new Map();
let rejectSave = false;
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png' };
http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const send = (code, data) => { res.writeHead(code, { 'Content-Type':'application/json' }); res.end(JSON.stringify(data)); };
    if (url.pathname === '/__mock__/fail-next-save') { rejectSave = true; return send(200, { ready:true }); }
    if (url.pathname.startsWith('/__mock__/repos/')) {
        if (req.headers.authorization !== 'Bearer test-token') return send(401, { message:'Test token rejected' });
        if (url.pathname.endsWith('/branches/main')) return send(200, { name:'main' });
        const marker = '/contents/';
        if (!url.pathname.includes(marker)) return send(200, { permissions:{push:true} });
        const file = decodeURIComponent(url.pathname.split(marker)[1]);
        if (!/^assets\/data\/[a-z]+\.json$/.test(file)) return send(404, { message:'Not found' });
        if (!records.has(file)) {
            try { records.set(file, { content:fs.readFileSync(path.join(root,file)).toString('base64'), sha:'original-'+file }); }
            catch { return send(404, { message:'Not found' }); }
        }
        const record = records.get(file);
        if (req.method === 'PUT') {
            if (rejectSave) { rejectSave = false; return send(409, { message:'Conflict' }); }
            let body = ''; for await (const chunk of req) body += chunk;
            const payload = JSON.parse(body);
            if (payload.sha !== record.sha) return send(409, { message:'Conflict' });
            record.content = payload.content; record.sha = 'saved-' + Date.now();
            return send(200, { content:{sha:record.sha} });
        }
        return send(200,record);
    }
    const fixture = url.pathname.startsWith('/__test__/');
    const relative = decodeURIComponent(fixture ? url.pathname.slice('/__test__/'.length) : url.pathname.slice(1)) || 'index.html';
    const filename = path.resolve(root,relative);
    if (!filename.startsWith(root + path.sep)) return send(403, {});
    try {
        let content = fs.readFileSync(filename);
        if (fixture && relative.endsWith('.js')) {
            const prefix = `if (!window.__mockFetch) { window.__mockFetch = true; const realFetch = window.fetch.bind(window); window.fetch = (input, options) => realFetch(typeof input === 'string' && input.startsWith('https://api.github.com/') ? '/__mock__/' + input.slice('https://api.github.com/'.length) : input, options); }\n`;
            content = Buffer.from(prefix + content.toString());
        }
        res.writeHead(200,{ 'Content-Type':mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control':'no-store' }); res.end(content);
    } catch { send(404,{message:'Not found'}); }
}).listen(4173,'127.0.0.1',()=>console.log('Portfolio preview: http://127.0.0.1:4173 ; test editor: /__test__/admin.html (test-token)'));

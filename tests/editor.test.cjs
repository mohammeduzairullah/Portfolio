const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function adminContext(fetch = async () => ({ ok:true, json:async()=>({content:{sha:'new-sha'}}) }), hostname = 'friend.github.io', pathname = '/my-portfolio/admin.html') {
    const elements = new Map();
    const doc = { getElementById(id) { if (!elements.has(id)) elements.set(id, { textContent:'', disabled:false, classList:{add(){},remove(){}}, contentWindow:{ postMessage(){} } }); return elements.get(id); }, addEventListener(){} };
    const context = vm.createContext({ document:doc, location:{hostname,pathname,origin:'https://' + hostname}, localStorage:{ getItem(){return null;} }, fetch, PortfolioAppearance:{current:{}}, setTimeout, clearTimeout, btoa:s=>Buffer.from(s,'binary').toString('base64'), atob:s=>Buffer.from(s,'base64').toString('binary'), encodeURIComponent,decodeURIComponent,escape,unescape });
    vm.runInContext(fs.readFileSync(path.join(root,'assets/js/admin.js'),'utf8'),context);
    return { context, elements, run:code=>vm.runInContext(code,context) };
}
test('detects friend project and root GitHub Pages repositories without source edits', () => {
    let c = adminContext(); assert.equal(c.run('GH_OWNER'), 'friend'); assert.equal(c.run('GH_REPO'),'my-portfolio');
    c = adminContext(undefined,'friend.github.io','/admin.html'); assert.equal(c.run('GH_REPO'),'friend.github.io');
    c = adminContext(undefined,'portfolio.example','/admin.html'); assert.equal(c.run('GH_OWNER'),'');
});
test('preview mode cannot write even when a token is present', async()=> {
    let calls = 0; const c = adminContext(async()=>{calls++;}); c.run("activeToken = 'test-token'");
    await assert.rejects(c.run("ghPutFile(DATA_FILES.site, 'old', {}, 'test')"), /Connect to your GitHub/); assert.equal(calls,0);
});
test('successful publish sends UTF-8 JSON, repository and branch, then marks saved',async()=>{
    let request; const c = adminContext(async(url,options)=>{request={url,...options};return {ok:true,json:async()=>({content:{sha:'new'}})};});
    c.run("activeToken='test-token'; previewOnly=false; GH_BRANCH='feature/profile'; drafts.site={name:'Zoë 👋'}; published.site='{}'");
    await c.run("ghPutFile(DATA_FILES.site,'old-sha',drafts.site,'Update profile')");
    const body=JSON.parse(request.body);
    assert.equal(request.url,'https://api.github.com/repos/friend/my-portfolio/contents/assets/data/site.json');
    assert.equal(request.headers.Authorization,'Bearer test-token'); assert.equal(body.sha,'old-sha'); assert.equal(body.branch,'feature/profile');
    assert.deepEqual(JSON.parse(Buffer.from(body.content,'base64')), {name:'Zoë 👋'});
    assert.equal(c.run('hasUnsavedChanges()'),false); assert.equal(c.run('saving'),false);
});
test('409 conflict preserves unsaved draft and re-enables connection controls',async()=>{
    const c=adminContext(async()=>({ok:false,status:409,json:async()=>({})}));
    c.run("activeToken='test-token';previewOnly=false;drafts.site={name:'New'};published.site='{}'");
    await assert.rejects(c.run("ghPutFile(DATA_FILES.site,'old',drafts.site,'Update')"),/file changed/);
    assert.equal(c.run('drafts.site.name'),'New');assert.equal(c.run('hasUnsavedChanges()'),true);assert.equal(c.elements.get('connection-fields').disabled,false);
    assert.match(c.elements.get('publish-status').textContent,/Not published/);
});
test('network failure keeps draft and releases save lock',async()=>{
    const c=adminContext(async()=>{throw new Error('Offline')}); c.run("activeToken='test-token';previewOnly=false;drafts.site={name:'New'};published.site='{}'");
    await assert.rejects(c.run("ghPutFile(DATA_FILES.site,'old',drafts.site,'Update')"),/Offline/); assert.equal(c.run('hasUnsavedChanges()'),true); assert.equal(c.run('saving'),false);
});
test('overlapping saves are rejected instead of racing',async()=>{
    let resolve; const c=adminContext(()=>new Promise(r=>{resolve=r}));c.run("activeToken='test-token';previewOnly=false");
    const first=c.run("ghPutFile(DATA_FILES.site,'old',{},'Update')");
    await assert.rejects(c.run("ghPutFile(DATA_FILES.hero,'old',{},'Update')"),/Another section/);
    resolve({ok:true,json:async()=>({content:{sha:'new'}})});await first;
});
test('site settings filter unexpected fields, reject unsafe links and default to email disabled',async()=>{
    const context=vm.createContext({ window:{}, URL, fetch:async()=>({ok:false}), document:{querySelectorAll:()=>[], querySelector:()=>null,getElementById:()=>null,body:{classList:{contains:()=>false}}} });
    vm.runInContext(fs.readFileSync(path.join(root,'assets/js/site.js'),'utf8'),context);
    const site=context.window.PortfolioSite; await site.ready;
    const value=site.normalize({identity:{firstName:'Alex'},token:'secret',emailjs:{enabled:'yes'}});
    assert.equal(value.identity.firstName,'Alex');assert.equal(value.token,undefined);assert.equal(value.emailjs.enabled,false);
    assert.equal(site.safeURL('javascript:alert(1)'),'');assert.equal(site.safeURL('https://example.com'),'https://example.com/');
});

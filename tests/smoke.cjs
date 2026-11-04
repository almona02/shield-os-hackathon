// Production build, synthetic data, memory backend, no external credentials.
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const env = {...process.env};
for (const key of Object.keys(env)) if (/^(META_|MODEL_API_KEY|SUPABASE_|NEXT_PUBLIC_SUPABASE_)/.test(key)) delete env[key];
const child = spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3101'],{env});
const timer = setTimeout(()=>{child.kill();process.exitCode=1;},30000);
(async()=>{
 try {
  await new Promise((resolve,reject)=>{child.stdout.on('data',b=>{if(b.toString().includes('Ready')) resolve();});child.once('exit',c=>reject(new Error(`server exited ${c}`)));});
  const call = async (path,body,method) => {
   const r=await fetch(`http://127.0.0.1:3101${path}`,{method:method??(body?'POST':'GET'),headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
   return [r.status,await r.json()];
  };
  assert.equal((await call('/api/events'))[1].verified,true);
  let [status,data]=await call('/api/approvals',{action:'create',partName:'Motor',createdBy:'TestTech',photo:'fake-invoice.png'});
  assert.equal(status,400);assert.equal(data.evidence.source,'mock');
  [status,data]=await call('/api/approvals',{action:'create',partName:'Motor',createdBy:'TestTech',photo:'motor-demo.png'});
  assert.equal(status,201); const id=data.request.id;
  [status,data]=await call('/api/approvals',{action:'decide',id,approver:'TestTech',decision:'approved'});
  assert.equal(status,400);assert.equal(data.code,'SELF_APPROVAL');
  assert.equal((await call('/api/approvals',{action:'decide',id,approver:'Manager',decision:'invalid'}))[0],400);
  assert.equal((await call('/api/approvals',{action:'decide',id,approver:'Manager',decision:'approved'}))[0],200);
  assert.equal((await call('/api/approvals',{action:'decide',id,approver:'Manager',decision:'approved'}))[0],400);
  assert.equal((await call('/api/events'))[1].verified,true);
  const risk=(await call('/api/risk'))[1]; assert.equal(risk.source,'local_heuristic'); assert.equal(risk.fallback_reason,'missing_api_key');
  assert.equal((await call('/api/tamper',{}))[0],410);
  assert.equal((await call('/api/events',{},'PUT'))[0],405);
  console.log('Local HTTP smoke passed: request/decision flow, rejection cases, chain, provenance and disabled tamper probe.');
 } catch(e) {console.error(e);process.exitCode=1;} finally {clearTimeout(timer);child.kill();}
})();

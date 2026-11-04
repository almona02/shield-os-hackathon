const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyEvidence, samPrompts } = require('../.test-build/sam.js');
const { analyzeRiskWithLlama, heuristicRisk } = require('../.test-build/llama.js');
const { ImmutableLog, MemoryLogStore, GENESIS_HASH } = require('../.test-build/shield-core/immutable-log.js');
const { createRequest, approve } = require('../.test-build/shield-core/approval-chain.js');
const image = 'data:image/png;base64,aGVsbG8=';
const risk = { risk_score: 20, findings: [], summary_en: 'Review', summary_ar: 'مراجعة' };
async function mocked(fn, run) {
 const old = global.fetch; const key = process.env.META_API_KEY; const alias = process.env.MODEL_API_KEY;
 process.env.META_API_KEY = 'test-key'; delete process.env.MODEL_API_KEY; global.fetch = fn;
 try { await run(); } finally { global.fetch = old; if (key === undefined) delete process.env.META_API_KEY; else process.env.META_API_KEY = key; if(alias !== undefined) process.env.MODEL_API_KEY = alias; }
}
test('filename simulations never claim a model call', async () => {
 const result = await verifyEvidence('fake-invoice.png', 'Motor YLM-45');
 assert.equal(result.source, 'mock'); assert.equal(result.label, 'simulated_reject'); assert.equal(result.score, null);
 assert.doesNotMatch(result.reason_en, /SAM.*found/);
});
test('motor prompts cannot fall back to a person or generic equipment', () => {
 assert.deepEqual(samPrompts('Motor YLM-45'), ['electric motor', 'motor']);
});
test('all SAM HTTP failures are unavailable, never a live fake verdict', async () => {
 await mocked(async () => new Response('{}', {status: 503}), async () => {
  const result = await verifyEvidence(image, 'Motor'); assert.equal(result.source, 'unavailable'); assert.equal(result.score, null);
 });
});
test('successful zero detections are no_match, not proof of fraud', async () => {
 await mocked(async () => Response.json({status:'completed', output_text:''}), async () => {
  const result = await verifyEvidence(image, 'Motor'); assert.equal(result.label,'no_match'); assert.equal(result.source,'sam_3_1');
 });
});
test('real detection keeps raw confidence, never inflates to authenticity 100', async () => {
 await mocked(async () => Response.json({status:'completed', output_text:'<0f>0<|box;x1=1;y1=1;x2=2;y2=2;c=0.8|>'}), async () => {
  const result = await verifyEvidence(image, 'Motor'); assert.equal(result.label,'matched'); assert.equal(result.score,80); assert.equal(result.matched_prompt,'electric motor');
 });
});
test('image URL fetch rejects internal destinations before a network call', async () => {
 await mocked(async () => { throw new Error('must not fetch'); }, async () => {
  assert.equal((await verifyEvidence('http://127.0.0.1/private', 'Motor')).source,'unavailable');
 });
});
test('risk output schema failure preserves heuristic provenance', async () => {
 await mocked(async () => Response.json({choices:[{message:{content:'{"risk_score": 99}'}}]}), async () => {
  const result = await analyzeRiskWithLlama([]); assert.equal(result.source,'local_heuristic'); assert.equal(result.fallback_reason,'invalid_response_schema');
 });
});
test('valid Responses API output is accepted', async () => {
 await mocked(async () => Response.json({status:'completed',output:[{content:[{text:JSON.stringify(risk)}]}]}), async () => {
  assert.equal((await analyzeRiskWithLlama([])).source,'meta_llama');
 });
});
test('rejected decisions and approvals spread over days are not bursts', () => {
 const events = Array.from({length:6}, (_,i) => ({event_type:'VERIFICATION',proof:{verified_by:'Manager',timestamp:`2026-10-${10+i}T12:00:00Z`,location:null},payload:{kind:'approval_decision',decision:'rejected'}}));
 assert.equal(heuristicRisk(events).risk_score,0);
 assert.equal(heuristicRisk(events.map(e=>({...e,payload:{decision:'approved'}}))).findings.some(f=>f.pattern==='SAME_APPROVER_BURST'),false);
});
test('empty or substituted genesis is not verified', async () => {
 await assert.rejects(new ImmutableLog({list:async()=>[]}).verifyChain(), /Genesis/);
 await assert.rejects(new ImmutableLog({list:async()=>[{prev_hash:null,event_hash:'forged',chain_position:1}]}).verifyChain());
});
test('valid append verifies; payload alteration is detected', async () => {
 const store = new MemoryLogStore(); const log = new ImmutableLog(store);
 await log.recordEvent({event_type:'INSPECTION',entity_id:'motor',vertical_id:'parts',proof:{verified_by:'Tech',timestamp:'2026-11-04T12:00:00Z',location:null},payload:{amount:1}});
 assert.equal(await log.verifyChain(),true);
 const records = await store.list(100); records[0].payload.amount = 999;
 await assert.rejects(log.verifyChain(), /Hash mismatch/);
});
test('self approval and repeated decisions are blocked by core', () => {
 const req = createRequest({entityId:'motor',title:'Motor',createdBy:'Tech',steps:[{stepId:'manager',role:'manager'}]});
 assert.throws(()=>approve(req,{stepId:'manager',approver:'Tech'}), /own request/);
 const done = approve(req,{stepId:'manager',approver:'Manager'});
 assert.throws(()=>approve(done,{stepId:'manager',approver:'Manager'}), /already/);
});

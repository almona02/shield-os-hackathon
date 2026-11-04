# DB immutability proof (Supabase)

API 405 is necessary but not sufficient. Judges need the Postgres trigger.

## Reproduce in Supabase SQL editor

```sql
-- As any role (incl. service_role / dashboard SQL)
UPDATE shield_events
SET entity_id = 'HACKED'
WHERE chain_position = 1;
```

**Actual result (captured 2026-11-04):**

```text
ERROR:  25001: shield_events is append-only: UPDATE is not allowed
CONTEXT:  PL/pgSQL function shield_block_mutation() line 3 at RAISE
```

Delete is blocked the same way:

```sql
DELETE FROM shield_events WHERE chain_position = 1;
-- ERROR: shield_events is append-only: DELETE is not allowed
```

## Also in the demo app

```bash
curl -X PUT https://shield-os-hackathon.vercel.app/api/events
# {"error":"shield_events is append-only: UPDATE not allowed"}  → HTTP 405

curl -X POST https://shield-os-hackathon.vercel.app/api/tamper
# {"blocked":true,"layer":"postgres_trigger","update":{"blocked":true,"message":"shield_events is append-only: UPDATE is not allowed"},...}
```

Trigger source: `supabase/migrations/001_shield_events.sql` → `trg_shield_no_update` / `shield_block_mutation()`.

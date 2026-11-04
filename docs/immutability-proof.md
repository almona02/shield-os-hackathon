# Append-only ledger notes (Supabase)

The HTTP API returns 405 for UPDATE-style calls. The database also blocks mutation with a trigger. Together they illustrate the demo’s append-only design.

## In the Supabase SQL editor

```sql
UPDATE shield_events
SET entity_id = 'HACKED'
WHERE chain_position = 1;
```

Expected result (captured 2026-11-04):

```text
ERROR:  25001: shield_events is append-only: UPDATE is not allowed
CONTEXT:  PL/pgSQL function shield_block_mutation() line 3 at RAISE
```

Delete is blocked the same way:

```sql
DELETE FROM shield_events WHERE chain_position = 1;
-- ERROR: shield_events is append-only: DELETE is not allowed
```

## From the demo app

```bash
curl -X PUT https://shield-os-hackathon.vercel.app/api/events
# HTTP 405 — append-only response

# Optional; not recommended during Loom recording:
curl -X POST https://shield-os-hackathon.vercel.app/api/tamper
```

Trigger source: `supabase/migrations/001_shield_events.sql`  
(`trg_shield_no_update` / `shield_block_mutation`).

Please treat this as a clear demo of the append-only design for hackathon review — not as a full independent security certification.

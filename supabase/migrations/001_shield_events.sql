-- Shield hackathon migration: append-only event ledger.
-- Enforcement layers:
--   1. Trigger blocks UPDATE and DELETE for every role (incl. service_role).
--   2. RLS: SELECT + INSERT for anon/authenticated. No UPDATE/DELETE policies.
--   3. CHECK constraints pin chain shape and proof structure.

BEGIN;

DO $$ BEGIN IF NOT EXISTS (
  SELECT 1 FROM pg_type WHERE typname = 'shield_event_type'
) THEN CREATE TYPE shield_event_type AS ENUM (
  'ON', 'OFF', 'FAULT', 'INSPECTION', 'VERIFICATION'
);
END IF;
END $$;

CREATE TABLE IF NOT EXISTS shield_events (
  event_hash TEXT PRIMARY KEY,
  prev_hash TEXT,
  -- Explicit position (set by app) so hash-chain matches MemoryLogStore.
  chain_position BIGINT NOT NULL UNIQUE,
  event_type shield_event_type NOT NULL,
  entity_id TEXT NOT NULL,
  vertical_id TEXT NOT NULL,
  proof JSONB NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_shield_chain_shape CHECK (
    (prev_hash IS NULL AND chain_position = 1)
    OR (prev_hash IS NOT NULL AND chain_position > 1)
  ),
  CONSTRAINT chk_shield_proof CHECK (
    jsonb_typeof(proof) = 'object'
    AND proof ? 'verified_by'
    AND proof ? 'timestamp'
  )
);

CREATE INDEX IF NOT EXISTS idx_shield_events_entity
  ON shield_events(entity_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_shield_events_vertical
  ON shield_events(vertical_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_shield_events_prev
  ON shield_events(prev_hash) WHERE prev_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shield_events_position
  ON shield_events(chain_position DESC);

CREATE OR REPLACE FUNCTION shield_block_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'shield_events is append-only: % is not allowed',
    TG_OP USING ERRCODE = '25001';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_shield_no_update ON shield_events;
CREATE TRIGGER trg_shield_no_update
  BEFORE UPDATE OR DELETE ON shield_events
  FOR EACH ROW EXECUTE FUNCTION shield_block_mutation();

ALTER TABLE shield_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shield_events_select_all ON shield_events;
CREATE POLICY shield_events_select_all
  ON shield_events FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS shield_events_insert_auth ON shield_events;
DROP POLICY IF EXISTS shield_events_insert_anon ON shield_events;
-- Hackathon demo uses ANON_KEY from the Next.js API routes.
CREATE POLICY shield_events_insert_anon
  ON shield_events FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO shield_events (
  event_hash, prev_hash, chain_position, event_type, entity_id, vertical_id, proof,
  recorded_at, created_at
)
SELECT
  '0000000000000000000000000000000000000000000000000000000000000000',
  NULL,
  1,
  'VERIFICATION'::shield_event_type,
  'shield_genesis',
  'shield_core',
  '{"verified_by": "system", "timestamp": "2025-02-20T00:00:00Z", "location": null}'::jsonb,
  '2025-02-20 00:00:00'::timestamptz,
  '2025-02-20 00:00:00'::timestamptz
WHERE NOT EXISTS (SELECT 1 FROM shield_events WHERE prev_hash IS NULL);

CREATE TABLE IF NOT EXISTS shield_approvals (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shield_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shield_approvals_all_anon ON shield_approvals;
CREATE POLICY shield_approvals_all_anon
  ON shield_approvals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS shield_anomalies (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_hash TEXT NOT NULL REFERENCES shield_events(event_hash),
  pattern TEXT NOT NULL,
  severity TEXT NOT NULL
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendation TEXT NOT NULL DEFAULT '',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_shield_anom_no_update ON shield_anomalies;
CREATE TRIGGER trg_shield_anom_no_update
  BEFORE UPDATE OR DELETE ON shield_anomalies
  FOR EACH ROW EXECUTE FUNCTION shield_block_mutation();

ALTER TABLE shield_anomalies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shield_anom_select_all ON shield_anomalies;
CREATE POLICY shield_anom_select_all
  ON shield_anomalies FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS shield_anom_insert_auth ON shield_anomalies;
CREATE POLICY shield_anom_insert_auth
  ON shield_anomalies FOR INSERT TO anon, authenticated WITH CHECK (true);

COMMIT;

SELECT 'shield ledger ready' AS status, COUNT(*) AS events
FROM shield_events;

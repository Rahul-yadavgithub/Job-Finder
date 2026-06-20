-- 1. Setup Branch Groups
ALTER TABLE branches ADD COLUMN IF NOT EXISTS branch_group TEXT;

UPDATE branches SET branch_group = CASE
  WHEN code IN ('CSE', 'MNC', 'ECE', 'EE', 'EP') THEN 'circuital'
  WHEN code IN ('CE', 'ME', 'CH', 'MSE') THEN 'core'
  ELSE code  -- Isolated fallback for any others
END;

ALTER TABLE branches ALTER COLUMN branch_group SET NOT NULL;

-- Helper function to read the group
CREATE OR REPLACE FUNCTION get_branch_group(p_branch_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT branch_group FROM branches WHERE id = p_branch_id;
$$;

-- 2. Setup Companies Table for Group Deduplication
ALTER TABLE companies ADD COLUMN IF NOT EXISTS branch_group_key TEXT;

UPDATE companies c
SET branch_group_key = (SELECT branch_group FROM branches b WHERE b.id = c.branch_id);

-- We don't set NOT NULL yet just in case there are missing branches, but we can set it if it's fully populated.

-- 3. Perform Migration in a Safe Transaction
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM companies WHERE branch_group_key IS NULL LIMIT 1) THEN
    RAISE EXCEPTION 'Aborting: branch_group_key not fully backfilled. Missing branch mappings.';
  END IF;
END $$;

ALTER TABLE companies ALTER COLUMN branch_group_key SET NOT NULL;

-- Drop old indexes
DROP INDEX IF EXISTS idx_companies_unique_name_branch;
DROP INDEX IF EXISTS idx_companies_dedup_hash;

-- Require pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recompute dedup_hash for all existing companies using the new group key
UPDATE companies
SET dedup_hash = encode(
  digest(lower(trim(company_name)) || '::' || branch_group_key, 'sha256'),
  'hex'
);

-- Rebuild HASH index
CREATE INDEX idx_companies_dedup_hash ON companies USING HASH (dedup_hash);

-- IMPORTANT: Cleanup existing duplicates before applying the strict constraint!
-- If 'cred' is already in both CSE and MNC, we keep the oldest one as 'active' and mark the rest as 'duplicate'
WITH canonicals AS (
  SELECT DISTINCT ON (lower(trim(company_name)), branch_group_key)
    id as canonical_id,
    lower(trim(company_name)) as normalized_name,
    branch_group_key
  FROM companies
  WHERE status = 'active'
  ORDER BY lower(trim(company_name)), branch_group_key, created_at ASC
)
UPDATE companies c
SET 
  status = 'duplicate',
  canonical_id = can.canonical_id
FROM canonicals can
WHERE lower(trim(c.company_name)) = can.normalized_name
  AND c.branch_group_key = can.branch_group_key
  AND c.status = 'active'
  AND c.id != can.canonical_id;

-- New unique constraint: unique per (name, group)
CREATE UNIQUE INDEX idx_companies_unique_name_group
  ON companies (lower(trim(company_name)), branch_group_key)
  WHERE status = 'active';

COMMIT;

-- 4. Update the RPC logic
CREATE OR REPLACE FUNCTION insert_company_safe(
  p_company_name TEXT,
  p_branch_id    UUID,
  p_hr_name      TEXT,
  p_email        TEXT,
  p_phone_number TEXT,
  p_description  TEXT,
  p_data         JSONB
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_group_key   TEXT;
  v_hash        TEXT;
  v_existing_id UUID;
  v_result      JSONB;
BEGIN
  -- Step 1: Resolve branch group
  SELECT branch_group INTO v_group_key
  FROM branches WHERE id = p_branch_id;

  IF v_group_key IS NULL THEN
    RAISE EXCEPTION 'Unknown branch_id: %', p_branch_id;
  END IF;

  -- Step 2: Compute group-scoped dedup hash
  v_hash := encode(
    digest(lower(trim(p_company_name)) || '::' || v_group_key, 'sha256'),
    'hex'
  );

  -- Step 3: Check if company exists in this group
  SELECT id INTO v_existing_id
  FROM companies
  WHERE dedup_hash = v_hash
    AND status = 'active'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Cross-branch duplicate detected
    INSERT INTO companies (company_name, branch_id, branch_group_key, hr_name, email, phone_number, description, dedup_hash, status, canonical_id, data, data_source)
    VALUES (p_company_name, p_branch_id, v_group_key, p_hr_name, p_email, p_phone_number, p_description, v_hash, 'duplicate', v_existing_id, p_data, 'csv_import');

    SELECT to_jsonb(c) || jsonb_build_object(
      'is_duplicate', true,
      'duplicate_reason', 'exists_in_branch_group',
      'canonical_branch_id', c.branch_id
    )
    INTO v_result
    FROM companies c WHERE id = v_existing_id;

    RETURN v_result;
  END IF;

  -- Step 4: No duplicate — insert as the canonical company
  INSERT INTO companies (company_name, branch_id, branch_group_key, hr_name, email, phone_number, description, dedup_hash, status, data, data_source)
  VALUES (p_company_name, p_branch_id, v_group_key, p_hr_name, p_email, p_phone_number, p_description, v_hash, 'active', p_data, 'csv_import')
  RETURNING to_jsonb(companies.*) || jsonb_build_object('is_duplicate', false)
  INTO v_result;

  -- Insert initial company_status
  INSERT INTO company_status (company_id, branch_id, base_status)
  VALUES ((v_result->>'id')::UUID, p_branch_id, 'not_contacted');

  RETURN v_result;

EXCEPTION WHEN unique_violation THEN
  -- Race condition fallback by group hash
  SELECT to_jsonb(c) || jsonb_build_object(
    'is_duplicate', true,
    'duplicate_reason', 'race_condition_caught',
    'canonical_branch_id', c.branch_id
  )
  INTO v_result
  FROM companies c
  WHERE c.dedup_hash = v_hash
    AND c.status = 'active'
  LIMIT 1;

  -- Insert duplicate audit record for race condition
  INSERT INTO companies (company_name, branch_id, branch_group_key, hr_name, email, phone_number, description, dedup_hash, status, canonical_id, data, data_source)
  VALUES (p_company_name, p_branch_id, v_group_key, p_hr_name, p_email, p_phone_number, p_description, v_hash, 'duplicate', (v_result->>'id')::UUID, p_data, 'csv_import');

  RETURN v_result;
END;
$$;

-- 5. Trigger for manual inserts to ensure correct group hash
CREATE OR REPLACE FUNCTION companies_set_group_hash()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  SELECT branch_group INTO NEW.branch_group_key
  FROM branches WHERE id = NEW.branch_id;

  NEW.dedup_hash := encode(
    digest(lower(trim(NEW.company_name)) || '::' || NEW.branch_group_key, 'sha256'),
    'hex'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_group_hash ON companies;
CREATE TRIGGER trg_companies_group_hash
BEFORE INSERT OR UPDATE OF company_name, branch_id
ON companies
FOR EACH ROW EXECUTE FUNCTION companies_set_group_hash();

-- STEP 1: Update companies table to support fast retrieval and deduplication

-- Drop existing unique constraint if it exists (might be named differently, but typically it's companies_company_name_branch_id_key)
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_company_name_branch_id_key;

-- Add new columns
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS dedup_hash TEXT,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'duplicate', 'archived')),
ADD COLUMN IF NOT EXISTS canonical_id UUID REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}';

-- Backfill dedup_hash for existing records (if any) to prevent null constraint violations
UPDATE companies 
SET dedup_hash = encode(digest(lower(trim(company_name)) || '::' || branch_id::text, 'sha256'), 'hex')
WHERE dedup_hash IS NULL;

-- Now make dedup_hash NOT NULL
ALTER TABLE companies ALTER COLUMN dedup_hash SET NOT NULL;

-- Create Indexes
-- 1. HASH index for O(1) duplicate detection
CREATE INDEX IF NOT EXISTS idx_companies_dedup_hash ON companies USING HASH (dedup_hash);

-- 2. UNIQUE composite constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_unique_name_branch
  ON companies (lower(trim(company_name)), branch_id)
  WHERE status = 'active';

-- 3. GIN index on data JSONB
CREATE INDEX IF NOT EXISTS idx_companies_data_gin ON companies USING GIN (data jsonb_path_ops);


-- STEP 2: Create insert_company_safe RPC

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
  v_hash        TEXT;
  v_existing_id UUID;
  v_result      JSONB;
BEGIN
  -- Compute deterministic hash
  v_hash := encode(
    digest(lower(trim(p_company_name)) || '::' || p_branch_id::text, 'sha256'),
    'hex'
  );

  -- O(1) hash index lookup
  SELECT id INTO v_existing_id
  FROM companies
  WHERE dedup_hash = v_hash AND status = 'active'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Duplicate detected: insert audit record, return canonical row
    INSERT INTO companies (company_name, branch_id, hr_name, email, phone_number, description, dedup_hash, status, canonical_id, data, data_source)
    VALUES (p_company_name, p_branch_id, p_hr_name, p_email, p_phone_number, p_description, v_hash, 'duplicate', v_existing_id, p_data, 'csv_import');

    SELECT to_jsonb(c) || jsonb_build_object('is_duplicate', true)
    INTO v_result
    FROM companies c WHERE id = v_existing_id;

    RETURN v_result;
  END IF;

  -- No duplicate — insert as active canonical row
  INSERT INTO companies (company_name, branch_id, hr_name, email, phone_number, description, dedup_hash, status, data, data_source)
  VALUES (p_company_name, p_branch_id, p_hr_name, p_email, p_phone_number, p_description, v_hash, 'active', p_data, 'csv_import')
  RETURNING to_jsonb(companies.*) || jsonb_build_object('is_duplicate', false)
  INTO v_result;

  -- Insert initial company_status (mapped to not_contacted/interested)
  INSERT INTO company_status (company_id, branch_id, base_status, mid_status)
  VALUES ((v_result->>'id')::UUID, p_branch_id, 'not_contacted', 'interested');

  RETURN v_result;
END;
$$;


-- STEP 3: Create import_jobs table

CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  duplicate_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_branch ON import_jobs(branch_id, created_at DESC);

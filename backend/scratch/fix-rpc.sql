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

  BEGIN
    -- No duplicate — insert as active canonical row
    INSERT INTO companies (company_name, branch_id, hr_name, email, phone_number, description, dedup_hash, status, data, data_source)
    VALUES (p_company_name, p_branch_id, p_hr_name, p_email, p_phone_number, p_description, v_hash, 'active', p_data, 'csv_import')
    RETURNING to_jsonb(companies.*) || jsonb_build_object('is_duplicate', false)
    INTO v_result;

    -- Insert initial company_status (omitting mid_status to avoid constraint errors)
    INSERT INTO company_status (company_id, branch_id, base_status)
    VALUES ((v_result->>'id')::UUID, p_branch_id, 'not_contacted');

    RETURN v_result;
  EXCEPTION WHEN unique_violation THEN
    -- Race condition: another concurrent process inserted this exact company.
    -- Fetch the ID that was just inserted
    SELECT id INTO v_existing_id
    FROM companies
    WHERE lower(trim(company_name)) = lower(trim(p_company_name))
      AND branch_id = p_branch_id
      AND status = 'active'
    LIMIT 1;

    -- Insert this request as a duplicate
    INSERT INTO companies (company_name, branch_id, hr_name, email, phone_number, description, dedup_hash, status, canonical_id, data, data_source)
    VALUES (p_company_name, p_branch_id, p_hr_name, p_email, p_phone_number, p_description, v_hash, 'duplicate', v_existing_id, p_data, 'csv_import');

    SELECT to_jsonb(c) || jsonb_build_object('is_duplicate', true)
    INTO v_result
    FROM companies c WHERE id = v_existing_id;

    RETURN v_result;
  END;
END;
$$;

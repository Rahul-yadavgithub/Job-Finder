CREATE OR REPLACE FUNCTION check_global_duplicate(p_normalized_name TEXT, p_raw_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_match RECORD;
  v_normalized_db TEXT;
BEGIN
  -- We don't have a normalized_name column, so we have to check by ilike on the raw name first to narrow down
  -- Then we can do a strict check. Or just use a broad ILIKE and then check in JS.
  -- Wait, if we just want an RPC:
  FOR v_match IN SELECT id, company_name FROM companies WHERE status = 'active' LOOP
    -- Simple normalization: lower and remove non-alphanumeric (we can't easily do the exact regex with JS suffixes in Postgres easily)
    -- So let's just return matches that are ILIKE %raw_name% and let JS do the exact normalization check!
  END LOOP;
END;
$$;

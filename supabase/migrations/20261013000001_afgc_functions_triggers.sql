-- ==============================================================================
-- Blood Donation Network - Serverless AFGC Matching & Lifecycle Engine
-- Runs natively inside Supabase PostgreSQL Cloud (Zero Server/Terminal Needed)
-- ==============================================================================

-- 1. Helper function: Get compatible donor blood groups
CREATE OR REPLACE FUNCTION get_compatible_donor_groups(p_recipient_group text)
RETURNS text[] AS $$
BEGIN
  RETURN CASE p_recipient_group
    WHEN 'O-'  THEN ARRAY['O-']
    WHEN 'O+'  THEN ARRAY['O-', 'O+']
    WHEN 'A-'  THEN ARRAY['O-', 'A-']
    WHEN 'A+'  THEN ARRAY['O-', 'O+', 'A-', 'A+']
    WHEN 'B-'  THEN ARRAY['O-', 'B-']
    WHEN 'B+'  THEN ARRAY['O-', 'O+', 'B-', 'B+']
    WHEN 'AB-' THEN ARRAY['O-', 'A-', 'B-', 'AB-']
    WHEN 'AB+' THEN ARRAY['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
    ELSE ARRAY[p_recipient_group]
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Helper function: Great-circle distance between two coords in Kilometers (Haversine)
CREATE OR REPLACE FUNCTION calculate_haversine_distance_km(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
)
RETURNS double precision AS $$
DECLARE
  r double precision := 6371.0; -- Earth radius in km
  dlat double precision;
  dlon double precision;
  a double precision;
  c double precision;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN 9999.0;
  END IF;

  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);

  a := sin(dlat / 2.0) * sin(dlat / 2.0) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon / 2.0) * sin(dlon / 2.0);

  c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a));

  RETURN ROUND((r * c)::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. AFGC Candidate Matching Function: Finds, ranks, and invites matching donors
CREATE OR REPLACE FUNCTION afgc_match_candidates(p_request_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_req record;
  v_compatible_groups text[];
  v_matched_count int := 0;
BEGIN
  -- Fetch the blood request
  SELECT * INTO v_req FROM blood_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Request not found');
  END IF;

  v_compatible_groups := get_compatible_donor_groups(v_req.blood_group);

  -- Match and rank eligible donors
  WITH ranked_donors AS (
    SELECT
      p.id AS donor_id,
      calculate_haversine_distance_km(v_req.latitude, v_req.longitude, p.latitude, p.longitude) AS dist_km,
      CASE WHEN p.blood_group = v_req.blood_group THEN 1.0 ELSE 0.85 END AS comp_score,
      LEAST(1.0, COALESCE(p.total_donations, 0)::double precision / 5.0) AS exp_score
    FROM profiles p
    WHERE p.role = 'donor'
      AND p.is_available = true
      AND p.blood_group = ANY(v_compatible_groups)
      AND (p.last_donation_date IS NULL OR p.last_donation_date <= (CURRENT_DATE - INTERVAL '90 days'))
  ),
  scored_donors AS (
    SELECT
      donor_id,
      dist_km,
      ROUND((
        (GREATEST(0.0, 1.0 - (dist_km / GREATEST(1.0, v_req.search_radius_km))) * 0.7) +
        (comp_score * 0.2) +
        (exp_score * 0.1)
      )::numeric, 2) AS total_score
    FROM ranked_donors
    WHERE dist_km <= v_req.search_radius_km
  )
  INSERT INTO candidate_invitations (request_id, donor_id, status, score, distance_km, notified_at)
  SELECT
    p_request_id,
    s.donor_id,
    'notified',
    s.total_score,
    s.dist_km,
    NOW()
  FROM scored_donors s
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_matched_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'matched_candidates', v_matched_count
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger: Automatically match candidates whenever a new blood request is inserted
CREATE OR REPLACE FUNCTION trg_fn_auto_match_request()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM afgc_match_candidates(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blood_request_auto_match ON blood_requests;
CREATE TRIGGER trg_blood_request_auto_match
AFTER INSERT ON blood_requests
FOR EACH ROW
EXECUTE FUNCTION trg_fn_auto_match_request();

-- 5. AFGC Inventory Reservation RPC
CREATE OR REPLACE FUNCTION afgc_reserve_inventory_units(p_request_id uuid, p_count int DEFAULT 1)
RETURNS jsonb AS $$
DECLARE
  v_req record;
  v_reserved_count int := 0;
BEGIN
  SELECT * INTO v_req FROM blood_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Request not found');
  END IF;

  WITH available_units AS (
    SELECT id
    FROM inventory_units
    WHERE hospital_id = v_req.hospital_id
      AND blood_group = v_req.blood_group
      AND status = 'available'
    ORDER BY expiry_date ASC
    LIMIT p_count
  )
  UPDATE inventory_units
  SET status = 'reserved', request_id = p_request_id, updated_at = NOW()
  WHERE id IN (SELECT id FROM available_units);

  GET DIAGNOSTICS v_reserved_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'units_reserved', v_reserved_count
  );
END;
$$ LANGUAGE plpgsql;

-- 6. AFGC Inventory Release RPC
CREATE OR REPLACE FUNCTION afgc_release_inventory_units(p_request_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_released_count int := 0;
BEGIN
  UPDATE inventory_units
  SET status = 'available', request_id = NULL, updated_at = NOW()
  WHERE request_id = p_request_id AND status = 'reserved';

  GET DIAGNOSTICS v_released_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'units_released', v_released_count
  );
END;
$$ LANGUAGE plpgsql;

-- 7. AFGC Donation Receipt Confirmation RPC
CREATE OR REPLACE FUNCTION afgc_confirm_donation_receipt(
  p_request_id uuid,
  p_donor_id uuid,
  p_units int DEFAULT 1
)
RETURNS jsonb AS $$
DECLARE
  v_req record;
  v_donor record;
  v_donation_id uuid;
  v_total_fulfilled int;
BEGIN
  SELECT * INTO v_req FROM blood_requests WHERE id = p_request_id;
  SELECT * INTO v_donor FROM profiles WHERE id = p_donor_id;

  -- 1. Create donation record
  INSERT INTO donation_records (
    request_id, donor_id, hospital_id, blood_group, units, donation_date
  ) VALUES (
    p_request_id, p_donor_id, v_req.hospital_id, v_req.blood_group, p_units, NOW()
  ) RETURNING id INTO v_donation_id;

  -- 2. Update donor profile stats
  UPDATE profiles
  SET
    total_donations = COALESCE(total_donations, 0) + p_units,
    last_donation_date = CURRENT_DATE,
    is_available = false,
    updated_at = NOW()
  WHERE id = p_donor_id;

  -- 3. Update candidate invitation and commitment status
  UPDATE candidate_invitations
  SET status = 'fulfilled', responded_at = NOW()
  WHERE request_id = p_request_id AND donor_id = p_donor_id;

  UPDATE donor_commitments
  SET status = 'completed', arrived_at = NOW()
  WHERE request_id = p_request_id AND donor_id = p_donor_id;

  -- 4. Check if request is fully fulfilled
  SELECT (
    (SELECT COUNT(*) FROM inventory_units WHERE request_id = p_request_id AND status = 'reserved') +
    (SELECT COALESCE(SUM(units), 0) FROM donation_records WHERE request_id = p_request_id)
  ) INTO v_total_fulfilled;

  IF v_total_fulfilled >= v_req.units_required THEN
    UPDATE blood_requests SET status = 'fulfilled', updated_at = NOW() WHERE id = p_request_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'donation_id', v_donation_id,
    'total_fulfilled', v_total_fulfilled,
    'units_required', v_req.units_required
  );
END;
$$ LANGUAGE plpgsql;

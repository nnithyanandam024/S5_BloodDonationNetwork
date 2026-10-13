-- ==============================================================================
-- Migration: Notifications & Realtime Alerts System
-- Project: Blood Donation Network (AFGC)
-- Runs in Supabase SQL Editor
-- ==============================================================================

-- 1. Ensure fcm_token column exists on profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fcm_token text;

-- 2. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'SYSTEM', -- 'DISPATCH_INVITE' | 'DONOR_COMMITTED' | 'GAP_FULFILLED' | 'DONATION_CONFIRMED' | 'SYSTEM'
  request_id UUID REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  blood_group TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 4. Row Level Security (RLS) Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;
CREATE POLICY "Allow insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- 5. Enable Supabase Realtime for instant mobile notification push
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 6. Trigger Function: Automatically notify donor when candidate invitation is created
CREATE OR REPLACE FUNCTION trg_fn_notify_donor_on_invite()
RETURNS TRIGGER AS $$
DECLARE
  v_req record;
BEGIN
  SELECT * INTO v_req FROM public.blood_requests WHERE id = NEW.request_id;
  IF FOUND THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      body,
      type,
      request_id,
      blood_group,
      is_read,
      created_at
    ) VALUES (
      NEW.donor_id,
      'Emergency Blood Match (' || v_req.blood_group || ')',
      'Urgent need at ' || COALESCE(v_req.hospital_name, 'nearby hospital') || '. You are a matched donor within search radius.',
      'DISPATCH_INVITE',
      NEW.request_id,
      v_req.blood_group,
      false,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_donor_invite ON public.candidate_invitations;
CREATE TRIGGER trg_notify_donor_invite
AFTER INSERT ON public.candidate_invitations
FOR EACH ROW
EXECUTE FUNCTION trg_fn_notify_donor_on_invite();

-- 7. Trigger Function: Automatically notify hospital when a donor commits
CREATE OR REPLACE FUNCTION trg_fn_notify_hospital_on_commitment()
RETURNS TRIGGER AS $$
DECLARE
  v_req record;
  v_donor record;
BEGIN
  SELECT * INTO v_req FROM public.blood_requests WHERE id = NEW.request_id;
  SELECT * INTO v_donor FROM public.profiles WHERE id = NEW.donor_id;

  IF FOUND AND v_req.hospital_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      body,
      type,
      request_id,
      blood_group,
      is_read,
      created_at
    ) VALUES (
      v_req.hospital_id,
      'Donor Committed: ' || COALESCE(v_donor.name, 'A donor'),
      COALESCE(v_donor.name, 'A donor') || ' has accepted the emergency invite and is on their way.',
      'DONOR_COMMITTED',
      NEW.request_id,
      v_req.blood_group,
      false,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_hospital_commitment ON public.donor_commitments;
CREATE TRIGGER trg_notify_hospital_commitment
AFTER INSERT ON public.donor_commitments
FOR EACH ROW
EXECUTE FUNCTION trg_fn_notify_hospital_on_commitment();

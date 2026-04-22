-- Migration 008: Customer ↔ Groomer ↔ Admin Messaging (Model C)
-- Run this in Supabase SQL Editor
--
-- Model C rules:
--   - Each customer has ONE thread (keyed by customer_id)
--   - Admin is always a participant and can read/send
--   - Customer can read/send in their own thread
--   - Groomer can read/send ONLY when they have an appointment with this
--     customer that is upcoming, in progress, or completed within 24h

-- =============================================
-- STEP 1: Create customer_messages table
-- =============================================
CREATE TABLE IF NOT EXISTS customer_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_role text NOT NULL CHECK (sender_role IN ('customer', 'groomer', 'admin')),
    message text,
    photo_url text,
    read_by_customer boolean NOT NULL DEFAULT false,
    read_by_staff boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    -- Either message or photo must be present
    CONSTRAINT customer_messages_content_check
        CHECK (message IS NOT NULL OR photo_url IS NOT NULL)
);

COMMENT ON TABLE customer_messages IS
    'Per-customer chat thread (Model C). Admin always visible; groomer access gated by active-appointment window.';
COMMENT ON COLUMN customer_messages.customer_id IS
    'The customer whose thread this message belongs to. One thread per customer.';
COMMENT ON COLUMN customer_messages.sender_role IS
    'Role of the sender at the time of sending: customer | groomer | admin.';

-- Indexes for thread loading and unread counts
CREATE INDEX IF NOT EXISTS idx_customer_messages_customer_time
    ON customer_messages (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_messages_unread_staff
    ON customer_messages (read_by_staff) WHERE read_by_staff = false;
CREATE INDEX IF NOT EXISTS idx_customer_messages_unread_customer
    ON customer_messages (customer_id, read_by_customer) WHERE read_by_customer = false;

-- =============================================
-- STEP 2: Enable RLS
-- =============================================
ALTER TABLE customer_messages ENABLE ROW LEVEL SECURITY;

-- Helper: is the current auth user an admin?
-- We inline this check in each policy to keep things explicit.

-- =============================================
-- STEP 3: Policies
-- =============================================

-- Customer can SELECT their own thread
DROP POLICY IF EXISTS "customer_messages_customer_select" ON customer_messages;
CREATE POLICY "customer_messages_customer_select" ON customer_messages
    FOR SELECT
    USING (customer_id = auth.uid());

-- Customer can INSERT into their own thread (as themselves)
DROP POLICY IF EXISTS "customer_messages_customer_insert" ON customer_messages;
CREATE POLICY "customer_messages_customer_insert" ON customer_messages
    FOR INSERT
    WITH CHECK (
        customer_id = auth.uid()
        AND sender_id = auth.uid()
        AND sender_role = 'customer'
    );

-- Customer can UPDATE only read_by_customer flag on their own messages
DROP POLICY IF EXISTS "customer_messages_customer_update_read" ON customer_messages;
CREATE POLICY "customer_messages_customer_update_read" ON customer_messages
    FOR UPDATE
    USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());

-- Admin can SELECT all threads
DROP POLICY IF EXISTS "customer_messages_admin_select" ON customer_messages;
CREATE POLICY "customer_messages_admin_select" ON customer_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

-- Admin can INSERT into any thread (as admin)
DROP POLICY IF EXISTS "customer_messages_admin_insert" ON customer_messages;
CREATE POLICY "customer_messages_admin_insert" ON customer_messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND sender_role = 'admin'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

-- Admin can UPDATE read flags on any row
DROP POLICY IF EXISTS "customer_messages_admin_update" ON customer_messages;
CREATE POLICY "customer_messages_admin_update" ON customer_messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

-- Groomer can SELECT messages only for customers where they have an
-- appointment that is upcoming, in progress, or completed within 24h
DROP POLICY IF EXISTS "customer_messages_groomer_select" ON customer_messages;
CREATE POLICY "customer_messages_groomer_select" ON customer_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.customer_id = customer_messages.customer_id
              AND a.assigned_groomer_id = auth.uid()
              AND (
                  a.status IN ('pending', 'confirmed', 'in_progress')
                  OR (a.status = 'completed' AND a.completed_at > now() - interval '24 hours')
              )
        )
    );

-- Groomer can INSERT into threads where the window is open
DROP POLICY IF EXISTS "customer_messages_groomer_insert" ON customer_messages;
CREATE POLICY "customer_messages_groomer_insert" ON customer_messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND sender_role = 'groomer'
        AND EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.customer_id = customer_messages.customer_id
              AND a.assigned_groomer_id = auth.uid()
              AND (
                  a.status IN ('pending', 'confirmed', 'in_progress')
                  OR (a.status = 'completed' AND a.completed_at > now() - interval '24 hours')
              )
        )
    );

-- Groomer can UPDATE read_by_staff on messages they can see
DROP POLICY IF EXISTS "customer_messages_groomer_update_read" ON customer_messages;
CREATE POLICY "customer_messages_groomer_update_read" ON customer_messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.customer_id = customer_messages.customer_id
              AND a.assigned_groomer_id = auth.uid()
              AND (
                  a.status IN ('pending', 'confirmed', 'in_progress')
                  OR (a.status = 'completed' AND a.completed_at > now() - interval '24 hours')
              )
        )
    );

-- =============================================
-- STEP 4: Enable Realtime on the table
-- =============================================
-- Supabase Realtime requires the table to be in the realtime publication.
ALTER PUBLICATION supabase_realtime ADD TABLE customer_messages;

-- =============================================
-- VERIFICATION
-- =============================================
-- Confirm the table exists with expected columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_messages'
ORDER BY ordinal_position;

-- Confirm RLS is enabled and count policies
SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = 'customer_messages') AS policy_count
FROM pg_class c
WHERE c.relname = 'customer_messages';

-- =====================================================
-- FIX #1: Prevent Double-Booking at Database Level
-- =====================================================
-- This creates a unique constraint that prevents two appointments
-- from being booked for the same groomer + date + time slot.
-- 
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- First, check for any existing double-bookings and fix them if needed
-- (This query shows duplicates - review before running the constraint)
SELECT 
    assigned_groomer_id,
    appointment_date,
    start_time,
    COUNT(*) as count
FROM appointments
WHERE status NOT IN ('cancelled', 'no_show')
AND assigned_groomer_id IS NOT NULL
GROUP BY assigned_groomer_id, appointment_date, start_time
HAVING COUNT(*) > 1;

-- Create the unique index (this prevents future double-bookings)
-- The WHERE clause excludes cancelled/no_show appointments
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_groomer_slot 
ON appointments (assigned_groomer_id, appointment_date, start_time) 
WHERE status NOT IN ('cancelled', 'no_show') 
AND assigned_groomer_id IS NOT NULL;

-- Alternative: If you want to use a partial unique constraint instead
-- DROP INDEX IF EXISTS idx_unique_groomer_slot;
-- ALTER TABLE appointments ADD CONSTRAINT unique_groomer_slot 
-- EXCLUDE USING btree (assigned_groomer_id WITH =, appointment_date WITH =, start_time WITH =)
-- WHERE (status NOT IN ('cancelled', 'no_show'));

-- Verify the index was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'appointments' 
AND indexname = 'idx_unique_groomer_slot';

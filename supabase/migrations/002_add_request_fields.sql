-- ============================================================
-- Migration 002: Add tenant_name, tenant_phone, category columns
-- to maintenance_requests, and open up RLS for public QR form.
--
-- Run this entire file in the Supabase SQL editor.
-- ============================================================

-- Add new columns (safe to run multiple times)
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS tenant_name TEXT;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS tenant_phone TEXT;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS category TEXT;

-- Allow anonymous (unauthenticated) users to INSERT maintenance requests.
-- This is required for the public tenant submission form reached via QR code.
CREATE POLICY "Allow anonymous inserts" ON maintenance_requests
  FOR INSERT WITH CHECK (true);

-- Allow public (anon) read on units so the QR form can populate the unit dropdown.
CREATE POLICY "Allow public read of units" ON units
  FOR SELECT USING (true);

-- Allow public (anon) read on properties so the QR form can show property names.
CREATE POLICY "Allow public read of properties" ON properties
  FOR SELECT USING (true);

-- Add geolocation columns for tracking clock-in and clock-out coordinates
ALTER TABLE attendance_logs 
  ADD COLUMN IF NOT EXISTS location_clock_in jsonb,
  ADD COLUMN IF NOT EXISTS location_clock_out jsonb;

-- Add setting to require location on clock in/out
ALTER TABLE attendance_settings
  ADD COLUMN IF NOT EXISTS require_location boolean DEFAULT false;


-- Add hashed backup codes column and reset flag
ALTER TABLE public.mfa_settings 
  ADD COLUMN IF NOT EXISTS backup_codes_hash text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS backup_codes_salt text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS backup_codes_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS backup_codes_reset_needed boolean DEFAULT false;

-- Clear all existing plaintext backup codes and flag for reset
UPDATE public.mfa_settings 
SET backup_codes = '{}', 
    backup_codes_reset_needed = true,
    backup_codes_count = 0
WHERE backup_codes IS NOT NULL AND array_length(backup_codes, 1) > 0;

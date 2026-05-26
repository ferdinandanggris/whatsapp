-- Drop assigned_agent_id from conversations
DROP INDEX IF EXISTS idx_conversations_agent;
ALTER TABLE conversations DROP COLUMN IF EXISTS assigned_agent_id;

-- Business profile fields for wa_phone_numbers
ALTER TABLE wa_phone_numbers ADD COLUMN IF NOT EXISTS description              TEXT;
ALTER TABLE wa_phone_numbers ADD COLUMN IF NOT EXISTS email                     VARCHAR(255);
ALTER TABLE wa_phone_numbers ADD COLUMN IF NOT EXISTS about                     TEXT;
ALTER TABLE wa_phone_numbers ADD COLUMN IF NOT EXISTS address                   TEXT;
ALTER TABLE wa_phone_numbers ADD COLUMN IF NOT EXISTS vertical                  VARCHAR(50);
ALTER TABLE wa_phone_numbers ADD COLUMN IF NOT EXISTS websites                  TEXT[];
ALTER TABLE wa_phone_numbers ADD COLUMN IF NOT EXISTS profile_picture_handle    TEXT;
ALTER TABLE wa_phone_numbers ADD COLUMN IF NOT EXISTS profile_picture_url       TEXT;
ALTER TABLE wa_phone_numbers ADD COLUMN IF NOT EXISTS business_profile_updated  TIMESTAMPTZ;

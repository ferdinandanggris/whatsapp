ALTER TABLE wa_phone_numbers ADD COLUMN IF NOT EXISTS display_name VARCHAR(255) NOT NULL DEFAULT '';

UPDATE wa_phone_numbers SET display_name = COALESCE(NULLIF(description, ''), display_phone_number) WHERE display_name = '';

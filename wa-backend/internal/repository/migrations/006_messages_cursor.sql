ALTER TABLE messages ADD COLUMN id BIGSERIAL;
DROP INDEX IF EXISTS idx_messages_lookup;
CREATE INDEX idx_messages_lookup_id ON messages(phone_number_id, wa_id, id DESC);

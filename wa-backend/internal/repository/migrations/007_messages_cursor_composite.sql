DROP INDEX IF EXISTS idx_messages_lookup_id;
DROP INDEX IF EXISTS idx_messages_lookup_ts;
CREATE INDEX idx_messages_lookup_ts ON messages(phone_number_id, wa_id, timestamp DESC, id DESC);

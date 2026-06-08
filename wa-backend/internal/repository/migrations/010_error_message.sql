ALTER TABLE messages RENAME COLUMN error_code TO error_message;
ALTER TABLE messages ALTER COLUMN error_message TYPE TEXT;

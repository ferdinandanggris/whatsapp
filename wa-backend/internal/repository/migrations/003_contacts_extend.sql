ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_is_blocked ON contacts(is_blocked);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_agent_id ON contacts(assigned_agent_id);

ALTER TABLE contacts DROP COLUMN IF EXISTS assigned_agent_id;
DROP INDEX IF EXISTS idx_contacts_assigned_agent_id;

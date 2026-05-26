CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 5.1 Entities & Multi-Tenancy
CREATE TABLE companies (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE wa_phone_numbers (
    phone_number_id      VARCHAR(50) PRIMARY KEY,
    company_id           BIGINT REFERENCES companies(id) ON DELETE SET NULL,
    display_phone_number VARCHAR(20) NOT NULL,
    quality_rating       VARCHAR(10) NOT NULL DEFAULT 'GREEN'
);

-- 5.2 Users & RBAC
CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'agent');

CREATE TABLE users (
    id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    role          user_role   NOT NULL,
    company_id    BIGINT      REFERENCES companies(id) ON DELETE CASCADE,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    is_active     BOOLEAN     NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.3 Contact Isolation
CREATE TABLE contacts (
    wa_id                    VARCHAR(20)  NOT NULL,
    phone_number_id          VARCHAR(50)  NOT NULL REFERENCES wa_phone_numbers(phone_number_id),
    profile_name             VARCHAR(255),
    company_custom_name      VARCHAR(255),
    last_customer_message_at TIMESTAMPTZ,
    PRIMARY KEY (wa_id, phone_number_id)
);

-- 5.4 Messages
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_status   AS ENUM ('received', 'sent', 'delivered', 'read', 'failed');

CREATE TABLE messages (
    wamid           VARCHAR(100) PRIMARY KEY,
    phone_number_id VARCHAR(50)  NOT NULL,
    wa_id           VARCHAR(20)  NOT NULL,
    direction       message_direction NOT NULL,
    type            VARCHAR(20)  NOT NULL,
    content         JSONB        NOT NULL DEFAULT '{}',
    status          message_status NOT NULL DEFAULT 'received',
    timestamp       TIMESTAMPTZ  NOT NULL,
    error_code      INT,
    agent_id        UUID        REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (wa_id, phone_number_id) REFERENCES contacts(wa_id, phone_number_id)
);

CREATE INDEX idx_messages_lookup ON messages(phone_number_id, wa_id, timestamp DESC);
CREATE INDEX idx_messages_status  ON messages(status) WHERE status = 'received';

-- Conversations
CREATE TABLE conversations (
    id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number_id      VARCHAR(50) NOT NULL,
    wa_id                VARCHAR(20) NOT NULL,
    last_message_at      TIMESTAMPTZ,
    last_message_preview VARCHAR(255),
    unread_count         INT         NOT NULL DEFAULT 1,
    FOREIGN KEY (wa_id, phone_number_id) REFERENCES contacts(wa_id, phone_number_id),
    UNIQUE (phone_number_id, wa_id)
);

CREATE INDEX idx_conversations_inbox ON conversations(last_message_at DESC);

-- Media cache
CREATE TABLE media_cache (
    id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id   VARCHAR(100) UNIQUE NOT NULL,
    mime_type  VARCHAR(50) NOT NULL,
    file_size  INT         NOT NULL,
    local_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Templates
CREATE TABLE templates (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(50)  NOT NULL,
    language        VARCHAR(10)  NOT NULL,
    status          VARCHAR(20)  NOT NULL,
    components      JSONB        NOT NULL DEFAULT '[]',
    meta_template_id VARCHAR(100),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (name, language)
);

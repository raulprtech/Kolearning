-- Migration: Create user_plugins table
-- Description: Stores which plugins/integrations are enabled for each user.

CREATE TABLE IF NOT EXISTS user_plugins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plugin_id TEXT NOT NULL, -- Ej: 'telegram_messaging'
  is_enabled BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, plugin_id)
);

-- Index for faster lookup of user plugins
CREATE INDEX IF NOT EXISTS idx_user_plugins_user_id ON user_plugins(user_id);

-- RLS Policies
ALTER TABLE user_plugins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own plugins" ON user_plugins;
CREATE POLICY "Users can manage own plugins" ON user_plugins FOR ALL USING (auth.uid() = user_id);

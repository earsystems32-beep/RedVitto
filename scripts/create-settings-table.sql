-- Create settings table for persistent configuration
-- Table: settings
-- Description: Stores system configuration that persists across server restarts
-- This table should have exactly ONE row with id=1

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  min_amount INTEGER NOT NULL DEFAULT 2000,
  timer_seconds INTEGER NOT NULL DEFAULT 30,
  create_user_enabled BOOLEAN NOT NULL DEFAULT true,
  alias TEXT NOT NULL DEFAULT 'DLHogar.mp',
  phone TEXT NOT NULL DEFAULT '543415481923',
  payment_type TEXT NOT NULL DEFAULT 'alias' CHECK (payment_type IN ('alias', 'cbu')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default row if it doesn't exist
INSERT INTO settings (id, min_amount, timer_seconds, create_user_enabled)
VALUES (1, 2000, 30, true)
ON CONFLICT (id) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_settings_id ON settings(id);

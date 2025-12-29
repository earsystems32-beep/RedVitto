-- Script SQL definitivo para tabla settings
-- Ejecutar en Supabase SQL Editor

DROP TABLE IF EXISTS settings CASCADE;

CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  
  -- Configuración general
  min_amount INTEGER NOT NULL DEFAULT 2000,
  timer_seconds INTEGER NOT NULL DEFAULT 30,
  create_user_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Información de pago
  alias TEXT DEFAULT '',
  payment_type TEXT NOT NULL DEFAULT 'alias' CHECK (payment_type IN ('alias', 'cbu')),
  
  -- Contacto principal
  phone TEXT DEFAULT '',
  
  -- Número de soporte (fijo, no rota)
  support_phone TEXT DEFAULT '',
  support_name TEXT DEFAULT '',
  
  -- Plataforma
  platform_url TEXT DEFAULT 'https://ganamos.sbs',
  
  -- Configuración de bono
  bonus_enabled BOOLEAN NOT NULL DEFAULT true,
  bonus_percentage INTEGER NOT NULL DEFAULT 25 CHECK (bonus_percentage >= 0 AND bonus_percentage <= 100),
  
  -- Sistema de rotación
  rotation_enabled BOOLEAN NOT NULL DEFAULT false,
  rotation_mode TEXT NOT NULL DEFAULT 'clicks' CHECK (rotation_mode IN ('clicks', 'time')),
  rotation_threshold INTEGER NOT NULL DEFAULT 10,
  
  -- Contadores globales de rotación
  current_rotation_index INTEGER NOT NULL DEFAULT 0,
  rotation_click_count INTEGER NOT NULL DEFAULT 0,
  last_rotation_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 9 Números de atención fijos
  attention_phone_1 TEXT DEFAULT '',
  attention_name_1 TEXT DEFAULT '',
  attention_active_1 BOOLEAN NOT NULL DEFAULT false,
  
  attention_phone_2 TEXT DEFAULT '',
  attention_name_2 TEXT DEFAULT '',
  attention_active_2 BOOLEAN NOT NULL DEFAULT false,
  
  attention_phone_3 TEXT DEFAULT '',
  attention_name_3 TEXT DEFAULT '',
  attention_active_3 BOOLEAN NOT NULL DEFAULT false,
  
  attention_phone_4 TEXT DEFAULT '',
  attention_name_4 TEXT DEFAULT '',
  attention_active_4 BOOLEAN NOT NULL DEFAULT false,
  
  attention_phone_5 TEXT DEFAULT '',
  attention_name_5 TEXT DEFAULT '',
  attention_active_5 BOOLEAN NOT NULL DEFAULT false,
  
  attention_phone_6 TEXT DEFAULT '',
  attention_name_6 TEXT DEFAULT '',
  attention_active_6 BOOLEAN NOT NULL DEFAULT false,
  
  attention_phone_7 TEXT DEFAULT '',
  attention_name_7 TEXT DEFAULT '',
  attention_active_7 BOOLEAN NOT NULL DEFAULT false,
  
  attention_phone_8 TEXT DEFAULT '',
  attention_name_8 TEXT DEFAULT '',
  attention_active_8 BOOLEAN NOT NULL DEFAULT false,
  
  attention_phone_9 TEXT DEFAULT '',
  attention_name_9 TEXT DEFAULT '',
  attention_active_9 BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow service role update access" ON settings FOR UPDATE USING (true) WITH CHECK (true);

INSERT INTO settings (id) VALUES (1);

SELECT * FROM settings;

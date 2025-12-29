-- ============================================================
-- SCRIPT COMPLETO PARA RECREAR LA TABLA SETTINGS
-- Incluye TODAS las columnas necesarias para TheCrown
-- ============================================================

-- ADVERTENCIA: Este script eliminará la tabla 'settings' existente y todos sus datos
-- Asegúrate de tener un backup si necesitas conservar alguna configuración

-- 1. Eliminar la tabla existente si existe
DROP TABLE IF EXISTS settings CASCADE;

-- 2. Crear la tabla settings con TODAS las columnas necesarias
CREATE TABLE settings (
  -- Identificador único (siempre debe ser 1)
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  
  -- Configuración general
  min_amount INTEGER NOT NULL DEFAULT 2000,
  timer_seconds INTEGER NOT NULL DEFAULT 30,
  create_user_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Configuración de pagos
  alias TEXT NOT NULL DEFAULT 'DLHogar.mp',
  payment_type TEXT NOT NULL DEFAULT 'alias' CHECK (payment_type IN ('alias', 'cbu')),
  
  -- Configuración de contactos
  phone TEXT NOT NULL DEFAULT '543415481923',
  support_phone TEXT NOT NULL DEFAULT '543415481923',
  
  -- Configuración de plataforma
  platform_url TEXT NOT NULL DEFAULT 'https://ganamos.sbs',
  
  -- Configuración de bonos
  bonus_enabled BOOLEAN NOT NULL DEFAULT true,
  bonus_percentage INTEGER NOT NULL DEFAULT 25 CHECK (bonus_percentage >= 0 AND bonus_percentage <= 100),
  
  -- Configuración de rotación de números de WhatsApp (NUEVO)
  rotation_enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamp de última actualización
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índice en id para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_settings_id ON settings(id);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow public read access" ON settings;
DROP POLICY IF EXISTS "Allow service role update access" ON settings;

-- 6. Crear política para permitir lectura pública
CREATE POLICY "Allow public read access" ON settings
  FOR SELECT
  USING (true);

-- 7. Crear política para permitir actualización solo con service role
CREATE POLICY "Allow service role update access" ON settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 8. Insertar la fila inicial con valores por defecto
INSERT INTO settings (
  id,
  min_amount,
  timer_seconds,
  create_user_enabled,
  alias,
  phone,
  support_phone,
  payment_type,
  platform_url,
  bonus_enabled,
  bonus_percentage,
  rotation_enabled,
  updated_at
) VALUES (
  1,                          -- id
  2000,                       -- min_amount
  30,                         -- timer_seconds
  true,                       -- create_user_enabled
  'DLHogar.mp',              -- alias
  '543415481923',            -- phone
  '543415481923',            -- support_phone
  'alias',                    -- payment_type
  'https://ganamos.sbs',     -- platform_url
  true,                       -- bonus_enabled
  25,                         -- bonus_percentage
  false,                      -- rotation_enabled (desactivado por defecto)
  NOW()                       -- updated_at
);

-- 9. Verificar que se creó correctamente
SELECT 
  id,
  min_amount,
  timer_seconds,
  create_user_enabled,
  alias,
  phone,
  support_phone,
  payment_type,
  platform_url,
  bonus_enabled,
  bonus_percentage,
  rotation_enabled,
  updated_at
FROM settings;

-- ============================================================
-- RESUMEN DE COLUMNAS:
-- ============================================================
-- id                    → INTEGER (siempre 1)
-- min_amount            → INTEGER (monto mínimo)
-- timer_seconds         → INTEGER (segundos del timer)
-- create_user_enabled   → BOOLEAN (permitir crear usuarios)
-- alias                 → TEXT (alias o CBU para pagos)
-- payment_type          → TEXT ('alias' o 'cbu')
-- phone                 → TEXT (teléfono de atención)
-- support_phone         → TEXT (teléfono de soporte)
-- platform_url          → TEXT (URL de la plataforma)
-- bonus_enabled         → BOOLEAN (activar/desactivar bono)
-- bonus_percentage      → INTEGER (porcentaje del bono 0-100)
-- rotation_enabled      → BOOLEAN (activar/desactivar rotación) ✨ NUEVO
-- updated_at            → TIMESTAMP (última actualización)
-- ============================================================

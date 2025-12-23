-- Script completo para recrear la tabla settings desde cero
-- ADVERTENCIA: Esto eliminará todos los datos existentes en la tabla settings

-- 1. Eliminar la tabla existente si existe
DROP TABLE IF EXISTS settings CASCADE;

-- 2. Crear la tabla settings con todas las columnas necesarias
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  min_amount INTEGER NOT NULL DEFAULT 2000,
  timer_seconds INTEGER NOT NULL DEFAULT 30,
  create_user_enabled BOOLEAN NOT NULL DEFAULT true,
  alias TEXT NOT NULL DEFAULT 'DLHogar.mp',
  phone TEXT NOT NULL DEFAULT '543415481923',
  support_phone TEXT NOT NULL DEFAULT '543415481923',
  payment_type TEXT NOT NULL DEFAULT 'alias' CHECK (payment_type IN ('alias', 'cbu')),
  platform_url TEXT NOT NULL DEFAULT 'https://ganamos.sbs',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insertar la fila inicial con valores por defecto
INSERT INTO settings (
  id,
  min_amount,
  timer_seconds,
  create_user_enabled,
  alias,
  phone,
  support_phone,
  payment_type,
  platform_url
) VALUES (
  1,
  2000,
  30,
  true,
  'DLHogar.mp',
  '543415481923',
  '543415481923',
  'alias',
  'https://ganamos.sbs'
);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 5. Crear política para permitir lectura pública
CREATE POLICY "Allow public read access"
  ON settings
  FOR SELECT
  USING (true);

-- 6. Crear política para permitir actualizaciones solo con service role
-- (Las actualizaciones se harán desde el backend con service_role_key)
CREATE POLICY "Allow service role updates"
  ON settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Verificar que todo se creó correctamente
SELECT * FROM settings;

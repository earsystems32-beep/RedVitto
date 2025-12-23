-- Agregar columnas para configuración del bono

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS bonus_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS bonus_percentage INTEGER NOT NULL DEFAULT 25;

-- Verificar cambios
SELECT id, bonus_enabled, bonus_percentage FROM settings;

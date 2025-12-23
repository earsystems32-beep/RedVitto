-- Agregar columna para URL de plataforma Ganamos
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS platform_url TEXT NOT NULL DEFAULT 'https://ganamos.sbs';

-- Actualizar el valor por defecto si ya existe
UPDATE settings
SET platform_url = 'https://ganamos.sbs'
WHERE id = 1 AND (platform_url IS NULL OR platform_url = '');

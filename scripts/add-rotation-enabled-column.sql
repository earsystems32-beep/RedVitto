-- Agregar columna rotation_enabled a la tabla settings
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS rotation_enabled BOOLEAN NOT NULL DEFAULT false;

-- Actualizar la fila existente con valor por defecto
UPDATE settings 
SET rotation_enabled = false 
WHERE id = 1;

-- Verificar que se agregó correctamente
SELECT id, rotation_enabled FROM settings WHERE id = 1;

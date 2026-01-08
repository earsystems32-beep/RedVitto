-- Script para agregar contador de solicitudes totales
-- Ejecutar en Supabase SQL Editor

-- Agregar columna para contador de solicitudes totales
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS total_requests_count INTEGER NOT NULL DEFAULT 0;

-- Verificar que se agregó correctamente
SELECT total_requests_count FROM settings WHERE id = 1;

-- =====================================================
-- MIGRACIÓN: Añadir estados de oferta al pipeline
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- El flujo correcto es:
-- 1. oportunidad: Proyecto presentado al CI, pendiente de decisión
-- 2. rechazado_ci: CI rechaza la oportunidad (no vale la pena)
-- 3. oferta_autorizada: CI aprueba, se puede presentar oferta al vendedor
-- 4. oferta_presentada: Oferta enviada al vendedor, esperando respuesta
-- 5. oferta_rechazada: El vendedor rechazó la oferta
-- 6. oferta_aceptada: El vendedor aceptó → Se convierte en proyecto
-- 7. en_ejecucion: Proyecto en obras
-- 8. en_venta: Proyecto terminado, en comercialización
-- 9. vendido: Proyecto vendido, cerrado

-- Añadir nuevos valores al ENUM project_status
-- PostgreSQL no permite añadir valores en medio, hay que recrear

-- Paso 1: Crear el nuevo tipo ENUM
DO $$ BEGIN
    CREATE TYPE project_status_new AS ENUM (
        'oportunidad',
        'rechazado_ci',
        'oferta_autorizada',
        'oferta_presentada',
        'oferta_rechazada',
        'oferta_aceptada',
        'en_ejecucion',
        'en_venta',
        'vendido'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Paso 2: Actualizar la tabla para usar el nuevo tipo
-- Primero, mapeamos los valores antiguos a los nuevos
ALTER TABLE projects_v2
    ALTER COLUMN status TYPE TEXT;

-- Mapear valores antiguos
UPDATE projects_v2 SET status = 'rechazado_ci' WHERE status = 'rechazado';
UPDATE projects_v2 SET status = 'oferta_aceptada' WHERE status = 'aprobado';

-- Paso 3: Convertir al nuevo tipo
ALTER TABLE projects_v2
    ALTER COLUMN status TYPE project_status_new
    USING status::project_status_new;

-- Paso 4: Eliminar el tipo antiguo y renombrar el nuevo
DROP TYPE IF EXISTS project_status;
ALTER TYPE project_status_new RENAME TO project_status;

-- Paso 5: Añadir columnas para tracking de ofertas
ALTER TABLE projects_v2 ADD COLUMN IF NOT EXISTS offer_amount DECIMAL(12,2);
ALTER TABLE projects_v2 ADD COLUMN IF NOT EXISTS offer_date TIMESTAMPTZ;
ALTER TABLE projects_v2 ADD COLUMN IF NOT EXISTS offer_response_date TIMESTAMPTZ;
ALTER TABLE projects_v2 ADD COLUMN IF NOT EXISTS offer_rejection_reason TEXT;

-- =====================================================
-- COMENTARIOS ACTUALIZADOS
-- =====================================================
COMMENT ON COLUMN projects_v2.status IS 'Estado: oportunidad → rechazado_ci | oferta_autorizada → oferta_presentada → oferta_rechazada | oferta_aceptada → en_ejecucion → en_venta → vendido';
COMMENT ON COLUMN projects_v2.offer_amount IS 'Importe de la oferta presentada al vendedor';
COMMENT ON COLUMN projects_v2.offer_date IS 'Fecha en que se presentó la oferta';
COMMENT ON COLUMN projects_v2.offer_response_date IS 'Fecha de respuesta del vendedor';
COMMENT ON COLUMN projects_v2.offer_rejection_reason IS 'Motivo por el que el vendedor rechazó la oferta';

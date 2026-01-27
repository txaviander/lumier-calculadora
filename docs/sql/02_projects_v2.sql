-- =====================================================
-- SPRINT 1: Tabla projects_v2 (nueva versión)
-- Ejecutar en Supabase SQL Editor
-- NOTA: Se crea como tabla nueva para no afectar la existente
-- =====================================================

-- Crear tipos ENUM
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM (
        'oportunidad',
        'aprobado',
        'en_ejecucion',
        'en_venta',
        'vendido',
        'rechazado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE renovation_type AS ENUM (
        'basica',
        'media',
        'integral',
        'lujo'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla de proyectos v2 (Sprint 1)
CREATE TABLE IF NOT EXISTS projects_v2 (
    project_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_code TEXT UNIQUE,  -- Auto-generado: LUM-2025-001
    status project_status DEFAULT 'oportunidad',

    -- Datos del inmueble
    property_address TEXT NOT NULL,
    property_city TEXT DEFAULT 'Madrid',
    property_district TEXT,
    property_postal_code TEXT,
    property_size_m2 DECIMAL(10,2),
    property_bedrooms INTEGER,
    property_bathrooms DECIMAL(3,1),
    property_current_condition TEXT,

    -- Datos financieros
    purchase_price DECIMAL(12,2),
    estimated_sale_price DECIMAL(12,2),
    estimated_renovation_cost DECIMAL(12,2),
    actual_renovation_cost DECIMAL(12,2),
    final_sale_price DECIMAL(12,2),

    -- Márgenes calculados
    gross_margin_amount DECIMAL(12,2),
    gross_margin_percentage DECIMAL(5,2),
    net_margin_amount DECIMAL(12,2),
    net_margin_percentage DECIMAL(5,2),
    roi_percentage DECIMAL(5,2),

    -- Tipo de reforma
    renovation_type renovation_type DEFAULT 'integral',
    target_completion_months INTEGER DEFAULT 8,

    -- Asignaciones
    commercial_user_id UUID REFERENCES user_profiles(id),
    assigned_pm_user_id UUID REFERENCES user_profiles(id),
    assigned_designer_user_id UUID REFERENCES user_profiles(id),

    -- Fechas clave
    approval_date TIMESTAMPTZ,
    approval_by_user_id UUID REFERENCES user_profiles(id),
    rejection_date TIMESTAMPTZ,
    rejection_reason TEXT,
    purchase_date TIMESTAMPTZ,
    renovation_start_date TIMESTAMPTZ,
    sale_date TIMESTAMPTZ,

    -- Metadatos
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID REFERENCES user_profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_projects_v2_status ON projects_v2(status);
CREATE INDEX IF NOT EXISTS idx_projects_v2_code ON projects_v2(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_v2_commercial ON projects_v2(commercial_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_v2_created ON projects_v2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_v2_district ON projects_v2(property_district);

-- Función para generar código de proyecto automáticamente
CREATE OR REPLACE FUNCTION generate_project_code()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    new_code TEXT;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');

    -- Obtener el siguiente número de secuencia para este año
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(project_code, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM projects_v2
    WHERE project_code LIKE 'LUM-' || year_part || '-%';

    -- Generar código con formato LUM-2025-001
    new_code := 'LUM-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');

    NEW.project_code := new_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_project_code ON projects_v2;
CREATE TRIGGER set_project_code
    BEFORE INSERT ON projects_v2
    FOR EACH ROW
    WHEN (NEW.project_code IS NULL)
    EXECUTE FUNCTION generate_project_code();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_projects_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_v2_timestamp ON projects_v2;
CREATE TRIGGER update_projects_v2_timestamp
    BEFORE UPDATE ON projects_v2
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_v2_updated_at();

-- RLS
ALTER TABLE projects_v2 ENABLE ROW LEVEL SECURITY;

-- Políticas: usuarios autenticados pueden ver todos los proyectos
CREATE POLICY "Usuarios pueden ver proyectos"
    ON projects_v2 FOR SELECT
    TO authenticated
    USING (true);

-- Políticas: usuarios autenticados pueden crear proyectos
CREATE POLICY "Usuarios pueden crear proyectos"
    ON projects_v2 FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Políticas: usuarios pueden actualizar proyectos que crearon o comerciales asignados
CREATE POLICY "Usuarios pueden actualizar proyectos"
    ON projects_v2 FOR UPDATE
    TO authenticated
    USING (
        created_by_user_id = auth.uid() OR
        commercial_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('direccion', 'financiero', 'admin')
        )
    );

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE projects_v2 IS 'Proyectos inmobiliarios Sprint 1 - Calculadora 2.0';
COMMENT ON COLUMN projects_v2.project_code IS 'Código único auto-generado: LUM-YYYY-NNN';
COMMENT ON COLUMN projects_v2.status IS 'Estado del proyecto en el pipeline';

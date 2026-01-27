-- =====================================================
-- SPRINT 1: Tabla calculator_snapshots
-- Histórico de cálculos de la calculadora
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Crear tipo ENUM para recomendación
DO $$ BEGIN
    CREATE TYPE recommended_action AS ENUM (
        'comprar',
        'negociar',
        'rechazar'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla de snapshots de calculadora
CREATE TABLE IF NOT EXISTS calculator_snapshots (
    snapshot_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects_v2(project_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    calculation_date TIMESTAMPTZ DEFAULT NOW(),
    calculated_by_user_id UUID REFERENCES user_profiles(id),

    -- Inputs del cálculo
    input_purchase_price DECIMAL(12,2),
    input_estimated_sale_price DECIMAL(12,2),
    input_property_size_m2 DECIMAL(10,2),
    input_renovation_type renovation_type,
    input_property_condition TEXT,
    input_custom_params JSONB,  -- Parámetros adicionales

    -- Outputs del cálculo
    output_capex_total DECIMAL(12,2),
    output_capex_breakdown JSONB,  -- Desglose por categoría
    output_gross_margin_amount DECIMAL(12,2),
    output_gross_margin_percentage DECIMAL(5,2),
    output_net_margin_amount DECIMAL(12,2),
    output_net_margin_percentage DECIMAL(5,2),
    output_roi_percentage DECIMAL(5,2),
    output_break_even_price DECIMAL(12,2),
    output_recommended_action recommended_action,

    -- Notas
    notes TEXT,

    -- Restricción única
    UNIQUE(project_id, version_number)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_snapshots_project ON calculator_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON calculator_snapshots(calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user ON calculator_snapshots(calculated_by_user_id);

-- Función para auto-incrementar version_number por proyecto
CREATE OR REPLACE FUNCTION set_snapshot_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version_number IS NULL THEN
        SELECT COALESCE(MAX(version_number), 0) + 1
        INTO NEW.version_number
        FROM calculator_snapshots
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_snapshot_version ON calculator_snapshots;
CREATE TRIGGER auto_snapshot_version
    BEFORE INSERT ON calculator_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION set_snapshot_version();

-- RLS
ALTER TABLE calculator_snapshots ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuarios pueden ver snapshots"
    ON calculator_snapshots FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuarios pueden crear snapshots"
    ON calculator_snapshots FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE calculator_snapshots IS 'Histórico de cálculos de la calculadora por proyecto';
COMMENT ON COLUMN calculator_snapshots.output_capex_breakdown IS 'JSON con desglose: {demolicion: X, albanileria: Y, ...}';
COMMENT ON COLUMN calculator_snapshots.output_recommended_action IS 'Recomendación basada en margen neto: comprar (>=18%), negociar (14-18%), rechazar (<14%)';

-- =====================================================
-- SPRINT 1: Tablas de presupuestos
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Crear tipos ENUM
DO $$ BEGIN
    CREATE TYPE budget_type AS ENUM (
        'estimado_calculadora',
        'proveedor_cotizacion',
        'aprobado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE budget_status AS ENUM (
        'borrador',
        'enviado_a_proveedor',
        'recibido',
        'aprobado',
        'rechazado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_category AS ENUM (
        'demolicion',
        'albanileria',
        'fontaneria',
        'electricidad',
        'carpinteria',
        'pintura',
        'marmoles',
        'climatizacion',
        'equipamiento',
        'otros'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE unit_of_measure AS ENUM (
        'm2',
        'm3',
        'ml',
        'ud',
        'pa'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- Tabla: budget_items_catalog
-- Catálogo de partidas de presupuesto
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_items_catalog (
    catalog_item_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_code TEXT UNIQUE NOT NULL,
    item_category item_category NOT NULL,
    item_name TEXT NOT NULL,
    item_description TEXT,
    unit_of_measure unit_of_measure NOT NULL,
    standard_unit_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_catalog_category ON budget_items_catalog(item_category);
CREATE INDEX IF NOT EXISTS idx_catalog_code ON budget_items_catalog(item_code);
CREATE INDEX IF NOT EXISTS idx_catalog_active ON budget_items_catalog(is_active);

-- =====================================================
-- Tabla: project_budgets
-- Presupuestos de cada proyecto
-- =====================================================
CREATE TABLE IF NOT EXISTS project_budgets (
    budget_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects_v2(project_id) ON DELETE CASCADE,
    budget_type budget_type NOT NULL,
    budget_version INTEGER DEFAULT 1,
    supplier_name TEXT,
    subtotal_amount DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    status budget_status DEFAULT 'borrador',
    created_by_user_id UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_budgets_project ON project_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_type ON project_budgets(budget_type);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON project_budgets(status);

-- =====================================================
-- Tabla: budget_line_items
-- Líneas de cada presupuesto
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_line_items (
    line_item_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID REFERENCES project_budgets(budget_id) ON DELETE CASCADE,
    catalog_item_id UUID REFERENCES budget_items_catalog(catalog_item_id),
    trade_group TEXT,  -- Grupo de trabajo (puede ser diferente del catálogo)
    line_order INTEGER DEFAULT 0,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    line_total DECIMAL(12,2)  -- Por si hay ajustes manuales
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_line_items_budget ON budget_line_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_line_items_catalog ON budget_line_items(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_line_items_order ON budget_line_items(budget_id, line_order);

-- Trigger para actualizar total del presupuesto
CREATE OR REPLACE FUNCTION update_budget_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE project_budgets
    SET
        subtotal_amount = (
            SELECT COALESCE(SUM(COALESCE(line_total, subtotal)), 0)
            FROM budget_line_items
            WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id)
        ),
        total_amount = (
            SELECT COALESCE(SUM(COALESCE(line_total, subtotal)), 0)
            FROM budget_line_items
            WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id)
        ),
        updated_at = NOW()
    WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_budget_on_line_change ON budget_line_items;
CREATE TRIGGER update_budget_on_line_change
    AFTER INSERT OR UPDATE OR DELETE ON budget_line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_totals();

-- RLS
ALTER TABLE budget_items_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;

-- Políticas: acceso para usuarios autenticados
CREATE POLICY "Ver catálogo" ON budget_items_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Ver presupuestos" ON project_budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Crear presupuestos" ON project_budgets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Actualizar presupuestos" ON project_budgets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Ver líneas" ON budget_line_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Crear líneas" ON budget_line_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Actualizar líneas" ON budget_line_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Eliminar líneas" ON budget_line_items FOR DELETE TO authenticated USING (true);

-- =====================================================
-- DATOS INICIALES: Catálogo de partidas
-- =====================================================
INSERT INTO budget_items_catalog (item_code, item_category, item_name, item_description, unit_of_measure, standard_unit_price) VALUES
-- Demolición
('DEM-001', 'demolicion', 'Demolición general', 'Demolición de tabiques, suelos y techos', 'm2', 25.00),
('DEM-002', 'demolicion', 'Retirada de escombros', 'Carga y transporte a vertedero', 'm3', 45.00),

-- Albañilería
('ALB-001', 'albanileria', 'Tabiquería pladur', 'Tabique de pladur con aislamiento', 'm2', 35.00),
('ALB-002', 'albanileria', 'Solado gres', 'Colocación de solado cerámico', 'm2', 45.00),
('ALB-003', 'albanileria', 'Alicatado baño', 'Alicatado de paredes en baño', 'm2', 55.00),

-- Fontanería
('FON-001', 'fontaneria', 'Punto de agua', 'Instalación de punto de agua', 'ud', 85.00),
('FON-002', 'fontaneria', 'Desagüe', 'Instalación de desagüe', 'ud', 65.00),
('FON-003', 'fontaneria', 'Sanitario completo', 'Inodoro con cisterna empotrada', 'ud', 450.00),

-- Electricidad
('ELE-001', 'electricidad', 'Punto de luz', 'Punto de luz con cableado', 'ud', 65.00),
('ELE-002', 'electricidad', 'Enchufe', 'Base de enchufe con cableado', 'ud', 45.00),
('ELE-003', 'electricidad', 'Cuadro eléctrico', 'Cuadro general de protección', 'ud', 350.00),

-- Carpintería
('CAR-001', 'carpinteria', 'Puerta interior', 'Puerta de paso lacada', 'ud', 280.00),
('CAR-002', 'carpinteria', 'Armario empotrado', 'Frente de armario por metro lineal', 'ml', 350.00),
('CAR-003', 'carpinteria', 'Cocina lineal', 'Mobiliario de cocina por metro lineal', 'ml', 850.00),

-- Pintura
('PIN-001', 'pintura', 'Pintura lisa', 'Pintura plástica en paredes y techos', 'm2', 12.00),
('PIN-002', 'pintura', 'Pintura decorativa', 'Estuco o pintura especial', 'm2', 28.00),

-- Mármoles
('MAR-001', 'marmoles', 'Encimera cocina', 'Encimera de piedra natural', 'ml', 280.00),
('MAR-002', 'marmoles', 'Encimera baño', 'Encimera de baño en mármol', 'ud', 450.00),

-- Climatización
('CLI-001', 'climatizacion', 'Split A/C', 'Máquina de aire acondicionado split', 'ud', 1200.00),
('CLI-002', 'climatizacion', 'Conductos A/C', 'Sistema de conductos por m2', 'm2', 85.00),
('CLI-003', 'climatizacion', 'Radiador', 'Radiador de aluminio', 'ud', 180.00),

-- Equipamiento
('EQU-001', 'equipamiento', 'Electrodomésticos básicos', 'Horno, vitro, campana', 'pa', 2500.00),
('EQU-002', 'equipamiento', 'Electrodomésticos premium', 'Electrodomésticos gama alta', 'pa', 5500.00),

-- Otros
('OTR-001', 'otros', 'Limpieza final', 'Limpieza de obra', 'pa', 500.00),
('OTR-002', 'otros', 'Imprevistos', 'Partida de imprevistos', 'pa', 0.00)

ON CONFLICT (item_code) DO NOTHING;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE budget_items_catalog IS 'Catálogo maestro de partidas de presupuesto';
COMMENT ON TABLE project_budgets IS 'Presupuestos asociados a cada proyecto';
COMMENT ON TABLE budget_line_items IS 'Líneas detalladas de cada presupuesto';

-- =====================================================
-- ESQUEMA DE BASE DE DATOS PARA LUMIER CALCULADORA
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: projects
-- Almacena la informacion de cada proyecto inmobiliario
-- =====================================================
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice para busqueda rapida por slug
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_updated ON projects(updated_at DESC);

-- =====================================================
-- TABLA: project_versions
-- Almacena las diferentes versiones de cada calculadora
-- =====================================================
CREATE TABLE project_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_name VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Restriccion: solo una version activa por proyecto
    UNIQUE(project_id, version_number)
);

-- Indices para consultas eficientes
CREATE INDEX idx_versions_project ON project_versions(project_id);
CREATE INDEX idx_versions_active ON project_versions(project_id, is_active) WHERE is_active = true;

-- =====================================================
-- POLITICAS DE SEGURIDAD (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;

-- Politica: Permitir lectura publica (para compartir URLs)
CREATE POLICY "Permitir lectura publica de proyectos"
    ON projects FOR SELECT
    USING (true);

CREATE POLICY "Permitir lectura publica de versiones"
    ON project_versions FOR SELECT
    USING (true);

-- Politica: Permitir escritura (sin autenticacion para MVP)
-- NOTA: Para produccion, agregar autenticacion
CREATE POLICY "Permitir insercion de proyectos"
    ON projects FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Permitir actualizacion de proyectos"
    ON projects FOR UPDATE
    USING (true);

CREATE POLICY "Permitir eliminacion de proyectos"
    ON projects FOR DELETE
    USING (true);

CREATE POLICY "Permitir insercion de versiones"
    ON project_versions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Permitir actualizacion de versiones"
    ON project_versions FOR UPDATE
    USING (true);

CREATE POLICY "Permitir eliminacion de versiones"
    ON project_versions FOR DELETE
    USING (true);

-- =====================================================
-- FUNCION: Actualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS DE EJEMPLO (opcional)
-- =====================================================
/*
INSERT INTO projects (name, slug, description) VALUES
('Casa Ejemplo Madrid', 'casa-ejemplo-madrid-abc123', 'Proyecto de renovacion en el centro de Madrid'),
('Villa Costa Brava', 'villa-costa-brava-xyz789', 'Casa vacacional con vistas al mar');

INSERT INTO project_versions (project_id, version_number, version_name, data, is_active) VALUES
(
    (SELECT id FROM projects WHERE slug = 'casa-ejemplo-madrid-abc123'),
    1,
    'Presupuesto Inicial',
    '{
        "precioCompra": 250000,
        "impuestosCompra": 25000,
        "notariaCompra": 1500,
        "registroCompra": 600,
        "gestoriaCompra": 500,
        "otrosGastosCompra": 0,
        "totalReforma": 80000,
        "honorariosReforma": 8000,
        "capitalPropio": 100000,
        "prestamo": 250000,
        "interesPrestamo": 4.5,
        "mesesPrestamo": 12,
        "fechaCompra": "2024-01-15",
        "fechaInicioReforma": "2024-02-01",
        "fechaFinReforma": "2024-06-30",
        "fechaVenta": "2024-09-30",
        "precioVenta": 450000,
        "comisionVenta": 13500,
        "plusvalia": 2000,
        "notariaVenta": 1000,
        "gestoriaVenta": 500,
        "otrosGastosVenta": 0,
        "cancelacionHipoteca": 500
    }',
    true
);
*/

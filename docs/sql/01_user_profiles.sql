-- =====================================================
-- SPRINT 1: Tabla user_profiles
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Crear tipo ENUM para roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'comercial',
        'project_manager',
        'financiero',
        'diseno',
        'direccion',
        'legal',
        'marketing',
        'rrhh',
        'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'comercial',
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas: usuarios autenticados pueden ver todos los perfiles
CREATE POLICY "Usuarios pueden ver perfiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (true);

-- Políticas: usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su perfil"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil en registro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_timestamp ON user_profiles;
CREATE TRIGGER update_user_profiles_timestamp
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- =====================================================
-- DATOS INICIALES: Crear perfiles para usuarios existentes
-- =====================================================
INSERT INTO user_profiles (id, email, full_name, role)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email),
    'direccion'::user_role  -- Por defecto direccion para usuarios @lumier.es
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE user_profiles IS 'Perfiles de usuario con roles del sistema Lumier Brain';
COMMENT ON COLUMN user_profiles.role IS 'Rol del usuario: comercial, project_manager, financiero, diseno, direccion, legal, marketing, rrhh, admin';

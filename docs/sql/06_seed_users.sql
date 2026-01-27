-- =====================================================
-- SPRINT 1: Seed de Usuarios Lumier
-- Ejecutar DESPUÉS de 01_user_profiles.sql
-- =====================================================

-- Este script actualiza los roles de los usuarios basándose en su email
-- Los usuarios deben haberse logueado al menos una vez con Google
-- para que existan en auth.users y user_profiles

-- =====================================================
-- ACTUALIZAR ROLES POR EMAIL
-- =====================================================

-- Alejandro Velasco - Legal
UPDATE user_profiles
SET full_name = 'Alejandro Velasco', role = 'legal'::user_role
WHERE email = 'alejandro@lumier.es';

-- Angela Manzanero - Legal
UPDATE user_profiles
SET full_name = 'Angela Manzanero', role = 'legal'::user_role
WHERE email = 'angela@lumier.es';

-- Axel Pinto - Dirección
UPDATE user_profiles
SET full_name = 'Axel Pinto', role = 'direccion'::user_role
WHERE email = 'axel@lumier.es';

-- Ayelen Sarmiento - Financiero
UPDATE user_profiles
SET full_name = 'Ayelen Sarmiento', role = 'financiero'::user_role
WHERE email = 'ayelen@lumier.es';

-- Beatriz Montero - RRHH
UPDATE user_profiles
SET full_name = 'Beatriz Montero', role = 'rrhh'::user_role
WHERE email = 'beatriz@lumier.es';

-- Fatima Saldaña - Financiero
UPDATE user_profiles
SET full_name = 'Fatima Saldaña', role = 'financiero'::user_role
WHERE email = 'fatima@lumier.es';

-- Javier Pérez - Comercial
UPDATE user_profiles
SET full_name = 'Javier Pérez', role = 'comercial'::user_role
WHERE email = 'javier.perez@lumier.es';

-- Javier Andrés - Administrador
UPDATE user_profiles
SET full_name = 'Javier Andrés', role = 'admin'::user_role
WHERE email = 'javier@lumier.es';

-- Laura de la Rocha - RRHH
UPDATE user_profiles
SET full_name = 'Laura de la Rocha', role = 'rrhh'::user_role
WHERE email = 'laura@lumier.es';

-- Oscar Bouzas - Marketing
UPDATE user_profiles
SET full_name = 'Oscar Bouzas', role = 'marketing'::user_role
WHERE email = 'oscar@lumier.es';

-- Paula Arredondo - Comercial
UPDATE user_profiles
SET full_name = 'Paula Arredondo', role = 'comercial'::user_role
WHERE email = 'paula@lumier.es';

-- Sofia Gómez - Project Manager
UPDATE user_profiles
SET full_name = 'Sofia Gómez', role = 'project_manager'::user_role
WHERE email = 'sofia@lumier.es';

-- Yolanda Castro - Project Manager
UPDATE user_profiles
SET full_name = 'Yolanda Castro', role = 'project_manager'::user_role
WHERE email = 'yolanda@lumier.es';

-- =====================================================
-- VERIFICACIÓN: Mostrar usuarios actualizados
-- =====================================================
SELECT
    email,
    full_name,
    role,
    is_active,
    created_at
FROM user_profiles
WHERE email LIKE '%@lumier.es'
ORDER BY
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'direccion' THEN 2
        WHEN 'financiero' THEN 3
        WHEN 'legal' THEN 4
        WHEN 'project_manager' THEN 5
        WHEN 'comercial' THEN 6
        WHEN 'marketing' THEN 7
        WHEN 'rrhh' THEN 8
        ELSE 9
    END,
    full_name;

-- =====================================================
-- ALTERNATIVA: Crear usuarios pre-registrados
-- Usar esta función para crear perfiles ANTES de que
-- los usuarios se logueen (requiere permisos de admin)
-- =====================================================

-- Esta función permite crear un usuario pendiente que se
-- vinculará automáticamente cuando se loguee con Google
CREATE OR REPLACE FUNCTION create_pending_user(
    p_email TEXT,
    p_full_name TEXT,
    p_role user_role
) RETURNS TABLE(email TEXT, full_name TEXT, role user_role, status TEXT) AS $$
DECLARE
    v_user_id UUID;
    v_status TEXT;
BEGIN
    -- Buscar si el usuario ya existe en auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE auth.users.email = p_email;

    IF v_user_id IS NOT NULL THEN
        -- Usuario existe, actualizar perfil
        INSERT INTO user_profiles (id, email, full_name, role)
        VALUES (v_user_id, p_email, p_full_name, p_role)
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            updated_at = NOW();
        v_status := 'updated';
    ELSE
        -- Usuario no existe aún, no podemos crear sin auth
        v_status := 'pending_login';
    END IF;

    RETURN QUERY SELECT p_email, p_full_name, p_role, v_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RESUMEN DE USUARIOS LUMIER
-- =====================================================
/*
| Nombre              | Email                    | Rol             |
|---------------------|--------------------------|-----------------|
| Javier Andrés       | javier@lumier.es         | admin           |
| Axel Pinto          | axel@lumier.es           | direccion       |
| Ayelen Sarmiento    | ayelen@lumier.es         | financiero      |
| Fatima Saldaña      | fatima@lumier.es         | financiero      |
| Alejandro Velasco   | alejandro@lumier.es      | legal           |
| Angela Manzanero    | angela@lumier.es         | legal           |
| Sofia Gómez         | sofia@lumier.es          | project_manager |
| Yolanda Castro      | yolanda@lumier.es        | project_manager |
| Javier Pérez        | javier.perez@lumier.es   | comercial       |
| Paula Arredondo     | paula@lumier.es          | comercial       |
| Oscar Bouzas        | oscar@lumier.es          | marketing       |
| Beatriz Montero     | beatriz@lumier.es        | rrhh            |
| Laura de la Rocha   | laura@lumier.es          | rrhh            |
*/

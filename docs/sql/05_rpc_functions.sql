-- =====================================================
-- SPRINT 1: Funciones RPC
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- FUNCIÓN: calculate_capex_estimate
-- Calcula el CAPEX estimado según m2 y tipo de reforma
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_capex_estimate(
    p_size_m2 DECIMAL,
    p_renovation_type TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_multiplier DECIMAL;
    v_demolicion DECIMAL;
    v_albanileria DECIMAL;
    v_fontaneria DECIMAL;
    v_electricidad DECIMAL;
    v_carpinteria DECIMAL;
    v_pintura DECIMAL;
    v_marmoles DECIMAL;
    v_climatizacion DECIMAL;
    v_equipamiento DECIMAL;
    v_otros DECIMAL;
    v_total DECIMAL;
BEGIN
    -- Determinar multiplicador según tipo de reforma
    -- basica: ~400€/m2, media: ~700€/m2, integral: ~1000€/m2, lujo: ~1500€/m2
    CASE p_renovation_type
        WHEN 'basica' THEN v_multiplier := 1.0;
        WHEN 'media' THEN v_multiplier := 1.75;
        WHEN 'integral' THEN v_multiplier := 2.5;
        WHEN 'lujo' THEN v_multiplier := 3.75;
        ELSE v_multiplier := 2.5;  -- Default: integral
    END CASE;

    -- Calcular cada partida (precios base para reforma básica por m2)
    v_demolicion := ROUND(p_size_m2 * 25 * v_multiplier, 0);
    v_albanileria := ROUND(p_size_m2 * 75 * v_multiplier, 0);
    v_fontaneria := ROUND(p_size_m2 * 50 * v_multiplier, 0);
    v_electricidad := ROUND(p_size_m2 * 45 * v_multiplier, 0);
    v_carpinteria := ROUND(p_size_m2 * 60 * v_multiplier, 0);
    v_pintura := ROUND(p_size_m2 * 25 * v_multiplier, 0);
    v_marmoles := ROUND(p_size_m2 * 30 * v_multiplier, 0);
    v_climatizacion := ROUND(p_size_m2 * 40 * v_multiplier, 0);
    v_equipamiento := ROUND(p_size_m2 * 35 * v_multiplier, 0);
    v_otros := ROUND(p_size_m2 * 15 * v_multiplier, 0);

    v_total := v_demolicion + v_albanileria + v_fontaneria + v_electricidad +
               v_carpinteria + v_pintura + v_marmoles + v_climatizacion +
               v_equipamiento + v_otros;

    RETURN jsonb_build_object(
        'demolicion', v_demolicion,
        'albanileria', v_albanileria,
        'fontaneria', v_fontaneria,
        'electricidad', v_electricidad,
        'carpinteria', v_carpinteria,
        'pintura', v_pintura,
        'marmoles', v_marmoles,
        'climatizacion', v_climatizacion,
        'equipamiento', v_equipamiento,
        'otros', v_otros,
        'total', v_total,
        'euro_por_m2', ROUND(v_total / p_size_m2, 0),
        'renovation_type', p_renovation_type
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: calculate_project_metrics
-- Calcula todas las métricas de un proyecto
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_project_metrics(
    p_purchase_price DECIMAL,
    p_sale_price DECIMAL,
    p_capex DECIMAL
)
RETURNS JSONB AS $$
DECLARE
    v_gross_margin_amount DECIMAL;
    v_gross_margin_pct DECIMAL;
    v_additional_costs DECIMAL;
    v_net_margin_amount DECIMAL;
    v_net_margin_pct DECIMAL;
    v_roi_pct DECIMAL;
    v_break_even DECIMAL;
    v_recommendation TEXT;
BEGIN
    -- Calcular márgenes
    v_gross_margin_amount := p_sale_price - p_purchase_price - p_capex;
    v_gross_margin_pct := ROUND((v_gross_margin_amount / p_sale_price) * 100, 2);

    -- Gastos adicionales = 20% de (compra + capex)
    v_additional_costs := (p_purchase_price + p_capex) * 0.20;

    v_net_margin_amount := v_gross_margin_amount - v_additional_costs;
    v_net_margin_pct := ROUND((v_net_margin_amount / p_sale_price) * 100, 2);

    -- ROI
    v_roi_pct := ROUND((v_net_margin_amount / (p_purchase_price + p_capex)) * 100, 2);

    -- Break-even
    v_break_even := p_purchase_price + p_capex + v_additional_costs;

    -- Recomendación
    IF v_net_margin_pct >= 18 THEN
        v_recommendation := 'comprar';
    ELSIF v_net_margin_pct >= 14 THEN
        v_recommendation := 'negociar';
    ELSE
        v_recommendation := 'rechazar';
    END IF;

    RETURN jsonb_build_object(
        'gross_margin_amount', v_gross_margin_amount,
        'gross_margin_percentage', v_gross_margin_pct,
        'net_margin_amount', v_net_margin_amount,
        'net_margin_percentage', v_net_margin_pct,
        'roi_percentage', v_roi_pct,
        'break_even_price', v_break_even,
        'additional_costs', v_additional_costs,
        'recommended_action', v_recommendation
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: approve_project
-- Aprobar un proyecto (solo dirección/financiero)
-- =====================================================
CREATE OR REPLACE FUNCTION approve_project(
    p_project_id UUID,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_role user_role;
BEGIN
    -- Verificar rol del usuario
    SELECT role INTO v_user_role
    FROM user_profiles
    WHERE id = p_user_id;

    IF v_user_role NOT IN ('direccion', 'financiero', 'admin') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No tienes permisos para aprobar proyectos'
        );
    END IF;

    -- Actualizar proyecto
    UPDATE projects_v2
    SET
        status = 'aprobado',
        approval_date = NOW(),
        approval_by_user_id = p_user_id,
        updated_at = NOW()
    WHERE project_id = p_project_id
    AND status = 'oportunidad';

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Proyecto no encontrado o no está en estado oportunidad'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Proyecto aprobado correctamente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: reject_project
-- Rechazar un proyecto (solo dirección/financiero)
-- =====================================================
CREATE OR REPLACE FUNCTION reject_project(
    p_project_id UUID,
    p_user_id UUID,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user_role user_role;
BEGIN
    -- Verificar rol del usuario
    SELECT role INTO v_user_role
    FROM user_profiles
    WHERE id = p_user_id;

    IF v_user_role NOT IN ('direccion', 'financiero', 'admin') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No tienes permisos para rechazar proyectos'
        );
    END IF;

    -- Verificar que se proporciona razón
    IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Debes indicar el motivo del rechazo'
        );
    END IF;

    -- Actualizar proyecto
    UPDATE projects_v2
    SET
        status = 'rechazado',
        rejection_date = NOW(),
        rejection_reason = p_reason,
        updated_at = NOW()
    WHERE project_id = p_project_id
    AND status = 'oportunidad';

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Proyecto no encontrado o no está en estado oportunidad'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Proyecto rechazado correctamente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: get_dashboard_stats
-- Estadísticas para el dashboard
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
    v_total_opportunities INTEGER;
    v_pending_approval INTEGER;
    v_approved_this_month INTEGER;
    v_rejected_this_month INTEGER;
    v_total_investment DECIMAL;
BEGIN
    SELECT COUNT(*) INTO v_total_opportunities
    FROM projects_v2;

    SELECT COUNT(*) INTO v_pending_approval
    FROM projects_v2
    WHERE status = 'oportunidad';

    SELECT COUNT(*) INTO v_approved_this_month
    FROM projects_v2
    WHERE status = 'aprobado'
    AND approval_date >= DATE_TRUNC('month', NOW());

    SELECT COUNT(*) INTO v_rejected_this_month
    FROM projects_v2
    WHERE status = 'rechazado'
    AND rejection_date >= DATE_TRUNC('month', NOW());

    SELECT COALESCE(SUM(purchase_price + COALESCE(estimated_renovation_cost, 0)), 0)
    INTO v_total_investment
    FROM projects_v2
    WHERE status IN ('aprobado', 'en_ejecucion', 'en_venta');

    RETURN jsonb_build_object(
        'total_opportunities', v_total_opportunities,
        'pending_approval', v_pending_approval,
        'approved_this_month', v_approved_this_month,
        'rejected_this_month', v_rejected_this_month,
        'total_investment', v_total_investment
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON FUNCTION calculate_capex_estimate IS 'Calcula CAPEX estimado según m2 y tipo de reforma';
COMMENT ON FUNCTION calculate_project_metrics IS 'Calcula métricas financieras: márgenes, ROI, break-even';
COMMENT ON FUNCTION approve_project IS 'Aprueba un proyecto - solo dirección/financiero/admin';
COMMENT ON FUNCTION reject_project IS 'Rechaza un proyecto con motivo - solo dirección/financiero/admin';
COMMENT ON FUNCTION get_dashboard_stats IS 'Devuelve estadísticas para el dashboard';

// =====================================================
// SPRINT 1: Tipos TypeScript
// Esquema actualizado para projects_v2 y calculator_snapshots
// =====================================================

// ENUMs
export type UserRole =
  | 'comercial'
  | 'project_manager'
  | 'financiero'
  | 'diseno'
  | 'direccion'
  | 'legal'
  | 'marketing'
  | 'rrhh'
  | 'admin'

export type ProjectStatus =
  | 'oportunidad'           // Presentado al CI, pendiente de decisión
  | 'rechazado_ci'          // CI rechaza la oportunidad
  | 'oferta_autorizada'     // CI aprueba, se puede presentar oferta
  | 'oferta_presentada'     // Oferta enviada al vendedor
  | 'oferta_rechazada'      // Vendedor rechazó la oferta
  | 'oferta_aceptada'       // Vendedor aceptó → Proyecto creado
  | 'en_ejecucion'          // Proyecto en obras
  | 'en_venta'              // En comercialización
  | 'vendido'               // Cerrado

export type RenovationType = 'basica' | 'media' | 'integral' | 'lujo'

export type RecommendedAction = 'comprar' | 'negociar' | 'rechazar'

export type BudgetType = 'estimado_calculadora' | 'proveedor_cotizacion' | 'aprobado'

export type BudgetStatus = 'borrador' | 'enviado_a_proveedor' | 'recibido' | 'aprobado' | 'rechazado'

export type ItemCategory =
  | 'demolicion'
  | 'albanileria'
  | 'fontaneria'
  | 'electricidad'
  | 'carpinteria'
  | 'pintura'
  | 'marmoles'
  | 'climatizacion'
  | 'equipamiento'
  | 'otros'

export type UnitOfMeasure = 'm2' | 'm3' | 'ml' | 'ud' | 'pa'

// =====================================================
// User Profile
// =====================================================
export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// =====================================================
// Project (v2)
// =====================================================
export interface Project {
  project_id: string
  project_code: string | null
  status: ProjectStatus

  // Datos del inmueble
  property_address: string
  property_city: string
  property_district: string | null
  property_postal_code: string | null
  property_size_m2: number | null
  property_bedrooms: number | null
  property_bathrooms: number | null
  property_current_condition: string | null

  // Datos financieros
  purchase_price: number | null
  estimated_sale_price: number | null
  estimated_renovation_cost: number | null
  actual_renovation_cost: number | null
  final_sale_price: number | null

  // Márgenes calculados
  gross_margin_amount: number | null
  gross_margin_percentage: number | null
  net_margin_amount: number | null
  net_margin_percentage: number | null
  roi_percentage: number | null

  // Tipo de reforma
  renovation_type: RenovationType
  target_completion_months: number

  // Asignaciones
  commercial_user_id: string | null
  assigned_pm_user_id: string | null
  assigned_designer_user_id: string | null

  // Fechas clave
  approval_date: string | null
  approval_by_user_id: string | null
  rejection_date: string | null
  rejection_reason: string | null
  purchase_date: string | null
  renovation_start_date: string | null
  sale_date: string | null

  // Datos de la oferta
  offer_amount: number | null
  offer_date: string | null
  offer_response_date: string | null
  offer_rejection_reason: string | null

  // Metadatos
  notes: string | null
  created_at: string
  updated_at: string
  created_by_user_id: string | null
}

// Proyecto con usuario comercial
export interface ProjectWithCommercial extends Project {
  commercial?: UserProfile | null
}

// =====================================================
// Calculator Snapshot
// =====================================================
export interface CapexBreakdown {
  demolicion: number
  albanileria: number
  fontaneria: number
  electricidad: number
  carpinteria: number
  pintura: number
  marmoles: number
  climatizacion: number
  equipamiento: number
  otros: number
  total: number
  euro_por_m2: number
  renovation_type: string
}

export interface CalculatorSnapshot {
  snapshot_id: string
  project_id: string
  version_number: number
  calculation_date: string
  calculated_by_user_id: string | null

  // Inputs
  input_purchase_price: number | null
  input_estimated_sale_price: number | null
  input_property_size_m2: number | null
  input_renovation_type: RenovationType | null
  input_property_condition: string | null
  input_custom_params: Record<string, unknown> | null

  // Outputs
  output_capex_total: number | null
  output_capex_breakdown: CapexBreakdown | null
  output_gross_margin_amount: number | null
  output_gross_margin_percentage: number | null
  output_net_margin_amount: number | null
  output_net_margin_percentage: number | null
  output_roi_percentage: number | null
  output_break_even_price: number | null
  output_recommended_action: RecommendedAction | null

  notes: string | null
}

// =====================================================
// Budget Tables
// =====================================================
export interface BudgetItemCatalog {
  catalog_item_id: string
  item_code: string
  item_category: ItemCategory
  item_name: string
  item_description: string | null
  unit_of_measure: UnitOfMeasure
  standard_unit_price: number | null
  is_active: boolean
  created_at: string
}

export interface ProjectBudget {
  budget_id: string
  project_id: string
  budget_type: BudgetType
  budget_version: number
  supplier_name: string | null
  subtotal_amount: number | null
  total_amount: number | null
  status: BudgetStatus
  created_by_user_id: string | null
  created_at: string
  updated_at: string
}

export interface BudgetLineItem {
  line_item_id: string
  budget_id: string
  catalog_item_id: string | null
  trade_group: string | null
  line_order: number
  quantity: number
  unit_price: number
  subtotal: number
  line_total: number | null
}

// =====================================================
// RPC Function Responses
// =====================================================
export interface CapexEstimateResponse {
  demolicion: number
  albanileria: number
  fontaneria: number
  electricidad: number
  carpinteria: number
  pintura: number
  marmoles: number
  climatizacion: number
  equipamiento: number
  otros: number
  total: number
  euro_por_m2: number
  renovation_type: string
}

export interface ProjectMetricsResponse {
  gross_margin_amount: number
  gross_margin_percentage: number
  net_margin_amount: number
  net_margin_percentage: number
  roi_percentage: number
  break_even_price: number
  additional_costs: number
  recommended_action: RecommendedAction
}

export interface ApproveRejectResponse {
  success: boolean
  message?: string
  error?: string
}

export interface DashboardStatsResponse {
  total_opportunities: number
  pending_approval: number
  approved_this_month: number
  rejected_this_month: number
  total_investment: number
}

// =====================================================
// Form Types
// =====================================================
export interface CalculatorFormStep1 {
  property_address: string
  property_city: string
  property_district: string
  property_postal_code: string
  property_size_m2: number
  property_bedrooms: number
  property_bathrooms: number
  property_current_condition: string
}

export interface CalculatorFormStep2 {
  purchase_price: number
  estimated_sale_price: number
  renovation_type: RenovationType
  target_completion_months: number
}

export interface CalculatorFormStep3 {
  notes: string
  custom_adjustments: Record<string, number>
}

export interface CalculatorFormData extends
  CalculatorFormStep1,
  CalculatorFormStep2,
  CalculatorFormStep3 {}

// =====================================================
// Filter and List Types
// =====================================================
export interface ProjectFilters {
  status?: ProjectStatus[]
  renovation_type?: RenovationType[]
  commercial_user_id?: string
  min_margin?: number
  max_margin?: number
  city?: string
  search?: string
}

export interface ProjectListItem {
  project_id: string
  project_code: string | null
  status: ProjectStatus
  property_address: string
  property_city: string
  property_size_m2: number | null
  purchase_price: number | null
  estimated_sale_price: number | null
  net_margin_percentage: number | null
  roi_percentage: number | null
  renovation_type: RenovationType
  created_at: string
  updated_at: string
  commercial?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

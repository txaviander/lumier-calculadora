# Plan de Implementación - Sprint 1

## Visión General

Este documento detalla el plan paso a paso para implementar el Sprint 1 de Lumier Brain (Calculadora 2.0 + Comité de Inversión).

**Duración estimada**: 25-36 horas de desarrollo
**Estrategia**: Desarrollo incremental manteniendo la calculadora actual funcional

---

## Fase 1: Base de Datos (2-3 horas)

### 1.1 Ejecutar Scripts SQL en Supabase

Ejecutar en el SQL Editor de Supabase **en este orden**:

```
1. docs/sql/01_user_profiles.sql
2. docs/sql/02_projects_v2.sql
3. docs/sql/03_calculator_snapshots.sql
4. docs/sql/04_budgets.sql
5. docs/sql/05_rpc_functions.sql
```

### 1.2 Verificar Creación

Después de ejecutar cada script, verificar:

```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_profiles', 'projects_v2', 'calculator_snapshots',
                   'project_budgets', 'budget_items_catalog', 'budget_line_items');

-- Verificar funciones RPC
SELECT proname FROM pg_proc
WHERE proname IN ('calculate_capex_estimate', 'calculate_project_metrics',
                  'approve_project', 'reject_project', 'get_dashboard_stats');

-- Verificar tipos ENUM
SELECT typname FROM pg_type
WHERE typname IN ('user_role', 'project_status', 'renovation_type',
                  'recommended_action', 'budget_type', 'budget_status', 'item_category');
```

### 1.3 Probar Funciones RPC

```sql
-- Test calculate_capex_estimate
SELECT calculate_capex_estimate(150, 'integral');

-- Test calculate_project_metrics
SELECT calculate_project_metrics(800000, 1200000, 150000);
```

**Resultado esperado**: JSONs con los cálculos correctos.

---

## Fase 2: Tipos TypeScript (1-2 horas)

### 2.1 Crear archivo de tipos

Crear `lib/types/sprint1.ts`:

```typescript
// Tipos base
export type UserRole =
  | 'comercial'
  | 'project_manager'
  | 'financiero'
  | 'diseno'
  | 'direccion'
  | 'legal'
  | 'marketing'
  | 'rrhh'
  | 'admin';

export type ProjectStatus =
  | 'oportunidad'
  | 'aprobado'
  | 'en_ejecucion'
  | 'en_venta'
  | 'vendido'
  | 'rechazado';

export type RenovationType = 'basica' | 'media' | 'integral' | 'lujo';

export type RecommendedAction = 'comprar' | 'negociar' | 'rechazar';

// Interfaces
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectV2 {
  project_id: string;
  project_code: string;
  status: ProjectStatus;

  // Datos del inmueble
  property_address: string;
  property_city: string;
  property_district: string | null;
  property_postal_code: string | null;
  property_size_m2: number | null;
  property_bedrooms: number | null;
  property_bathrooms: number | null;
  property_current_condition: string | null;

  // Datos financieros
  purchase_price: number | null;
  estimated_sale_price: number | null;
  estimated_renovation_cost: number | null;
  actual_renovation_cost: number | null;
  final_sale_price: number | null;

  // Márgenes
  gross_margin_amount: number | null;
  gross_margin_percentage: number | null;
  net_margin_amount: number | null;
  net_margin_percentage: number | null;
  roi_percentage: number | null;

  // Reforma
  renovation_type: RenovationType;
  target_completion_months: number;

  // Asignaciones
  commercial_user_id: string | null;
  assigned_pm_user_id: string | null;
  assigned_designer_user_id: string | null;

  // Fechas
  approval_date: string | null;
  approval_by_user_id: string | null;
  rejection_date: string | null;
  rejection_reason: string | null;
  purchase_date: string | null;
  renovation_start_date: string | null;
  sale_date: string | null;

  // Meta
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
}

export interface CalculatorSnapshot {
  snapshot_id: string;
  project_id: string;
  version_number: number;
  calculation_date: string;
  calculated_by_user_id: string | null;

  // Inputs
  input_purchase_price: number | null;
  input_estimated_sale_price: number | null;
  input_property_size_m2: number | null;
  input_renovation_type: RenovationType | null;
  input_property_condition: string | null;
  input_custom_params: Record<string, unknown> | null;

  // Outputs
  output_capex_total: number | null;
  output_capex_breakdown: CapexBreakdown | null;
  output_gross_margin_amount: number | null;
  output_gross_margin_percentage: number | null;
  output_net_margin_amount: number | null;
  output_net_margin_percentage: number | null;
  output_roi_percentage: number | null;
  output_break_even_price: number | null;
  output_recommended_action: RecommendedAction | null;

  notes: string | null;
}

export interface CapexBreakdown {
  demolicion: number;
  albanileria: number;
  fontaneria: number;
  electricidad: number;
  carpinteria: number;
  pintura: number;
  marmoles: number;
  climatizacion: number;
  equipamiento: number;
  otros: number;
  total: number;
  euro_por_m2: number;
  renovation_type: string;
}

export interface ProjectMetrics {
  gross_margin_amount: number;
  gross_margin_percentage: number;
  net_margin_amount: number;
  net_margin_percentage: number;
  roi_percentage: number;
  break_even_price: number;
  additional_costs: number;
  recommended_action: RecommendedAction;
}

export interface DashboardStats {
  total_opportunities: number;
  pending_approval: number;
  approved_this_month: number;
  rejected_this_month: number;
  total_investment: number;
}

// Wizard form data
export interface WizardStep1Data {
  property_address: string;
  property_district: string;
  property_postal_code: string;
  property_size_m2: number;
  property_bedrooms: number;
  property_bathrooms: number;
  property_current_condition: string;
}

export interface WizardStep2Data {
  purchase_price: number;
  estimated_sale_price: number;
  renovation_type: RenovationType;
}

export interface WizardFormData extends WizardStep1Data, WizardStep2Data {}
```

### 2.2 Actualizar lib/supabase.ts

Añadir funciones para Sprint 1:

```typescript
// Importar tipos
import type {
  UserProfile,
  ProjectV2,
  CalculatorSnapshot,
  CapexBreakdown,
  ProjectMetrics,
  DashboardStats
} from './types/sprint1';

// === USER PROFILES ===
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function getUsersByRole(role: UserRole): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('role', role)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

// === PROJECTS V2 ===
export async function getProjectsV2(status?: ProjectStatus): Promise<ProjectV2[]> {
  let query = supabase.from('projects_v2').select('*').order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getProjectV2ById(projectId: string): Promise<ProjectV2 | null> {
  const { data, error } = await supabase
    .from('projects_v2')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (error) throw error;
  return data;
}

export async function createProjectV2(project: Partial<ProjectV2>): Promise<ProjectV2> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('projects_v2')
    .insert({
      ...project,
      created_by_user_id: user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProjectV2(
  projectId: string,
  updates: Partial<ProjectV2>
): Promise<ProjectV2> {
  const { data, error } = await supabase
    .from('projects_v2')
    .update(updates)
    .eq('project_id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// === RPC FUNCTIONS ===
export async function calculateCapexEstimate(
  sizeM2: number,
  renovationType: RenovationType
): Promise<CapexBreakdown> {
  const { data, error } = await supabase.rpc('calculate_capex_estimate', {
    p_size_m2: sizeM2,
    p_renovation_type: renovationType
  });

  if (error) throw error;
  return data;
}

export async function calculateProjectMetrics(
  purchasePrice: number,
  salePrice: number,
  capex: number
): Promise<ProjectMetrics> {
  const { data, error } = await supabase.rpc('calculate_project_metrics', {
    p_purchase_price: purchasePrice,
    p_sale_price: salePrice,
    p_capex: capex
  });

  if (error) throw error;
  return data;
}

export async function approveProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase.rpc('approve_project', {
    p_project_id: projectId,
    p_user_id: user.id
  });

  if (error) throw error;
  return data;
}

export async function rejectProject(
  projectId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase.rpc('reject_project', {
    p_project_id: projectId,
    p_user_id: user.id,
    p_reason: reason
  });

  if (error) throw error;
  return data;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_dashboard_stats');

  if (error) throw error;
  return data;
}

// === CALCULATOR SNAPSHOTS ===
export async function createSnapshot(
  projectId: string,
  inputs: Partial<CalculatorSnapshot>,
  outputs: Partial<CalculatorSnapshot>
): Promise<CalculatorSnapshot> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('calculator_snapshots')
    .insert({
      project_id: projectId,
      calculated_by_user_id: user?.id,
      ...inputs,
      ...outputs
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProjectSnapshots(projectId: string): Promise<CalculatorSnapshot[]> {
  const { data, error } = await supabase
    .from('calculator_snapshots')
    .select('*')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false });

  if (error) throw error;
  return data || [];
}
```

---

## Fase 3: Contexto de Usuario y Roles (2-3 horas)

### 3.1 Crear UserContext

Crear `contexts/UserContext.tsx`:

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentUserProfile } from '@/lib/supabase';
import type { UserProfile, UserRole } from '@/lib/types/sprint1';

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canApprove: boolean;
  isCommercial: boolean;
  isDirection: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const userProfile = await getCurrentUserProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!profile) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(profile.role);
  };

  const canApprove = hasRole(['direccion', 'financiero', 'admin']);
  const isCommercial = hasRole('comercial');
  const isDirection = hasRole('direccion');

  return (
    <UserContext.Provider value={{
      profile,
      loading,
      hasRole,
      canApprove,
      isCommercial,
      isDirection
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
```

### 3.2 Crear RoleGuard

Crear `components/RoleGuard.tsx`:

```typescript
'use client';

import { useUser } from '@/contexts/UserContext';
import type { UserRole } from '@/lib/types/sprint1';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { profile, loading, hasRole } = useUser();

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando...</div>;
  }

  if (!profile || !hasRole(allowedRoles)) {
    return fallback || (
      <div className="flex items-center justify-center p-8 text-gray-500">
        No tienes permisos para ver esta sección.
      </div>
    );
  }

  return <>{children}</>;
}
```

### 3.3 Actualizar app/layout.tsx

Añadir UserProvider:

```typescript
import { UserProvider } from '@/contexts/UserContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## Fase 4: Wizard de Nueva Oportunidad (6-8 horas)

### 4.1 Estructura de Archivos

```
app/
  oportunidades/
    page.tsx              # Lista de oportunidades
    nueva/
      page.tsx            # Wizard
    [id]/
      page.tsx            # Detalle
```

### 4.2 Componentes del Wizard

Crear en `components/opportunities/`:

```
WizardContainer.tsx       # Contenedor principal
WizardProgress.tsx        # Indicador de pasos
Step1PropertyData.tsx     # Paso 1: Datos inmueble
Step2FinancialData.tsx    # Paso 2: Datos financieros
Step3Results.tsx          # Paso 3: Resultados
PropertyForm.tsx          # Formulario reutilizable
FinancialForm.tsx         # Formulario reutilizable
ResultsPanel.tsx          # Panel de resultados
CapexBreakdownCard.tsx    # Desglose CAPEX
MetricsCard.tsx           # Métricas
RecommendationBadge.tsx   # Badge recomendación
```

### 4.3 Flujo del Wizard

1. **Paso 1**: Usuario ingresa datos del inmueble
   - Dirección, distrito, código postal
   - m², habitaciones, baños
   - Estado actual (descripción)

2. **Paso 2**: Usuario ingresa datos financieros
   - Precio de compra
   - Precio estimado de venta
   - Tipo de reforma (basica/media/integral/lujo)
   - → Llamada a `calculate_capex_estimate`

3. **Paso 3**: Mostrar resultados
   - CAPEX desglosado
   - Márgenes (bruto, neto)
   - ROI
   - Recomendación
   - → Llamada a `calculate_project_metrics`
   - Botón "Guardar Oportunidad"
   - → Crear proyecto y snapshot

---

## Fase 5: Lista de Oportunidades (3-4 horas)

### 5.1 Componentes

```
components/opportunities/
  OpportunityList.tsx     # Lista principal
  OpportunityCard.tsx     # Tarjeta individual
  OpportunityFilters.tsx  # Filtros
  StatusBadge.tsx         # Badge de estado
```

### 5.2 Filtros

- Por estado (oportunidad, aprobado, rechazado, etc.)
- Por distrito
- Por comercial asignado
- Por rango de fechas
- Por rango de margen

### 5.3 Ordenamiento

- Por fecha (más reciente primero)
- Por margen (mayor primero)
- Por precio

---

## Fase 6: Comité de Inversión (3-4 horas)

### 6.1 Página Principal

Crear `app/comite/page.tsx`:

- Protegida con RoleGuard (solo dirección, financiero, admin)
- Lista de proyectos en estado "oportunidad"
- Vista de tarjetas o tabla

### 6.2 Componentes

```
components/committee/
  CommitteeList.tsx       # Lista para aprobar
  CommitteeCard.tsx       # Tarjeta con acciones
  ApprovalModal.tsx       # Modal de confirmación
  RejectionModal.tsx      # Modal con motivo
```

### 6.3 Flujo de Aprobación

1. Dirección/Financiero accede a `/comite`
2. Ve lista de proyectos pendientes
3. Click en "Aprobar" → Modal confirmación → `approve_project`
4. Click en "Rechazar" → Modal con textarea para motivo → `reject_project`

---

## Fase 7: Integración y Testing (4-6 horas)

### 7.1 Testing Manual

- [ ] Crear nuevo usuario → verificar perfil creado
- [ ] Flujo wizard completo → proyecto guardado
- [ ] Lista de oportunidades → filtros funcionan
- [ ] Aprobación → estado cambia
- [ ] Rechazo → motivo guardado

### 7.2 Testing de RPC

```sql
-- Verificar cálculos
SELECT calculate_capex_estimate(100, 'integral');
-- Debe retornar total ~100000€ (100m² × 1000€/m²)

SELECT calculate_project_metrics(500000, 800000, 100000);
-- Verificar márgenes y recomendación
```

### 7.3 Testing de Permisos

- [ ] Usuario comercial NO puede aprobar
- [ ] Usuario dirección SÍ puede aprobar
- [ ] RLS funciona correctamente

---

## Fase 8: Responsive y UX (2-3 horas)

### 8.1 Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### 8.2 Mejoras Mobile

- Wizard en pantalla completa
- Cards apiladas verticalmente
- Sidebar colapsada por defecto
- Botones táctiles grandes

---

## Checklist Final

### Base de Datos
- [ ] Tablas creadas
- [ ] ENUMs creados
- [ ] Funciones RPC funcionando
- [ ] RLS configurado
- [ ] Triggers activos

### Frontend
- [ ] Tipos TypeScript definidos
- [ ] Funciones Supabase actualizadas
- [ ] UserContext implementado
- [ ] RoleGuard funcionando

### Páginas
- [ ] /oportunidades lista
- [ ] /oportunidades/nueva wizard
- [ ] /oportunidades/[id] detalle
- [ ] /comite aprobaciones

### Funcionalidad
- [ ] Crear oportunidad
- [ ] Calcular CAPEX
- [ ] Calcular métricas
- [ ] Guardar snapshot
- [ ] Aprobar proyecto
- [ ] Rechazar proyecto
- [ ] Ver histórico

### UX
- [ ] Responsive mobile
- [ ] Loading states
- [ ] Error handling
- [ ] Mensajes de éxito

---

## Orden de Ejecución Recomendado

```
Día 1 (6-8h):
  1. ✅ Fase 1: Base de datos
  2. ✅ Fase 2: Tipos TypeScript
  3. ✅ Fase 3: Contexto de usuario

Día 2 (6-8h):
  4. Fase 4: Wizard (inicio)

Día 3 (6-8h):
  5. Fase 4: Wizard (completar)
  6. Fase 5: Lista oportunidades

Día 4 (4-6h):
  7. Fase 6: Comité de inversión

Día 5 (4-6h):
  8. Fase 7: Testing
  9. Fase 8: Responsive
```

---

## Notas Importantes

1. **No tocar calculadora actual**: El nuevo desarrollo va en rutas separadas (`/oportunidades`, `/comite`)

2. **Orden de SQL**: Los scripts deben ejecutarse en orden numérico por las dependencias entre tablas

3. **Testing de RPC**: Siempre probar las funciones RPC en el SQL Editor antes de integrar

4. **Commits frecuentes**: Hacer commits después de cada fase completada

5. **Revisar RLS**: Las políticas de seguridad son críticas, probar con diferentes usuarios

---

## Recursos

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase RPC Docs](https://supabase.com/docs/guides/database/functions)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)

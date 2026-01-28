# Contexto del Proyecto - Lumier Brain

> **Última actualización:** 28 de Enero de 2026
> **Versión del contexto:** 1.0

## Objetivo del Proyecto

**Lumier Brain** es la plataforma interna de gestión para Lumier, una promotora inmobiliaria de lujo en Madrid. El objetivo principal es digitalizar y automatizar los procesos de:

1. **Evaluación de oportunidades de inversión** - Calculadora que replica las fórmulas del Excel existente
2. **Flujo de aprobación del Comité de Inversión** - Aprobar/rechazar oportunidades
3. **Gestión de usuarios y roles** - Comerciales, PM, Financiero, Dirección, etc.
4. **Control económico de obra** (Sprint 2 - futuro)

### Métricas de Negocio Lumier
- Facturación: ~30M€/año
- Proyectos anuales: ~15 rehabilitaciones
- Objetivo margen bruto: 60%
- Objetivo margen neto: 20%

## Arquitectura Técnica Actual

### Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 14.0.4 | Framework React con App Router |
| TypeScript | 5.3.x | Tipado estático |
| React | 18.2.x | UI library |
| Tailwind CSS | 3.3.6 | Estilos |
| Supabase | 2.39.x | Backend (PostgreSQL + Auth + Storage) |
| Vercel | - | Deployment |
| Lucide React | 0.263.1 | Iconos |
| Jest | 30.x | Testing |

### Estructura de Carpetas Clave

```
lumier-calculadora/
├── app/                          # Next.js App Router
│   ├── calculadora/              # Módulo calculadora
│   │   ├── page.tsx              # Lista de proyectos (usa tabla `projects`)
│   │   ├── [projectSlug]/        # Detalle de proyecto existente
│   │   └── nueva/page.tsx        # Wizard nueva oportunidad
│   ├── comite-inversion/         # Comité de inversión
│   ├── usuarios/                 # Gestión de usuarios
│   ├── perfil/                   # Perfil de usuario
│   └── auth/callback/            # OAuth callback
│
├── components/
│   ├── calculator/               # Componentes de calculadora
│   │   ├── KeyMetrics.tsx        # KPIs principales
│   │   ├── ProfitLossSummary.tsx # P&L resumen
│   │   ├── SensitivityMatrix.tsx # Matriz de sensibilidad
│   │   ├── RenovationModule.tsx  # Módulo de reforma
│   │   ├── SubmitToCIModal.tsx   # Modal presentar al CI
│   │   └── wizard/               # Wizard 3 pasos
│   │       ├── CalculatorWizard.tsx
│   │       ├── Step1Property.tsx
│   │       ├── Step2Financial.tsx
│   │       └── Step3Summary.tsx
│   ├── dashboard/                # Layout y navegación
│   ├── investment-committee/     # Componentes del CI
│   └── users/                    # Gestión usuarios
│
├── hooks/                        # React Hooks personalizados
│   ├── useCalculator.ts          # Lógica de cálculo (CAPEX, métricas)
│   ├── useProjects.ts            # CRUD proyectos (usa projects_v2)
│   ├── useUserProfile.ts         # Perfil del usuario actual
│   └── useUsers.ts               # Gestión de usuarios
│
├── lib/
│   ├── supabase.ts               # Cliente Supabase + funciones CRUD
│   ├── types.ts                  # Interfaces TypeScript (Sprint 1)
│   ├── auth.ts                   # Helpers de autenticación
│   └── utils.ts                  # Utilidades (cn, formatters)
│
├── docs/                         # Documentación del proyecto
│   ├── PROJECT_CONTEXT.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── GAP_ANALYSIS.md
│   └── sql/                      # Scripts SQL
│
└── __tests__/                    # Tests unitarios
```

## Arquitectura de Base de Datos

### IMPORTANTE: Dos Sistemas Coexistentes

El proyecto tiene **DOS sistemas de datos diferentes** que NO están sincronizados:

#### Sistema ANTIGUO (lib/supabase.ts)
- **Tablas**: `projects` + `project_versions`
- **Usado por**: Lista de calculadora (`/calculadora/page.tsx`)
- **Estructura**: Datos en JSONB dentro de `project_versions.data`
- **Campos clave**: `CalculatorData` con propiedades como `precioCompra`, `precioVenta`, `m2Construidos`, `calidad` (1-5 estrellas)

#### Sistema NUEVO (lib/types.ts)
- **Tablas**: `projects_v2` + `calculator_snapshots` + `user_profiles`
- **Usado por**: Wizard (`/calculadora/nueva`), hooks `useProjects`
- **Estructura**: Tablas normalizadas con campos específicos
- **Campos clave**: `property_address`, `purchase_price`, `renovation_type` (basica/media/integral/lujo)

> **DECISIÓN CRÍTICA**: Intentar unificar estos sistemas causó múltiples errores en la sesión del 28/01/2026. Ver `.claude/decisions.md` para detalles.

### Funciones RPC en Supabase

| Función | Propósito |
|---------|-----------|
| `calculate_capex_estimate` | Calcula CAPEX por m² y tipo reforma |
| `calculate_project_metrics` | Márgenes, ROI, break-even |
| `approve_project` | Aprobar oportunidad (solo CI) |
| `reject_project` | Rechazar oportunidad con motivo |
| `get_dashboard_stats` | Estadísticas para dashboard |
| `generate_project_code` | Genera códigos LUM-2025-XXX |

## Flujos de Usuario Principales

### 1. Calculadora (Sistema Antiguo)
```
/calculadora → Lista proyectos (tabla `projects`)
    ↓
/calculadora/[projectSlug] → Detalle con cálculos
    ↓
Editar valores → Recálculo automático → Guardar versión
```

### 2. Nueva Oportunidad (Sistema Nuevo)
```
/calculadora/nueva → Wizard
    ↓
Step 1: Datos inmueble (dirección, m², habitaciones)
    ↓
Step 2: Datos financieros (precio compra, venta, tipo reforma)
    ↓
Step 3: Resumen + Guardar → Crea en `projects_v2`
```

### 3. Comité de Inversión
```
/comite-inversion → Lista oportunidades pendientes
    ↓
Ver detalles → Aprobar / Rechazar
    ↓
Notificación al comercial
```

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `comercial` | Crear oportunidades, ver sus proyectos |
| `project_manager` | Gestionar proyectos asignados |
| `financiero` | Ver todos, aprobar en CI |
| `direccion` | Todo, aprobar/rechazar en CI |
| `diseno` | Ver proyectos asignados |
| `admin` | Gestión completa de usuarios |

## Información del Owner

- **Nombre**: Javi (Javier Andrés)
- **Email**: javier@lumier.es
- **Rol**: Director en Lumier
- **Perfil técnico**: No técnico pero interesado en aprender
- **Contexto personal**: 45 años, Madrid, casado con Mónica (arquitecta), 2 hijos

## Convenciones de Código

### Nomenclatura
- Componentes: PascalCase (`KeyMetrics.tsx`)
- Hooks: camelCase con prefijo `use` (`useCalculator.ts`)
- Tipos/Interfaces: PascalCase (`ProjectWithMetrics`)
- Variables CSS: Tailwind classes

### Estructura de Componentes
```tsx
'use client'  // Si usa hooks de React

import { ... } from 'react'
import { ... } from '@/lib/...'
import type { ... } from '@/lib/types'

interface ComponentProps {
  // Props tipadas
}

export function Component({ ... }: ComponentProps) {
  // Hooks primero
  // Luego handlers
  // Luego render
}
```

### Patrones de Estado
- `useState` para estado local
- `useCallback` para handlers memoizados
- `useMemo` para cálculos derivados
- NO usar `useEffect` para fetch inicial (usar patterns de Next.js)

## Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## URLs y Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Redirect a dashboard |
| `/calculadora` | Lista de proyectos (sistema antiguo) |
| `/calculadora/[slug]` | Detalle proyecto |
| `/calculadora/nueva` | Wizard nueva oportunidad |
| `/comite-inversion` | Comité de Inversión |
| `/usuarios` | Gestión de usuarios |
| `/perfil` | Perfil del usuario actual |

## Dependencias Críticas

- **@supabase/ssr**: Autenticación server-side
- **lucide-react**: Iconos (IMPORTANTE: versión 0.263.1 fija)
- **nanoid**: Generación de IDs únicos
- **tailwind-merge**: Merge de clases Tailwind
- **clsx**: Condicionales de clases

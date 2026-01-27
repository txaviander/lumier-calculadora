'use client'

import { useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  RenovationType,
  CalculatorSnapshot,
  CapexEstimateResponse,
  ProjectMetricsResponse,
  RecommendedAction
} from '@/lib/types'

// =====================================================
// useCapexCalculator - Cálculo de CAPEX
// =====================================================
interface UseCapexCalculatorReturn {
  calculateCapex: (sizeM2: number, renovationType: RenovationType) => Promise<CapexEstimateResponse>
  capexResult: CapexEstimateResponse | null
  loading: boolean
  error: Error | null
}

export function useCapexCalculator(): UseCapexCalculatorReturn {
  const [capexResult, setCapexResult] = useState<CapexEstimateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const calculateCapex = useCallback(async (
    sizeM2: number,
    renovationType: RenovationType
  ): Promise<CapexEstimateResponse> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase
        .rpc('calculate_capex_estimate', {
          p_size_m2: sizeM2,
          p_renovation_type: renovationType
        })

      if (rpcError) throw rpcError

      const result = data as CapexEstimateResponse
      setCapexResult(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al calcular CAPEX')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    calculateCapex,
    capexResult,
    loading,
    error
  }
}

// =====================================================
// useProjectMetrics - Cálculo de métricas
// =====================================================
interface UseProjectMetricsReturn {
  calculateMetrics: (
    purchasePrice: number,
    salePrice: number,
    capex: number
  ) => Promise<ProjectMetricsResponse>
  metricsResult: ProjectMetricsResponse | null
  loading: boolean
  error: Error | null
}

export function useProjectMetrics(): UseProjectMetricsReturn {
  const [metricsResult, setMetricsResult] = useState<ProjectMetricsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const calculateMetrics = useCallback(async (
    purchasePrice: number,
    salePrice: number,
    capex: number
  ): Promise<ProjectMetricsResponse> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase
        .rpc('calculate_project_metrics', {
          p_purchase_price: purchasePrice,
          p_sale_price: salePrice,
          p_capex: capex
        })

      if (rpcError) throw rpcError

      const result = data as ProjectMetricsResponse
      setMetricsResult(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al calcular métricas')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    calculateMetrics,
    metricsResult,
    loading,
    error
  }
}

// =====================================================
// useCalculatorSnapshots - Histórico de cálculos
// =====================================================
interface UseCalculatorSnapshotsReturn {
  snapshots: CalculatorSnapshot[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  createSnapshot: (snapshot: Omit<CalculatorSnapshot, 'snapshot_id' | 'version_number' | 'calculation_date'>) => Promise<CalculatorSnapshot>
  latestSnapshot: CalculatorSnapshot | null
}

export function useCalculatorSnapshots(projectId: string | null): UseCalculatorSnapshotsReturn {
  const [snapshots, setSnapshots] = useState<CalculatorSnapshot[]>([])
  const [loading, setLoading] = useState(!!projectId)
  const [error, setError] = useState<Error | null>(null)

  const fetchSnapshots = useCallback(async () => {
    if (!projectId) {
      setSnapshots([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('calculator_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false })

      if (queryError) throw queryError

      setSnapshots(data || [])
    } catch (err) {
      console.error('Error fetching snapshots:', err)
      setError(err instanceof Error ? err : new Error('Error al cargar snapshots'))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const createSnapshot = useCallback(async (
    snapshotData: Omit<CalculatorSnapshot, 'snapshot_id' | 'version_number' | 'calculation_date'>
  ): Promise<CalculatorSnapshot> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error: insertError } = await supabase
        .from('calculator_snapshots')
        .insert({
          ...snapshotData,
          calculated_by_user_id: user?.id
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Actualizar lista local
      setSnapshots(prev => [data, ...prev])

      return data
    } catch (err) {
      console.error('Error creating snapshot:', err)
      throw err instanceof Error ? err : new Error('Error al crear snapshot')
    }
  }, [])

  // Efecto para cargar snapshots cuando cambia el proyecto
  useState(() => {
    if (projectId) {
      fetchSnapshots()
    }
  })

  const latestSnapshot = useMemo(() => {
    return snapshots.length > 0 ? snapshots[0] : null
  }, [snapshots])

  return {
    snapshots,
    loading,
    error,
    refetch: fetchSnapshots,
    createSnapshot,
    latestSnapshot
  }
}

// =====================================================
// useFullCalculator - Calculadora completa combinada
// =====================================================
interface CalculatorState {
  // Step 1: Inmueble
  propertyAddress: string
  propertyCity: string
  propertyDistrict: string
  propertySizeM2: number
  propertyBedrooms: number
  propertyBathrooms: number
  propertyCondition: string

  // Step 2: Financiero
  purchasePrice: number
  estimatedSalePrice: number
  renovationType: RenovationType
  targetCompletionMonths: number

  // Step 3: Ajustes
  customAdjustments: Record<string, number>
  notes: string
}

interface CalculatorResults {
  capex: CapexEstimateResponse | null
  metrics: ProjectMetricsResponse | null
  recommendation: RecommendedAction | null
}

interface UseFullCalculatorReturn {
  // Estado
  state: CalculatorState
  results: CalculatorResults
  currentStep: number
  loading: boolean
  error: Error | null

  // Acciones
  updateState: (updates: Partial<CalculatorState>) => void
  setStep: (step: number) => void
  calculate: () => Promise<void>
  reset: () => void
  saveSnapshot: (projectId: string) => Promise<CalculatorSnapshot>
}

const initialState: CalculatorState = {
  propertyAddress: '',
  propertyCity: 'Madrid',
  propertyDistrict: '',
  propertySizeM2: 0,
  propertyBedrooms: 2,
  propertyBathrooms: 1,
  propertyCondition: '',
  purchasePrice: 0,
  estimatedSalePrice: 0,
  renovationType: 'integral',
  targetCompletionMonths: 8,
  customAdjustments: {},
  notes: ''
}

export function useFullCalculator(): UseFullCalculatorReturn {
  const [state, setState] = useState<CalculatorState>(initialState)
  const [results, setResults] = useState<CalculatorResults>({
    capex: null,
    metrics: null,
    recommendation: null
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { calculateCapex } = useCapexCalculator()
  const { calculateMetrics } = useProjectMetrics()

  const updateState = useCallback((updates: Partial<CalculatorState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const setStep = useCallback((step: number) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step)
    }
  }, [])

  const calculate = useCallback(async () => {
    if (!state.propertySizeM2 || !state.purchasePrice || !state.estimatedSalePrice) {
      setError(new Error('Faltan datos requeridos para el cálculo'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Calcular CAPEX
      const capexResult = await calculateCapex(state.propertySizeM2, state.renovationType)

      // 2. Aplicar ajustes personalizados
      let adjustedCapex = capexResult.total
      Object.values(state.customAdjustments).forEach(adjustment => {
        adjustedCapex += adjustment
      })

      // 3. Calcular métricas con CAPEX ajustado
      const metricsResult = await calculateMetrics(
        state.purchasePrice,
        state.estimatedSalePrice,
        adjustedCapex
      )

      setResults({
        capex: { ...capexResult, total: adjustedCapex },
        metrics: metricsResult,
        recommendation: metricsResult.recommended_action
      })
    } catch (err) {
      console.error('Error in full calculation:', err)
      setError(err instanceof Error ? err : new Error('Error en el cálculo'))
    } finally {
      setLoading(false)
    }
  }, [state, calculateCapex, calculateMetrics])

  const reset = useCallback(() => {
    setState(initialState)
    setResults({ capex: null, metrics: null, recommendation: null })
    setCurrentStep(1)
    setError(null)
  }, [])

  const saveSnapshot = useCallback(async (projectId: string): Promise<CalculatorSnapshot> => {
    if (!results.capex || !results.metrics) {
      throw new Error('No hay resultados para guardar')
    }

    const { data: { user } } = await supabase.auth.getUser()

    const snapshotData = {
      project_id: projectId,
      calculated_by_user_id: user?.id || null,

      // Inputs
      input_purchase_price: state.purchasePrice,
      input_estimated_sale_price: state.estimatedSalePrice,
      input_property_size_m2: state.propertySizeM2,
      input_renovation_type: state.renovationType,
      input_property_condition: state.propertyCondition || null,
      input_custom_params: state.customAdjustments,

      // Outputs
      output_capex_total: results.capex.total,
      output_capex_breakdown: results.capex,
      output_gross_margin_amount: results.metrics.gross_margin_amount,
      output_gross_margin_percentage: results.metrics.gross_margin_percentage,
      output_net_margin_amount: results.metrics.net_margin_amount,
      output_net_margin_percentage: results.metrics.net_margin_percentage,
      output_roi_percentage: results.metrics.roi_percentage,
      output_break_even_price: results.metrics.break_even_price,
      output_recommended_action: results.metrics.recommended_action,

      notes: state.notes || null
    }

    const { data, error: insertError } = await supabase
      .from('calculator_snapshots')
      .insert(snapshotData)
      .select()
      .single()

    if (insertError) throw insertError

    return data
  }, [state, results])

  return {
    state,
    results,
    currentStep,
    loading,
    error,
    updateState,
    setStep,
    calculate,
    reset,
    saveSnapshot
  }
}

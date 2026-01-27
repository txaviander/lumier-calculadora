"use client"

import React, { useState } from "react"
import { Hammer, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface RenovationModuleProps {
  obra: number
  calidadCoste: number
  interiorismo: number
  mobiliario: number
  arquitectura: number
  permisoConstruccion: number
  costosTenencia: number
  plusvalia: number
  extras?: number
  m2Construidos: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export function RenovationModule({
  obra,
  calidadCoste,
  interiorismo,
  mobiliario,
  arquitectura,
  permisoConstruccion,
  costosTenencia,
  plusvalia,
  extras = 0,
  m2Construidos
}: RenovationModuleProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hardCosts = obra + calidadCoste + interiorismo + mobiliario + extras
  const softCosts = arquitectura + permisoConstruccion + costosTenencia + plusvalia
  const totalReforma = hardCosts + softCosts
  const costePorM2 = Math.round(totalReforma / m2Construidos)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Hammer className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Reforma</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Reforma</p>
          <p className="text-lg font-bold tabular-nums text-rose-600">{formatCurrency(totalReforma)}</p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Hard Costs</p>
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(hardCosts)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Soft Costs</p>
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(softCosts)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Coste/m²</p>
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(costePorM2)}/m²</p>
        </div>
      </div>

      {/* Toggle Details */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" />
            Ocultar desglose
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" />
            Ver desglose detallado
          </>
        )}
      </button>

      {/* Detailed Breakdown */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {/* Hard Costs Detail */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Hard Costs
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CostItem label="Obra" value={obra} />
              <CostItem label="Materiales" value={calidadCoste} />
              <CostItem label="Interiorismo" value={interiorismo} />
              <CostItem label="Mobiliario" value={mobiliario} />
              {extras > 0 && <CostItem label="Extras" value={extras} />}
            </div>
          </div>

          {/* Soft Costs Detail */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Soft Costs
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CostItem label="Arquitectura" value={arquitectura} />
              <CostItem label="Permisos" value={permisoConstruccion} />
              <CostItem label="Tenencia" value={costosTenencia} />
              <CostItem label="Plusvalía" value={plusvalia} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CostItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-2 rounded-lg bg-muted/30">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xs font-medium tabular-nums">{formatCurrency(value)}</p>
    </div>
  )
}

"use client"

import { cn } from "@/lib/utils"
import { TrendingUp } from "lucide-react"

interface KeyMetricsProps {
  precioCompra: number
  precioVenta: number
  inversionTotal: number
  roi: number
  margen: number
  tir: number
  mesesProyecto: number
  beneficioNeto: number
  m2Totales: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + '%'
}

export function KeyMetrics({
  precioCompra,
  precioVenta,
  inversionTotal,
  roi,
  margen,
  tir,
  mesesProyecto,
  beneficioNeto,
  m2Totales
}: KeyMetricsProps) {
  const getStatusLabel = () => {
    if (margen >= 16) return "OPORTUNIDAD"
    if (margen >= 13) return "AJUSTADO"
    return "NO HACER"
  }

  const getStatusColor = () => {
    if (margen >= 16) return "bg-emerald-500"
    if (margen >= 13) return "bg-amber-500"
    return "bg-rose-500"
  }

  const getTirColor = () => {
    if (tir >= 30) return "text-emerald-600"
    if (tir >= 20) return "text-amber-600"
    return "text-foreground"
  }

  return (
    <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      {/* Mobile Layout */}
      <div className="lg:hidden space-y-4">
        {/* Fila 1: Precios principales */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Compra</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(precioCompra)}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(precioCompra / m2Totales)}/m²</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Venta</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(precioVenta)}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(precioVenta / m2Totales)}/m²</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Inversión</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(inversionTotal)}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(inversionTotal / m2Totales)}/m²</p>
          </div>
        </div>

        {/* Fila 2: KPIs de rentabilidad */}
        <div className="grid grid-cols-4 gap-3 pt-3 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">ROI</p>
            <p className="text-base font-semibold tabular-nums">{formatPercent(roi)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Margen</p>
            <p className="text-base font-semibold tabular-nums">{formatPercent(margen)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">TIR</p>
            <p className={cn("text-base font-semibold tabular-nums flex items-center justify-center gap-1", getTirColor())}>
              {formatPercent(tir)}
              {tir >= 30 && <TrendingUp className="h-3.5 w-3.5" />}
            </p>
            <p className="text-[10px] text-muted-foreground">{mesesProyecto.toFixed(1)} meses</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Beneficio</p>
            <p className={cn(
              "text-base font-bold tabular-nums",
              beneficioNeto >= 0 ? "text-emerald-600" : "text-rose-500"
            )}>
              {formatCurrency(beneficioNeto)}
            </p>
          </div>
        </div>

        {/* Fila 3: Badge de estado */}
        <div className="flex justify-center">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wide",
            getStatusColor()
          )}>
            {getStatusLabel()}
          </span>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex items-center justify-between gap-8">
        {/* Grupo izquierdo: Precios */}
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Compra</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{formatCurrency(precioCompra)}</p>
            <p className="text-sm text-muted-foreground">{formatCurrency(precioCompra / m2Totales)}/m²</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Venta</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{formatCurrency(precioVenta)}</p>
            <p className="text-sm text-muted-foreground">{formatCurrency(precioVenta / m2Totales)}/m²</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Inversión</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{formatCurrency(inversionTotal)}</p>
            <p className="text-sm text-muted-foreground">{formatCurrency(inversionTotal / m2Totales)}/m²</p>
          </div>
        </div>

        {/* Separador */}
        <div className="h-12 w-px bg-border" />

        {/* Grupo central: KPIs */}
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">ROI</p>
            <p className="text-xl font-semibold tabular-nums">{formatPercent(roi)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Margen</p>
            <p className="text-xl font-semibold tabular-nums">{formatPercent(margen)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">TIR</p>
            <p className={cn("text-xl font-semibold tabular-nums flex items-center gap-1", getTirColor())}>
              {formatPercent(tir)}
              {tir >= 30 && <TrendingUp className="h-4 w-4" />}
            </p>
            <p className="text-xs text-muted-foreground">{mesesProyecto.toFixed(1)} meses</p>
          </div>
        </div>

        {/* Grupo derecho: Beneficio y Estado */}
        <div className={cn(
          "flex items-center gap-3 rounded-xl px-5 py-3 ml-auto",
          beneficioNeto >= 0 ? "bg-emerald-50" : "bg-rose-50"
        )}>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Beneficio</p>
            <p className={cn(
              "text-2xl font-bold tabular-nums",
              beneficioNeto >= 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              {formatCurrency(beneficioNeto)}
            </p>
          </div>
          <span className={cn(
            "px-2.5 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider",
            getStatusColor()
          )}>
            {getStatusLabel()}
          </span>
        </div>
      </div>
    </div>
  )
}

"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface MetricProps {
  label: string
  value: string
  subtitle?: string
  trend?: "up" | "down" | "neutral"
}

function Metric({ label, value, subtitle, trend }: MetricProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          "text-base font-semibold tabular-nums",
          trend === "up" && "text-emerald-600",
          trend === "down" && "text-rose-500"
        )}>
          {value}
        </span>
        {trend && trend !== "neutral" && (
          trend === "up"
            ? <TrendingUp className="h-3 w-3 text-emerald-600" />
            : <TrendingDown className="h-3 w-3 text-rose-500" />
        )}
      </div>
      {subtitle && (
        <span className="text-[10px] text-muted-foreground">{subtitle}</span>
      )}
    </div>
  )
}

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
  const isViable = margen >= 13

  const getTirTrend = (): "up" | "down" | "neutral" => {
    if (tir >= 30) return "up"
    if (tir < 20) return "down"
    return "neutral"
  }

  return (
    <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Metric
            label="Compra"
            value={formatCurrency(precioCompra)}
            subtitle={`${formatCurrency(precioCompra / m2Totales)}/m²`}
          />
          <Metric
            label="Venta"
            value={formatCurrency(precioVenta)}
            subtitle={`${formatCurrency(precioVenta / m2Totales)}/m²`}
          />
          <Metric
            label="Inversión"
            value={formatCurrency(inversionTotal)}
            subtitle={`${formatCurrency(inversionTotal / m2Totales)}/m²`}
          />
          <div className="hidden sm:block h-8 w-px bg-border" />
          <Metric
            label="ROI"
            value={formatPercent(roi)}
          />
          <Metric
            label="Margen"
            value={formatPercent(margen)}
          />
          <Metric
            label="TIR"
            value={formatPercent(tir)}
            subtitle={`${mesesProyecto.toFixed(1)} meses`}
            trend={getTirTrend()}
          />
        </div>

        <div className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2",
          isViable
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700"
        )}>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">
              Beneficio
            </p>
            <p className="text-lg font-bold tabular-nums">
              {formatCurrency(beneficioNeto)}
            </p>
          </div>
          <div className={cn(
            "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            margen >= 16 ? "bg-emerald-600 text-white" :
            margen >= 13 ? "bg-amber-500 text-white" :
            "bg-rose-600 text-white"
          )}>
            {margen >= 16 ? "Viable" : margen >= 13 ? "Ajustado" : "No Hacer"}
          </div>
        </div>
      </div>
    </div>
  )
}

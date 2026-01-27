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
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className={cn(
          "text-lg font-semibold tabular-nums",
          trend === "up" && "text-emerald-600",
          trend === "down" && "text-rose-500"
        )}>
          {value}
        </span>
        {trend && trend !== "neutral" && (
          trend === "up"
            ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            : <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
        )}
      </div>
      {subtitle && (
        <span className="text-[11px] text-muted-foreground">{subtitle}</span>
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
    <div className="mt-6 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <Metric
          label="Compra"
          value={formatCurrency(precioCompra)}
          subtitle={`${formatCurrency(precioCompra / m2Totales)}/m2`}
        />
        <Metric
          label="Venta"
          value={formatCurrency(precioVenta)}
          subtitle={`${formatCurrency(precioVenta / m2Totales)}/m2`}
        />
        <Metric
          label="Inversion Total"
          value={formatCurrency(inversionTotal)}
          subtitle={`${formatCurrency(inversionTotal / m2Totales)}/m2`}
        />
        <Metric
          label="ROI"
          value={formatPercent(roi)}
          trend="neutral"
        />
        <Metric
          label="Margen"
          value={formatPercent(margen)}
          trend="neutral"
        />
        <Metric
          label="TIR Anual"
          value={formatPercent(tir)}
          subtitle={`${mesesProyecto.toFixed(1)} meses`}
          trend={getTirTrend()}
        />
      </div>

      <div className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-2.5",
        isViable
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700"
      )}>
        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide opacity-70">
            Beneficio Neto
          </p>
          <p className="text-xl font-bold tabular-nums">
            {formatCurrency(beneficioNeto)}
          </p>
        </div>
        <div className={cn(
          "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
          isViable ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
        )}>
          {margen >= 16 ? "Viable" : margen >= 13 ? "Ajustado" : "No Hacer"}
        </div>
      </div>
    </div>
  )
}

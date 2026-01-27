"use client"

import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface SensitivityMatrixProps {
  baseCompra: number
  baseVenta: number
  totalGastos: number
}

export function SensitivityMatrix({
  baseCompra,
  baseVenta,
  totalGastos
}: SensitivityMatrixProps) {
  // Validar que los valores base sean válidos
  if (!baseCompra || baseCompra <= 0 || !baseVenta || baseVenta <= 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Matriz de Sensibilidad</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Introduce precios de compra y venta válidos para ver el análisis de sensibilidad.
        </p>
      </div>
    )
  }

  // Variaciones: -10%, -5%, 0% (actual), +5%, +10%
  const variations = [-10, -5, 0, 5, 10]

  // Generar precios de compra (filas) - filtrar valores <= 0
  const compraVariations = variations
    .map(pct => ({
      pct,
      value: Math.round(baseCompra * (1 + pct / 100))
    }))
    .filter(item => item.value > 0)

  // Generar precios de venta (columnas) - filtrar valores <= 0
  const ventaVariations = variations
    .map(pct => ({
      pct,
      value: Math.round(baseVenta * (1 + pct / 100))
    }))
    .filter(item => item.value > 0)

  // Calcular margen para cada combinación
  const calculateMargin = (compra: number, venta: number) => {
    if (venta <= 0) return -999 // Valor inválido
    const totalInversion = compra + totalGastos
    const beneficio = venta - totalInversion
    const margen = (beneficio / venta) * 100
    // Limitar a rangos razonables para evitar valores absurdos
    if (margen < -100 || margen > 100 || !isFinite(margen)) {
      return margen < 0 ? -100 : 100
    }
    return margen
  }

  // Colores más neutros basados en el margen
  const getMarginStyle = (margen: number, isCurrentScenario: boolean) => {
    let bgColor = ""
    let textColor = "text-gray-700"

    if (margen >= 16) {
      bgColor = "bg-emerald-100"
      textColor = "text-emerald-800"
    } else if (margen >= 13) {
      bgColor = "bg-emerald-50"
      textColor = "text-emerald-700"
    } else if (margen >= 10) {
      bgColor = "bg-lime-50"
      textColor = "text-lime-700"
    } else if (margen >= 5) {
      bgColor = "bg-amber-50"
      textColor = "text-amber-700"
    } else if (margen >= 0) {
      bgColor = "bg-orange-50"
      textColor = "text-orange-700"
    } else {
      bgColor = "bg-red-50"
      textColor = "text-red-700"
    }

    return { bgColor, textColor }
  }

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toLocaleString("es-ES", { maximumFractionDigits: 2 }) + "M"
    }
    return (value / 1000).toLocaleString("es-ES", { maximumFractionDigits: 0 }) + "k"
  }

  const formatPct = (pct: number) => {
    if (pct === 0) return "Actual"
    return (pct > 0 ? "+" : "") + pct + "%"
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Matriz de Sensibilidad</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Margen según precio de compra y venta
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2 text-[10px] uppercase tracking-wider text-muted-foreground text-left">
                <div className="flex flex-col leading-tight">
                  <span>Compra ↓</span>
                  <span>Venta →</span>
                </div>
              </th>
              {ventaVariations.map(({ pct, value }) => (
                <th
                  key={value}
                  className={cn(
                    "p-2 text-center min-w-[80px]",
                    pct === 0 && "bg-muted/30"
                  )}
                >
                  <div className="text-[10px] text-muted-foreground">{formatPct(pct)}</div>
                  <div className="text-xs font-medium">{formatPrice(value)} €</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compraVariations.map(({ pct: compraPct, value: compra }) => (
              <tr key={compra}>
                <td
                  className={cn(
                    "p-2 text-left",
                    compraPct === 0 && "bg-muted/30"
                  )}
                >
                  <div className="text-[10px] text-muted-foreground">{formatPct(compraPct)}</div>
                  <div className="text-xs font-medium">{formatPrice(compra)} €</div>
                </td>
                {ventaVariations.map(({ pct: ventaPct, value: venta }) => {
                  const margen = calculateMargin(compra, venta)
                  const isCurrentScenario = compraPct === 0 && ventaPct === 0
                  const { bgColor, textColor } = getMarginStyle(margen, isCurrentScenario)

                  return (
                    <td
                      key={`${compra}-${venta}`}
                      className={cn(
                        "p-2 text-center",
                        bgColor,
                        isCurrentScenario && "ring-2 ring-inset ring-gray-800"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-semibold tabular-nums",
                        textColor
                      )}>
                        {margen.toFixed(1)}%
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda simplificada */}
      <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-3 text-[10px]">
        <span className="text-muted-foreground font-medium">Leyenda:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
          <span className="text-muted-foreground">≥16% Viable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-100" />
          <span className="text-muted-foreground">13-16% Ajustado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-50 border border-amber-100" />
          <span className="text-muted-foreground">5-13%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-100" />
          <span className="text-muted-foreground">&lt;5% Riesgo</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-3 h-3 rounded bg-white ring-2 ring-inset ring-gray-800" />
          <span className="text-muted-foreground">Escenario actual</span>
        </div>
      </div>
    </div>
  )
}

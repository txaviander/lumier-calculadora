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
  // Generate price variations
  const compraVariations = [-10, -5, 0, 5, 10].map(pct =>
    Math.round(baseCompra * (1 + pct / 100))
  )

  const ventaVariations = [15, 10, 5, 0, -5, -10].map(pct =>
    Math.round(baseVenta * (1 + pct / 100))
  )

  // Calculate margin for each combination
  const calculateMargin = (compra: number, venta: number) => {
    const totalInversion = compra + totalGastos
    const beneficio = venta - totalInversion
    const margen = (beneficio / totalInversion) * 100
    return { beneficio, margen }
  }

  // Get color based on margin
  const getMarginColor = (margen: number) => {
    if (margen >= 15) return "bg-emerald-500 text-white"
    if (margen >= 10) return "bg-emerald-400 text-white"
    if (margen >= 5) return "bg-emerald-300 text-emerald-900"
    if (margen >= 0) return "bg-amber-200 text-amber-900"
    if (margen >= -5) return "bg-orange-300 text-orange-900"
    if (margen >= -10) return "bg-rose-400 text-white"
    return "bg-rose-600 text-white"
  }

  // Check if this is the base case
  const isBaseCase = (compra: number, venta: number) => {
    return compra === baseCompra && venta === baseVenta
  }

  const formatPrice = (value: number) => {
    return (value / 1000).toLocaleString("es-ES") + "k EUR"
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Analisis de Sensibilidad</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Margen segun precio de compra y venta
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-[10px] uppercase tracking-wider text-muted-foreground text-left border-b border-border">
                <div className="flex flex-col">
                  <span>Venta &rarr;</span>
                  <span>Compra &darr;</span>
                </div>
              </th>
              {ventaVariations.map((venta) => (
                <th
                  key={venta}
                  className={cn(
                    "p-2 text-xs font-medium text-center border-b border-border min-w-[90px]",
                    venta === baseVenta && "bg-muted/50"
                  )}
                >
                  {formatPrice(venta)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compraVariations.map((compra) => (
              <tr key={compra}>
                <td
                  className={cn(
                    "p-2 text-xs font-medium border-b border-border",
                    compra === baseCompra && "bg-muted/50"
                  )}
                >
                  {formatPrice(compra)}
                </td>
                {ventaVariations.map((venta) => {
                  const { margen } = calculateMargin(compra, venta)
                  const isBase = isBaseCase(compra, venta)

                  return (
                    <td
                      key={`${compra}-${venta}`}
                      className={cn(
                        "p-2 text-center border-b border-border transition-all",
                        getMarginColor(margen),
                        isBase && "ring-2 ring-foreground ring-offset-1"
                      )}
                    >
                      <span className="text-sm font-semibold tabular-nums">
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

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-4">
        <span className="text-xs text-muted-foreground">Leyenda:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-xs text-muted-foreground">{">=15%"}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-400" />
          <span className="text-xs text-muted-foreground">10-15%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-300" />
          <span className="text-xs text-muted-foreground">5-10%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-amber-200" />
          <span className="text-xs text-muted-foreground">0-5%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-orange-300" />
          <span className="text-xs text-muted-foreground">-5-0%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-rose-600" />
          <span className="text-xs text-muted-foreground">{"<-10%"}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-4 h-4 rounded ring-2 ring-foreground ring-offset-1 bg-muted" />
          <span className="text-xs text-muted-foreground">Escenario actual</span>
        </div>
      </div>
    </div>
  )
}

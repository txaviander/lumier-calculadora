"use client"

import { cn } from "@/lib/utils"
import { Receipt, ArrowRight } from "lucide-react"

interface LineItemProps {
  label: string
  value: string
  indent?: boolean
  bold?: boolean
  highlight?: "blue" | "green" | "red"
}

function LineItem({ label, value, indent, bold, highlight }: LineItemProps) {
  return (
    <div className={cn(
      "flex items-center justify-between py-1.5",
      indent && "pl-4"
    )}>
      <span className={cn(
        "text-sm",
        indent ? "text-muted-foreground" : "font-medium",
        bold && "font-semibold"
      )}>
        {label}
      </span>
      <span className={cn(
        "text-sm tabular-nums",
        bold && "font-semibold",
        highlight === "blue" && "text-blue-600 font-semibold",
        highlight === "green" && "text-emerald-600 font-semibold",
        highlight === "red" && "text-rose-500 font-semibold"
      )}>
        {value}
      </span>
    </div>
  )
}

interface ProfitLossSummaryProps {
  precioCompra: number
  honorarioCompra: number
  inscripcionEscritura: number
  itp: number
  totalAdquisicion: number
  hardCosts: number
  softCosts: number
  totalGastos: number
  precioVenta: number
  honorariosVenta: number
  ventaNeta: number
  beneficioNeto: number
  inversionTotal: number
  margen: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export function ProfitLossSummary({
  precioCompra,
  honorarioCompra,
  inscripcionEscritura,
  itp,
  totalAdquisicion,
  hardCosts,
  softCosts,
  totalGastos,
  precioVenta,
  honorariosVenta,
  ventaNeta,
  beneficioNeto,
  inversionTotal,
  margen
}: ProfitLossSummaryProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Resumen P&L</h3>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Adquisicion */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 pb-2 border-b border-border">
            Adquisicion
          </p>
          <div className="space-y-0">
            <LineItem label="Compra piso" value={formatCurrency(precioCompra)} />
            <LineItem label="Honorarios compra" value={formatCurrency(honorarioCompra)} indent />
            <LineItem label="Inscripcion escritura" value={formatCurrency(inscripcionEscritura)} indent />
            <LineItem label="ITP (2%)" value={formatCurrency(itp)} indent />
          </div>
          <div className="mt-3 pt-2 border-t border-border">
            <LineItem label="Total Adquisicion" value={formatCurrency(totalAdquisicion)} highlight="blue" bold />
          </div>
        </div>

        {/* Gastos */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 pb-2 border-b border-border">
            Inversion Reforma
          </p>
          <div className="space-y-0">
            <LineItem label="Hard Costs" value={formatCurrency(hardCosts)} />
            <LineItem label="Soft Costs" value={formatCurrency(softCosts)} />
          </div>
          <div className="mt-3 pt-2 border-t border-border">
            <LineItem label="Total Gastos" value={formatCurrency(totalGastos)} highlight="red" bold />
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Inversion Total</span>
              <span className="font-bold tabular-nums">{formatCurrency(inversionTotal)}</span>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 pb-2 border-b border-border">
            Resultado Venta
          </p>
          <div className="space-y-0">
            <LineItem label="Precio venta" value={formatCurrency(precioVenta)} />
            <LineItem label="Comision venta" value={`-${formatCurrency(honorariosVenta)}`} indent />
            <LineItem label="Venta neta" value={formatCurrency(ventaNeta)} />
          </div>
          <div className="mt-3 pt-2 border-t border-border">
            <LineItem label="Beneficio Neto" value={formatCurrency(beneficioNeto)} highlight="green" bold />
          </div>

          <div className={cn(
            "mt-4 p-3 rounded-lg flex items-center justify-between",
            beneficioNeto >= 0 ? "bg-emerald-50" : "bg-rose-50"
          )}>
            <div className={cn(
              "flex items-center gap-2",
              beneficioNeto >= 0 ? "text-emerald-700" : "text-rose-700"
            )}>
              <ArrowRight className="h-4 w-4" />
              <span className="text-sm font-medium">Margen sobre inversion</span>
            </div>
            <span className={cn(
              "text-sm font-bold tabular-nums",
              beneficioNeto >= 0 ? "text-emerald-700" : "text-rose-700"
            )}>
              {margen.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

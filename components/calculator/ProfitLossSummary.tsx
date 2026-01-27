"use client"

import { cn } from "@/lib/utils"
import { Receipt } from "lucide-react"

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
      "flex items-center justify-between py-1",
      indent && "pl-3"
    )}>
      <span className={cn(
        "text-xs",
        indent ? "text-muted-foreground" : "text-foreground",
        bold && "font-semibold text-sm"
      )}>
        {label}
      </span>
      <span className={cn(
        "text-xs tabular-nums",
        bold && "font-semibold text-sm",
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

      {/* Adquisicion */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 pb-1 border-b border-border">
          Adquisición
        </p>
        <LineItem label="Compra piso" value={formatCurrency(precioCompra)} />
        <LineItem label="Honorarios compra" value={formatCurrency(honorarioCompra)} indent />
        <LineItem label="Inscripción escritura" value={formatCurrency(inscripcionEscritura)} indent />
        <LineItem label="ITP (2%)" value={formatCurrency(itp)} indent />
        <div className="mt-2 pt-2 border-t border-dashed border-border">
          <LineItem label="Total Adquisición" value={formatCurrency(totalAdquisicion)} highlight="blue" bold />
        </div>
      </div>

      {/* Inversion Reforma */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 pb-1 border-b border-border">
          Inversión Reforma
        </p>
        <LineItem label="Hard Costs" value={formatCurrency(hardCosts)} />
        <LineItem label="Soft Costs" value={formatCurrency(softCosts)} />
        <div className="mt-2 pt-2 border-t border-dashed border-border">
          <LineItem label="Total Gastos" value={formatCurrency(totalGastos)} highlight="red" bold />
        </div>
      </div>

      {/* Inversion Total */}
      <div className="mb-4 p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Inversión Total</span>
          <span className="text-sm font-bold tabular-nums">{formatCurrency(inversionTotal)}</span>
        </div>
      </div>

      {/* Resultado Venta */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 pb-1 border-b border-border">
          Resultado Venta
        </p>
        <LineItem label="Precio venta" value={formatCurrency(precioVenta)} />
        <LineItem label="Comisión venta" value={`-${formatCurrency(honorariosVenta)}`} indent />
        <LineItem label="Venta neta" value={formatCurrency(ventaNeta)} />
        <div className="mt-2 pt-2 border-t border-dashed border-border">
          <LineItem label="Beneficio Neto" value={formatCurrency(beneficioNeto)} highlight="green" bold />
        </div>
      </div>

      {/* Margen Final */}
      <div className={cn(
        "p-3 rounded-lg",
        beneficioNeto >= 0 ? "bg-emerald-50" : "bg-rose-50"
      )}>
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-xs font-medium",
            beneficioNeto >= 0 ? "text-emerald-700" : "text-rose-700"
          )}>
            Margen sobre inversión
          </span>
          <span className={cn(
            "text-lg font-bold tabular-nums",
            beneficioNeto >= 0 ? "text-emerald-700" : "text-rose-700"
          )}>
            {margen.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}

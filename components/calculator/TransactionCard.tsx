"use client"

import { ArrowDownLeft, ArrowUpRight, Calendar, Percent } from "lucide-react"

interface TransactionCardProps {
  precioCompra: number
  precioVenta: number
  fechaCompra: string
  fechaVenta: string
  intermediacionCompra: boolean
  porcentajeIntermediacionCompra: number
  intermediacionVenta: boolean
  porcentajeIntermediacionVenta: number
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function TransactionCard({
  precioCompra,
  precioVenta,
  fechaCompra,
  fechaVenta,
  intermediacionCompra,
  porcentajeIntermediacionCompra,
  intermediacionVenta,
  porcentajeIntermediacionVenta,
  m2Totales
}: TransactionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-4">Compra y Venta</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Compra */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Compra</span>
          </div>

          <p className="text-2xl font-bold tabular-nums text-blue-600 mb-3">
            {formatCurrency(precioCompra)}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(fechaCompra)}</span>
            </div>
            {intermediacionCompra && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Percent className="h-3.5 w-3.5" />
                <span>Intermediacion: {porcentajeIntermediacionCompra}%</span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Precio por m2</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(precioCompra / m2Totales)}/m2</p>
            </div>
          </div>
        </div>

        {/* Venta */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Venta</span>
          </div>

          <p className="text-2xl font-bold tabular-nums text-emerald-600 mb-3">
            {formatCurrency(precioVenta)}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(fechaVenta)} (prevista)</span>
            </div>
            {intermediacionVenta && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Percent className="h-3.5 w-3.5" />
                <span>Intermediacion: {porcentajeIntermediacionVenta}%</span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Precio por m2</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(precioVenta / m2Totales)}/m2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

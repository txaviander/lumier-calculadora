"use client"

import React, { useState } from "react"
import { Hammer, Paintbrush, Sofa, HardHat, FileText, Building, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CostCategoryProps {
  icon: React.ReactNode
  title: string
  items: { label: string; value: number }[]
  color: "blue" | "amber" | "violet" | "slate"
}

function CostCategory({ icon, title, items, color }: CostCategoryProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    slate: "bg-slate-100 text-slate-600",
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", colorClasses[color])}>
          {icon}
        </div>
        <span className="text-sm font-medium">{title}</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="tabular-nums">{item.value.toLocaleString("es-ES")} EUR</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-sm font-medium">Subtotal</span>
        <span className="text-sm font-semibold tabular-nums">{total.toLocaleString("es-ES")} EUR</span>
      </div>
    </div>
  )
}

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
  const [hardCostsOpen, setHardCostsOpen] = useState(true)
  const [softCostsOpen, setSoftCostsOpen] = useState(true)

  const hardCosts = {
    obra: [
      { label: "Obra civil", value: Math.round(obra * 0.4) },
      { label: "Albañileria", value: Math.round(obra * 0.35) },
      { label: "Fontaneria", value: Math.round(obra * 0.15) },
      { label: "Electricidad", value: Math.round(obra * 0.1) },
    ],
    materiales: [
      { label: "Suelos", value: Math.round(calidadCoste * 0.25) },
      { label: "Revestimientos", value: Math.round(calidadCoste * 0.20) },
      { label: "Carpinteria", value: Math.round(calidadCoste * 0.30) },
      { label: "Sanitarios", value: Math.round(calidadCoste * 0.15) },
      { label: "Iluminacion", value: Math.round(calidadCoste * 0.10) },
    ],
    interiorismo: [
      { label: "Diseño interior", value: Math.round(interiorismo * 0.5) },
      { label: "Pintura", value: Math.round(interiorismo * 0.35) },
      { label: "Acabados", value: Math.round(interiorismo * 0.15) },
    ],
    mobiliario: [
      { label: "Cocina equipada", value: Math.round(mobiliario * 0.55) },
      { label: "Armarios", value: Math.round(mobiliario * 0.30) },
      { label: "Otros muebles", value: Math.round(mobiliario * 0.15) },
    ],
  }

  const softCosts = [
    { label: "Arquitectura", value: arquitectura },
    { label: "Permiso construccion", value: permisoConstruccion },
    { label: "Costos tenencia", value: costosTenencia },
    { label: "Plusvalia", value: plusvalia },
  ]

  const hardTotal = obra + calidadCoste + interiorismo + mobiliario + extras
  const softTotal = softCosts.reduce((s, i) => s + i.value, 0)
  const grandTotal = hardTotal + softTotal

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Hammer className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Reforma Completa</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Reforma</p>
          <p className="text-lg font-bold tabular-nums text-rose-600">{grandTotal.toLocaleString("es-ES")} EUR</p>
        </div>
      </div>

      {/* Hard Costs */}
      <div className="mb-5">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          onClick={() => setHardCostsOpen(!hardCostsOpen)}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Hard Costs
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tabular-nums">{hardTotal.toLocaleString("es-ES")} EUR</p>
            {hardCostsOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </Button>

        {hardCostsOpen && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-3">
            <CostCategory
              icon={<HardHat className="h-3.5 w-3.5" />}
              title="Obra"
              items={hardCosts.obra}
              color="blue"
            />
            <CostCategory
              icon={<Building className="h-3.5 w-3.5" />}
              title="Materiales"
              items={hardCosts.materiales}
              color="amber"
            />
            <CostCategory
              icon={<Paintbrush className="h-3.5 w-3.5" />}
              title="Interiorismo"
              items={hardCosts.interiorismo}
              color="violet"
            />
            <CostCategory
              icon={<Sofa className="h-3.5 w-3.5" />}
              title="Mobiliario"
              items={hardCosts.mobiliario}
              color="slate"
            />
          </div>
        )}
      </div>

      {/* Soft Costs */}
      <div className="pt-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          onClick={() => setSoftCostsOpen(!softCostsOpen)}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Soft Costs
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tabular-nums">{softTotal.toLocaleString("es-ES")} EUR</p>
            {softCostsOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </Button>

        {softCostsOpen && (
          <div className="rounded-lg border border-border p-4 mt-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-medium">Gastos Administrativos</span>
            </div>

            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
              {softCosts.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="tabular-nums">{item.value.toLocaleString("es-ES")} EUR</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cost per m2 */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Coste reforma por m2</span>
        <span className="text-sm font-semibold tabular-nums">{Math.round(grandTotal / m2Construidos).toLocaleString("es-ES")} EUR/m2</span>
      </div>
    </div>
  )
}

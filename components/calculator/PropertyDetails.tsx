"use client"

import { Building2, Check, X } from "lucide-react"

interface DetailItemProps {
  label: string
  value: string
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  )
}

interface FeatureChipProps {
  label: string
  active: boolean
}

function FeatureChip({ label, active }: FeatureChipProps) {
  return (
    <div className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
      active
        ? "bg-emerald-50 text-emerald-700"
        : "bg-muted text-muted-foreground"
    }`}>
      {active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </div>
  )
}

interface PropertyDetailsProps {
  ciudad: string
  direccion: string
  planta: string
  m2Construidos: number
  m2ZZCC: number
  terrazaM2: number
  exterior: boolean
  ascensor: boolean
  portero: boolean
  ite: boolean
  garaje: boolean
  toldoPergola: boolean
}

export function PropertyDetails({
  ciudad,
  direccion,
  planta,
  m2Construidos,
  m2ZZCC,
  terrazaM2,
  exterior,
  ascensor,
  portero,
  ite,
  garaje,
  toldoPergola
}: PropertyDetailsProps) {
  const m2Totales = m2Construidos + m2ZZCC

  const features = [
    { label: "Exterior", active: exterior },
    { label: "Ascensor", active: ascensor },
    { label: "Portero", active: portero },
    { label: "ITE", active: ite },
    { label: "Garaje", active: garaje },
    { label: "Terraza", active: terrazaM2 > 0 },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Datos del Inmueble</h3>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Ubicacion
          </p>
          <div className="space-y-0">
            <DetailItem label="Ciudad" value={ciudad} />
            <DetailItem label="Direccion" value={direccion} />
            <DetailItem label="Planta" value={planta} />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Superficie
          </p>
          <div className="space-y-0">
            <DetailItem label="Construidos" value={`${m2Construidos} m2`} />
            <DetailItem label="Zonas Comunes" value={`${m2ZZCC} m2`} />
            <DetailItem label="Terraza" value={`${terrazaM2} m2`} />
            <div className="flex items-center justify-between py-2 bg-muted/50 rounded px-2 mt-1">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm font-semibold tabular-nums">{m2Totales} m2</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Caracteristicas
        </p>
        <div className="flex flex-wrap gap-1.5">
          {features.map((feature) => (
            <FeatureChip key={feature.label} {...feature} />
          ))}
        </div>
      </div>
    </div>
  )
}

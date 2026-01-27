"use client"

import { Button } from "@/components/ui/button"
import { Save, Share2, Printer, History } from "lucide-react"

interface ProjectHeaderProps {
  title: string
  versionNumber?: number
  onSave: () => void
  onShare: () => void
  onPrint: () => void
  onVersionHistory?: () => void
  hasChanges?: boolean
  saving?: boolean
}

export function ProjectHeader({
  title,
  versionNumber,
  onSave,
  onShare,
  onPrint,
  onVersionHistory,
  hasChanges,
  saving
}: ProjectHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {hasChanges && (
          <span className="inline-flex items-center gap-1 text-sm text-orange-600">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            Cambios sin guardar
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {versionNumber && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground"
              onClick={onVersionHistory}
            >
              <History className="h-3.5 w-3.5" />
              <span>v{versionNumber}</span>
            </Button>
            <div className="h-4 w-px bg-border" />
          </>
        )}
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={onShare}>
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={onPrint}>
          <Printer className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
          onClick={onSave}
          disabled={saving}
        >
          <Save className="h-3.5 w-3.5" />
          <span>{saving ? 'Guardando...' : 'Guardar'}</span>
        </Button>
      </div>
    </header>
  )
}

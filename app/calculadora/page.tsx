'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/dashboard'
import { ProjectWithMetrics, getProjectsWithMetrics, createProject, deleteProject } from '@/lib/supabase'

type ViewMode = 'grid' | 'list'
type SortOption = 'updated' | 'name' | 'inversion' | 'beneficio' | 'margen' | 'roi'
type SortDirection = 'asc' | 'desc'

export default function CalculadoraPage() {
  return (
    <ProtectedRoute>
      <CalculadoraContent />
    </ProtectedRoute>
  )
}

function CalculadoraContent() {
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<ProjectWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('updated')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showSuccess, setShowSuccess] = useState(false)

  // Mostrar mensaje de éxito si viene del wizard
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true)
      // Ocultar después de 5 segundos
      const timer = setTimeout(() => setShowSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const data = await getProjectsWithMetrics()
      setProjects(data)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setCreating(true)
    try {
      const project = await createProject(newProjectName, newProjectDescription || undefined)
      await loadProjects()
      setNewProjectName('')
      setNewProjectDescription('')
      setShowNewProject(false)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Error al crear el proyecto')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteProject(id: string, name: string) {
    if (!confirm(`¿Seguro que deseas eliminar el proyecto "${name}"? Esta accion no se puede deshacer.`)) {
      return
    }

    try {
      await deleteProject(id)
      setProjects(projects.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Error al eliminar el proyecto')
    }
  }

  // Filtrar y ordenar proyectos
  const filteredProjects = useMemo(() => {
    let result = [...projects]

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.metrics?.ciudad?.toLowerCase().includes(query) ||
        p.metrics?.direccion?.toLowerCase().includes(query)
      )
    }

    // Ordenar
    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'inversion':
          comparison = (a.metrics?.inversionTotal || 0) - (b.metrics?.inversionTotal || 0)
          break
        case 'beneficio':
          comparison = (a.metrics?.beneficioNeto || 0) - (b.metrics?.beneficioNeto || 0)
          break
        case 'margen':
          comparison = (a.metrics?.margen || 0) - (b.metrics?.margen || 0)
          break
        case 'roi':
          comparison = (a.metrics?.roi || 0) - (b.metrics?.roi || 0)
          break
        case 'updated':
        default:
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      }
      return sortDirection === 'desc' ? -comparison : comparison
    })

    return result
  }, [projects, searchQuery, sortBy, sortDirection])

  // Función para manejar click en columna
  function handleColumnSort(column: SortOption) {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(column)
      setSortDirection('desc')
    }
  }

  // Calcular totales
  const totals = useMemo(() => {
    const projectsWithMetrics = projects.filter(p => p.metrics)
    return {
      totalProjects: projects.length,
      totalInversion: projectsWithMetrics.reduce((sum, p) => sum + (p.metrics?.inversionTotal || 0), 0),
      totalBeneficio: projectsWithMetrics.reduce((sum, p) => sum + (p.metrics?.beneficioNeto || 0), 0),
      avgMargen: projectsWithMetrics.length > 0
        ? projectsWithMetrics.reduce((sum, p) => sum + (p.metrics?.margen || 0), 0) / projectsWithMetrics.length
        : 0
    }
  }, [projects])

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
  }

  function formatPercent(value: number) {
    return new Intl.NumberFormat('es-ES', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  function getMargenColor(margen: number | undefined) {
    if (margen === undefined) return 'text-gray-400'
    if (margen >= 16) return 'text-green-600'
    if (margen >= 13) return 'text-orange-500'
    return 'text-red-500'
  }

  function getMargenBgColor(margen: number | undefined) {
    if (margen === undefined) return 'bg-gray-100'
    if (margen >= 16) return 'bg-green-100'
    if (margen >= 13) return 'bg-orange-100'
    return 'bg-red-100'
  }

  function getMargenLabel(margen: number | undefined) {
    if (margen === undefined) return 'Sin datos'
    if (margen >= 16) return 'OPORTUNIDAD'
    if (margen >= 13) return 'AJUSTADO'
    return 'NO HACER'
  }

  // Icono de ordenación
  function SortIcon({ column }: { column: SortOption }) {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-300 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortDirection === 'desc' ? (
      <svg className="w-4 h-4 text-gray-700 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-gray-700 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    )
  }

  return (
    <DashboardLayout
      title="Calculadora de Oportunidades"
      subtitle="Gestiona los análisis de rentabilidad de tus proyectos inmobiliarios"
    >
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 font-medium">¡Oportunidad creada correctamente!</span>
          </div>
          <button onClick={() => setShowSuccess(false)} className="text-green-600 hover:text-green-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div></div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Proyecto Rápido
          </button>
          <Link
            href="/calculadora/nueva"
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Nueva Oportunidad
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Proyectos</div>
            <div className="text-2xl font-bold text-gray-900">{totals.totalProjects}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Inversión Total</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalInversion)}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Beneficio Total</div>
            <div className={`text-2xl font-bold ${totals.totalBeneficio >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(totals.totalBeneficio)}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Margen Promedio</div>
            <div className={`text-2xl font-bold ${getMargenColor(totals.avgMargen)}`}>
              {formatPercent(totals.avgMargen)}
            </div>
          </div>
        </div>
      )}

      {/* Search and View Controls */}
      {projects.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar proyectos por nombre, ciudad o dirección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as SortOption); setSortDirection('desc'); }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="updated">Fecha actualización</option>
                  <option value="name">Nombre</option>
                  <option value="inversion">Inversión</option>
                  <option value="beneficio">Beneficio</option>
                  <option value="margen">Margen</option>
                  <option value="roi">ROI</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Vista cuadrícula"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Vista lista"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {searchQuery && (
            <div className="mt-3 text-sm text-gray-500">
              {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Proyecto</h2>
            </div>
            <form onSubmit={handleCreateProject} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Proyecto *
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Ej: Casa Reforma Madrid Centro"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Breve descripción del proyecto..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newProjectName.trim()}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects View */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay proyectos todavía</h3>
          <p className="text-gray-500 mb-6">Crea tu primer proyecto para comenzar</p>
          <button
            onClick={() => setShowNewProject(true)}
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Primer Proyecto
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron proyectos</h3>
          <p className="text-gray-500 mb-4">No hay proyectos que coincidan con "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-gray-900 hover:text-gray-700 font-medium"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/calculadora/${project.slug}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              {/* Header con indicador de margen */}
              <div className={`px-4 py-2 ${getMargenBgColor(project.metrics?.margen)}`}>
                <span className={`text-xs font-bold ${getMargenColor(project.metrics?.margen)}`}>
                  {getMargenLabel(project.metrics?.margen)}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDeleteProject(project.id, project.name)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                    title="Eliminar proyecto"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
                  {project.name}
                </h3>

                {project.metrics?.direccion && (
                  <p className="text-sm text-gray-500 mb-3">
                    {project.metrics.direccion}{project.metrics.ciudad ? `, ${project.metrics.ciudad}` : ''}
                  </p>
                )}

                {project.metrics ? (
                  <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-400">Beneficio</div>
                        <div className={`font-bold ${project.metrics.beneficioNeto >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {formatCurrency(project.metrics.beneficioNeto)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Margen</div>
                        <div className={`font-bold ${getMargenColor(project.metrics.margen)}`}>
                          {formatPercent(project.metrics.margen)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">ROI</div>
                        <div className="font-bold text-gray-700">
                          {formatPercent(project.metrics.roi)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Inversión</div>
                        <div className="font-bold text-gray-700">
                          {formatCurrency(project.metrics.inversionTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 mt-4 pt-4 border-t border-gray-100 text-center py-2">
                    Sin datos guardados
                  </div>
                )}

                <div className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                  Actualizado: {formatDate(project.updated_at)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleColumnSort('name')}
                  className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                >
                  <div className="flex items-center">
                    Proyecto
                    <SortIcon column="name" />
                  </div>
                </th>
                <th
                  onClick={() => handleColumnSort('inversion')}
                  className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none"
                >
                  <div className="flex items-center justify-end">
                    Inversión
                    <SortIcon column="inversion" />
                  </div>
                </th>
                <th
                  onClick={() => handleColumnSort('beneficio')}
                  className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                >
                  <div className="flex items-center justify-end">
                    Beneficio
                    <SortIcon column="beneficio" />
                  </div>
                </th>
                <th
                  onClick={() => handleColumnSort('margen')}
                  className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                >
                  <div className="flex items-center justify-end">
                    Margen
                    <SortIcon column="margen" />
                  </div>
                </th>
                <th
                  onClick={() => handleColumnSort('roi')}
                  className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:bg-gray-100 transition-colors select-none"
                >
                  <div className="flex items-center justify-end">
                    ROI
                    <SortIcon column="roi" />
                  </div>
                </th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Estado</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/calculadora/${project.slug}`} className="flex items-center gap-3 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                          {project.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {project.metrics?.direccion ? `${project.metrics.direccion}${project.metrics.ciudad ? `, ${project.metrics.ciudad}` : ''}` : formatDate(project.updated_at)}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right hidden md:table-cell">
                    <span className="font-medium text-gray-700">
                      {project.metrics ? formatCurrency(project.metrics.inversionTotal) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${project.metrics && project.metrics.beneficioNeto >= 0 ? 'text-green-600' : project.metrics ? 'text-red-500' : 'text-gray-400'}`}>
                      {project.metrics ? formatCurrency(project.metrics.beneficioNeto) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${getMargenColor(project.metrics?.margen)}`}>
                      {project.metrics ? formatPercent(project.metrics.margen) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right hidden lg:table-cell">
                    <span className="font-medium text-gray-700">
                      {project.metrics ? formatPercent(project.metrics.roi) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center hidden lg:table-cell">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${getMargenBgColor(project.metrics?.margen)} ${getMargenColor(project.metrics?.margen)}`}>
                      {getMargenLabel(project.metrics?.margen)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/calculadora/${project.slug}`}
                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                        title="Abrir proyecto"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar proyecto"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}

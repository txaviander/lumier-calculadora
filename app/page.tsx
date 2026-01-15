'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Project, getProjects, createProject, deleteProject } from '@/lib/supabase'

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  )
}

function HomeContent() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const data = await getProjects()
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
      setProjects([project, ...projects])
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

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto p-6">
        {/* Header section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mis Proyectos</h1>
            <p className="text-gray-500 mt-1">Gestiona las calculadoras de tus proyectos inmobiliarios</p>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 bg-lumier-gold hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Proyecto
          </button>
        </div>

        {/* New Project Modal */}
        {showNewProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Crear Nuevo Proyecto</h2>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lumier-gold focus:border-transparent"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripcion (opcional)
                    </label>
                    <textarea
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      placeholder="Breve descripcion del proyecto..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lumier-gold focus:border-transparent resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewProject(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newProjectName.trim()}
                    className="flex-1 px-4 py-3 bg-lumier-gold text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creando...' : 'Crear Proyecto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumier-gold"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay proyectos todavia</h3>
            <p className="text-gray-500 mb-6">Crea tu primer proyecto para comenzar</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="inline-flex items-center gap-2 bg-lumier-gold hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Primer Proyecto
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/${project.slug}`}
                className="bg-white rounded-xl card-shadow p-6 hover:scale-[1.02] transition-transform group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-lumier-gold to-yellow-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
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
                <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-lumier-gold transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-4 pt-4 border-t">
                  <span>Actualizado: {formatDate(project.updated_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm">
        <p>Lumier Casas Boutique - Calculadora de Renovaciones</p>
      </footer>
    </div>
  )
}

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectHeader, CIStatus } from '@/components/calculator/ProjectHeader'

const defaultProps = {
  title: 'Test Project',
  onSave: jest.fn(),
  onShare: jest.fn(),
  onPrint: jest.fn(),
}

describe('ProjectHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic rendering', () => {
    it('renders the title', () => {
      render(<ProjectHeader {...defaultProps} />)
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    it('renders version number when provided', () => {
      render(<ProjectHeader {...defaultProps} versionNumber={3} />)
      expect(screen.getByText('v3')).toBeInTheDocument()
    })

    it('shows unsaved changes indicator', () => {
      render(<ProjectHeader {...defaultProps} hasChanges={true} />)
      expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument()
    })

    it('shows saving state on save button', () => {
      render(<ProjectHeader {...defaultProps} saving={true} />)
      expect(screen.getByText('Guardando...')).toBeInTheDocument()
    })
  })

  describe('CI Status: not_submitted', () => {
    it('shows Presentar al CI button when not submitted', () => {
      const onSubmitToCI = jest.fn()
      render(
        <ProjectHeader
          {...defaultProps}
          onSubmitToCI={onSubmitToCI}
          ciStatus="not_submitted"
        />
      )
      expect(screen.getByText('Presentar al CI')).toBeInTheDocument()
    })

    it('disables submit button when there are unsaved changes', () => {
      const onSubmitToCI = jest.fn()
      render(
        <ProjectHeader
          {...defaultProps}
          onSubmitToCI={onSubmitToCI}
          ciStatus="not_submitted"
          hasChanges={true}
        />
      )
      const button = screen.getByText('Presentar al CI').closest('button')
      expect(button).toBeDisabled()
    })

    it('shows Enviando... when submitting', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          onSubmitToCI={jest.fn()}
          ciStatus="not_submitted"
          submittingToCI={true}
        />
      )
      expect(screen.getByText('Enviando...')).toBeInTheDocument()
    })
  })

  describe('CI Status: oportunidad', () => {
    it('shows Pendiente de CI badge', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          ciStatus="oportunidad"
        />
      )
      expect(screen.getByText('Pendiente de CI')).toBeInTheDocument()
    })

    it('does not show Presentar al CI button', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          onSubmitToCI={jest.fn()}
          ciStatus="oportunidad"
        />
      )
      expect(screen.queryByText('Presentar al CI')).not.toBeInTheDocument()
    })

    it('shows project code when provided', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          ciStatus="oportunidad"
          ciProjectCode="LUM-2025-001"
        />
      )
      expect(screen.getByText('LUM-2025-001')).toBeInTheDocument()
    })
  })

  describe('CI Status: aprobado', () => {
    it('shows Aprobado badge', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          ciStatus="aprobado"
        />
      )
      expect(screen.getByText('Aprobado')).toBeInTheDocument()
    })

    it('shows Ver Proyecto link when approved with project code', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          ciStatus="aprobado"
          ciProjectCode="LUM-2025-001"
        />
      )
      expect(screen.getByText('Ver Proyecto')).toBeInTheDocument()
    })
  })

  describe('CI Status: rechazado', () => {
    it('shows Rechazado badge', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          ciStatus="rechazado"
        />
      )
      expect(screen.getByText('Rechazado')).toBeInTheDocument()
    })

    it('shows rejection reason when provided', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          ciStatus="rechazado"
          ciRejectionReason="Margen insuficiente para la zona"
        />
      )
      expect(screen.getByText(/Margen insuficiente para la zona/)).toBeInTheDocument()
    })

    it('does not show Ver Proyecto link when rejected', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          ciStatus="rechazado"
          ciProjectCode="LUM-2025-001"
        />
      )
      expect(screen.queryByText('Ver Proyecto')).not.toBeInTheDocument()
    })
  })

  describe('CI Status: en_ejecucion', () => {
    it('shows En Ejecución badge', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          ciStatus="en_ejecucion"
        />
      )
      expect(screen.getByText('En Ejecución')).toBeInTheDocument()
    })

    it('shows Ver Proyecto link', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          ciStatus="en_ejecucion"
          ciProjectCode="LUM-2025-001"
        />
      )
      expect(screen.getByText('Ver Proyecto')).toBeInTheDocument()
    })
  })

  describe('CI Status: en_venta', () => {
    it('shows En Venta badge', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          ciStatus="en_venta"
        />
      )
      expect(screen.getByText('En Venta')).toBeInTheDocument()
    })
  })

  describe('CI Status: vendido', () => {
    it('shows Vendido badge', () => {
      render(
        <ProjectHeader
          {...defaultProps}
          ciStatus="vendido"
        />
      )
      expect(screen.getByText('Vendido')).toBeInTheDocument()
    })
  })

  describe('Button actions', () => {
    it('calls onSave when save button is clicked', () => {
      render(<ProjectHeader {...defaultProps} />)
      fireEvent.click(screen.getByText('Guardar'))
      expect(defaultProps.onSave).toHaveBeenCalled()
    })

    it('calls onSubmitToCI when submit button is clicked', () => {
      const onSubmitToCI = jest.fn()
      render(
        <ProjectHeader
          {...defaultProps}
          onSubmitToCI={onSubmitToCI}
          ciStatus="not_submitted"
        />
      )
      fireEvent.click(screen.getByText('Presentar al CI'))
      expect(onSubmitToCI).toHaveBeenCalled()
    })
  })
})

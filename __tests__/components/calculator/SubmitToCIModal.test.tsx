import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SubmitToCIModal } from '@/components/calculator/SubmitToCIModal'

const mockProjectData = {
  direccion: 'Calle Test 123',
  ciudad: 'Madrid',
  m2Totales: 120,
  precioCompra: 500000,
  precioVenta: 750000,
  margen: 18.5,
  roi: 25,
  beneficioNeto: 138750
}

describe('SubmitToCIModal', () => {
  const mockOnClose = jest.fn()
  const mockOnConfirm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SubmitToCIModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={mockProjectData}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal when isOpen is true', () => {
    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={mockProjectData}
      />
    )
    expect(screen.getByText('Presentar al Comité de Inversión')).toBeInTheDocument()
    expect(screen.getByText('Calle Test 123')).toBeInTheDocument()
  })

  it('displays project data correctly', () => {
    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={mockProjectData}
      />
    )

    expect(screen.getByText('Madrid')).toBeInTheDocument()
    expect(screen.getByText('120 m²')).toBeInTheDocument()
  })

  it('shows COMPRAR recommendation for margin >= 18%', () => {
    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={{ ...mockProjectData, margen: 20 }}
      />
    )

    expect(screen.getByText('Recomendación automática: COMPRAR')).toBeInTheDocument()
  })

  it('shows NEGOCIAR recommendation for margin between 14% and 18%', () => {
    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={{ ...mockProjectData, margen: 16 }}
      />
    )

    expect(screen.getByText('Recomendación automática: NEGOCIAR')).toBeInTheDocument()
  })

  it('shows RECHAZAR recommendation for margin < 14%', () => {
    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={{ ...mockProjectData, margen: 10 }}
      />
    )

    expect(screen.getByText('Recomendación automática: RECHAZAR')).toBeInTheDocument()
  })

  it('shows warning for low margin projects', () => {
    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={{ ...mockProjectData, margen: 10 }}
      />
    )

    expect(screen.getByText(/Este proyecto tiene un margen por debajo del 14%/)).toBeInTheDocument()
  })

  it('does not show warning for good margin projects', () => {
    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={{ ...mockProjectData, margen: 20 }}
      />
    )

    expect(screen.queryByText(/Este proyecto tiene un margen por debajo del 14%/)).not.toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', () => {
    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={mockProjectData}
      />
    )

    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    mockOnConfirm.mockResolvedValue(undefined)

    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={mockProjectData}
      />
    )

    const confirmButton = screen.getByText('Confirmar y Enviar')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled()
    })
  })

  it('displays margin percentage correctly', () => {
    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={mockProjectData}
      />
    )

    expect(screen.getByText('18.5%')).toBeInTheDocument()
  })

  it('displays ROI percentage correctly', () => {
    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={mockProjectData}
      />
    )

    expect(screen.getByText('25.0%')).toBeInTheDocument()
  })

  it('formats currency correctly in Spanish format', () => {
    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={mockProjectData}
      />
    )

    // Should show formatted currency values
    expect(screen.getByText('500.000 €')).toBeInTheDocument()
    expect(screen.getByText('750.000 €')).toBeInTheDocument()
  })

  it('shows loading state when submitting', async () => {
    // Make onConfirm take some time
    mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(
      <SubmitToCIModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        projectData={mockProjectData}
      />
    )

    const confirmButton = screen.getByText('Confirmar y Enviar')
    fireEvent.click(confirmButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Enviando...')).toBeInTheDocument()
    })
  })
})

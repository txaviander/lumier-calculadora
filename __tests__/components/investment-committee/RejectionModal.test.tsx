import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RejectionModal } from '@/components/investment-committee/RejectionModal'
import type { ProjectListItem } from '@/lib/types'

const mockProject: ProjectListItem = {
  project_id: 'test-123',
  project_code: 'LUM-2026-001',
  status: 'oportunidad',
  property_address: 'Calle Test 123',
  property_city: 'Madrid',
  property_size_m2: 120,
  purchase_price: 500000,
  estimated_sale_price: 750000,
  net_margin_percentage: 12.5,
  roi_percentage: 25,
  renovation_type: 'integral',
  created_at: '2026-01-27T10:00:00Z',
  updated_at: '2026-01-27T10:00:00Z',
  commercial: {
    id: 'user-123',
    full_name: 'Test User',
    avatar_url: null,
  },
}

describe('RejectionModal', () => {
  const mockOnClose = jest.fn()
  const mockOnConfirm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <RejectionModal
        project={mockProject}
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal when isOpen is true', () => {
    render(
      <RejectionModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    )
    expect(screen.getByText('Rechazar Oportunidad')).toBeInTheDocument()
    expect(screen.getByText('Calle Test 123')).toBeInTheDocument()
  })

  it('displays all rejection reasons', () => {
    render(
      <RejectionModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByText('Margen insuficiente')).toBeInTheDocument()
    expect(screen.getByText('Ubicación inadecuada')).toBeInTheDocument()
    expect(screen.getByText('Precio de compra excesivo')).toBeInTheDocument()
    expect(screen.getByText('Reforma muy compleja')).toBeInTheDocument()
  })

  it('does not call onConfirm when no reason is selected', async () => {
    render(
      <RejectionModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    )

    const confirmButton = screen.getByText('Confirmar Rechazo')
    fireEvent.click(confirmButton)

    // Wait a bit for any async operations
    await waitFor(() => {
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })
  })

  it('requires notes when "Otro motivo" is selected', async () => {
    render(
      <RejectionModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    )

    // Click on "Otro motivo" radio button
    const otherReasonLabel = screen.getByText('Otro motivo')
    fireEvent.click(otherReasonLabel)

    const confirmButton = screen.getByText('Confirmar Rechazo')
    fireEvent.click(confirmButton)

    // Should not call onConfirm without additional notes
    await waitFor(() => {
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })
  })

  it('calls onConfirm with reason when valid', async () => {
    mockOnConfirm.mockResolvedValue(undefined)

    render(
      <RejectionModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    )

    const marginReason = screen.getByText('Margen insuficiente')
    fireEvent.click(marginReason)

    const confirmButton = screen.getByText('Confirmar Rechazo')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('Margen insuficiente')
    })
  })

  it('calls onClose when cancel button is clicked', () => {
    render(
      <RejectionModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    )

    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('displays project financial metrics correctly', () => {
    render(
      <RejectionModal
        project={mockProject}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    )

    // Check that margin is displayed
    expect(screen.getByText('12.5%')).toBeInTheDocument()
  })
})

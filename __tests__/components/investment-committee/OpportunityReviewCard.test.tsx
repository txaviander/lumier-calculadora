import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { OpportunityReviewCard } from '@/components/investment-committee/OpportunityReviewCard'
import type { ProjectListItem } from '@/lib/types'

const createMockProject = (overrides: Partial<ProjectListItem> = {}): ProjectListItem => ({
  project_id: 'test-123',
  project_code: 'LUM-2026-001',
  status: 'oportunidad',
  property_address: 'Calle Test 123',
  property_city: 'Madrid',
  property_size_m2: 120,
  purchase_price: 500000,
  estimated_sale_price: 750000,
  net_margin_percentage: 18.5,
  roi_percentage: 25,
  renovation_type: 'integral',
  created_at: '2026-01-27T10:00:00Z',
  updated_at: '2026-01-27T10:00:00Z',
  commercial: {
    id: 'user-123',
    full_name: 'Test User',
    avatar_url: null,
  },
  ...overrides,
})

describe('OpportunityReviewCard', () => {
  const mockOnApprove = jest.fn()
  const mockOnReject = jest.fn()
  const mockOnViewDetails = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders project information correctly', () => {
    const project = createMockProject()
    render(
      <OpportunityReviewCard
        project={project}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onViewDetails={mockOnViewDetails}
      />
    )

    expect(screen.getByText('Calle Test 123')).toBeInTheDocument()
    expect(screen.getByText('Madrid')).toBeInTheDocument()
    expect(screen.getByText('120 m²')).toBeInTheDocument()
    expect(screen.getByText('LUM-2026-001')).toBeInTheDocument()
  })

  it('displays COMPRAR recommendation for margin >= 18%', () => {
    const project = createMockProject({ net_margin_percentage: 20 })
    render(
      <OpportunityReviewCard
        project={project}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onViewDetails={mockOnViewDetails}
      />
    )

    expect(screen.getByText('COMPRAR')).toBeInTheDocument()
  })

  it('displays NEGOCIAR recommendation for margin between 14% and 18%', () => {
    const project = createMockProject({ net_margin_percentage: 16 })
    render(
      <OpportunityReviewCard
        project={project}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onViewDetails={mockOnViewDetails}
      />
    )

    expect(screen.getByText('NEGOCIAR')).toBeInTheDocument()
  })

  it('displays RECHAZAR recommendation for margin < 14%', () => {
    const project = createMockProject({ net_margin_percentage: 10 })
    render(
      <OpportunityReviewCard
        project={project}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onViewDetails={mockOnViewDetails}
      />
    )

    expect(screen.getByText('RECHAZAR')).toBeInTheDocument()
  })

  it('handles null margin gracefully', () => {
    const project = createMockProject({ net_margin_percentage: null })
    render(
      <OpportunityReviewCard
        project={project}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onViewDetails={mockOnViewDetails}
      />
    )

    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })

  it('calls onApprove when Aprobar button is clicked', () => {
    const project = createMockProject()
    render(
      <OpportunityReviewCard
        project={project}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onViewDetails={mockOnViewDetails}
      />
    )

    const approveButton = screen.getByText('Aprobar')
    fireEvent.click(approveButton)

    expect(mockOnApprove).toHaveBeenCalledWith(project)
  })

  it('calls onReject when Rechazar button is clicked', () => {
    const project = createMockProject()
    render(
      <OpportunityReviewCard
        project={project}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onViewDetails={mockOnViewDetails}
      />
    )

    const rejectButton = screen.getByText('Rechazar')
    fireEvent.click(rejectButton)

    expect(mockOnReject).toHaveBeenCalledWith(project)
  })

  it('displays commercial information when available', () => {
    const project = createMockProject({
      commercial: {
        id: 'user-123',
        full_name: 'Juan García',
        avatar_url: null,
      },
    })
    render(
      <OpportunityReviewCard
        project={project}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onViewDetails={mockOnViewDetails}
      />
    )

    expect(screen.getByText('Juan García')).toBeInTheDocument()
    expect(screen.getByText('Presentado por')).toBeInTheDocument()
  })

  it('formats currency correctly', () => {
    const project = createMockProject({
      purchase_price: 500000,
      estimated_sale_price: 750000,
    })
    render(
      <OpportunityReviewCard
        project={project}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onViewDetails={mockOnViewDetails}
      />
    )

    // Check for formatted currency (Spanish format)
    expect(screen.getByText('500.000 €')).toBeInTheDocument()
    expect(screen.getByText('750.000 €')).toBeInTheDocument()
  })

  it('displays renovation type', () => {
    const project = createMockProject({ renovation_type: 'lujo' })
    render(
      <OpportunityReviewCard
        project={project}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onViewDetails={mockOnViewDetails}
      />
    )

    expect(screen.getByText('lujo')).toBeInTheDocument()
  })
})

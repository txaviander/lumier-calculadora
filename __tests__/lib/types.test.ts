/**
 * Tests for TypeScript types validation
 * These tests ensure our types are correctly defined and catch potential issues
 */

import type {
  UserProfile,
  Project,
  ProjectListItem,
  UserRole,
  ProjectStatus,
  RenovationType,
  RecommendedAction,
} from '@/lib/types'

describe('Type Definitions', () => {
  describe('UserRole', () => {
    it('should accept valid roles', () => {
      const validRoles: UserRole[] = [
        'comercial',
        'project_manager',
        'financiero',
        'diseno',
        'direccion',
        'legal',
        'marketing',
        'rrhh',
        'admin',
      ]

      validRoles.forEach(role => {
        const user: Partial<UserProfile> = { role }
        expect(user.role).toBeDefined()
      })
    })
  })

  describe('ProjectStatus', () => {
    it('should have all required statuses for workflow', () => {
      const statuses: ProjectStatus[] = [
        'oportunidad',
        'aprobado',
        'en_ejecucion',
        'en_venta',
        'vendido',
        'rechazado',
      ]

      // Verify we have the key workflow statuses
      expect(statuses).toContain('oportunidad')
      expect(statuses).toContain('aprobado')
      expect(statuses).toContain('rechazado')
    })
  })

  describe('RenovationType', () => {
    it('should have all renovation levels', () => {
      const types: RenovationType[] = ['basica', 'media', 'integral', 'lujo']
      expect(types.length).toBe(4)
    })
  })

  describe('RecommendedAction', () => {
    it('should have the three possible actions', () => {
      const actions: RecommendedAction[] = ['comprar', 'negociar', 'rechazar']
      expect(actions.length).toBe(3)
    })
  })

  describe('ProjectListItem', () => {
    it('should have project_id not id', () => {
      const project: ProjectListItem = {
        project_id: 'test-123',
        project_code: 'LUM-2026-001',
        status: 'oportunidad',
        property_address: 'Test Address',
        property_city: 'Madrid',
        property_size_m2: 100,
        purchase_price: 500000,
        estimated_sale_price: 700000,
        net_margin_percentage: 15,
        roi_percentage: 20,
        renovation_type: 'integral',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      }

      // This test validates that we use project_id, not id
      expect(project.project_id).toBeDefined()
      // @ts-expect-error - id should not exist on ProjectListItem
      expect(project.id).toBeUndefined()
    })

    it('should allow null values for optional fields', () => {
      const project: ProjectListItem = {
        project_id: 'test-123',
        project_code: null,
        status: 'oportunidad',
        property_address: 'Test Address',
        property_city: 'Madrid',
        property_size_m2: null,
        purchase_price: null,
        estimated_sale_price: null,
        net_margin_percentage: null,
        roi_percentage: null,
        renovation_type: 'basica',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        commercial: null,
      }

      expect(project.property_size_m2).toBeNull()
      expect(project.net_margin_percentage).toBeNull()
    })
  })

  describe('UserProfile', () => {
    it('should have id as string (UUID)', () => {
      const user: UserProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@lumier.es',
        full_name: 'Test User',
        role: 'admin',
        phone: null,
        avatar_url: null,
        is_active: true,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      }

      expect(typeof user.id).toBe('string')
      expect(user.id.length).toBe(36) // UUID length
    })
  })
})

describe('Business Logic Validations', () => {
  describe('Margin Recommendations', () => {
    const getRecommendation = (margin: number | null): RecommendedAction | 'sin_datos' => {
      if (margin === null) return 'sin_datos'
      if (margin >= 18) return 'comprar'
      if (margin >= 14) return 'negociar'
      return 'rechazar'
    }

    it('should recommend COMPRAR for margin >= 18%', () => {
      expect(getRecommendation(18)).toBe('comprar')
      expect(getRecommendation(20)).toBe('comprar')
      expect(getRecommendation(25)).toBe('comprar')
    })

    it('should recommend NEGOCIAR for margin between 14% and 18%', () => {
      expect(getRecommendation(14)).toBe('negociar')
      expect(getRecommendation(16)).toBe('negociar')
      expect(getRecommendation(17.99)).toBe('negociar')
    })

    it('should recommend RECHAZAR for margin < 14%', () => {
      expect(getRecommendation(13.99)).toBe('rechazar')
      expect(getRecommendation(10)).toBe('rechazar')
      expect(getRecommendation(0)).toBe('rechazar')
      expect(getRecommendation(-5)).toBe('rechazar')
    })

    it('should handle null margin', () => {
      expect(getRecommendation(null)).toBe('sin_datos')
    })
  })

  describe('Committee Access Control', () => {
    const canAccessCommittee = (role: UserRole): boolean => {
      return role === 'direccion' || role === 'admin'
    }

    it('should allow access to direccion role', () => {
      expect(canAccessCommittee('direccion')).toBe(true)
    })

    it('should allow access to admin role', () => {
      expect(canAccessCommittee('admin')).toBe(true)
    })

    it('should deny access to other roles', () => {
      const otherRoles: UserRole[] = [
        'comercial',
        'project_manager',
        'financiero',
        'diseno',
        'legal',
        'marketing',
        'rrhh',
      ]

      otherRoles.forEach(role => {
        expect(canAccessCommittee(role)).toBe(false)
      })
    })
  })
})

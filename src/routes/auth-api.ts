import { Hono } from 'hono'
import { HonoEnv } from '../types/env'

const authApiRoutes = new Hono<HonoEnv>()

// Auth me endpoint for user authentication
authApiRoutes.get('/me', (c) => {
  // Check for token in Authorization header
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: 'Authentication required'
    }, 401)
  }

  // Mock user data based on token
  return c.json({
    success: true,
    data: {
      id: 'user-123',
      email: 'admin@example.com',
      name: 'John Doe (Demo User)',
      lastName: 'Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format',
      roles: ['admin', 'tenant_owner'],
      tenantId: 'tenant-abc-corp',
      tenantName: 'ABC Corporation',
      company: 'ABC Corporation',
      department: 'Engineering',
      phone: '+81-90-1234-5678',
      bio: 'シニアソフトウェアエンジニア。フルスタック開発とクラウドアーキテクチャが専門。',
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: '2024-09-01T09:00:00Z',
      updatedAt: new Date().toISOString()
    }
  })
})

export { authApiRoutes }
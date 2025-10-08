import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import { authRoutes } from './routes/auth'
import { tenantRoutes } from './routes/tenant'
import { userRoutes } from './routes/user'
import { paymentRoutes } from './routes/demo-payment'
import { dashboardRoutes } from './routes/dashboard'
import { adminRoutes } from './routes/admin'

type Bindings = {
  // Future Cloudflare bindings
  // DB: D1Database;
  // SESSIONS: KVNamespace;
  // ENVIRONMENT: string;
  // API_BASE_URL: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Static assets
app.use('/static/*', serveStatic({ root: './public' }))

// Renderer for all HTML pages
app.use('*', renderer)

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/tenants', tenantRoutes)
app.route('/api/users', userRoutes)
app.route('/api/payment', paymentRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/admin', adminRoutes)

// Main App Pages
app.get('/', (c) => {
  return c.render(
    <div className="min-h-screen bg-gray-50">
      <div className="platform-gateway-app">
        <div id="app"></div>
      </div>
    </div>,
    { title: 'Platform Gateway - Enterprise Multi-Tenant Management' }
  )
})

// Dashboard page
app.get('/dashboard/*', (c) => {
  return c.render(
    <div className="min-h-screen bg-gray-50">
      <div className="platform-gateway-app">
        <div id="app"></div>
      </div>
    </div>,
    { title: 'Dashboard - Platform Gateway' }
  )
})

// Authentication pages
app.get('/auth/*', (c) => {
  return c.render(
    <div className="min-h-screen bg-gray-50">
      <div className="platform-gateway-app">
        <div id="app"></div>
      </div>
    </div>,
    { title: 'Authentication - Platform Gateway' }
  )
})

// Admin pages
app.get('/admin/*', (c) => {
  return c.render(
    <div className="min-h-screen bg-gray-50">
      <div className="platform-gateway-app">
        <div id="app"></div>
      </div>
    </div>,
    { title: 'Admin Console - Platform Gateway' }
  )
})

export default app

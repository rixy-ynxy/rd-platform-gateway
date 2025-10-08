import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { billingRoutes } from './routes/billing'
import { adminRoutes } from './routes/admin'
import { dashboardRoutes } from './routes/dashboard'
import { tenantApiRoutes } from './routes/tenant-api'
import { paymentApiRoutes } from './routes/payment-api'
import { authApiRoutes } from './routes/auth-api'

const app = new Hono()

// Middleware
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.route('/api/auth', authApiRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/tenant', tenantApiRoutes)
app.route('/api/payment', paymentApiRoutes)
app.route('/api/billing', billingRoutes)
app.route('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Favicon handler to prevent 500 errors
app.get('/favicon.ico', (c) => {
  return c.notFound()
})

// Main application route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Platform Gateway - Payment System</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/plugin/relativeTime.js"></script>
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <!-- App Container -->
        <div id="app">
            <!-- Loading placeholder -->
            <div class="min-h-screen bg-gray-50 flex items-center justify-center">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p class="text-gray-600">Loading Platform Gateway...</p>
                </div>
            </div>
        </div>

        <!-- Load the main application -->
        <script type="module" src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
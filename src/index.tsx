import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { billingRoutes } from './routes/billing'
import { adminRoutes } from './routes/admin'

const app = new Hono()

// Middleware
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.route('/api/billing', billingRoutes)
app.route('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
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
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <!-- Navigation -->
        <nav class="nav-container">
            <div class="nav-content">
                <div class="nav-wrapper">
                    <div class="nav-brand">
                        <i class="fas fa-credit-card mr-2"></i>
                        Platform Gateway
                    </div>
                    <div class="nav-menu">
                        <a href="/" class="nav-link active">Dashboard</a>
                        <a href="/billing" class="nav-link">Billing</a>
                        <a href="/analytics" class="nav-link">Analytics</a>
                        <a href="/admin" class="nav-link">Admin</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <!-- Dashboard Header -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">Payment System Dashboard</h1>
                <p class="text-gray-600 mt-2">Manage your billing, subscriptions, and payment analytics</p>
            </div>

            <!-- Metrics Grid -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="metric-card">
                    <div class="metric-value">$12,847</div>
                    <div class="metric-label">Monthly Revenue</div>
                </div>
                <div class="metric-card green">
                    <div class="metric-value">1,234</div>
                    <div class="metric-label">Active Subscriptions</div>
                </div>
                <div class="metric-card yellow">
                    <div class="metric-value">89.5%</div>
                    <div class="metric-label">Payment Success Rate</div>
                </div>
                <div class="metric-card purple">
                    <div class="metric-value">456</div>
                    <div class="metric-label">New Customers</div>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Revenue Chart -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Revenue Overview</h3>
                        <p class="card-subtitle">Monthly revenue trend</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Transactions</h3>
                        <p class="card-subtitle">Latest payment activities</p>
                    </div>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <div class="font-medium">ABC Corp - Pro Plan</div>
                                <div class="text-sm text-gray-600">2 hours ago</div>
                            </div>
                            <div class="text-green-600 font-semibold">+$99.00</div>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <div class="font-medium">XYZ Ltd - Enterprise</div>
                                <div class="text-sm text-gray-600">5 hours ago</div>
                            </div>
                            <div class="text-green-600 font-semibold">+$299.00</div>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <div class="font-medium">StartupCo - Basic</div>
                                <div class="text-sm text-gray-600">1 day ago</div>
                            </div>
                            <div class="text-green-600 font-semibold">+$29.00</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="mt-8">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Quick Actions</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <button class="btn btn-primary flex items-center justify-center gap-2">
                            <i class="fas fa-plus"></i>
                            New Subscription
                        </button>
                        <button class="btn btn-secondary flex items-center justify-center gap-2">
                            <i class="fas fa-file-invoice"></i>
                            Generate Invoice
                        </button>
                        <button class="btn btn-secondary flex items-center justify-center gap-2">
                            <i class="fas fa-chart-bar"></i>
                            View Analytics
                        </button>
                        <button class="btn btn-secondary flex items-center justify-center gap-2">
                            <i class="fas fa-cog"></i>
                            Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Initialize Chart.js
            const ctx = document.getElementById('revenueChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [8000, 9500, 11200, 10800, 12100, 12847],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });

            // Add navigation functionality
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    // In a real app, this would route to different pages
                    console.log('Navigating to:', e.target.textContent);
                });
            });

            // Add button functionality
            document.querySelectorAll('.btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    console.log('Action:', e.target.textContent.trim());
                });
            });
        </script>
    </body>
    </html>
  `)
})

export default app
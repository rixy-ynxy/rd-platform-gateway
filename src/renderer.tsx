import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'Platform Gateway - Enterprise Multi-Tenant Management'}</title>
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* Font Awesome Icons */}
        <link 
          href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" 
          rel="stylesheet" 
        />
        
        {/* Chart.js for metrics */}
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js"></script>
        
        {/* Axios for API calls */}
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        
        {/* Day.js for date handling */}
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/plugin/relativeTime.js"></script>
        
        {/* Lodash utilities */}
        <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
        

        {/* Custom styles */}
        <link href="/static/styles.css" rel="stylesheet" />
        
        {/* Tailwind Config */}
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    primary: {
                      50: '#f0f9ff',
                      100: '#e0f2fe',
                      500: '#0ea5e9',
                      600: '#0284c7',
                      700: '#0369a1',
                      900: '#0c4a6e'
                    },
                    success: {
                      50: '#f0fdf4',
                      500: '#10b981',
                      600: '#059669'
                    },
                    warning: {
                      50: '#fffbeb',
                      500: '#f59e0b',
                      600: '#d97706'
                    },
                    danger: {
                      50: '#fef2f2',
                      500: '#ef4444',
                      600: '#dc2626'
                    }
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body className="bg-gray-50 font-sans antialiased">
        {children}
        

        {/* Main Application Script - Load after other dependencies */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Wait for all external scripts to load before initializing app
            window.addEventListener('load', function() {
              const script = document.createElement('script');
              script.src = '/static/app.js?v=${Date.now()}';
              script.onload = function() {
                console.log('✅ App script loaded successfully');
              };
              script.onerror = function() {
                console.error('❌ Failed to load app script');
              };
              document.head.appendChild(script);
            });
          `
        }} />
      </body>
    </html>
  )
})

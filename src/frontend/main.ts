// Platform Gateway UI - Main Entry Point
import { PlatformGatewayApp } from './App';
import { Navigation } from './components/Navigation';
import { HelpGuide } from './components/HelpGuide';

// Global app instance
let app: PlatformGatewayApp;

function initializeApp(): void {
  try {
    console.log('🚀 Initializing Platform Gateway App...');
    app = new PlatformGatewayApp();
    
    // Make app methods available globally for onclick handlers
    (window as any).app = {
      ...app,
      bypassLogin: () => app.bypassLogin(),
      logout: () => app.logout(),
      toggleUserMenu: () => app.toggleUserMenu(),
      hideDemoBanner: () => app.hideDemoBanner(),
      toggleNavSection: (sectionId: string) => {
        Navigation.toggleNavSection(sectionId);
      }
    };

    // Make HelpGuide globally available
    (window as any).HelpGuide = HelpGuide;
    
    console.log('✅ Platform Gateway App initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Platform Gateway App:', error);
    // Fallback initialization
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div class="min-h-screen bg-gray-50 flex items-center justify-center">
          <div class="text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h2 class="text-xl font-bold text-gray-900 mb-2">Application Error</h2>
            <p class="text-gray-600">Failed to initialize the application. Please refresh the page.</p>
            <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Refresh Page
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Try multiple initialization methods
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM already loaded
  initializeApp();
}

// Fallback initialization after 2 seconds if nothing happened
setTimeout(() => {
  if (!app) {
    console.warn('⚠️ App not initialized after 2 seconds, trying again...');
    initializeApp();
  }
}, 2000);

// Export app globally instead of as module
(window as any).PlatformGatewayApp = app;
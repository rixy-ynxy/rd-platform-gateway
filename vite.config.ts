import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  // Frontend app build configuration
  if (process.env.BUILD_TARGET === 'frontend') {
    return {
      build: {
        rollupOptions: {
          input: 'src/frontend/main.ts',
          output: {
            dir: 'public/static',
            entryFileNames: 'app.js',
            format: 'iife',
            name: 'PlatformGatewayApp',
            inlineDynamicImports: true
          }
        },
        target: 'es2015',
        minify: false
      },
      resolve: {
        alias: {
          '@': '/src/frontend'
        }
      },
      esbuild: {
        target: 'es2015'
      }
    }
  }

  // Default Hono backend build configuration
  return {
    plugins: [
      build(),
      devServer({
        adapter,
        entry: 'src/index.tsx'
      })
    ],
    resolve: {
      alias: {
        '@': '/src/frontend'
      }
    }
  }
})

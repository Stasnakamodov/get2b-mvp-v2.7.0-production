/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hide X-Powered-By: Next.js header (reduces fingerprint for scanners)
  poweredByHeader: false,

  // Standalone output — минимальный production билд для Docker/VPS
  // Копирует только нужные файлы из node_modules в .next/standalone
  output: 'standalone',

  // ОПТИМИЗАЦИЯ ДЛЯ DEV РЕЖИМА - ускоряем компиляцию
  experimental: {
    forceSwcTransforms: true,
    // Отключаем лишние оптимизации в dev
    optimizeCss: false,
    // Ускоряем hot reload
    webVitalsAttribution: ['CLS', 'LCP'],
    // CSRF protection for Server Actions: restrict to production domain
    serverActions: {
      allowedOrigins:
        process.env.NODE_ENV === 'production'
          ? ['get2b.pro', 'www.get2b.pro']
          : ['localhost:3000', 'localhost:3001', 'localhost:3002'],
    },
  },

  // Dev-only ngrok domain (set NGROK_DOMAIN env var when using ngrok locally)
  allowedDevOrigins: process.env.NGROK_DOMAIN ? [process.env.NGROK_DOMAIN] : [],
  
  // Включаем проверки для production, отключаем только в dev
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // Включаем ESLint проверки для production, отключаем только в dev
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  
  // WEBPACK оптимизации для dev
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Ускоряем компиляцию в dev режиме
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // Отключаем минификацию в dev
      config.optimization.minimize = false;
      
             // Кэшируем модули для быстрых пересборок
       config.cache = {
         type: 'filesystem',
         buildDependencies: {
           config: [__filename]
         }
       };
       
       // Оптимизируем watching для меньшего CPU
       if (!isServer) {
         config.watchOptions = {
           poll: 3000, // Реже проверяем изменения
           aggregateTimeout: 1000, // Больше задержка перед пересборкой
           ignored: /node_modules/, // Игнорим node_modules
         };
         
         // Исправляем chunk loading для ngrok
         config.output = {
           ...config.output,
           publicPath: '/_next/',
         };
       }
     }
     return config;
  },
  
  // Конфигурируем внешние изображения
  // sharp установлен в Docker — оптимизация картинок работает
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Supabase storage removed — using local storage now
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.alicdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'alicdn.com',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Настройка для ngrok и внешних доменов
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  
  // Security headers с ограниченным CORS
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'
    const ngrokOrigin = process.env.NGROK_DOMAIN ? `https://${process.env.NGROK_DOMAIN}, ` : ''
    const allowedOrigins = isDev
      ? `${ngrokOrigin}http://localhost:3000, http://localhost:3001, http://localhost:3002`
      : 'https://get2b.pro'

    return [
      {
        source: '/_next/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigins,
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600',
          },
        ],
      },
    ]
  },

  // ИСПРАВЛЕНА КОНФИГУРАЦИЯ - убираем дублирование с верхней
  // (верхняя webpack конфигурация уже оптимизирована)

  // Отключаем строгую проверку хоста
  async rewrites() {
    return []
  },

}

module.exports = nextConfig 
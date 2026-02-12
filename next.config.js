/** @type {import('next').NextConfig} */
const nextConfig = {
  // ОПТИМИЗАЦИЯ ДЛЯ DEV РЕЖИМА - ускоряем компиляцию
  experimental: {
    forceSwcTransforms: true,
    // Отключаем лишние оптимизации в dev
    optimizeCss: false,
    // Ускоряем hot reload
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  
  // Убираем Cross origin warnings от ngrok
  allowedDevOrigins: ['389328403a7d.ngrok-free.app'],
  
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
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
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
      }
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Настройка для ngrok и внешних доменов
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  
  // Security headers с ограниченным CORS
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'
    const allowedOrigins = isDev
      ? 'https://389328403a7d.ngrok-free.app, http://localhost:3000, http://localhost:3001, http://localhost:3002'
      : 'https://yourdomain.com'

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
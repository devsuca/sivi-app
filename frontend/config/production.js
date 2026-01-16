/**
 * Configurações de Produção para SIVI+360° Frontend
 */

const config = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://10.1.10.31:8000/api',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.1.10.31:8000/api',
  
  // App Configuration
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'SIVI+360°',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  environment: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || 'production',
  
  // Security
  nextAuthSecret: process.env.NEXTAUTH_SECRET || 'your-nextauth-secret-key-here',
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://10.1.10.31:3000',
  
  // Feature Flags
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  
  // Upload Configuration
  maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'), // 10MB
  allowedFileTypes: (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),

  // Cache Configuration
  cacheTtl: parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '3600'), // 1 hora
  
  // Logging
  logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'error',
  
  // Analytics
  gaId: process.env.NEXT_PUBLIC_GA_ID || null,
  
  // Performance
  enableCompression: true,
  enableMinification: true,
  enableSourceMaps: false,
  
  // Security Headers
  securityHeaders: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
  
  // CORS Configuration
  corsOrigins: [
    'http://10.1.10.31:3000',  // frontend local via IP
    'http://localhost:3000',    // frontend local para testes
  ],
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela
  },
};

module.exports = config;

/**
 * Performance Configuration
 * Centralized configuration for performance optimizations
 */

const performanceConfig = {
  // Database query optimization
  database: {
    // Default pagination limits
    defaultPageSize: 20,
    maxPageSize: 100,
    
    // Query timeouts (in milliseconds)
    queryTimeout: 30000, // 30 seconds
    aggregationTimeout: 60000, // 1 minute for complex aggregations
    
    // Connection pool settings
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    
    // Index creation settings
    createIndexesOnStartup: true,
    indexCreationTimeout: 120000, // 2 minutes
  },

  // Caching configuration
  cache: {
    // Default TTL for different types of data
    defaultTTL: 300, // 5 minutes
    patientSearchTTL: 120, // 2 minutes
    analyticsTTL: 600, // 10 minutes
    staticDataTTL: 3600, // 1 hour
    
    // Cache size limits
    maxCacheSize: 1000, // Maximum number of cached items
    cleanupInterval: 60000, // Cleanup every minute
    
    // Cache keys patterns
    patterns: {
      patientSearch: 'patient_search_',
      analytics: 'analytics_',
      dashboard: 'dashboard_',
      sms: 'sms_'
    }
  },

  // API rate limiting
  rateLimit: {
    // General API rate limits
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // requests per window
    },
    
    // Search API rate limits (more restrictive)
    search: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60 // requests per window
    },
    
    // Analytics API rate limits
    analytics: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 100 // requests per window
    }
  },

  // Socket.IO optimization
  socket: {
    // Notification batching
    notificationBatchSize: 10,
    notificationBatchInterval: 1000, // 1 second
    
    // Connection settings
    pingTimeout: 60000,
    pingInterval: 25000,
    
    // Room management
    maxRoomsPerSocket: 10,
    roomCleanupInterval: 300000 // 5 minutes
  },

  // File upload optimization
  upload: {
    // Cloudinary optimization
    cloudinary: {
      quality: 'auto:good',
      format: 'auto',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      
      // Image transformations
      thumbnailSize: 150,
      previewSize: 500,
      
      // Upload timeout
      timeout: 60000 // 1 minute
    },
    
    // Local file handling
    tempCleanupInterval: 3600000, // 1 hour
    maxTempFileAge: 24 * 3600000 // 24 hours
  },

  // SMS optimization
  sms: {
    // Batch processing
    batchSize: 100,
    batchInterval: 5000, // 5 seconds
    
    // Rate limiting for SMS API
    apiRateLimit: {
      requestsPerSecond: 10,
      burstLimit: 50
    },
    
    // Retry configuration
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds
    
    // Template caching
    templateCacheTTL: 1800 // 30 minutes
  },

  // Analytics optimization
  analytics: {
    // Data aggregation limits
    maxDataPoints: 1000,
    defaultDateRange: 30, // days
    maxDateRange: 365, // days
    
    // Chart optimization
    chartDataLimit: 100,
    realtimeUpdateInterval: 30000, // 30 seconds
    
    // Report generation
    reportTimeout: 300000, // 5 minutes
    maxReportSize: 50 * 1024 * 1024 // 50MB
  },

  // Memory management
  memory: {
    // Garbage collection hints
    gcInterval: 300000, // 5 minutes
    
    // Memory usage thresholds
    warningThreshold: 0.8, // 80% of available memory
    criticalThreshold: 0.9, // 90% of available memory
    
    // Process restart thresholds
    maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
    maxUptime: 24 * 3600 * 1000 // 24 hours
  },

  // Monitoring and logging
  monitoring: {
    // Performance metrics collection
    collectMetrics: process.env.NODE_ENV === 'production',
    metricsInterval: 60000, // 1 minute
    
    // Slow query logging
    slowQueryThreshold: 1000, // 1 second
    logSlowQueries: true,
    
    // Error tracking
    errorSamplingRate: 1.0, // Log all errors
    performanceSamplingRate: 0.1 // Log 10% of performance metrics
  }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  // Development optimizations
  performanceConfig.cache.defaultTTL = 60; // Shorter cache in dev
  performanceConfig.database.queryTimeout = 10000; // Shorter timeout in dev
  performanceConfig.monitoring.collectMetrics = true; // Always collect in dev
}

if (process.env.NODE_ENV === 'production') {
  // Production optimizations
  performanceConfig.database.maxPoolSize = 20; // Larger pool in production
  performanceConfig.cache.maxCacheSize = 5000; // Larger cache in production
  performanceConfig.socket.notificationBatchSize = 20; // Larger batches in production
}

// Helper functions
const getConfig = (path) => {
  return path.split('.').reduce((obj, key) => obj && obj[key], performanceConfig);
};

const updateConfig = (path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((obj, key) => obj[key], performanceConfig);
  target[lastKey] = value;
};

module.exports = {
  performanceConfig,
  getConfig,
  updateConfig
};
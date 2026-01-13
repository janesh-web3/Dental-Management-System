#!/usr/bin/env node

/**
 * Optimized startup script for the dental management system backend
 * This script applies performance optimizations before starting the server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Dental Management System with Performance Optimizations...\n');

// Set performance-optimized environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.UV_THREADPOOL_SIZE = '16'; // Increase thread pool for better I/O performance
process.env.NODE_OPTIONS = '--max-old-space-size=2048 --optimize-for-size'; // Memory optimization

// Performance monitoring flags
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_OPTIONS += ' --inspect=0.0.0.0:9229'; // Enable debugging in dev
}

console.log('📊 Performance Settings:');
console.log(`   Environment: ${process.env.NODE_ENV}`);
console.log(`   Thread Pool Size: ${process.env.UV_THREADPOOL_SIZE}`);
console.log(`   Memory Limit: 2GB`);
console.log(`   Node Options: ${process.env.NODE_OPTIONS}`);
console.log('');

// Start the main server
const serverPath = path.join(__dirname, '..', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

// Handle server events
server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\n🔄 Server process exited with code ${code}`);
  if (code !== 0) {
    console.log('🔄 Attempting to restart server...');
    // Restart logic could be added here
  }
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

// Memory monitoring (development only)
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    console.log(`📊 Memory Usage: RSS: ${memUsageMB.rss}MB, Heap: ${memUsageMB.heapUsed}/${memUsageMB.heapTotal}MB, External: ${memUsageMB.external}MB`);
    
    // Warn if memory usage is high
    if (memUsageMB.heapUsed > 1500) {
      console.warn('⚠️  High memory usage detected!');
    }
  }, 60000); // Check every minute
}
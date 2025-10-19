module.exports = {
  apps: [
    {
      // Production configuration
      name: 'engineer-cv-prod',
      script: 'server.js',
      cwd: __dirname,
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        ENABLE_CLUSTERING: 'false' // PM2 handles clustering
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        ENABLE_CLUSTERING: 'false'
      },
      
      // Performance settings
      max_memory_restart: '2G',
      node_args: '--max-old-space-size=2048',
      
      // Logging
      log_file: './logs/pm2-combined.log',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto restart settings
      autorestart: true,
      watch: false, // Disable in production
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Process management
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Environment variables
      source_map_support: false,
      instance_var: 'INSTANCE_ID',
      
      // Advanced settings
      vizion: false, // Disable git metadata
      automation: false,
      pmx: true, // Enable PM2 monitoring
      
      // Graceful shutdown
      kill_retry_time: 100,
      shutdown_with_message: true
    },
    
    {
      // Development configuration
      name: 'engineer-cv-dev',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      
      // Development settings
      watch: ['server', 'server.js'],
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'dist', '.git'],
      watch_options: {
        followSymlinks: false,
        usePolling: false
      },
      
      // Logging
      log_file: './logs/pm2-dev-combined.log',
      out_file: './logs/pm2-dev-out.log',
      error_file: './logs/pm2-dev-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart
      autorestart: true,
      max_restarts: 5,
      min_uptime: '5s',
      restart_delay: 2000,
      
      // Development optimizations
      max_memory_restart: '1G',
      node_args: '--inspect=0.0.0.0:9229'
    },
    
    {
      // Staging configuration
      name: 'engineer-cv-staging',
      script: 'server.js',
      cwd: __dirname,
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'staging',
        PORT: 3001,
        ENABLE_CLUSTERING: 'false'
      },
      
      // Staging settings
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      
      // Logging
      log_file: './logs/pm2-staging-combined.log',
      out_file: './logs/pm2-staging-out.log',
      error_file: './logs/pm2-staging-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart
      autorestart: true,
      watch: false,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 3000
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/engineer.cv.git',
      path: '/var/www/engineer-cv',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no',
      env: {
        NODE_ENV: 'production'
      }
    },
    
    staging: {
      user: 'deploy',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/engineer.cv.git',
      path: '/var/www/engineer-cv-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  },
  
  // PM2 monitoring configuration
  monitoring: {
    // Enable PM2 Plus monitoring
    pmx: true,
    network: true,
    ports: true,
    
    // Custom metrics
    custom_probes: [
      {
        name: 'CPU usage',
        value: () => process.cpuUsage()
      },
      {
        name: 'Memory usage',
        value: () => Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100
      },
      {
        name: 'Event Loop Latency',
        value: () => {
          const start = process.hrtime();
          setImmediate(() => {
            const delta = process.hrtime(start);
            const nanosec = delta[0] * 1e9 + delta[1];
            const millisec = nanosec / 1e6;
            return Math.round(millisec * 100) / 100;
          });
        }
      }
    ],
    
    // Network monitoring
    network_timeout: 5000,
    
    // Process monitoring
    ignore_routes: ['/api/health', '/api/metrics'],
    
    // Error tracking
    error: true,
    
    // Transaction tracing
    transactions: true,
    
    // HTTP monitoring
    http: true,
    http_latency: 200,
    http_code: 500,
    
    // Database monitoring
    db: true,
    
    // Custom actions
    actions: [
      {
        action_name: 'restart-app',
        action_type: 'exec',
        command: 'pm2 restart engineer-cv-prod'
      },
      {
        action_name: 'clear-logs',
        action_type: 'exec',
        command: 'pm2 flush'
      },
      {
        action_name: 'memory-snapshot',
        action_type: 'exec',
        command: 'node --expose-gc -e "global.gc(); console.log(process.memoryUsage())"'
      }
    ]
  }
};

// PM2 startup script generator
if (require.main === module) {
  console.log('PM2 Ecosystem Configuration');
  console.log('============================');
  console.log('Available environments:');
  console.log('- production: pm2 start ecosystem.config.js --env production');
  console.log('- development: pm2 start ecosystem.config.js --env development');
  console.log('- staging: pm2 start ecosystem.config.js --env staging');
  console.log('');
  console.log('Useful commands:');
  console.log('- pm2 status');
  console.log('- pm2 logs');
  console.log('- pm2 monit');
  console.log('- pm2 reload ecosystem.config.js');
  console.log('- pm2 stop all');
  console.log('- pm2 delete all');
}

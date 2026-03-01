module.exports = {
  apps: [
    {
      name: 'moneymind-frontend',
      script: 'serve',
      args: '-s dist -p 3000',
      cwd: '/var/www/moneymind-frontend',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: '/var/log/pm2/moneymind-frontend-error.log',
      out_file: '/var/log/pm2/moneymind-frontend-out.log',
      log_file: '/var/log/pm2/moneymind-frontend.log',
      merge_logs: true
    }
  ]
};
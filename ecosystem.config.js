// PM2 配置檔案 - 用於生產環境進程管理
module.exports = {
  apps: [
    {
      name: 'member-management-api',
      script: './dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};

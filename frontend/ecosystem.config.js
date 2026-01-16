module.exports = {
  apps: [
    {
      name: "sivis::frontend",
      script: "node_modules/next/dist/bin/next",
      exec_mode: "fork", 
      args: "start", 
      instances: "max",
      autorestart: true, 
      watch: false, 
      max_memory_restart: "1G", 
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/app-err.log",
      out_file: "logs/app-out.log",
    },
  ],
};

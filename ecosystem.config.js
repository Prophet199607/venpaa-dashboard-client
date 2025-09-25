module.exports = {
  apps: [
    {
      name: 'nextjs-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 5005',
      cwd: '/var/www/nextjs-app',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};

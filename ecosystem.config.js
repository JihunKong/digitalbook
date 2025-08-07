module.exports = {
  apps: [{
    name: 'digitalbook',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    max_memory_restart: '500M'
  }]
}
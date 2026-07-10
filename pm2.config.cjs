/**
 * PM2 ecosystem file — production cluster config.
 *
 * Usage:
 *   npm run build:server          # compile TypeScript first
 *   pm2 start pm2.config.cjs      # start cluster
 *   pm2 save && pm2 startup       # persist across reboots
 *
 * PM2 spawns one process per CPU core (instances: 'max').
 * The @socket.io/redis-adapter ensures real-time events are broadcast
 * across all workers via Redis pub/sub.
 */
module.exports = {
  apps: [
    {
      name:           'cartiva-api',
      script:         './server/dist/index.js',   // compiled output
      instances:      'max',                      // one per CPU core
      exec_mode:      'cluster',
      autorestart:    true,
      watch:          false,
      max_memory_restart: '1G',                   // restart if any worker exceeds 1 GB

      env_production: {
        NODE_ENV:            'production',
        PORT:                5000,
        // Give each worker 16 libuv threads for native bcrypt.
        // Default is 4. With 16 threads per worker and 4 workers = 64 concurrent
        // bcrypt operations at ~70 ms each = ~900 logins/second throughput.
        UV_THREADPOOL_SIZE:  '16',
      },

      // Graceful shutdown: PM2 sends SIGINT, waits kill_timeout, then SIGKILL.
      kill_timeout:   10_000,   // ms to wait for in-flight requests after SIGINT
      listen_timeout: 10_000,   // ms to wait for app to mark itself as online
      wait_ready:     false,

      // Log to stdout/stderr only — container runtime captures these.
      error_file:   '/dev/null',
      out_file:     '/dev/null',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}

import winston from 'winston'
import { env } from '../config/env.js'

const { combine, timestamp, colorize, printf, json } = winston.format

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp: ts, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
    return `${ts} [${level}] ${message}${metaStr}`
  }),
)

export const logger = winston.createLogger({
  level: env.isDev() ? 'debug' : 'info',
  // In production use JSON to stdout — the container runtime (Docker/K8s)
  // captures stdout and ships it to your log aggregator (CloudWatch, Loki, etc.).
  // File transports are avoided because container filesystems are ephemeral.
  format: env.isDev() ? devFormat : combine(timestamp(), json()),
  transports: [new winston.transports.Console()],
})

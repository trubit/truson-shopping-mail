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
  format: env.isDev() ? devFormat : combine(timestamp(), json()),
  transports: [
    new winston.transports.Console(),
    ...(env.isProd()
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
})

import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

const host = env.EMAIL_HOST
const port = env.EMAIL_PORT
const user = env.EMAIL_USER
const pass = env.EMAIL_PASS
const from = env.EMAIL_FROM

console.log('\n─── SMTP Config ─────────────────────────────────')
console.log('Host:   ', host)
console.log('Port:   ', port, port === 465 ? '(SSL)' : port === 587 ? '(STARTTLS)' : '')
console.log('User:   ', user ? user.slice(0, 12) + '***' : '⚠  NOT SET')
console.log('Pass:   ', pass ? '●'.repeat(8) : '⚠  NOT SET')
console.log('From:   ', from)
console.log('─────────────────────────────────────────────────\n')

if (!user || !pass) {
  console.log('Fill EMAIL_USER and EMAIL_PASS in .env then re-run this test.')
  process.exit(1)
}

const t = nodemailer.createTransport({
  host, port,
  secure: port === 465,
  auth: { user, pass },
  tls: { rejectUnauthorized: false },
})

console.log('Connecting to SMTP server...')
try {
  await t.verify()
  console.log('✓  SMTP connection verified — ready to send emails\n')
} catch (e: unknown) {
  const err = e as NodeJS.ErrnoException & { response?: string; responseCode?: number }
  console.log('✗  Connection failed:')
  console.log('   message:', err.message)
  if (err.code)         console.log('   code:   ', err.code)
  if (err.response)     console.log('   server: ', err.response)
  if (err.responseCode) console.log('   status: ', err.responseCode)
  console.log('')
  if (err.code === 'EAUTH' || err.responseCode === 535) {
    console.log('Fix: Wrong password. For Gmail use an App Password (myaccount.google.com → Security → App passwords)')
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    console.log('Fix: Wrong host or port. Check EMAIL_HOST and EMAIL_PORT in .env')
  }
}
process.exit(0)

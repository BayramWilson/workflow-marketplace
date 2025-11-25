import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mysql from 'mysql2/promise'
import { createAuthRouter } from './route/auth.ts'
import { createCatalogRouter } from './route/catalog.ts'
import { createLibraryRouter } from './route/library.ts'
import { createCheckoutRouter, registerStripeWebhookRoute } from './route/checkout.ts'

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173'
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PW || '',
  database: process.env.DB_NAME || 'my_app_db',
  waitForConnections: true,
  connectionLimit: 10,
})

app.use(cors({ origin: ORIGIN, credentials: true }))
app.use(cookieParser())

// Stripe webhook must use raw body parser and be registered BEFORE express.json()
if (STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET) {
  registerStripeWebhookRoute(app, {
    pool,
    jwtSecret: JWT_SECRET,
    stripeSecretKey: STRIPE_SECRET_KEY,
    origin: ORIGIN,
    webhookSecret: STRIPE_WEBHOOK_SECRET,
  })
}

app.use(express.json())

// mount auth routes
app.use('/api', createAuthRouter({ pool, jwtSecret: JWT_SECRET }))
// mount catalog routes
app.use('/api', createCatalogRouter({ pool }))
// mount library routes
app.use('/api', createLibraryRouter({ pool, jwtSecret: JWT_SECRET }))
// mount checkout routes
if (STRIPE_SECRET_KEY) {
  app.use(
    '/api',
    createCheckoutRouter({
      pool,
      jwtSecret: JWT_SECRET,
      stripeSecretKey: STRIPE_SECRET_KEY,
      origin: ORIGIN,
      webhookSecret: STRIPE_WEBHOOK_SECRET,
    })
  )
}

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})



import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mysql from 'mysql2/promise'
import { createAuthRouter } from './route/auth.ts'
import { createCatalogRouter } from './route/catalog.ts'
import { createLibraryRouter } from './route/library.ts'
import { createSellerRouter } from './route/seller.ts'

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173'

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PW || '',
  database: process.env.DB_NAME || 'my_app_db',
  waitForConnections: true,
  connectionLimit: 10,
})

app.use(cors({ origin: ORIGIN, credentials: true }))
app.use(express.json())
app.use(cookieParser())

// mount auth routes
app.use('/api', createAuthRouter({ pool, jwtSecret: JWT_SECRET }))
// mount catalog routes
app.use('/api', createCatalogRouter({ pool }))
// mount library routes
app.use('/api', createLibraryRouter({ pool, jwtSecret: JWT_SECRET }))
// mount seller routes
app.use('/api', createSellerRouter({ pool, jwtSecret: JWT_SECRET }))

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})



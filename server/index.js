import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import argon2 from 'argon2'
import mysql from 'mysql2/promise'

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

function isStrongPassword(pw) {
  return (
    typeof pw === 'string' &&
    pw.length >= 12 &&
    /[a-z]/.test(pw) &&
    /[A-Z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  )
}

function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  res.cookie('auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set true behind HTTPS/proxy
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

function clearAuthCookie(res) {
  res.clearCookie('auth', { path: '/' })
}

async function getUserByEmail(email) {
  const [rows] = await pool.query(
    'SELECT id, email, password_hash, display_name, avatar_url, bio FROM users WHERE email = ? LIMIT 1',
    [email]
  )
  return rows[0]
}

async function getUserById(id) {
  const [rows] = await pool.query(
    'SELECT id, email, display_name, avatar_url, bio FROM users WHERE id = ? LIMIT 1',
    [id]
  )
  return rows[0]
}

async function getUserByDisplayName(displayName) {
  const [rows] = await pool.query(
    'SELECT id, email, display_name FROM users WHERE display_name = ? LIMIT 1',
    [displayName]
  )
  return rows[0]
}

function requireAuth(req, res, next) {
  const token = req.cookies?.auth
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.id
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

app.post('/api/auth/register', async (req, res) => {
  try {
    let { email, displayName, password } = req.body || {}
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Missing fields' })
    }
    email = String(email).trim().toLowerCase()
    displayName = String(displayName).trim()
    if (displayName.length < 3) {
      return res.status(400).json({ error: 'Anzeigename zu kurz (mind. 3 Zeichen)' })
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'Passwort zu schwach (mind. 12 Zeichen inkl. Groß‑, Kleinbuchstaben, Ziffer & Sonderzeichen)' })
    }
    const existingEmail = await getUserByEmail(email)
    if (existingEmail) return res.status(409).json({ error: 'E‑Mail bereits registriert' })
    const existingName = await getUserByDisplayName(displayName)
    if (existingName) return res.status(409).json({ error: 'Anzeigename bereits vergeben' })
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id })
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, display_name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [email, passwordHash, displayName]
    )
    const user = { id: result.insertId, email, displayName }
    setAuthCookie(res, { id: user.id })
    res.json(user)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' })
    const user = await getUserByEmail(email)
    if (!user) return res.status(401).json({ error: 'Ungültige Zugangsdaten' })
    const ok = await argon2.verify(user.password_hash, password)
    if (!ok) return res.status(401).json({ error: 'Ungültige Zugangsdaten' })
    setAuthCookie(res, { id: user.id })
    res.json({ id: user.id, email: user.email, displayName: user.display_name, avatarUrl: user.avatar_url, bio: user.bio })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/auth/logout', (req, res) => {
  clearAuthCookie(res)
  res.json({ success: true })
})

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.userId)
    res.json(user)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

app.put('/api/profile', requireAuth, async (req, res) => {
  try {
    const { displayName, avatarUrl, bio } = req.body || {}
    if (displayName) {
      const name = String(displayName).trim()
      if (name.length < 3) {
        return res.status(400).json({ error: 'Anzeigename zu kurz (mind. 3 Zeichen)' })
      }
      const existing = await getUserByDisplayName(name)
      if (existing && existing.id !== req.userId) {
        return res.status(409).json({ error: 'Anzeigename bereits vergeben' })
      }
    }
    await pool.query(
      'UPDATE users SET display_name = ?, avatar_url = ?, bio = ?, updated_at = NOW() WHERE id = ?',
      [displayName ?? null, avatarUrl ?? null, bio ?? null, req.userId]
    )
    const user = await getUserById(req.userId)
    res.json(user)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})



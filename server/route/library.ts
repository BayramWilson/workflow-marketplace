import express from 'express'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'

export function createLibraryRouter({ pool, jwtSecret }) {
  const router = express.Router()

  function requireAuth(req, res, next) {
    const token = req.cookies?.auth
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    try {
      const payload = jwt.verify(token, jwtSecret)
      req.userId = payload.id
      next()
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  router.get('/library', requireAuth, async (req, res) => {
    try {
      const userId = req.userId
      const [rows] = await pool.query(
        `
        SELECT
          p.id                   AS purchaseId,
          p.purchased_at         AS purchasedAt,
          p.download_count       AS downloadCount,
          p.last_accessed_at     AS lastAccessedAt,
          w.id                   AS workflowId,
          w.title                AS title,
          w.price                AS price,
          w.currency             AS currency
        FROM workflow_purchases p
        JOIN workflows w ON w.id = p.workflow_id
        WHERE p.buyer_id = ?
        ORDER BY p.purchased_at DESC
        `,
        [userId]
      )
      const items = (rows as any[]).map(r => ({
        purchaseId: r.purchaseId,
        workflow: {
          id: r.workflowId,
          title: r.title,
          price: Number(r.price),
          currency: r.currency,
        },
        purchasedAt: r.purchasedAt,
        downloadCount: r.downloadCount,
        lastAccessedAt: r.lastAccessedAt,
      }))
      res.json(items)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  router.post('/library/:purchaseId/access', requireAuth, async (req, res) => {
    try {
      const userId = req.userId
      const purchaseId = Number(req.params.purchaseId)
      if (!Number.isFinite(purchaseId)) return res.status(400).json({ error: 'Invalid purchaseId' })

      const [rows] = await pool.query(
        `SELECT id FROM workflow_purchases WHERE id = ? AND buyer_id = ? LIMIT 1`,
        [purchaseId, userId]
      )
      if (!(rows as any[])[0]) return res.status(404).json({ error: 'Not found' })

      await pool.query(
        `UPDATE workflow_purchases SET download_count = download_count + 1, last_accessed_at = NOW() WHERE id = ?`,
        [purchaseId]
      )
      res.status(204).end()
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  router.get('/library/:purchaseId/download', requireAuth, async (req, res) => {
    try {
      const userId = req.userId
      const purchaseId = Number(req.params.purchaseId)
      if (!Number.isFinite(purchaseId)) return res.status(400).json({ error: 'Invalid purchaseId' })

      const [rows] = await pool.query(
        `
        SELECT p.id AS purchaseId, w.file_storage_path AS filePath, w.title AS title
        FROM workflow_purchases p
        JOIN workflows w ON w.id = p.workflow_id
        WHERE p.id = ? AND p.buyer_id = ? LIMIT 1
        `,
        [purchaseId, userId]
      )
      const rec = (rows as any[])[0]
      if (!rec) return res.status(404).json({ error: 'Not found' })

      const rawPath: string | null = rec.filePath
      if (!rawPath) return res.status(404).json({ error: 'File not available' })

      // Resolve file path safely; allow absolute, otherwise relative to project root
      const resolved = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
      let stat: fs.Stats
      try {
        stat = await fsp.stat(resolved)
      } catch {
        return res.status(404).json({ error: 'File missing' })
      }
      if (!stat.isFile()) return res.status(404).json({ error: 'File missing' })

      // Update counters (fire and forget; don't block download on failure)
      pool.query(
        `UPDATE workflow_purchases SET download_count = download_count + 1, last_accessed_at = NOW() WHERE id = ?`,
        [purchaseId]
      ).catch(() => {})

      const safeBase = String(rec.title || 'workflow').replace(/[^a-z0-9-_]+/gi, '_') || 'workflow'
      const ext = (path.extname(resolved) || '.json').toLowerCase()
      const filename = `${safeBase}${ext}`
      const contentType = ext === '.json' ? 'application/json' : 'application/octet-stream'
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      const stream = fs.createReadStream(resolved)
      stream.on('error', () => {
        res.destroy()
      })
      stream.pipe(res)
    } catch (e) {
      console.error(e)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Server error' })
      }
    }
  })

  // Simulated checkout: create PAID order, order_item, and library purchase
  router.post('/purchase/:workflowId', requireAuth, async (req, res) => {
    const conn = await pool.getConnection()
    try {
      const userId = req.userId
      const workflowId = Number(req.params.workflowId)
      if (!Number.isFinite(workflowId)) return res.status(400).json({ error: 'Invalid workflowId' })

      // Fetch workflow details
      const [wrows] = await conn.query(
        `SELECT id, seller_id, price, currency, status FROM workflows WHERE id = ? LIMIT 1`,
        [workflowId]
      )
      const wf = wrows[0]
      if (!wf) return res.status(404).json({ error: 'Workflow not found' })
      if (String(wf.status).toUpperCase() !== 'PUBLISHED') {
        return res.status(400).json({ error: 'Workflow not available for purchase' })
      }

      // If already owned, return 200 with existing purchase id
      const [prow] = await conn.query(
        `SELECT id FROM workflow_purchases WHERE buyer_id = ? AND workflow_id = ? LIMIT 1`,
        [userId, workflowId]
      )
      if (prow[0]) {
        return res.json({ purchaseId: prow[0].id })
      }

      await conn.beginTransaction()
      // Create PAID order
      const total = Number(wf.price) || 0
      const currency = wf.currency || 'USD'
      const [orderRes] = await conn.query(
        `INSERT INTO orders (buyer_id, total_amount, currency, platform_fee_amount, status, created_at, paid_at)
         VALUES (?, ?, ?, 0.00, 'PAID', NOW(), NOW())`,
        [userId, total, currency]
      )
      const orderId = orderRes.insertId

      // Create order item and compute seller earnings (no fee here)
      const unit = Number(wf.price) || 0
      await conn.query(
        `INSERT INTO order_items (order_id, workflow_id, seller_id, unit_price, platform_fee_amount, seller_earnings)
         VALUES (?, ?, ?, ?, 0.00, ?)`,
        [orderId, workflowId, wf.seller_id, unit, unit]
      )

      // Create library purchase
      const [purchaseRes] = await conn.query(
        `INSERT INTO workflow_purchases (buyer_id, workflow_id, order_id, purchased_at, last_accessed_at, download_count)
         VALUES (?, ?, ?, NOW(), NULL, 0)`,
        [userId, workflowId, orderId]
      )
      // increment purchase counter if column exists
      try {
        await conn.query(`UPDATE workflows SET purchase_count = COALESCE(purchase_count, 0) + 1 WHERE id = ?`, [workflowId])
      } catch {}
      await conn.commit()

      res.status(201).json({ purchaseId: purchaseRes.insertId })
    } catch (e) {
      try {
        await conn.rollback()
      } catch {}
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    } finally {
      conn.release()
    }
  })

  return router
}



import express from 'express'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import multer from 'multer'
import jwt from 'jsonwebtoken'

type CreateSellerRouterArgs = {
  pool: any
  jwtSecret: string
}

export function createSellerRouter({ pool, jwtSecret }: CreateSellerRouterArgs) {
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

  // ensure storage dir
  const storageRoot = path.resolve(process.cwd(), 'storage', 'workflows')
  fs.mkdirSync(storageRoot, { recursive: true })

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, storageRoot),
      filename: (req, file, cb) => {
        const safeBase = String(file.originalname || 'artifact').replace(/[^a-z0-9._-]+/gi, '_')
        const stamp = Date.now()
        cb(null, `${req.userId || 'user'}_${stamp}_${safeBase}`)
      },
    }),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  })

  async function assertOwnership(workflowId: number, userId: number) {
    const [rows] = await pool.query(
      `SELECT id FROM workflows WHERE id = ? AND seller_id = ? LIMIT 1`,
      [workflowId, userId]
    )
    return !!rows?.[0]
  }

  function normalizeString(v: any, max?: number) {
    if (v === null || v === undefined) return null
    const s = String(v).trim()
    if (!s) return null
    return typeof max === 'number' ? s.slice(0, max) : s
  }

  async function upsertTagsForWorkflow(conn, workflowId: number, tagSlugs: string[]) {
    if (!Array.isArray(tagSlugs) || tagSlugs.length === 0) return
    // fetch tag ids
    const [tagRows] = await conn.query(
      `SELECT id, slug FROM workflow_tags WHERE slug IN (${tagSlugs.map(() => '?').join(',')})`,
      tagSlugs
    )
    const tagIds = new Set<number>(tagRows.map((r) => Number(r.id)))
    if (tagIds.size === 0) return
    // remove existing then insert
    await conn.query(`DELETE FROM workflow_tag_assignments WHERE workflow_id = ?`, [workflowId])
    const values = Array.from(tagIds).map((id) => [workflowId, id])
    await conn.query(
      `INSERT INTO workflow_tag_assignments (workflow_id, tag_id) VALUES ${values
        .map(() => '(?, ?)')
        .join(',')}`,
      values.flat()
    )
  }

  // List seller's workflows
  router.get('/seller/workflows', requireAuth, async (req, res) => {
    try {
      const userId = req.userId
      const { status } = req.query as Record<string, string | undefined>
      const where = ['w.seller_id = ?']
      const params: any[] = [userId]
      if (status) {
        where.push('w.status = ?')
        params.push(String(status).toUpperCase())
      }
      const [rows] = await pool.query(
        `
        SELECT
          w.id,
          w.seller_id AS sellerId,
          w.category_id AS categoryId,
          w.title,
          w.short_description AS shortDescription,
          w.description,
          w.platform_type AS platformType,
          w.price,
          w.currency,
          w.delivery_type AS deliveryType,
          w.status,
          w.created_at AS createdAt,
          w.updated_at AS updatedAt,
          w.purchase_count AS purchaseCount,
          COALESCE(SUM(p.download_count), 0) AS downloadTotal,
          c.name AS categoryName,
          c.slug AS categorySlug
        FROM workflows w
        LEFT JOIN workflow_purchases p ON p.workflow_id = w.id
        LEFT JOIN workflow_categories c ON c.id = w.category_id
        WHERE ${where.join(' AND ')}
        GROUP BY w.id
        ORDER BY w.updated_at DESC
        `,
        params
      )
      // attach tags
      const ids = rows.map((r) => Number(r.id))
      let tagMap: Record<number, string[]> = {}
      if (ids.length > 0) {
        const [tagRows] = await pool.query(
          `
          SELECT wta.workflow_id AS workflowId, t.slug
          FROM workflow_tag_assignments wta
          JOIN workflow_tags t ON t.id = wta.tag_id
          WHERE wta.workflow_id IN (${ids.map(() => '?').join(',')})
          ORDER BY t.slug
          `,
          ids
        )
        tagMap = tagRows.reduce((acc, r) => {
          const wid = Number(r.workflowId)
          acc[wid] = acc[wid] || []
          acc[wid].push(r.slug)
          return acc
        }, {} as Record<number, string[]>)
      }
      const items = rows.map((r) => ({
        id: r.id,
        sellerId: r.sellerId,
        categoryId: r.categoryId,
        title: r.title,
        shortDescription: r.shortDescription,
        description: r.description,
        platformType: r.platformType,
        price: Number(r.price),
        currency: r.currency,
        deliveryType: r.deliveryType,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        purchaseCount: r.purchaseCount ?? 0,
        downloadTotal: Number(r.downloadTotal ?? 0),
        category: r.categoryId
          ? { id: r.categoryId, name: r.categoryName, slug: r.categorySlug }
          : null,
        tags: tagMap[Number(r.id)] || [],
      }))
      res.json({ items })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Create draft workflow
  router.post('/seller/workflows', requireAuth, async (req, res) => {
    const conn = await pool.getConnection()
    try {
      const userId = req.userId
      const body = req.body || {}
      const title = normalizeString(body.title, 255)
      if (!title) return res.status(400).json({ error: 'Titel ist erforderlich' })
      const shortDescription = normalizeString(body.shortDescription, 512)
      const description = normalizeString(body.description)
      const platformType = normalizeString(body.platformType, 64)
      const deliveryType = normalizeString(body.deliveryType, 64)
      const price = Number(body.price ?? 0)
      if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: 'Ungültiger Preis' })
      const currency = normalizeString(body.currency, 3) || 'USD'
      const categoryId = body.categoryId ? Number(body.categoryId) : null
      const tagSlugs: string[] = Array.isArray(body.tags) ? body.tags.map((t) => String(t)) : []

      await conn.beginTransaction()
      const [resInsert] = await conn.query(
        `
        INSERT INTO workflows
          (seller_id, category_id, title, short_description, description, platform_type, price, currency, delivery_type, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', NOW(), NOW())
        `,
        [userId, categoryId, title, shortDescription, description, platformType, price, currency, deliveryType]
      )
      const workflowId = resInsert.insertId
      await upsertTagsForWorkflow(conn, workflowId, tagSlugs)
      await conn.commit()
      res.status(201).json({ id: workflowId })
    } catch (e) {
      try { await conn.rollback() } catch {}
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    } finally {
      conn.release()
    }
  })

  // Update draft fields (non-status)
  router.put('/seller/workflows/:id', requireAuth, async (req, res) => {
    const conn = await pool.getConnection()
    try {
      const userId = req.userId
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })
      if (!(await assertOwnership(id, userId))) return res.status(404).json({ error: 'Not found' })

      const body = req.body || {}
      const title = normalizeString(body.title, 255)
      const shortDescription = normalizeString(body.shortDescription, 512)
      const description = normalizeString(body.description)
      const platformType = normalizeString(body.platformType, 64)
      const deliveryType = normalizeString(body.deliveryType, 64)
      const priceRaw = body.price
      const currency = normalizeString(body.currency, 3)
      const categoryId = body.categoryId === null ? null : (body.categoryId !== undefined ? Number(body.categoryId) : undefined)
      const tagSlugs: string[] | undefined = Array.isArray(body.tags) ? body.tags.map((t) => String(t)) : undefined

      const sets = []
      const params: any[] = []
      if (title !== null) { sets.push('title = ?'); params.push(title) }
      if (shortDescription !== null) { sets.push('short_description = ?'); params.push(shortDescription) }
      if (description !== null) { sets.push('description = ?'); params.push(description) }
      if (platformType !== null) { sets.push('platform_type = ?'); params.push(platformType) }
      if (deliveryType !== null) { sets.push('delivery_type = ?'); params.push(deliveryType) }
      if (priceRaw !== undefined) {
        const p = Number(priceRaw)
        if (!Number.isFinite(p) || p < 0) return res.status(400).json({ error: 'Ungültiger Preis' })
        sets.push('price = ?'); params.push(p)
      }
      if (currency !== null) { sets.push('currency = ?'); params.push(currency) }
      if (categoryId !== undefined) { sets.push('category_id = ?'); params.push(categoryId) }
      if (sets.length === 0 && tagSlugs === undefined) {
        return res.status(400).json({ error: 'Keine Änderungen' })
      }
      await conn.beginTransaction()
      if (sets.length > 0) {
        sets.push('updated_at = NOW()')
        await conn.query(`UPDATE workflows SET ${sets.join(', ')} WHERE id = ? AND seller_id = ?`, [...params, id, userId])
      }
      if (tagSlugs !== undefined) {
        await upsertTagsForWorkflow(conn, id, tagSlugs)
      }
      await conn.commit()
      res.status(204).end()
    } catch (e) {
      try { await conn.rollback() } catch {}
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    } finally {
      conn.release()
    }
  })

  // Upload artifact
  router.post('/seller/workflows/:id/artifact', requireAuth, upload.single('file'), async (req, res) => {
    try {
      const userId = req.userId
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })
      if (!(await assertOwnership(id, userId))) return res.status(404).json({ error: 'Not found' })
      const file = req.file
      if (!file) return res.status(400).json({ error: 'Datei erforderlich' })
      const relPath = path.relative(process.cwd(), file.path)
      await pool.query(
        `UPDATE workflows SET file_storage_path = ?, file_size_bytes = ?, updated_at = NOW() WHERE id = ? AND seller_id = ?`,
        [relPath, file.size, id, userId]
      )
      res.json({ path: relPath, size: file.size })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Validate readiness for publish
  router.post('/seller/workflows/:id/validate', requireAuth, async (req, res) => {
    try {
      const userId = req.userId
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })
      if (!(await assertOwnership(id, userId))) return res.status(404).json({ error: 'Not found' })
      const [rows] = await pool.query(
        `SELECT title, price, delivery_type AS deliveryType, file_storage_path AS filePath, description FROM workflows WHERE id = ? LIMIT 1`,
        [id]
      )
      const wf = rows?.[0]
      if (!wf) return res.status(404).json({ error: 'Not found' })
      const issues: string[] = []
      if (!wf.title) issues.push('Titel fehlt')
      if (!(Number(wf.price) >= 0)) issues.push('Preis ungültig')
      if (!wf.deliveryType) issues.push('Delivery‑Typ fehlt')
      if (String(wf.deliveryType).toUpperCase() === 'FILE' && !wf.filePath) {
        issues.push('Datei muss hochgeladen werden')
      }
      // basic JSON validation if file exists and seems JSON
      if (wf.filePath && /\.json$/i.test(String(wf.filePath))) {
        try {
          const full = path.isAbsolute(wf.filePath) ? wf.filePath : path.resolve(process.cwd(), wf.filePath)
          const buf = await fsp.readFile(full, 'utf-8')
          JSON.parse(buf)
        } catch {
          issues.push('JSON‑Datei ist ungültig')
        }
      }
      res.json({ ok: issues.length === 0, issues })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // Publish
  router.post('/seller/workflows/:id/publish', requireAuth, async (req, res) => {
    const conn = await pool.getConnection()
    try {
      const userId = req.userId
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })
      if (!(await assertOwnership(id, userId))) return res.status(404).json({ error: 'Not found' })

      // run validations
      const [rows] = await conn.query(
        `SELECT title, price, delivery_type AS deliveryType, file_storage_path AS filePath FROM workflows WHERE id = ? LIMIT 1`,
        [id]
      )
      const wf = rows?.[0]
      const issues: string[] = []
      if (!wf?.title) issues.push('Titel fehlt')
      if (!(Number(wf?.price) >= 0)) issues.push('Preis ungültig')
      if (!wf?.deliveryType) issues.push('Delivery‑Typ fehlt')
      if (String(wf?.deliveryType || '').toUpperCase() === 'FILE' && !wf?.filePath) {
        issues.push('Datei muss hochgeladen werden')
      }
      if (issues.length > 0) {
        return res.status(400).json({ error: 'Validierung fehlgeschlagen', issues })
      }
      await conn.query(
        `UPDATE workflows SET status = 'PUBLISHED', updated_at = NOW() WHERE id = ? AND seller_id = ?`,
        [id, userId]
      )
      res.status(204).end()
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    } finally {
      conn.release()
    }
  })

  // Unpublish
  router.post('/seller/workflows/:id/unpublish', requireAuth, async (req, res) => {
    try {
      const userId = req.userId
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })
      if (!(await assertOwnership(id, userId))) return res.status(404).json({ error: 'Not found' })
      await pool.query(
        `UPDATE workflows SET status = 'DRAFT', updated_at = NOW() WHERE id = ? AND seller_id = ?`,
        [id, userId]
      )
      res.status(204).end()
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  return router
}



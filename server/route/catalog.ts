import express from 'express'

export function createCatalogRouter({ pool }) {
  const router = express.Router()

  router.get('/workflows', async (req, res) => {
    try {
      const {
        status = 'published',
        category,
        categoryId,
        tags,
        q,
        platformType,
        sort = 'newest',
        page = '1',
        pageSize = '20',
      } = req.query as Record<string, string | undefined>

      const pageNum = Math.max(1, parseInt(String(page || '1'), 10) || 1)
      const sizeNum = Math.min(100, Math.max(1, parseInt(String(pageSize || '20'), 10) || 20))
      const offset = (pageNum - 1) * sizeNum

      const where = []
      const params = []

      if (status) {
        // normalize to upper-case to match schema default like 'DRAFT', 'PUBLISHED'
        where.push('w.status = ?')
        params.push(String(status).toUpperCase())
      }

      let joinTags = false
      let tagList = []
      if (tags) {
        tagList = String(tags)
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
        if (tagList.length > 0) {
          joinTags = true
        }
      }

      if (categoryId) {
        where.push('w.category_id = ?')
        params.push(Number(categoryId))
      } else if (category) {
        where.push('c.slug = ?')
        params.push(String(category))
      }

      if (platformType) {
        where.push('w.platform_type = ?')
        params.push(String(platformType))
      }

      if (q) {
        const like = `%${String(q).trim()}%`
        where.push('(w.title LIKE ? OR w.short_description LIKE ? OR w.description LIKE ?)')
        params.push(like, like, like)
      }

      // additional joins applied conditionally (base joins for seller/category are already in the main query)
      const joins = []
      if (joinTags) {
        joins.push(
          'INNER JOIN workflow_tag_assignments wta ON wta.workflow_id = w.id',
          'INNER JOIN workflow_tags tfilter ON tfilter.id = wta.tag_id'
        )
        where.push(`tfilter.slug IN (${tagList.map(() => '?').join(',')})`)
        params.push(...tagList)
      }

      const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

      let orderBy = 'w.created_at DESC'
      if (sort === 'price_asc') orderBy = 'w.price ASC'
      else if (sort === 'price_desc') orderBy = 'w.price DESC'
      else if (sort === 'updated') orderBy = 'w.updated_at DESC'

      // data query with aggregation for tags
      const dataSql = `
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
          s.display_name AS sellerDisplayName,
          s.avatar_url AS sellerAvatarUrl,
          c.name AS categoryName,
          c.slug AS categorySlug,
          GROUP_CONCAT(DISTINCT t.slug ORDER BY t.slug SEPARATOR ',') AS tagSlugs
        FROM workflows w
        LEFT JOIN users s ON s.id = w.seller_id
        LEFT JOIN workflow_categories c ON c.id = w.category_id
        LEFT JOIN workflow_tag_assignments wta2 ON wta2.workflow_id = w.id
        LEFT JOIN workflow_tags t ON t.id = wta2.tag_id
        ${joins.length ? joins.join(' ') : ''}
        ${whereSql}
        GROUP BY w.id
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `
      const dataParams = [...params, sizeNum, offset]

      const countSql = `
        SELECT COUNT(DISTINCT w.id) AS total
        FROM workflows w
        LEFT JOIN workflow_categories c ON c.id = w.category_id
        ${joinTags ? 'INNER JOIN workflow_tag_assignments wta ON wta.workflow_id = w.id INNER JOIN workflow_tags tfilter ON tfilter.id = wta.tag_id' : ''}
        ${whereSql}
      `
      const [rows] = await pool.query(dataSql, dataParams)
      const [countRows] = await pool.query(countSql, params)
      const total = countRows?.[0]?.total ?? 0

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
        seller: {
          id: r.sellerId,
          displayName: r.sellerDisplayName,
          avatarUrl: r.sellerAvatarUrl,
        },
        category: r.categoryId
          ? {
              id: r.categoryId,
              name: r.categoryName,
              slug: r.categorySlug,
            }
          : null,
        tags: r.tagSlugs ? String(r.tagSlugs).split(',') : [],
      }))

      res.json({
        items,
        page: pageNum,
        pageSize: sizeNum,
        total,
      })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  router.get('/workflows/:id', async (req, res) => {
    try {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })

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
          s.display_name AS sellerDisplayName,
          s.avatar_url AS sellerAvatarUrl,
          c.name AS categoryName,
          c.slug AS categorySlug
        FROM workflows w
        LEFT JOIN users s ON s.id = w.seller_id
        LEFT JOIN workflow_categories c ON c.id = w.category_id
        WHERE w.id = ?
        LIMIT 1
        `,
        [id]
      )

      const wf = rows?.[0]
      if (!wf) return res.status(404).json({ error: 'Not found' })

      const [tagRows] = await pool.query(
        `
        SELECT t.slug
        FROM workflow_tag_assignments wta
        INNER JOIN workflow_tags t ON t.id = wta.tag_id
        WHERE wta.workflow_id = ?
        ORDER BY t.slug
        `,
        [id]
      )

      const tags = tagRows.map((r) => r.slug)

      res.json({
        id: wf.id,
        sellerId: wf.sellerId,
        categoryId: wf.categoryId,
        title: wf.title,
        shortDescription: wf.shortDescription,
        description: wf.description,
        platformType: wf.platformType,
        price: Number(wf.price),
        currency: wf.currency,
        deliveryType: wf.deliveryType,
        status: wf.status,
        createdAt: wf.createdAt,
        updatedAt: wf.updatedAt,
        purchaseCount: wf.purchaseCount ?? 0,
        seller: {
          id: wf.sellerId,
          displayName: wf.sellerDisplayName,
          avatarUrl: wf.sellerAvatarUrl,
        },
        category: wf.categoryId
          ? {
              id: wf.categoryId,
              name: wf.categoryName,
              slug: wf.categorySlug,
            }
          : null,
        tags,
      })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  router.get('/categories', async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT id, name, slug, parent_id AS parentId, sort_order AS sortOrder
        FROM workflow_categories
        ORDER BY sort_order ASC, name ASC
        `
      )
      res.json(rows)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  router.get('/tags', async (_req, res) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT id, name, slug
        FROM workflow_tags
        ORDER BY name ASC
        `
      )
      res.json(rows)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  return router
}


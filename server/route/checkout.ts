import express from 'express'
import jwt from 'jsonwebtoken'
import Stripe from 'stripe'

type Deps = {
  pool: any
  jwtSecret: string
  stripeSecretKey: string
  origin: string
  webhookSecret?: string | null
}

function requireAuthFactory(jwtSecret: string) {
  return function requireAuth(req: any, res: any, next: any) {
    const token = req.cookies?.auth
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    try {
      const payload = jwt.verify(token, jwtSecret) as any
      req.userId = payload.id
      next()
    } catch {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }
}

export function createCheckoutRouter({ pool, jwtSecret, stripeSecretKey, origin }: Deps) {
  const router = express.Router()
  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-10-28.acacia' })
  const requireAuth = requireAuthFactory(jwtSecret)

  router.post('/checkout/session', requireAuth, async (req, res) => {
    const userId = req.userId as number
    const { workflowId, items } = (req.body || {}) as {
      workflowId?: number
      items?: Array<{ workflowId: number; quantity?: number }>
    }
    try {
      const conn = await pool.getConnection()
      try {
        // Resolve cart items
        let cart: Array<{ id: number; title: string; price: number; currency: string; seller_id: number }> = []
        if (Array.isArray(items) && items.length > 0) {
          const ids = items.map((i) => Number(i.workflowId)).filter((n) => Number.isFinite(n))
          if (ids.length === 0) return res.status(400).json({ error: 'No valid items' })
          const [rows] = await conn.query(
            `SELECT id, title, price, currency, seller_id FROM workflows WHERE id IN (${ids.map(() => '?').join(',')}) AND status = 'PUBLISHED'`,
            ids
          )
          cart = (rows as any[]).map((r) => ({
            id: r.id,
            title: r.title,
            price: Number(r.price),
            currency: String(r.currency || 'USD'),
            seller_id: Number(r.seller_id),
          }))
        } else if (Number.isFinite(Number(workflowId))) {
          const idNum = Number(workflowId)
          const [rows] = await conn.query(
            `SELECT id, title, price, currency, seller_id FROM workflows WHERE id = ? AND status = 'PUBLISHED' LIMIT 1`,
            [idNum]
          )
          const wf = (rows as any[])[0]
          if (!wf) return res.status(404).json({ error: 'Workflow not found' })
          cart = [
            {
              id: wf.id,
              title: wf.title,
              price: Number(wf.price),
              currency: String(wf.currency || 'USD'),
              seller_id: Number(wf.seller_id),
            },
          ]
        } else {
          return res.status(400).json({ error: 'Missing workflowId or items' })
        }

        // Normalize currency (assume same currency across items for now)
        const currency = cart[0]?.currency || 'USD'
        const total = cart.reduce((sum, it) => sum + (Number.isFinite(it.price) ? it.price : 0), 0)

        await conn.beginTransaction()
        const [orderRes] = await conn.query(
          `INSERT INTO orders (buyer_id, total_amount, currency, platform_fee_amount, status, created_at, paid_at)
           VALUES (?, ?, ?, 0.00, 'PENDING', NOW(), NULL)`,
          [userId, total, currency]
        )
        const orderId = (orderRes as any).insertId as number

        for (const it of cart) {
          const unit = it.price
          const platformFee = 0.0
          const sellerEarnings = unit - platformFee
          await conn.query(
            `INSERT INTO order_items (order_id, workflow_id, seller_id, unit_price, platform_fee_amount, seller_earnings)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderId, it.id, it.seller_id, unit, platformFee, sellerEarnings]
          )
        }
        await conn.commit()

        const successUrl = `${origin}/library?success=1`
        const cancelUrl = `${origin}/workflows/${cart[0].id}?canceled=1`

        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.map((it) => ({
          price_data: {
            currency,
            unit_amount: Math.round(Number(it.price) * 100),
            product_data: {
              name: it.title,
            },
          },
          quantity: 1,
        }))

        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          line_items: lineItems,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            orderId: String(orderId),
            buyerId: String(userId),
            workflowIds: cart.map((c) => c.id).join(','),
          },
        })

        await conn.query(
          `UPDATE orders SET stripe_checkout_session_id = ? WHERE id = ?`,
          [session.id, orderId]
        )

        return res.json({ sessionId: session.id, url: session.url })
      } catch (e) {
        try { await (conn as any).rollback() } catch {}
        throw e
      } finally {
        ;(conn as any).release()
      }
    } catch (e) {
      console.error(e)
      return res.status(500).json({ error: 'Server error' })
    }
  })

  return router
}

export function registerStripeWebhookRoute(app: any, { pool, stripeSecretKey, webhookSecret }: Deps) {
  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-10-28.acacia' })
  const endpointSecret = webhookSecret || null

  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req: any, res: any) => {
    const sig = req.headers['stripe-signature']
    let event: Stripe.Event
    try {
      if (!endpointSecret) {
        return res.status(500).send('Webhook secret missing')
      }
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed.', err?.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = Number(session.metadata?.orderId || '0')
      const buyerId = Number(session.metadata?.buyerId || '0')
      const workflowIds = String(session.metadata?.workflowIds || '')
        .split(',')
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n))

      const conn = await pool.getConnection()
      try {
        await conn.beginTransaction()

        await conn.query(
          `UPDATE orders SET status = 'PAID', paid_at = NOW(), stripe_payment_intent_id = ? WHERE id = ?`,
          [session.payment_intent ?? null, orderId]
        )

        for (const wfId of workflowIds) {
          try {
            const [existing] = await conn.query(
              `SELECT id FROM workflow_purchases WHERE buyer_id = ? AND workflow_id = ? LIMIT 1`,
              [buyerId, wfId]
            )
            if (!(existing as any[])[0]) {
              const [purchaseRes] = await conn.query(
                `INSERT INTO workflow_purchases (buyer_id, workflow_id, order_id, purchased_at, last_accessed_at, download_count)
                 VALUES (?, ?, ?, NOW(), NULL, 0)`,
                [buyerId, wfId, orderId]
              )
              void purchaseRes
              try {
                await conn.query(
                  `UPDATE workflows SET purchase_count = COALESCE(purchase_count, 0) + 1 WHERE id = ?`,
                  [wfId]
                )
              } catch {}
            }
          } catch (e) {
            // continue other items; unique constraint or any error on one shouldn't block others
          }
        }

        await conn.commit()
      } catch (e) {
        try { await conn.rollback() } catch {}
        console.error('Webhook handler failed', e)
        return res.status(500).send('Webhook processing error')
      } finally {
        conn.release()
      }
    }

    res.json({ received: true })
  })
}



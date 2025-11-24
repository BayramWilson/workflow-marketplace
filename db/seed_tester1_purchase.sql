USE `my_app_db`;

-- Resolve IDs
SET @buyer_id = (SELECT id FROM users WHERE display_name = 'tester1' LIMIT 1);
SET @workflow_id = (SELECT id FROM workflows WHERE title = 'n8n: Gmail → Slack Alert' LIMIT 1);
SET @already = (SELECT id FROM workflow_purchases WHERE buyer_id = @buyer_id AND workflow_id = @workflow_id LIMIT 1);

-- Create PAID order if user/workflow exist and not purchased yet
INSERT INTO orders (buyer_id, total_amount, currency, platform_fee_amount, status, created_at, paid_at)
SELECT
  @buyer_id,
  w.price,
  w.currency,
  0.00,
  'PAID',
  NOW(),
  NOW()
FROM workflows w
WHERE w.id = @workflow_id
  AND @buyer_id IS NOT NULL
  AND @already IS NULL;

-- Capture last inserted order id
SET @order_id = LAST_INSERT_ID();

-- Insert order item if an order was created
INSERT INTO order_items (order_id, workflow_id, seller_id, unit_price, platform_fee_amount, seller_earnings)
SELECT
  @order_id,
  w.id,
  w.seller_id,
  w.price,
  0.00,
  w.price
FROM workflows w
WHERE w.id = @workflow_id
  AND @order_id > 0
  AND @already IS NULL;

-- Insert library purchase
INSERT INTO workflow_purchases (buyer_id, workflow_id, order_id, purchased_at, last_accessed_at, download_count)
SELECT
  @buyer_id,
  @workflow_id,
  @order_id,
  NOW(),
  NULL,
  0
WHERE @order_id > 0
  AND @already IS NULL;

-- Increment purchase_count for the workflow if we created a purchase
UPDATE workflows
SET purchase_count = COALESCE(purchase_count, 0) + 1
WHERE id = @workflow_id
  AND @order_id > 0
  AND @already IS NULL;



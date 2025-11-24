USE `my_app_db`;

-- Seller user (id auto)
INSERT INTO users (email, password_hash, display_name, is_admin, created_at, updated_at)
VALUES ('seller@example.com', '$argon2id$v=19$m=65536,t=3,p=4$J3Jldmlldy1vbmx5$GfI1Q5sQb7M2c1x9Tg', 'Demo Seller', 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Categories
INSERT INTO workflow_categories (name, slug, sort_order)
VALUES 
  ('Marketing', 'marketing', 1),
  ('Sales', 'sales', 2),
  ('Produktivität', 'productivity', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

-- Tags
INSERT INTO workflow_tags (name, slug)
VALUES
  ('n8n', 'n8n'),
  ('Zapier', 'zapier'),
  ('Make', 'make'),
  ('Slack', 'slack'),
  ('Gmail', 'gmail')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Helper: get ids
SET @seller_id = (SELECT id FROM users WHERE email = 'seller@example.com' LIMIT 1);
SET @cat_marketing = (SELECT id FROM workflow_categories WHERE slug = 'marketing' LIMIT 1);
SET @cat_sales = (SELECT id FROM workflow_categories WHERE slug = 'sales' LIMIT 1);
SET @cat_prod = (SELECT id FROM workflow_categories WHERE slug = 'productivity' LIMIT 1);

-- Five workflows
INSERT INTO workflows (seller_id, category_id, title, short_description, description, platform_type, price, currency, delivery_type, status, created_at, updated_at)
VALUES
(@seller_id, @cat_marketing, 'n8n: Gmail → Slack Alert', 'Benachrichtigt bei neuen Mails', 'Sendet Slack-Nachrichten bei neuen Gmail-E-Mails mit Filtern.', 'n8n', 19.99, 'EUR', 'file_download', 'PUBLISHED', NOW(), NOW()),
(@seller_id, @cat_sales, 'Zapier: Stripe → Notion Deal', 'Erstellt Sales-Einträge in Notion', 'Erstellt in Notion einen Deal-Eintrag nach Stripe-Zahlung.', 'zapier', 14.99, 'EUR', 'file_download', 'PUBLISHED', NOW(), NOW()),
(@seller_id, @cat_prod, 'Make: Trello → Slack Digest', 'Tägliche Board-Zusammenfassung', 'Sendet tägliche Zusammenfassung von Trello-Änderungen in Slack.', 'make', 9.99, 'EUR', 'file_download', 'PUBLISHED', NOW(), NOW()),
(@seller_id, @cat_marketing, 'n8n: RSS → Twitter Auto-Post', 'Postet neue Artikel automatisch', 'Trackt RSS-Feeds und postet neue Artikel auf Twitter/X.', 'n8n', 24.99, 'EUR', 'file_download', 'PUBLISHED', NOW(), NOW()),
(@seller_id, @cat_prod, 'Zapier: Google Sheets → Email Report', 'Wöchentlicher KPI-Report', 'Versendet wöchentliche KPI-Reports aus Google Sheets per E-Mail.', 'zapier', 12.50, 'EUR', 'file_download', 'PUBLISHED', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at);

-- Tag assignments by matching titles (idempotent approach via subselects)
INSERT IGNORE INTO workflow_tag_assignments (workflow_id, tag_id)
SELECT w.id, t.id
FROM workflows w
JOIN workflow_tags t ON t.slug IN ('gmail', 'slack', 'n8n')
WHERE w.title = 'n8n: Gmail → Slack Alert';

INSERT IGNORE INTO workflow_tag_assignments (workflow_id, tag_id)
SELECT w.id, t.id
FROM workflows w
JOIN workflow_tags t ON t.slug IN ('zapier')
WHERE w.title = 'Zapier: Stripe → Notion Deal';

INSERT IGNORE INTO workflow_tag_assignments (workflow_id, tag_id)
SELECT w.id, t.id
FROM workflows w
JOIN workflow_tags t ON t.slug IN ('make', 'slack')
WHERE w.title = 'Make: Trello → Slack Digest';

INSERT IGNORE INTO workflow_tag_assignments (workflow_id, tag_id)
SELECT w.id, t.id
FROM workflows w
JOIN workflow_tags t ON t.slug IN ('n8n')
WHERE w.title = 'n8n: RSS → Twitter Auto-Post';

INSERT IGNORE INTO workflow_tag_assignments (workflow_id, tag_id)
SELECT w.id, t.id
FROM workflows w
JOIN workflow_tags t ON t.slug IN ('zapier', 'gmail')
WHERE w.title = 'Zapier: Google Sheets → Email Report';

-- Attach simple downloadable JSON files to each workflow
UPDATE workflows
SET file_storage_path = 'storage/workflows/n8n_gmail_to_slack_alert.json'
WHERE title = 'n8n: Gmail → Slack Alert';

UPDATE workflows
SET file_storage_path = 'storage/workflows/zapier_stripe_to_notion_deal.json'
WHERE title = 'Zapier: Stripe → Notion Deal';

UPDATE workflows
SET file_storage_path = 'storage/workflows/make_trello_to_slack_digest.json'
WHERE title = 'Make: Trello → Slack Digest';

UPDATE workflows
SET file_storage_path = 'storage/workflows/n8n_rss_to_twitter_auto_post.json'
WHERE title = 'n8n: RSS → Twitter Auto-Post';

UPDATE workflows
SET file_storage_path = 'storage/workflows/zapier_google_sheets_to_email_report.json'
WHERE title = 'Zapier: Google Sheets → Email Report';



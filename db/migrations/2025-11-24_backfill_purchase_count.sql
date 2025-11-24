USE `my_app_db`;
UPDATE workflows w
LEFT JOIN (
  SELECT workflow_id, COUNT(*) AS cnt
  FROM workflow_purchases
  GROUP BY workflow_id
) p ON p.workflow_id = w.id
SET w.purchase_count = COALESCE(p.cnt, 0);



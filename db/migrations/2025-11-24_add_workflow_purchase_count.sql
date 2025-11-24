USE `my_app_db`;
ALTER TABLE `workflows` ADD COLUMN `purchase_count` INT NOT NULL DEFAULT 0 AFTER `file_size_bytes`;



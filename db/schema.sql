-- MySQL / MariaDB schema generated from the provided Mermaid ER diagram
-- Compatible with MySQL 8+ and MariaDB 10.4+

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Adjust the database name as needed
CREATE DATABASE IF NOT EXISTS `my_app_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE `my_app_db`;

-- Use InnoDB for FK support
SET FOREIGN_KEY_CHECKS = 0;

/* ===========================
   USERS / ROLES
   =========================== */
CREATE TABLE IF NOT EXISTS `users` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`           VARCHAR(255)     NOT NULL,
  `password_hash`   VARCHAR(255)     NOT NULL,
  `display_name`    VARCHAR(255)     NOT NULL,
  `is_admin`        BOOLEAN          NOT NULL DEFAULT 0,
  `avatar_url`      VARCHAR(2048)    NULL,
  `bio`             TEXT             NULL,
  `created_at`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Follows (User follows Seller)
CREATE TABLE IF NOT EXISTS `user_follows` (
  `follower_id` BIGINT UNSIGNED NOT NULL,
  `seller_id`   BIGINT UNSIGNED NOT NULL,
  `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follower_id`, `seller_id`),
  KEY `ix_user_follows_seller_id` (`seller_id`),
  CONSTRAINT `fk_user_follows_follower`
    FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_follows_seller`
    FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ===========================
   CATEGORIES + TAGS
   =========================== */
CREATE TABLE IF NOT EXISTS `workflow_categories` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(255)     NOT NULL,
  `slug`       VARCHAR(255)     NOT NULL,
  `parent_id`  BIGINT UNSIGNED  NULL,
  `sort_order` INT              NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_workflow_categories_slug` (`slug`),
  KEY `ix_workflow_categories_parent_id` (`parent_id`),
  CONSTRAINT `fk_workflow_categories_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `workflow_categories`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workflow_tags` (
  `id`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255)     NOT NULL,
  `slug` VARCHAR(255)     NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_workflow_tags_slug` (`slug`),
  KEY `ix_workflow_tags_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ===========================
   WORKFLOWS (Products)
   =========================== */
CREATE TABLE IF NOT EXISTS `workflows` (
  `id`                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `seller_id`              BIGINT UNSIGNED  NOT NULL,
  `category_id`            BIGINT UNSIGNED  NULL,

  `title`                  VARCHAR(255)     NOT NULL,
  `short_description`      VARCHAR(512)     NULL,
  `description`            TEXT             NULL,

  `platform_type`          VARCHAR(64)      NULL, -- replace with ENUM if you have final values
  `price`                  DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  `currency`               CHAR(3)          NOT NULL DEFAULT 'USD',

  `delivery_type`          VARCHAR(64)      NULL, -- replace with ENUM if you have final values
  `file_storage_path`      VARCHAR(2048)    NULL,
  `file_size_bytes`        BIGINT UNSIGNED  NULL,

  `remote_host_url`        VARCHAR(2048)    NULL,
  `is_hosted_by_platform`  BOOLEAN          NOT NULL DEFAULT 0,
  `hosting_monthly_fee`    DECIMAL(10,2)    NULL,

  `stripe_product_id`      VARCHAR(255)     NULL,
  `stripe_price_id`        VARCHAR(255)     NULL,

  `status`                 VARCHAR(32)      NOT NULL DEFAULT 'DRAFT', -- replace with ENUM if you have final values
  `reject_reason`          TEXT             NULL,

  `approved_by`            BIGINT UNSIGNED  NULL,
  `approved_at`            DATETIME         NULL,

  `created_at`             DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `ix_workflows_seller_id` (`seller_id`),
  KEY `ix_workflows_category_id` (`category_id`),
  KEY `ix_workflows_status` (`status`),
  CONSTRAINT `fk_workflows_seller`
    FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_workflows_category`
    FOREIGN KEY (`category_id`) REFERENCES `workflow_categories`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_workflows_approved_by`
    FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workflow_tag_assignments` (
  `workflow_id` BIGINT UNSIGNED NOT NULL,
  `tag_id`      BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`workflow_id`, `tag_id`),
  KEY `ix_workflow_tag_assignments_tag_id` (`tag_id`),
  CONSTRAINT `fk_workflow_tag_assignments_workflow`
    FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_workflow_tag_assignments_tag`
    FOREIGN KEY (`tag_id`) REFERENCES `workflow_tags`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ===========================
   ORDERS / STRIPE
   =========================== */
CREATE TABLE IF NOT EXISTS `orders` (
  `id`                         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `buyer_id`                   BIGINT UNSIGNED  NOT NULL,
  `stripe_payment_intent_id`   VARCHAR(255)     NULL,
  `stripe_checkout_session_id` VARCHAR(255)     NULL,
  `total_amount`               DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  `currency`                   CHAR(3)          NOT NULL DEFAULT 'USD',
  `platform_fee_amount`        DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  `status`                     VARCHAR(32)      NOT NULL DEFAULT 'PENDING',
  `created_at`                 DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at`                    DATETIME         NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_stripe_pi` (`stripe_payment_intent_id`),
  UNIQUE KEY `uq_orders_stripe_cs` (`stripe_checkout_session_id`),
  KEY `ix_orders_buyer_id` (`buyer_id`),
  KEY `ix_orders_status` (`status`),
  CONSTRAINT `fk_orders_buyer`
    FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`           BIGINT UNSIGNED  NOT NULL,
  `workflow_id`        BIGINT UNSIGNED  NOT NULL,
  `seller_id`          BIGINT UNSIGNED  NOT NULL,
  `unit_price`         DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  `platform_fee_amount` DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `seller_earnings`    DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `ix_order_items_order_id` (`order_id`),
  KEY `ix_order_items_workflow_id` (`workflow_id`),
  KEY `ix_order_items_seller_id` (`seller_id`),
  CONSTRAINT `fk_order_items_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_workflow`
    FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_seller`
    FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ===========================
   PURCHASE LIBRARY
   =========================== */
CREATE TABLE IF NOT EXISTS `workflow_purchases` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `buyer_id`           BIGINT UNSIGNED  NOT NULL,
  `workflow_id`        BIGINT UNSIGNED  NOT NULL,
  `order_id`           BIGINT UNSIGNED  NOT NULL,
  `purchased_at`       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_accessed_at`   DATETIME         NULL,
  `download_count`     INT              NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_workflow_purchases_buyer_workflow` (`buyer_id`, `workflow_id`),
  KEY `ix_workflow_purchases_order_id` (`order_id`),
  CONSTRAINT `fk_workflow_purchases_buyer`
    FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_workflow_purchases_workflow`
    FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_workflow_purchases_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ===========================
   REVIEWS & COMMENTS
   =========================== */
CREATE TABLE IF NOT EXISTS `workflow_reviews` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workflow_id` BIGINT UNSIGNED  NOT NULL,
  `user_id`     BIGINT UNSIGNED  NOT NULL,
  `rating`      TINYINT UNSIGNED NOT NULL, -- expected 1..5; enforce in application or add CHECK
  `title`       VARCHAR(255)     NULL,
  `body`        TEXT             NULL,
  `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_workflow_reviews_user_workflow` (`user_id`, `workflow_id`),
  KEY `ix_workflow_reviews_workflow_id` (`workflow_id`),
  CONSTRAINT `fk_workflow_reviews_workflow`
    FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_workflow_reviews_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workflow_comments` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workflow_id` BIGINT UNSIGNED  NOT NULL,
  `user_id`     BIGINT UNSIGNED  NOT NULL,
  `parent_id`   BIGINT UNSIGNED  NULL,
  `body`        TEXT             NOT NULL,
  `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_workflow_comments_workflow_id` (`workflow_id`),
  KEY `ix_workflow_comments_parent_id` (`parent_id`),
  CONSTRAINT `fk_workflow_comments_workflow`
    FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_workflow_comments_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_workflow_comments_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `workflow_comments`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ===========================
   SUPPORT SYSTEM (TICKETS)
   =========================== */
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id`                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`                BIGINT UNSIGNED  NOT NULL,
  `workflow_id`            BIGINT UNSIGNED  NULL,
  `assigned_to_admin_id`   BIGINT UNSIGNED  NULL,
  `subject`                VARCHAR(255)     NOT NULL,
  `status`                 VARCHAR(32)      NOT NULL DEFAULT 'OPEN',   -- replace with ENUM if desired
  `priority`               VARCHAR(16)      NOT NULL DEFAULT 'MEDIUM', -- replace with ENUM if desired
  `created_at`             DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_support_tickets_user_id` (`user_id`),
  KEY `ix_support_tickets_workflow_id` (`workflow_id`),
  KEY `ix_support_tickets_assigned_to_admin_id` (`assigned_to_admin_id`),
  CONSTRAINT `fk_support_tickets_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_support_tickets_workflow`
    FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_support_tickets_assigned_admin`
    FOREIGN KEY (`assigned_to_admin_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `support_messages` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ticket_id`  BIGINT UNSIGNED  NOT NULL,
  `sender_id`  BIGINT UNSIGNED  NOT NULL,
  `body`       TEXT             NOT NULL,
  `created_at` DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_support_messages_ticket_id` (`ticket_id`),
  KEY `ix_support_messages_sender_id` (`sender_id`),
  CONSTRAINT `fk_support_messages_ticket`
    FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_support_messages_sender`
    FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ===========================
   MODERATION LOGS
   =========================== */
CREATE TABLE IF NOT EXISTS `workflow_moderation_logs` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workflow_id` BIGINT UNSIGNED  NOT NULL,
  `admin_id`    BIGINT UNSIGNED  NOT NULL,
  `action`      VARCHAR(32)      NOT NULL, -- replace with ENUM if desired
  `reason`      TEXT             NULL,
  `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_workflow_moderation_logs_workflow_id` (`workflow_id`),
  KEY `ix_workflow_moderation_logs_admin_id` (`admin_id`),
  CONSTRAINT `fk_workflow_moderation_logs_workflow`
    FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_workflow_moderation_logs_admin`
    FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ===========================
   OPTIONAL: CREDENTIAL MGMT
   =========================== */
CREATE TABLE IF NOT EXISTS `workflow_credential_requirements` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workflow_id` BIGINT UNSIGNED  NOT NULL,
  `provider`    VARCHAR(255)     NOT NULL,
  `description` TEXT             NULL,
  PRIMARY KEY (`id`),
  KEY `ix_workflow_credential_requirements_workflow_id` (`workflow_id`),
  CONSTRAINT `fk_workflow_credential_requirements_workflow`
    FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_workflow_credentials` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`               BIGINT UNSIGNED  NOT NULL,
  `workflow_id`           BIGINT UNSIGNED  NOT NULL,
  `provider`              VARCHAR(255)     NOT NULL,
  `encrypted_credentials` TEXT             NOT NULL,
  `created_at`            DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_workflow_credentials_unique` (`user_id`, `workflow_id`, `provider`),
  KEY `ix_user_workflow_credentials_workflow_id` (`workflow_id`),
  CONSTRAINT `fk_user_workflow_credentials_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_workflow_credentials_workflow`
    FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- End of schema



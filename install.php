<?php

/**
 * Travix - Database Installer
 * 
 * Place this file in your project root and open it in the browser.
 * It will create all required database tables for the Travix platform.
 * 
 * DELETE THIS FILE after installation for security.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// ─── Configuration ────────────────────────────────────────────────────────────
// Adjust these values to match your environment or leave as defaults for Laragon
$config = [
    'host'     => '127.0.0.1',
    'port'     => '3306',
    'database' => 'travix',
    'username' => 'root',
    'password' => '',
    'charset'  => 'utf8mb4',
];
// ─────────────────────────────────────────────────────────────────────────────

define('STEP', isset($_GET['step']) ? (int) $_GET['step'] : 0);

// ─── Styles ───────────────────────────────────────────────────────────────────
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Travix — Database Installer</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #0f1624;
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
        }

        .card {
            background: #1a2235;
            border: 1px solid #243049;
            border-radius: 16px;
            padding: 2.5rem;
            width: 100%;
            max-width: 760px;
            box-shadow: 0 25px 60px rgba(0,0,0,.5);
        }

        .logo {
            display: flex;
            align-items: center;
            gap: .75rem;
            margin-bottom: 2rem;
        }
        .logo-icon {
            width: 48px; height: 48px;
            background: linear-gradient(135deg, #c9a84c, #e8c97e);
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.5rem;
        }
        .logo-text { font-size: 1.6rem; font-weight: 700; color: #e8c97e; letter-spacing: .03em; }
        .logo-sub  { font-size: .8rem; color: #64748b; letter-spacing: .1em; text-transform: uppercase; }

        h2 { font-size: 1.3rem; color: #e2e8f0; margin-bottom: .5rem; }
        p.lead { color: #94a3b8; font-size: .95rem; margin-bottom: 1.75rem; line-height: 1.6; }

        /* Steps */
        .steps { display: flex; gap: .5rem; margin-bottom: 2rem; }
        .step-dot {
            flex: 1; height: 4px; border-radius: 999px;
            background: #243049; transition: background .3s;
        }
        .step-dot.done { background: #c9a84c; }
        .step-dot.active { background: #e8c97e; }

        /* Log */
        .log {
            background: #0d1520;
            border: 1px solid #1e2d45;
            border-radius: 10px;
            padding: 1.25rem 1.5rem;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: .85rem;
            max-height: 380px;
            overflow-y: auto;
            line-height: 1.7;
        }
        .log-ok   { color: #34d399; }
        .log-err  { color: #f87171; }
        .log-info { color: #60a5fa; }
        .log-warn { color: #fbbf24; }

        /* Buttons */
        .btn {
            display: inline-flex; align-items: center; gap: .5rem;
            padding: .75rem 1.75rem;
            border: none; border-radius: 8px;
            font-size: .95rem; font-weight: 600; cursor: pointer;
            text-decoration: none; transition: opacity .2s, transform .1s;
            margin-top: 1.5rem;
        }
        .btn:hover  { opacity: .88; transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .btn-primary { background: linear-gradient(135deg, #c9a84c, #e8c97e); color: #0f1624; }
        .btn-danger  { background: #ef4444; color: #fff; }
        .btn-outline { background: transparent; border: 1px solid #243049; color: #94a3b8; }

        .flex-row { display: flex; gap: 1rem; flex-wrap: wrap; }

        /* Config table */
        table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        td { padding: .45rem .75rem; border-bottom: 1px solid #1e2d45; font-size: .9rem; }
        td:first-child { color: #64748b; width: 40%; }
        td code {
            background: #0d1520; padding: .15rem .45rem;
            border-radius: 4px; font-size: .85rem; color: #e8c97e;
        }

        .badge {
            display: inline-block; padding: .2rem .6rem;
            border-radius: 999px; font-size: .75rem; font-weight: 600;
        }
        .badge-success { background: #064e3b; color: #34d399; }
        .badge-danger  { background: #450a0a; color: #f87171; }
        .badge-info    { background: #1e3a5f; color: #60a5fa; }

        .warning-box {
            background: #292200; border: 1px solid #fbbf24;
            border-radius: 10px; padding: 1rem 1.25rem;
            color: #fbbf24; font-size: .88rem; margin-bottom: 1.5rem;
        }
        .warning-box strong { display: block; margin-bottom: .3rem; }
    </style>
</head>
<body>
<div class="card">

    <!-- Logo -->
    <div class="logo">
        <div class="logo-icon">✈</div>
        <div>
            <div class="logo-text">Travix</div>
            <div class="logo-sub">Database Installer</div>
        </div>
    </div>

    <!-- Progress dots -->
    <div class="steps">
        <div class="step-dot <?= STEP >= 1 ? 'done' : (STEP === 0 ? 'active' : '') ?>"></div>
        <div class="step-dot <?= STEP >= 2 ? 'done' : (STEP === 1 ? 'active' : '') ?>"></div>
        <div class="step-dot <?= STEP >= 3 ? 'done' : (STEP === 2 ? 'active' : '') ?>"></div>
    </div>

<?php

// ─── Step 0 — Welcome ─────────────────────────────────────────────────────────
if (STEP === 0):
?>
    <h2>Welcome to the Travix Installer</h2>
    <p class="lead">
        This installer will create the Travix database and all required tables on your local MySQL server.
        Make sure MySQL is running before you continue.
    </p>

    <div class="warning-box">
        <strong>⚠ Security Notice</strong>
        Delete <code>install.php</code> from your server immediately after installation is complete.
    </div>

    <h2 style="margin-bottom:.75rem">Database Settings</h2>
    <table>
        <tr><td>Host</td>         <td><code><?= htmlspecialchars($config['host']) ?></code></td></tr>
        <tr><td>Port</td>         <td><code><?= htmlspecialchars($config['port']) ?></code></td></tr>
        <tr><td>Database Name</td><td><code><?= htmlspecialchars($config['database']) ?></code></td></tr>
        <tr><td>Username</td>     <td><code><?= htmlspecialchars($config['username']) ?></code></td></tr>
        <tr><td>Password</td>     <td><code><?= $config['password'] === '' ? '(empty)' : '••••••' ?></code></td></tr>
        <tr><td>Charset</td>      <td><code><?= htmlspecialchars($config['charset']) ?></code></td></tr>
    </table>

    <p style="color:#64748b;font-size:.85rem">
        To change these values, edit the <code>$config</code> array at the top of <code>install.php</code>.
    </p>

    <div class="flex-row">
        <a class="btn btn-primary" href="?step=1">▶ Start Installation</a>
    </div>

<?php
// ─── Step 1 — Create DB & Tables ──────────────────────────────────────────────
elseif (STEP === 1):

    $logs   = [];
    $errors = 0;

    function log_ok($msg)   { global $logs; $logs[] = ['ok',   $msg]; }
    function log_err($msg)  { global $logs, $errors; $logs[] = ['err', $msg]; $errors++; }
    function log_info($msg) { global $logs; $logs[] = ['info', $msg]; }

    // ── Connect (without selecting a DB first so we can CREATE it)
    try {
        $dsn = "mysql:host={$config['host']};port={$config['port']};charset={$config['charset']}";
        $pdo = new PDO($dsn, $config['username'], $config['password'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        log_ok("Connected to MySQL {$config['host']}:{$config['port']}");
    } catch (PDOException $e) {
        log_err("Cannot connect to MySQL: " . $e->getMessage());
    }

    if ($errors === 0) {

        // ── Create database
        $dbName = $config['database'];
        try {
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET {$config['charset']} COLLATE {$config['charset']}_unicode_ci");
            log_ok("Database `{$dbName}` ready");
        } catch (PDOException $e) {
            log_err("Cannot create database: " . $e->getMessage());
        }

        // ── Select database
        try {
            $pdo->exec("USE `{$dbName}`");
            log_info("Using database `{$dbName}`");
        } catch (PDOException $e) {
            log_err("Cannot select database: " . $e->getMessage());
        }
    }

    // ── Table definitions (mirrors Laravel migrations exactly)
    $tables = [];

    // 1. users
    $tables['users'] = "
        CREATE TABLE IF NOT EXISTS `users` (
            `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `name`              VARCHAR(255) NOT NULL,
            `email`             VARCHAR(255) NOT NULL,
            `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
            `password`          VARCHAR(255) NOT NULL,
            `role`              ENUM('sender','traveler','admin') NOT NULL DEFAULT 'sender',
            `phone`             VARCHAR(255) NULL DEFAULT NULL,
            `address`           TEXT NULL DEFAULT NULL,
            `country`           VARCHAR(255) NULL DEFAULT NULL,
            `city`              VARCHAR(255) NULL DEFAULT NULL,
            `profile_image`     VARCHAR(255) NULL DEFAULT NULL,
            `rating`            DECIMAL(3,2) NOT NULL DEFAULT 0.00,
            `total_ratings`     INT NOT NULL DEFAULT 0,
            `is_verified`       TINYINT(1) NOT NULL DEFAULT 0,
            `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
            `last_login_at`     TIMESTAMP NULL DEFAULT NULL,
            `remember_token`    VARCHAR(100) NULL DEFAULT NULL,
            `created_at`        TIMESTAMP NULL DEFAULT NULL,
            `updated_at`        TIMESTAMP NULL DEFAULT NULL,
            `deleted_at`        TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `users_email_unique` (`email`)
        ) ENGINE=InnoDB DEFAULT CHARSET={$config['charset']} COLLATE={$config['charset']}_unicode_ci
    ";

    // 2. shipments
    $tables['shipments'] = "
        CREATE TABLE IF NOT EXISTS `shipments` (
            `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `sender_id`             BIGINT UNSIGNED NOT NULL,
            `traveler_id`           BIGINT UNSIGNED NULL DEFAULT NULL,
            `item_name`             VARCHAR(255) NOT NULL,
            `description`           TEXT NULL DEFAULT NULL,
            `category`              ENUM('electronics','documents','clothing','gifts','food','medicines','other') NOT NULL,
            `weight`                DECIMAL(8,2) NOT NULL COMMENT 'kg',
            `value`                 DECIMAL(10,2) NULL DEFAULT NULL COMMENT 'USD',
            `pickup_location`       VARCHAR(255) NOT NULL,
            `pickup_country`        VARCHAR(255) NOT NULL,
            `pickup_city`           VARCHAR(255) NOT NULL,
            `pickup_address`        VARCHAR(255) NULL DEFAULT NULL,
            `destination`           VARCHAR(255) NOT NULL,
            `destination_country`   VARCHAR(255) NOT NULL,
            `destination_city`      VARCHAR(255) NOT NULL,
            `destination_address`   VARCHAR(255) NULL DEFAULT NULL,
            `receiver_name`         VARCHAR(255) NOT NULL,
            `receiver_phone`        VARCHAR(255) NOT NULL,
            `receiver_email`        VARCHAR(255) NULL DEFAULT NULL,
            `pickup_date`           DATE NOT NULL,
            `delivery_date`         DATE NULL DEFAULT NULL,
            `accepted_at`           TIMESTAMP NULL DEFAULT NULL,
            `delivered_at`          TIMESTAMP NULL DEFAULT NULL,
            `price`                 DECIMAL(10,2) NOT NULL,
            `platform_fee`          DECIMAL(10,2) NOT NULL DEFAULT 0,
            `traveler_earnings`     DECIMAL(10,2) NULL DEFAULT NULL,
            `status`                ENUM('pending','matched','accepted','in_transit','delivered','cancelled','disputed') NOT NULL DEFAULT 'pending',
            `item_images`           JSON NULL DEFAULT NULL,
            `documents`             JSON NULL DEFAULT NULL,
            `special_instructions`  TEXT NULL DEFAULT NULL,
            `cancellation_reason`   TEXT NULL DEFAULT NULL,
            `created_at`            TIMESTAMP NULL DEFAULT NULL,
            `updated_at`            TIMESTAMP NULL DEFAULT NULL,
            `deleted_at`            TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `shipments_sender_id_index`   (`sender_id`),
            KEY `shipments_traveler_id_index` (`traveler_id`),
            KEY `shipments_status_index`      (`status`),
            KEY `shipments_pickup_dest_index` (`pickup_location`,`destination`),
            KEY `shipments_pickup_date_index` (`pickup_date`),
            CONSTRAINT `shipments_sender_id_fk`
                FOREIGN KEY (`sender_id`)   REFERENCES `users` (`id`) ON DELETE CASCADE,
            CONSTRAINT `shipments_traveler_id_fk`
                FOREIGN KEY (`traveler_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET={$config['charset']} COLLATE={$config['charset']}_unicode_ci
    ";

    // 3. trips
    $tables['trips'] = "
        CREATE TABLE IF NOT EXISTS `trips` (
            `id`                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `traveler_id`             BIGINT UNSIGNED NOT NULL,
            `from_location`           VARCHAR(255) NOT NULL,
            `from_country`            VARCHAR(255) NOT NULL,
            `from_city`               VARCHAR(255) NOT NULL,
            `to_location`             VARCHAR(255) NOT NULL,
            `to_country`              VARCHAR(255) NOT NULL,
            `to_city`                 VARCHAR(255) NOT NULL,
            `departure_date`          DATE NOT NULL,
            `arrival_date`            DATE NULL DEFAULT NULL,
            `flight_number`           VARCHAR(255) NULL DEFAULT NULL,
            `available_space`         DECIMAL(8,2) NOT NULL COMMENT 'kg',
            `used_space`              DECIMAL(8,2) NOT NULL DEFAULT 0,
            `price_per_kg`            DECIMAL(8,2) NOT NULL,
            `accepted_categories`     JSON NULL DEFAULT NULL,
            `status`                  ENUM('active','full','in_progress','completed','cancelled') NOT NULL DEFAULT 'active',
            `verification_documents`  JSON NULL DEFAULT NULL,
            `is_verified`             TINYINT(1) NOT NULL DEFAULT 0,
            `notes`                   TEXT NULL DEFAULT NULL,
            `created_at`              TIMESTAMP NULL DEFAULT NULL,
            `updated_at`              TIMESTAMP NULL DEFAULT NULL,
            `deleted_at`              TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `trips_traveler_id_index`   (`traveler_id`),
            KEY `trips_status_index`        (`status`),
            KEY `trips_route_index`         (`from_location`,`to_location`),
            KEY `trips_departure_date_index`(`departure_date`),
            CONSTRAINT `trips_traveler_id_fk`
                FOREIGN KEY (`traveler_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET={$config['charset']} COLLATE={$config['charset']}_unicode_ci
    ";

    // 4. transactions
    $tables['transactions'] = "
        CREATE TABLE IF NOT EXISTS `transactions` (
            `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `shipment_id`           BIGINT UNSIGNED NOT NULL,
            `sender_id`             BIGINT UNSIGNED NOT NULL,
            `traveler_id`           BIGINT UNSIGNED NULL DEFAULT NULL,
            `amount`                DECIMAL(10,2) NOT NULL,
            `platform_fee`          DECIMAL(10,2) NOT NULL DEFAULT 0,
            `traveler_amount`       DECIMAL(10,2) NULL DEFAULT NULL,
            `currency`              VARCHAR(3) NOT NULL DEFAULT 'USD',
            `payment_method`        ENUM('stripe','paypal','card','bank_transfer') NOT NULL,
            `payment_gateway_id`    VARCHAR(255) NULL DEFAULT NULL,
            `payment_intent_id`     VARCHAR(255) NULL DEFAULT NULL,
            `status`                ENUM('pending','processing','completed','failed','refunded','held') NOT NULL DEFAULT 'pending',
            `paid_at`               TIMESTAMP NULL DEFAULT NULL,
            `released_at`           TIMESTAMP NULL DEFAULT NULL,
            `refunded_at`           TIMESTAMP NULL DEFAULT NULL,
            `notes`                 TEXT NULL DEFAULT NULL,
            `failure_reason`        TEXT NULL DEFAULT NULL,
            `created_at`            TIMESTAMP NULL DEFAULT NULL,
            `updated_at`            TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `transactions_shipment_id_index`        (`shipment_id`),
            KEY `transactions_sender_id_index`          (`sender_id`),
            KEY `transactions_traveler_id_index`        (`traveler_id`),
            KEY `transactions_status_index`             (`status`),
            KEY `transactions_payment_gateway_id_index` (`payment_gateway_id`),
            CONSTRAINT `transactions_shipment_id_fk`
                FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE,
            CONSTRAINT `transactions_sender_id_fk`
                FOREIGN KEY (`sender_id`)   REFERENCES `users`     (`id`) ON DELETE CASCADE,
            CONSTRAINT `transactions_traveler_id_fk`
                FOREIGN KEY (`traveler_id`) REFERENCES `users`     (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET={$config['charset']} COLLATE={$config['charset']}_unicode_ci
    ";

    // 5. reviews
    $tables['reviews'] = "
        CREATE TABLE IF NOT EXISTS `reviews` (
            `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `shipment_id`  BIGINT UNSIGNED NOT NULL,
            `reviewer_id`  BIGINT UNSIGNED NOT NULL,
            `reviewed_id`  BIGINT UNSIGNED NOT NULL,
            `rating`       INT NOT NULL COMMENT '1-5',
            `comment`      TEXT NULL DEFAULT NULL,
            `type`         ENUM('sender_to_traveler','traveler_to_sender') NOT NULL,
            `created_at`   TIMESTAMP NULL DEFAULT NULL,
            `updated_at`   TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `reviews_shipment_id_index` (`shipment_id`),
            KEY `reviews_reviewer_id_index` (`reviewer_id`),
            KEY `reviews_reviewed_id_index` (`reviewed_id`),
            UNIQUE KEY `reviews_unique` (`shipment_id`,`reviewer_id`,`type`),
            CONSTRAINT `reviews_shipment_id_fk`
                FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE,
            CONSTRAINT `reviews_reviewer_id_fk`
                FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
            CONSTRAINT `reviews_reviewed_id_fk`
                FOREIGN KEY (`reviewed_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET={$config['charset']} COLLATE={$config['charset']}_unicode_ci
    ";

    // ── Laravel Sanctum — personal_access_tokens
    $tables['personal_access_tokens'] = "
        CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
            `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `tokenable_type` VARCHAR(255) NOT NULL,
            `tokenable_id`   BIGINT UNSIGNED NOT NULL,
            `name`           VARCHAR(255) NOT NULL,
            `token`          VARCHAR(64) NOT NULL,
            `abilities`      TEXT NULL DEFAULT NULL,
            `last_used_at`   TIMESTAMP NULL DEFAULT NULL,
            `expires_at`     TIMESTAMP NULL DEFAULT NULL,
            `created_at`     TIMESTAMP NULL DEFAULT NULL,
            `updated_at`     TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
            KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET={$config['charset']} COLLATE={$config['charset']}_unicode_ci
    ";

    // ── Laravel — sessions
    $tables['sessions'] = "
        CREATE TABLE IF NOT EXISTS `sessions` (
            `id`             VARCHAR(255) NOT NULL,
            `user_id`        BIGINT UNSIGNED NULL DEFAULT NULL,
            `ip_address`     VARCHAR(45) NULL DEFAULT NULL,
            `user_agent`     TEXT NULL DEFAULT NULL,
            `payload`        LONGTEXT NOT NULL,
            `last_activity`  INT NOT NULL,
            PRIMARY KEY (`id`),
            KEY `sessions_user_id_index`      (`user_id`),
            KEY `sessions_last_activity_index`(`last_activity`)
        ) ENGINE=InnoDB DEFAULT CHARSET={$config['charset']} COLLATE={$config['charset']}_unicode_ci
    ";

    // ── Laravel — cache
    $tables['cache'] = "
        CREATE TABLE IF NOT EXISTS `cache` (
            `key`        VARCHAR(255) NOT NULL,
            `value`      MEDIUMTEXT NOT NULL,
            `expiration` INT NOT NULL,
            PRIMARY KEY (`key`)
        ) ENGINE=InnoDB DEFAULT CHARSET={$config['charset']} COLLATE={$config['charset']}_unicode_ci
    ";

    // ── Laravel — cache_locks
    $tables['cache_locks'] = "
        CREATE TABLE IF NOT EXISTS `cache_locks` (
            `key`        VARCHAR(255) NOT NULL,
            `owner`      VARCHAR(255) NOT NULL,
            `expiration` INT NOT NULL,
            PRIMARY KEY (`key`)
        ) ENGINE=InnoDB DEFAULT CHARSET={$config['charset']} COLLATE={$config['charset']}_unicode_ci
    ";

    // ── Laravel — jobs
    $tables['jobs'] = "
        CREATE TABLE IF NOT EXISTS `jobs` (
            `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `queue`        VARCHAR(255) NOT NULL,
            `payload`      LONGTEXT NOT NULL,
            `attempts`     TINYINT UNSIGNED NOT NULL,
            `reserved_at`  INT UNSIGNED NULL DEFAULT NULL,
            `available_at` INT UNSIGNED NOT NULL,
            `created_at`   INT UNSIGNED NOT NULL,
            PRIMARY KEY (`id`),
            KEY `jobs_queue_index` (`queue`)
        ) ENGINE=InnoDB DEFAULT CHARSET={$config['charset']} COLLATE={$config['charset']}_unicode_ci
    ";

    // ── Laravel — failed_jobs
    $tables['failed_jobs'] = "
        CREATE TABLE IF NOT EXISTS `failed_jobs` (
            `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `uuid`       VARCHAR(255) NOT NULL,
            `connection` TEXT NOT NULL,
            `queue`      TEXT NOT NULL,
            `payload`    LONGTEXT NOT NULL,
            `exception`  LONGTEXT NOT NULL,
            `failed_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
        ) ENGINE=InnoDB DEFAULT CHARSET={$config['charset']} COLLATE={$config['charset']}_unicode_ci
    ";

    // ── Create tables
    if ($errors === 0) {
        log_info("─── Creating tables ───────────────────────────────");
        foreach ($tables as $name => $sql) {
            try {
                $pdo->exec($sql);
                log_ok("  ✓ `{$name}` — created / already exists");
            } catch (PDOException $e) {
                log_err("  ✗ `{$name}` — " . $e->getMessage());
            }
        }

        // ── Laravel migrations table (used by artisan migrate)
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `migrations` (
                    `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
                    `migration` VARCHAR(255) NOT NULL,
                    `batch`     INT NOT NULL,
                    PRIMARY KEY (`id`)
                ) ENGINE=InnoDB DEFAULT CHARSET={$config['charset']} COLLATE={$config['charset']}_unicode_ci
            ");
            log_ok("  ✓ `migrations` — created / already exists");
        } catch (PDOException $e) {
            log_err("  ✗ `migrations` — " . $e->getMessage());
        }
    }

    $success = ($errors === 0);
?>
    <h2><?= $success ? '✅ Installation Complete' : '❌ Installation Failed' ?></h2>
    <p class="lead">
        <?php if ($success): ?>
            All tables were created successfully. You can now run the Laravel API.
        <?php else: ?>
            Some steps failed. Check the log below and fix the issues before retrying.
        <?php endif; ?>
    </p>

    <div class="log">
        <?php foreach ($logs as [$type, $msg]): ?>
            <div class="log-<?= $type ?>"><?= htmlspecialchars($msg) ?></div>
        <?php endforeach; ?>
    </div>

    <div class="flex-row">
        <?php if ($success): ?>
            <a class="btn btn-primary" href="?step=2">▶ Next: Seed Data</a>
            <a class="btn btn-outline"  href="?step=0">← Back</a>
        <?php else: ?>
            <a class="btn btn-danger"  href="?step=1">↺ Retry</a>
            <a class="btn btn-outline"  href="?step=0">← Back</a>
        <?php endif; ?>
    </div>

<?php
// ─── Step 2 — Optional Seed ───────────────────────────────────────────────────
elseif (STEP === 2):

    $seed = isset($_GET['seed']) && $_GET['seed'] === '1';
    $logs   = [];
    $errors = 0;

    function log_ok2($m)   { global $logs; $logs[] = ['ok',   $m]; }
    function log_err2($m)  { global $logs, $errors; $logs[] = ['err', $m]; $errors++; }
    function log_info2($m) { global $logs; $logs[] = ['info', $m]; }

    if ($seed) {
        try {
            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
            $pdo = new PDO($dsn, $config['username'], $config['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]);
        } catch (PDOException $e) {
            log_err2("DB connection failed: " . $e->getMessage());
            $seed = false;
        }

        if ($errors === 0) {
            // Admin user
            $hash = password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);
            $now  = date('Y-m-d H:i:s');

            try {
                $stmt = $pdo->prepare("
                    INSERT IGNORE INTO `users`
                        (`name`,`email`,`password`,`role`,`is_verified`,`is_active`,`email_verified_at`,`created_at`,`updated_at`)
                    VALUES
                        (:n, :e, :p, 'admin', 1, 1, :v, :c, :u)
                ");
                $stmt->execute([
                    ':n' => 'Travix Admin',
                    ':e' => 'admin@travix.com',
                    ':p' => $hash,
                    ':v' => $now,
                    ':c' => $now,
                    ':u' => $now,
                ]);
                log_ok2("Admin user created — admin@travix.com / admin123");
            } catch (PDOException $e) {
                log_err2("Admin insert failed: " . $e->getMessage());
            }

            // Demo sender
            $hash2 = password_hash('password', PASSWORD_BCRYPT, ['cost' => 12]);
            try {
                $stmt2 = $pdo->prepare("
                    INSERT IGNORE INTO `users`
                        (`name`,`email`,`password`,`role`,`phone`,`country`,`city`,`is_verified`,`is_active`,`email_verified_at`,`created_at`,`updated_at`)
                    VALUES
                        (:n, :e, :p, 'sender', '+962791234567', 'Jordan', 'Amman', 1, 1, :v, :c, :u)
                ");
                $stmt2->execute([
                    ':n' => 'Ahmad Al-Masri',
                    ':e' => 'sender@travix.com',
                    ':p' => $hash2,
                    ':v' => $now,
                    ':c' => $now,
                    ':u' => $now,
                ]);
                log_ok2("Demo sender created — sender@travix.com / password");
            } catch (PDOException $e) {
                log_err2("Sender insert failed: " . $e->getMessage());
            }

            // Demo traveler
            try {
                $stmt3 = $pdo->prepare("
                    INSERT IGNORE INTO `users`
                        (`name`,`email`,`password`,`role`,`phone`,`country`,`city`,`is_verified`,`is_active`,`email_verified_at`,`created_at`,`updated_at`)
                    VALUES
                        (:n, :e, :p, 'traveler', '+962799876543', 'Jordan', 'Amman', 1, 1, :v, :c, :u)
                ");
                $stmt3->execute([
                    ':n' => 'Laila Hassan',
                    ':e' => 'traveler@travix.com',
                    ':p' => $hash2,
                    ':v' => $now,
                    ':c' => $now,
                    ':u' => $now,
                ]);
                log_ok2("Demo traveler created — traveler@travix.com / password");
            } catch (PDOException $e) {
                log_err2("Traveler insert failed: " . $e->getMessage());
            }

            log_info2("Seed complete — " . ($errors === 0 ? "all records inserted" : "some records failed"));
        }
    }
?>
    <h2>Optional: Seed Demo Data</h2>
    <p class="lead">
        You can insert a few demo accounts to test the platform right away, or skip this step and go directly to the finish page.
    </p>

    <?php if ($seed): ?>
        <div class="log">
            <?php foreach ($logs as [$type, $msg]): ?>
                <div class="log-<?= $type ?>"><?= htmlspecialchars($msg) ?></div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <?php if (!$seed): ?>
        <table>
            <tr><td>Admin</td>      <td><code>admin@travix.com</code> / <code>admin123</code></td></tr>
            <tr><td>Demo Sender</td><td><code>sender@travix.com</code> / <code>password</code></td></tr>
            <tr><td>Demo Traveler</td><td><code>traveler@travix.com</code> / <code>password</code></td></tr>
        </table>
    <?php endif; ?>

    <div class="flex-row">
        <?php if (!$seed): ?>
            <a class="btn btn-primary" href="?step=2&seed=1">▶ Insert Demo Data</a>
        <?php endif; ?>
        <a class="btn <?= $seed ? 'btn-primary' : 'btn-outline' ?>" href="?step=3">
            <?= $seed ? '▶ Finish' : 'Skip →' ?>
        </a>
        <a class="btn btn-outline" href="?step=1">← Back</a>
    </div>

<?php
// ─── Step 3 — Finish ──────────────────────────────────────────────────────────
elseif (STEP === 3):
?>
    <h2>🎉 Installation Complete!</h2>
    <p class="lead">
        Your Travix database is ready. Here's what to do next:
    </p>

    <table>
        <tr>
            <td>1. Copy <code>.env.example</code></td>
            <td>to <code>.env</code> and set your <code>APP_KEY</code></td>
        </tr>
        <tr>
            <td>2. Laravel API URL</td>
            <td><code>http://localhost/travix/travix-api/public</code></td>
        </tr>
        <tr>
            <td>3. Frontend URL</td>
            <td><code>http://localhost/travix</code></td>
        </tr>
        <tr>
            <td>4. API auth</td>
            <td>Laravel Sanctum — <code>POST /api/login</code></td>
        </tr>
        <tr>
            <td>5. ⚠ Delete this file</td>
            <td><code>install.php</code> — remove it immediately!</td>
        </tr>
    </table>

    <div class="warning-box" style="margin-top:1.5rem">
        <strong>🔒 Security Reminder</strong>
        <code>install.php</code> gives full database access to anyone who can access it.
        Delete it from your server right now.
    </div>

    <div class="flex-row">
        <a class="btn btn-primary" href="../">Open Travix →</a>
    </div>

<?php endif; ?>

</div><!-- /.card -->
</body>
</html>

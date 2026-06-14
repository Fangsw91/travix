╔══════════════════════════════════════════════════════════════════╗
║                  TRAVIX — PROJECT SETUP GUIDE                   ║
║              Share this file with your team members             ║
╚══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WHAT YOU NEED TO INSTALL FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Laragon (local server — includes PHP, MySQL, Apache)
     Download: https://laragon.org/download/
     → Choose "Laragon Full" version
     → Install it with default settings
     → Make sure to run Laragon as Administrator

  2. That's it! Laragon includes everything else you need.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 1 — GET THE PROJECT FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Get the project ZIP/RAR file from your team leader
  2. Extract it
  3. Copy the extracted "travix" folder to:

        C:\laragon\www\travix

  Final structure should look like this:
  
        C:\laragon\www\travix\
        ├── travix-api\          ← Laravel backend
        ├── signup.html
        ├── signin.html
        ├── index.html
        ├── install.php          ← database installer
        └── ... (other files)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 2 — START LARAGON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Open Laragon (double-click the desktop icon)
  2. Click "Start All" button
  3. You should see Apache and MySQL turn GREEN
  
  ⚠ If they don't turn green:
     - Right-click Laragon → Run as Administrator
     - Or check if port 80 or 3306 is used by another app


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 3 — SET UP THE DATABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Make sure Laragon is running (Step 2 done)
  2. Open your browser (Chrome or Edge)
  3. Go to this URL:

        http://localhost/travix/install.php

  4. Click "Start Installation"
  5. Wait for all tables to show ✓ (green checkmarks)
  6. Click "Next: Seed Data"
  7. Click "Insert Demo Data" (optional — adds test accounts)
  8. Click "Finish"

  ✅ Database is now ready!

  ⚠ IMPORTANT: After installation is done,
    DELETE the file: C:\laragon\www\travix\install.php
    (It's a security risk to leave it there)

  Demo accounts created (if you clicked Insert Demo Data):
  ┌─────────────┬───────────────────────┬──────────────┐
  │ Role        │ Email                 │ Password     │
  ├─────────────┼───────────────────────┼──────────────┤
  │ Admin       │ admin@travix.com      │ admin123     │
  │ Sender      │ sender@travix.com     │ password     │
  │ Traveler    │ traveler@travix.com   │ password     │
  └─────────────┴───────────────────────┴──────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 4 — START THE LARAVEL API (BACKEND)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  The frontend needs the Laravel API running on port 8000.
  You must do this EVERY TIME you work on the project.

  HOW TO START IT:

  Option A — Using Laragon Terminal (Recommended):
  ─────────────────────────────────────────────────
  1. Right-click the Laragon icon in the system tray (bottom right)
  2. Click "Terminal"
  3. Type this command and press Enter:

        cd C:\laragon\www\travix\travix-api

  4. Then type this and press Enter:

        php artisan serve

  5. You should see:
        INFO  Server running on [http://127.0.0.1:8000]

  6. LEAVE THIS WINDOW OPEN — do not close it while working!

  Option B — Using Windows CMD:
  ──────────────────────────────
  1. Press Windows Key + R
  2. Type: cmd  → press Enter
  3. Type:  cd C:\laragon\www\travix\travix-api  → press Enter
  4. Type:  php artisan serve  → press Enter

  ⚠ Common mistakes:
     ✗ WRONG:  cd C:\laragon\www\travix\travix-api php artisan serve
     ✓ RIGHT:  Each command on its own line, press Enter between them


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 5 — OPEN THE WEBSITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Open your browser and go to:

        http://localhost/travix/

  ⚠ DO NOT open the HTML files by double-clicking them!
    Always use the http://localhost/... URL in your browser.
    Opening with file:// will cause login/register errors.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  QUICK CHECKLIST — BEFORE YOU START WORKING EACH DAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [ ] Laragon is open and Apache + MySQL are green
  [ ] Terminal is open with "php artisan serve" running
  [ ] Browser is using http://localhost/travix/ (not file://)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  USEFUL URLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Website (Frontend)     →  http://localhost/travix/
  API (Backend)          →  http://localhost:8000/api
  Database Manager       →  http://localhost/phpmyadmin
  Database Installer     →  http://localhost/travix/install.php


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COMMON ERRORS & FIXES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ERROR: "Failed to fetch" or "ERR_CONNECTION_REFUSED"
  FIX:   The Laravel API is not running.
         Go to Step 4 and run: php artisan serve

  ERROR: "php is not recognized as a command"
  FIX:   Use the Laragon Terminal (Option A in Step 4)
         NOT the regular Windows CMD

  ERROR: Page not found / 404
  FIX:   Make sure the travix folder is in C:\laragon\www\
         And Laragon Apache is running (green)

  ERROR: Cannot connect to database
  FIX:   Make sure Laragon MySQL is running (green)
         Then go to http://localhost/travix/install.php and re-run

  ERROR: "file:// URLs are treated as unique security origins"
  FIX:   You opened the HTML file directly. Always use:
         http://localhost/travix/  in your browser


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DATABASE DETAILS (for phpMyAdmin or MySQL tools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Host:      127.0.0.1
  Port:      3306
  Database:  travix
  Username:  root
  Password:  (leave empty)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NEED HELP?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Take a screenshot of the error and send it to the team leader.
  Include: what step you were on + what the error message says.

══════════════════════════════════════════════════════════════════════
  Travix Team — Internal Setup Guide
══════════════════════════════════════════════════════════════════════

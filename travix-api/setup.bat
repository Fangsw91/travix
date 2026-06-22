@echo off
echo ========================================
echo   Travix Setup - One-time initialization
echo ========================================
echo.

REM Step 1: Install composer dependencies
echo [1/5] Installing composer packages...
call composer install --no-interaction

REM Step 2: Create .env if it doesn't exist (won't overwrite existing one)
if not exist .env (
    echo [2/5] Creating .env file...
    copy .env.example .env
    php artisan key:generate
) else (
    echo [2/5] .env already exists - skipping (your settings are safe)
)

REM Step 3: Create SQLite database file ONLY if it doesn't exist
if not exist database\database.sqlite (
    echo [3/5] Creating database.sqlite...
    type nul > database\database.sqlite
) else (
    echo [3/5] database.sqlite already exists - skipping (your data is safe)
)

REM Step 4: Run migrations (safe - only adds new tables/columns, never deletes data)
echo [4/5] Running migrations...
call php artisan migrate --force

REM Step 5: Link storage for verification photos / pickup photos
echo [5/5] Linking storage...
call php artisan storage:link

echo.
echo ========================================
echo   Setup complete! Your data is preserved.
echo   Run: php artisan serve
echo ========================================
pause

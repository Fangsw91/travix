@echo off
echo ========================================
echo   Travix Update - MySQL Edition
echo   Your database is a real MySQL DB now,
echo   so this NEVER touches your data.
echo ========================================
echo.

echo [1/3] Pulling latest code from GitHub...
cd ..
git pull origin main
cd travix-api

echo [2/3] Updating composer packages...
call composer install --no-interaction

echo [3/3] Running any new migrations (existing data is safe)...
call php artisan migrate --force

echo.
echo ========================================
echo   Update complete!
echo ========================================
pause

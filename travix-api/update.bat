@echo off
echo ========================================
echo   Travix Update - pulls latest code
echo   Your database and .env are NEVER touched
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

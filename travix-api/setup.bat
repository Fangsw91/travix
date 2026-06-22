@echo off
echo ========================================
echo   Travix Setup - MySQL Edition
echo ========================================
echo.

echo [1/6] Creating .env file...
if not exist .env (
    copy .env.example .env
    php artisan key:generate
) else (
    echo .env already exists - skipping
)

echo [2/6] Creating 'travix' database in MySQL...
"C:\laragon\bin\mysql\mysql-8.4\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS travix;" 2>nul
if errorlevel 1 (
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS travix;"
)

echo [3/6] Installing composer packages...
call composer install --no-interaction

echo [4/6] Running migrations...
call php artisan migrate --force

echo [5/6] Linking storage for photos...
call php artisan storage:link

echo [6/6] Done!
echo.
echo ========================================
echo   Setup complete!
echo   Open phpMyAdmin -^> 'travix' database
echo   to see all your data live.
echo   Run: php artisan serve
echo ========================================
pause

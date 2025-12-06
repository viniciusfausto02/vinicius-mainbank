@echo off
REM Add PostgreSQL bin directory to PATH temporarily
set "PGPATH=C:\Program Files\PostgreSQL\18\bin"
if exist "%PGPATH%" (
    echo PostgreSQL found at %PGPATH%
    set "PATH=%PGPATH%;%PATH%"
    echo PATH updated
) else (
    echo PostgreSQL not found at expected location
    echo Please enter PostgreSQL installation path:
    set /p PGPATH="Enter path: "
)

REM Test connection
echo.
echo Testing PostgreSQL connection...
psql -U postgres -d postgres -c "SELECT version();" 2>nul
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] PostgreSQL connection successful!
) else (
    echo.
    echo [ERROR] Failed to connect to PostgreSQL
    echo Please verify your PostgreSQL installation and password
)

pause

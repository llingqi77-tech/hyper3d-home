@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>&1
if not errorlevel 1 (
  start "全屋 3D 服务" /min py -3 -m http.server 8765 --bind 127.0.0.1
) else (
  start "全屋 3D 服务" /min python -m http.server 8765 --bind 127.0.0.1
)

timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8765/index.html"
endlocal

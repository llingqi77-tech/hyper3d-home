@echo off
cd /d "%~dp0"
echo Open http://127.0.0.1:5182/ after the server starts.
call npm run dev
pause

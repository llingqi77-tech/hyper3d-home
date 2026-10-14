@echo off
cd /d "%~dp0"
start "" http://127.0.0.1:5186
node server.mjs
pause


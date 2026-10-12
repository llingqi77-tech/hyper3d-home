@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing Three.js and Vite for the kitchen viewer...
  npm install
)
start "" http://127.0.0.1:5180
npm run dev

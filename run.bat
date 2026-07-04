@echo off
cd /d "%~dp0client"
start "Client" cmd /k npm run dev

cd /d "%~dp0server"
start "Server" cmd /k npm run start

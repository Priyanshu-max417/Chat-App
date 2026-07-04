@echo off
for /f "tokens=1" %%p in ('tasklist ^| findstr /i "node.exe vite.exe cmd.exe"') do taskkill /f /pid %%p >nul 2>&1

echo Stopped client and server processes.
pause

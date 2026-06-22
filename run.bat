@echo off
echo Starting MicroFinance System...

start cmd /k "cd backend && python manage.py runserver"
start cmd /k "cd frontend && npm start"

echo Backend running on http://localhost:8000
echo Frontend running on http://localhost:3000
echo Press any key to stop...
pause
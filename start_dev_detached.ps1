# Launch the dev server in a new, separate PowerShell window
# This prevents the Agent from waiting for the process to finish (which causes the hang)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

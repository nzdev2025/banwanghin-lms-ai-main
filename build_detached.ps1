# Run the build command in a new window
# This ensures the build process has its own memory space and output stream
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run build; Read-Host 'Build Complete. Press Enter to close...'" -WindowStyle Normal

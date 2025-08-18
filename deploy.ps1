# Stop the script if any command fails
$ErrorActionPreference = "Stop"

try {
    Write-Host "Starting automated deployment to GitHub Pages..." -ForegroundColor Cyan

    # Step 1: Fetch the latest changes from the remote repository to ensure we are up-to-date.
    Write-Host "Pulling latest changes from Git..." -ForegroundColor Yellow
    git pull

    # Step 2: Install/update dependencies to ensure the build environment is correct.
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install

    # Step 3: Run the 'deploy' script from package.json.
    # This script handles both building the project and pushing the 'dist' folder to the 'gh-pages' branch.
    Write-Host "Building project and deploying to GitHub Pages..." -ForegroundColor Yellow
    npm run deploy

    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host " Deployment successful! Your site should be live soon. " -ForegroundColor Green
    Write-Host "======================================================" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
    Write-Host "  An error occurred during deployment. " -ForegroundColor Red
    Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    # Exit with a non-zero status code to indicate that something went wrong.
    exit 1
}

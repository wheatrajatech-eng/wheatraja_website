param(
  [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = Join-Path $OutputDir "wheatraja-$timestamp.sql"
mysqldump --single-transaction --routines --triggers --hex-blob -h $env:DB_HOST -P $env:DB_PORT -u $env:DB_USER "-p$env:DB_PASSWORD" $env:DB_NAME | Set-Content -Path $file
Write-Output $file

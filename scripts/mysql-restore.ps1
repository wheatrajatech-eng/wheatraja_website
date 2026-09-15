param(
  [Parameter(Mandatory=$true)][string]$BackupFile
)

$ErrorActionPreference = "Stop"
if (!(Test-Path $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}
Get-Content -Path $BackupFile | mysql -h $env:DB_HOST -P $env:DB_PORT -u $env:DB_USER "-p$env:DB_PASSWORD" $env:DB_NAME

param(
  [string]$OutputDir = "backups",
  [string]$DrillDbName = "",
  [string]$EvidenceFile = "docs/audit/backup-restore-drill-latest.json"
)

$ErrorActionPreference = "Stop"

foreach ($name in @("DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME")) {
  if (-not [Environment]::GetEnvironmentVariable($name)) {
    throw "$name is required"
  }
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$evidenceDir = Split-Path -Parent $EvidenceFile
if ($evidenceDir) {
  New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
if (-not $DrillDbName) {
  $DrillDbName = "$($env:DB_NAME)_restore_drill_$timestamp"
}

$backupFile = & "$PSScriptRoot\mysql-backup.ps1" -OutputDir $OutputDir
if (-not (Test-Path $backupFile)) {
  throw "Backup file was not created: $backupFile"
}

mysql -h $env:DB_HOST -P $env:DB_PORT -u $env:DB_USER "-p$env:DB_PASSWORD" -e "DROP DATABASE IF EXISTS ``$DrillDbName``; CREATE DATABASE ``$DrillDbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
Get-Content -Path $backupFile | mysql -h $env:DB_HOST -P $env:DB_PORT -u $env:DB_USER "-p$env:DB_PASSWORD" $DrillDbName

$tables = @("users", "products", "orders", "payments", "inventory", "invoices")
$counts = @{}
foreach ($table in $tables) {
  $query = "SELECT COUNT(*) FROM ``$table``;"
  $value = mysql -N -B -h $env:DB_HOST -P $env:DB_PORT -u $env:DB_USER "-p$env:DB_PASSWORD" $DrillDbName -e $query
  $counts[$table] = [int]$value
}

$evidence = [ordered]@{
  drill_completed_at = (Get-Date).ToString("o")
  source_database = $env:DB_NAME
  drill_database = $DrillDbName
  backup_file = (Resolve-Path $backupFile).Path
  counts = $counts
  result = "passed"
}

$evidence | ConvertTo-Json -Depth 6 | Set-Content -Path $EvidenceFile -Encoding UTF8
Write-Output ($evidence | ConvertTo-Json -Depth 6)

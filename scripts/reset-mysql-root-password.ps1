param(
  [string]$ServiceName = "MySQL80",
  [string]$NewPassword = "WheatRaja@123"
)

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Error "Run this script from an Administrator PowerShell."
  exit 1
}

$service = Get-CimInstance Win32_Service -Filter "Name='$ServiceName'"
if (-not $service) {
  Write-Error "Service '$ServiceName' was not found."
  exit 1
}

$mysqld = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
if (-not (Test-Path -LiteralPath $mysqld)) {
  Write-Error "mysqld.exe was not found at $mysqld."
  exit 1
}

$defaultsFile = "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
if (-not (Test-Path -LiteralPath $defaultsFile)) {
  Write-Error "MySQL defaults file was not found at $defaultsFile."
  exit 1
}

$escapedPassword = $NewPassword.Replace("'", "''")
$initFile = Join-Path $env:TEMP "wheatraja-reset-mysql-root.sql"
@"
ALTER USER 'root'@'localhost' IDENTIFIED BY '$escapedPassword';
FLUSH PRIVILEGES;
"@ | Set-Content -LiteralPath $initFile -Encoding ASCII

Write-Host "Stopping $ServiceName..."
Stop-Service -Name $ServiceName -Force
Start-Sleep -Seconds 3

Write-Host "Starting one-time MySQL password reset..."
$process = Start-Process -FilePath $mysqld -ArgumentList @(
  "--defaults-file=$defaultsFile",
  "--init-file=$initFile",
  "--console"
) -WindowStyle Hidden -PassThru

Start-Sleep -Seconds 12

Write-Host "Stopping one-time MySQL process..."
Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Remove-Item -LiteralPath $initFile -Force -ErrorAction SilentlyContinue

Write-Host "Restarting $ServiceName..."
Start-Service -Name $ServiceName
Start-Sleep -Seconds 5

Write-Host "Done. Test with:"
Write-Host 'mysql -h localhost -P 3306 -u root -pWheatRaja@123 -e "SELECT VERSION();"'

param(
  [string]$ApiDir = "apps/api"
)

$ErrorActionPreference = "Stop"
Push-Location $ApiDir
try {
  $env:PYTHONPATH = "."
  $alembic = Join-Path (Get-Location) "venv\Scripts\alembic.exe"
  if (Test-Path $alembic) {
    & $alembic -c alembic.ini current
    & $alembic -c alembic.ini upgrade head
    & $alembic -c alembic.ini check
  } else {
    python -m alembic -c alembic.ini current
    python -m alembic -c alembic.ini upgrade head
    python -m alembic -c alembic.ini check
  }
} finally {
  Pop-Location
}

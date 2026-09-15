$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$projectPython = Join-Path $projectRoot 'apps/api/venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $projectPython)) {
    $projectPython = 'python'
}
$previousPythonPath = $env:PYTHONPATH
try {
    $env:PYTHONPATH = Join-Path $projectRoot 'apps/api'
    & $projectPython -m pytest (Join-Path $projectRoot 'apps/api/tests') @args
    $testExitCode = $LASTEXITCODE
} finally {
    $env:PYTHONPATH = $previousPythonPath
}
exit $testExitCode

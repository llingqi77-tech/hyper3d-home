$ErrorActionPreference = 'Stop'
$previewRoot = $PSScriptRoot
$previewPython = 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
if (-not (Test-Path -LiteralPath $previewPython)) {
    throw 'Preview Python runtime was not found.'
}
$previewRunning = $false
try {
    $previewResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:8765/' -UseBasicParsing -TimeoutSec 2
    $previewRunning = $previewResponse.StatusCode -eq 200
} catch { }
if (-not $previewRunning) {
    Start-Process -FilePath $previewPython -ArgumentList @('-m', 'http.server', '8765', '--bind', '127.0.0.1') -WorkingDirectory $previewRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $previewRoot 'preview.stdout.log') -RedirectStandardError (Join-Path $previewRoot 'preview.stderr.log') | Out-Null
}
Write-Output 'Preview: http://127.0.0.1:8765/'

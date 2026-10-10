$ErrorActionPreference = 'Stop'
$previewRoot = Split-Path -Parent $PSScriptRoot
$previewPython = Get-Command py -ErrorAction SilentlyContinue
if ($previewPython) {
    $previewExe = $previewPython.Source
    $previewArgs = @('-3', '-m', 'http.server', '8765', '--bind', '127.0.0.1')
} else {
    $previewPython = Get-Command python -ErrorAction SilentlyContinue
    if (-not $previewPython) { throw 'Python 3 was not found on PATH.' }
    $previewExe = $previewPython.Source
    $previewArgs = @('-m', 'http.server', '8765', '--bind', '127.0.0.1')
}
$previewRunning = $false
try {
    $previewResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:8765/' -UseBasicParsing -TimeoutSec 2
    $previewRunning = $previewResponse.StatusCode -eq 200
} catch { }
if (-not $previewRunning) {
    Start-Process -FilePath $previewExe -ArgumentList $previewArgs -WorkingDirectory $previewRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'preview.stdout.log') -RedirectStandardError (Join-Path $PSScriptRoot 'preview.stderr.log') | Out-Null
}
Write-Output 'Preview: http://127.0.0.1:8765/'

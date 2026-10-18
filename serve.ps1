# ---------------------------------------------------------------------------
# CapyCake - tiny local web server (Windows PowerShell, nothing to install).
# Browsers only allow the webcam and JavaScript modules on a real web address,
# so the game is served at http://localhost:8085 instead of opened as a file.
# The first time, it also downloads the hand tracking model (7.5 MB) into
# models\ so the game then works without internet.
# Close this window to stop the server.   Bianco's Labs
# ---------------------------------------------------------------------------
param([int]$Port = 8085)

$root = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))

# hand model (Google MediaPipe, Apache-2.0)
$model = Join-Path $root 'models\hand_landmarker.task'
if (-not (Test-Path -LiteralPath $model)) {
  Write-Host "  Downloading the hand tracking model (first start only)..." -ForegroundColor Cyan
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -UseBasicParsing -Uri 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' -OutFile $model
    Write-Host "  Done." -ForegroundColor Green
  } catch {
    if (Test-Path -LiteralPath $model) { Remove-Item -LiteralPath $model -Force }
    Write-Host "  Could not download it now - the game will try again from the browser." -ForegroundColor Yellow
  }
}

$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.mjs' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.wasm' = 'application/wasm'; '.json' = 'application/json'; '.map' = 'application/json'
  '.png' = 'image/png'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'; '.woff2' = 'font/woff2'
  '.task' = 'application/octet-stream'; '.txt' = 'text/plain; charset=utf-8'; '.md' = 'text/plain; charset=utf-8'
}

# find a free port
$listener = $null
for ($p = $Port; $p -lt $Port + 20; $p++) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$p/")
    $l.Start()
    $listener = $l
    $Port = $p
    break
  } catch { }
}
if (-not $listener) { Write-Host "Could not open a local port." -ForegroundColor Red; Read-Host "Press Enter to close"; exit 1 }

$url = "http://localhost:$Port/"
Write-Host ""
Write-Host "  CAPYCAKE is running at $url" -ForegroundColor Magenta
Write-Host "  Opening your browser... (keep this window open while you play)"
Write-Host "  Close this window to stop the game server."
Write-Host ""
Start-Process $url

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path -eq '/') { $path = '/index.html' }
    $file = [System.IO.Path]::GetFullPath((Join-Path $root ($path.TrimStart('/') -replace '/', '\')))
    $res = $ctx.Response
    $res.Headers.Add('Cache-Control', 'no-cache')
    if ($file.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] } else { $res.ContentType = 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $res.ContentLength64 = $bytes.Length
      if ($ctx.Request.HttpMethod -ne 'HEAD') { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
    } else {
      $res.StatusCode = 404
    }
    $res.OutputStream.Close()
  } catch {
    # a browser tab closing mid-download is not a problem
  }
}

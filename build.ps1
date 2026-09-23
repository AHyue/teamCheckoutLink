$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$distRoot = Join-Path $projectRoot 'dist'
$chromiumRoot = Join-Path $distRoot 'chromium'
$edgeRoot = Join-Path $distRoot 'edge'
$firefoxRoot = Join-Path $distRoot 'firefox'
$sharedFiles = @('popup.html', 'popup.css', 'popup.js', 'content.css', 'content.js', 'page-bridge.js', 'background.js')

$resolvedProjectRoot = [System.IO.Path]::GetFullPath($projectRoot).TrimEnd('\')
$resolvedDistRoot = [System.IO.Path]::GetFullPath($distRoot).TrimEnd('\')
if (-not $resolvedDistRoot.StartsWith($resolvedProjectRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Refusing to clean a dist directory outside the project root.'
}

if (Test-Path -LiteralPath $distRoot) {
  Remove-Item -LiteralPath $distRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $chromiumRoot -Force | Out-Null
New-Item -ItemType Directory -Path $edgeRoot -Force | Out-Null
New-Item -ItemType Directory -Path $firefoxRoot -Force | Out-Null

Copy-Item -LiteralPath (Join-Path $projectRoot 'manifest.json') -Destination (Join-Path $chromiumRoot 'manifest.json')
Copy-Item -LiteralPath (Join-Path $projectRoot 'manifest.json') -Destination (Join-Path $edgeRoot 'manifest.json')
Copy-Item -LiteralPath (Join-Path $projectRoot 'manifest.firefox.json') -Destination (Join-Path $firefoxRoot 'manifest.json')

foreach ($file in $sharedFiles) {
  Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination (Join-Path $chromiumRoot $file)
  Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination (Join-Path $edgeRoot $file)
  Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination (Join-Path $firefoxRoot $file)
}

Compress-Archive -Path (Join-Path $chromiumRoot '*') -DestinationPath (Join-Path $distRoot 'team-long-link-chromium.zip')
Compress-Archive -Path (Join-Path $edgeRoot '*') -DestinationPath (Join-Path $distRoot 'team-long-link-edge.zip')
Compress-Archive -Path (Join-Path $firefoxRoot '*') -DestinationPath (Join-Path $distRoot 'team-long-link-firefox.zip')

Write-Host "Build complete: $distRoot"

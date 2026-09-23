$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$distRoot = Join-Path $projectRoot 'dist'
$chromiumRoot = Join-Path $distRoot 'chromium'
$edgeRoot = Join-Path $distRoot 'edge'
$firefoxRoot = Join-Path $distRoot 'firefox'
$sharedFiles = @('popup.html', 'popup.css', 'popup.js', 'content.css', 'content.js', 'page-bridge.js', 'background.js', 'LICENSE')

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

foreach ($targetRoot in @($chromiumRoot, $edgeRoot, $firefoxRoot)) {
  $iconRoot = Join-Path $targetRoot 'assets\icons'
  New-Item -ItemType Directory -Path $iconRoot -Force | Out-Null
  foreach ($size in @(16, 48, 128)) {
    $icon = Join-Path $projectRoot "assets\icons\icon$size.png"
    Copy-Item -LiteralPath $icon -Destination (Join-Path $iconRoot "icon$size.png")
  }
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
function New-ExtensionArchive {
  param(
    [Parameter(Mandatory=$true)][string]$SourceDirectory,
    [Parameter(Mandatory=$true)][string]$DestinationPath
  )

  $sourceRoot = [System.IO.Path]::GetFullPath($SourceDirectory).TrimEnd('\') + '\'
  $archive = [System.IO.Compression.ZipFile]::Open(
    $DestinationPath,
    [System.IO.Compression.ZipArchiveMode]::Create
  )
  try {
    Get-ChildItem -LiteralPath $SourceDirectory -File -Recurse | ForEach-Object {
      $entryName = $_.FullName.Substring($sourceRoot.Length).Replace('\', '/')
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $archive,
        $_.FullName,
        $entryName,
        [System.IO.Compression.CompressionLevel]::Optimal
      ) | Out-Null
    }
  } finally {
    $archive.Dispose()
  }
}

New-ExtensionArchive -SourceDirectory $chromiumRoot -DestinationPath (Join-Path $distRoot 'teamCheckoutLink-chromium.zip')
New-ExtensionArchive -SourceDirectory $edgeRoot -DestinationPath (Join-Path $distRoot 'teamCheckoutLink-edge.zip')
New-ExtensionArchive -SourceDirectory $firefoxRoot -DestinationPath (Join-Path $distRoot 'teamCheckoutLink-firefox.zip')

Write-Host "Build complete: $distRoot"

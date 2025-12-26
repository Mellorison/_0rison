Param(
  [string]$SrcDir = "$(Split-Path -Parent $PSScriptRoot)\assets\src",
  [string]$OutDir = "$(Split-Path -Parent $PSScriptRoot)\assets\glb",
  [string]$BinDir = "$(Split-Path -Parent $PSScriptRoot)\tools\bin",
  [switch]$NoOptimize
)

$ErrorActionPreference = 'Stop'

$assimp = Join-Path $BinDir 'assimp.exe'
$gltfpack = Join-Path $BinDir 'gltfpack.exe'

if (!(Test-Path -LiteralPath $SrcDir)) { New-Item -ItemType Directory -Path $SrcDir | Out-Null }
if (!(Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

if (!(Test-Path -LiteralPath $assimp)) {
  throw "Missing assimp CLI: $assimp`nPlace assimp.exe in orison-web/tools/bin/"
}

function Convert-One($inPath) {
  $inFile = Get-Item -LiteralPath $inPath
  $name = [IO.Path]::GetFileNameWithoutExtension($inFile.Name)
  $tmp = Join-Path $OutDir ($name + '.raw.glb')
  $out = Join-Path $OutDir ($name + '.glb')

  Write-Host "Converting: $($inFile.FullName)"

  # Assimp conversion
  & $assimp export "$($inFile.FullName)" "$tmp" -f glb2 | Out-Host

  if ($NoOptimize -or !(Test-Path -LiteralPath $gltfpack)) {
    Move-Item -Force -LiteralPath $tmp -Destination $out
    return
  }

  # gltfpack optimization
  & $gltfpack -i "$tmp" -o "$out" | Out-Host
  Remove-Item -Force -LiteralPath $tmp
}

$exts = @('*.fbx','*.obj','*.dae','*.gltf','*.glb','*.blend')
$inputs = @()
foreach ($e in $exts) {
  $inputs += Get-ChildItem -LiteralPath $SrcDir -Recurse -File -Filter $e -ErrorAction SilentlyContinue
}

if ($inputs.Count -eq 0) {
  Write-Host "No input files found in $SrcDir" -ForegroundColor Yellow
  Write-Host "Put Quaternius/other source models (FBX/OBJ/BLEND) into that folder, then rerun." -ForegroundColor Yellow
  exit 0
}

foreach ($f in $inputs) {
  try {
    Convert-One $f.FullName
  } catch {
    Write-Host "Failed: $($f.FullName)" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
  }
}

Write-Host "Done. Output in: $OutDir" -ForegroundColor Green

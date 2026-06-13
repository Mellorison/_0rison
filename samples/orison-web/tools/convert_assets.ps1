Param(
  [string]$SrcDir = "$(Split-Path -Parent $PSScriptRoot)\assets\src",
  [string]$OutDir = "$(Split-Path -Parent $PSScriptRoot)\assets\glb",
  [string]$BinDir = "$(Split-Path -Parent $PSScriptRoot)\tools\bin",
  [switch]$NoOptimize
)

$ErrorActionPreference = 'Stop'

$assimp = Join-Path $BinDir 'assimp.exe'
$gltfpack = Join-Path $BinDir 'gltfpack.exe'

$hasAssimp = Test-Path -LiteralPath $assimp
$hasGltfpack = Test-Path -LiteralPath $gltfpack

if (!(Test-Path -LiteralPath $SrcDir)) { New-Item -ItemType Directory -Path $SrcDir | Out-Null }
if (!(Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

if (!$hasGltfpack -and !$hasAssimp) {
  throw "Missing converters in: $BinDir`nExpected either gltfpack.exe (preferred) or assimp.exe."
}

function _safeName($s) {
  $x = $s
  $x = $x -replace '[\\/]+', '__'
  $x = $x -replace '[^a-zA-Z0-9_\-\.]+', '_'
  $x = $x.TrimEnd([char[]]@('.',' '))
  if ([string]::IsNullOrWhiteSpace($x)) { $x = 'asset' }
  return $x
}

function _shortHash8($s) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($s)
  $md5 = [System.Security.Cryptography.MD5]::Create()
  try {
    $h = $md5.ComputeHash($bytes)
  } finally {
    $md5.Dispose()
  }
  return ([System.BitConverter]::ToString($h) -replace '-', '').Substring(0, 8).ToLowerInvariant()
}

function _outNameFor($inFile) {
  $full = $inFile.FullName
  $rel = $full
  if ($full.StartsWith($SrcDir, [System.StringComparison]::OrdinalIgnoreCase)) {
    $rel = $full.Substring($SrcDir.Length)
  }
  $rel = $rel.TrimStart([char[]]@('\','/'))

  # Keep output names short to avoid Windows path issues.
  $dir = [IO.Path]::GetDirectoryName($rel)
  $base = [IO.Path]::GetFileNameWithoutExtension($rel)
  $folderTag = if ([string]::IsNullOrWhiteSpace($dir)) { 'root' } else { _safeName((Split-Path $dir -Leaf)) }
  $hash = _shortHash8($rel)
  $file = (_safeName($folderTag) + '__' + _safeName($base) + '__' + $hash + '.glb')
  return $file
}

function Convert-One($inPath) {
  $inFile = Get-Item -LiteralPath $inPath
  $outFile = _outNameFor $inFile
  $out = Join-Path $OutDir $outFile

  Write-Host "Converting: $($inFile.FullName)"

  $ext = $inFile.Extension.ToLowerInvariant()

  if ($hasGltfpack) {
    if ($ext -eq '.obj' -or $ext -eq '.gltf' -or $ext -eq '.glb') {
      if (!$out.ToLowerInvariant().EndsWith('.glb')) { $out = $out + '.glb' }
      & $gltfpack -i "$($inFile.FullName)" -o "$out" | Out-Host
      return
    }
  }

  if ($hasAssimp) {
    & $assimp export "$($inFile.FullName)" "$out" -f glb2 | Out-Host
    if (!$NoOptimize -and $hasGltfpack) {
      $tmp = Join-Path $OutDir (($outFile -replace '\.glb$','') + '.raw.glb')
      Move-Item -Force -LiteralPath $out -Destination $tmp
      & $gltfpack -i "$tmp" -o "$out" | Out-Host
      Remove-Item -Force -LiteralPath $tmp
    }
    return
  }

  throw "No converter available for extension '$ext'. Install assimp.exe for FBX/DAE/BLEND, or use OBJ/GLB/GLTF inputs with gltfpack.exe."
}

$exts = @('*.obj','*.gltf','*.glb')
if ($hasAssimp) {
  $exts += @('*.fbx','*.dae','*.blend')
}
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

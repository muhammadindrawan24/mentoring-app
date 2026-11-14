# Build lalu deploy hasil static export ke branch gh-pages.
# Jalankan dari root project: npm run deploy:pages

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'out'

if (-not (Test-Path $out)) {
  throw "Folder out tidak ditemukan. Jalankan 'npm run build' terlebih dahulu."
}

$tmp = Join-Path $env:TEMP 'mentoring-gh-pages'
if (Test-Path $tmp) {
  Remove-Item -LiteralPath $tmp -Recurse -Force
}
New-Item -ItemType Directory -Path $tmp | Out-Null

robocopy $out $tmp /E /NFL /NDL /NJH /NJS /NP | Out-Null

Push-Location $tmp
try {
  git init -b gh-pages | Out-Null
  git add -A
  git commit -m "deploy: static site $(Get-Date -Format 'yyyy-MM-dd HH:mm')" | Out-Null
  git remote add origin https://github.com/muhammadindrawan24/mentoring-app.git
  git push -f origin gh-pages
} finally {
  Pop-Location
}

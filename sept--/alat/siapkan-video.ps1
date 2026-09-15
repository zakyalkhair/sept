<#
  Menyiapkan video mentah untuk diunggah ke Cloudinary.

  - Mengurutkan berkas, menamainya ulang jadi 01.mp4 … 21.mp4
  - Mengompres yang di atas batas 100 MB Cloudinary (lihat docs/02-pesan §2.8)
  - Melaporkan apa yang perlu perhatian manusia

  Berkas asli TIDAK disentuh; hasilnya ditulis ke folder keluaran.

  PENTING setelah diunggah ke Cloudinary: nama file di sini (01, 02, ...)
  harus jadi PUBLIC ID di Cloudinary, bukan sekadar nama tampilan. Di akun
  bermode "Dynamic folders", rename lewat klik-kanan di Media Library kadang
  cuma mengubah nama tampilan — cek field "Public ID" di panel detail asset
  untuk pastikan. Verifikasi satu URL dulu (mis. lewat browser atau
  `Invoke-WebRequest -Method Head`) sebelum mengisi banyak nomor ke
  `SUDAH_ADA` di src/data/video.js — lihat docs/02-pesan.md §2.8.

  Pakai:
    .\alat\siapkan-video.ps1 -Sumber "C:\...\video-mentah"
    .\alat\siapkan-video.ps1 -Sumber "..." -Keluaran "..." -Crf 28
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Sumber,

  [string]$Keluaran = "$PSScriptRoot\..\video-siap",

  # 26 biasanya membawa video 1 menit dari ~180 MB ke ~25 MB tanpa
  # perbedaan yang terlihat di HP. Naikkan ke 28 kalau masih terlalu besar.
  [int]$Crf = 26,

  # Batas Cloudinary. Berkas di bawah ini disalin apa adanya, tidak
  # dikompres ulang — mengompres video yang sudah cukup kecil cuma
  # membuang kualitas.
  [int]$BatasMB = 100
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Sumber)) { throw "Folder sumber tidak ada: $Sumber" }

$adaFfmpeg = [bool](Get-Command ffmpeg -ErrorAction SilentlyContinue)

New-Item -ItemType Directory -Force $Keluaran | Out-Null

$berkas = Get-ChildItem $Sumber -File |
  Where-Object { $_.Extension -match '^\.(mp4|mov|m4v|avi|mkv|webm)$' } |
  Sort-Object Name

if ($berkas.Count -eq 0) { throw "Tidak ada berkas video di $Sumber" }
if ($berkas.Count -gt 21) {
  Write-Warning "Ada $($berkas.Count) berkas, hanya 21 pertama yang dipakai."
  $berkas = $berkas | Select-Object -First 21
}

Write-Output "Sumber   : $Sumber"
Write-Output "Keluaran : $Keluaran"
Write-Output "Berkas   : $($berkas.Count)"
Write-Output ""

$i = 0
$perluKompres = @()

foreach ($f in $berkas) {
  $i++
  $nama = '{0:d2}' -f $i
  $mb = [math]::Round($f.Length / 1MB, 1)
  $tujuan = Join-Path $Keluaran "$nama.mp4"

  if ($mb -le $BatasMB) {
    Copy-Item $f.FullName $tujuan -Force
    Write-Output "$nama  $mb MB  <- $($f.Name)  (disalin)"
    continue
  }

  if (-not $adaFfmpeg) {
    $perluKompres += "$nama ($mb MB) <- $($f.Name)"
    Write-Output "$nama  $mb MB  <- $($f.Name)  (TERLALU BESAR, ffmpeg tidak ada)"
    continue
  }

  Write-Output "$nama  $mb MB  <- $($f.Name)  (dikompres, crf $Crf)..."
  & ffmpeg -y -loglevel error -i $f.FullName `
    -vf "scale=-2:1080" -c:v libx264 -crf $Crf -preset slow `
    -c:a aac -b:a 128k $tujuan

  $mbBaru = [math]::Round((Get-Item $tujuan).Length / 1MB, 1)
  Write-Output "          -> $mbBaru MB"
  if ($mbBaru -gt $BatasMB) {
    $perluKompres += "$nama masih $mbBaru MB - ulangi dengan -Crf 28"
  }
}

Write-Output ""
Write-Output "Selesai. Unggah isi folder ini ke Cloudinary, folder '20sept'."

if (-not $adaFfmpeg) {
  Write-Output ""
  Write-Output "ffmpeg tidak terpasang. Pasang dengan: winget install Gyan.FFmpeg"
}

if ($perluKompres.Count -gt 0) {
  Write-Output ""
  Write-Output "PERLU PERHATIAN:"
  $perluKompres | ForEach-Object { Write-Output "  - $_" }
}

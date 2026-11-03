$ErrorActionPreference = 'Stop'
$project = 'D:\Kuliah\Project\kasir-toko-bangunan'
$npm = 'D:\Nodejs\npm.cmd'
$url = 'http://127.0.0.1:5173'

function Test-App {
    try {
        return (Invoke-WebRequest -Uri $url -TimeoutSec 2 -UseBasicParsing).StatusCode -eq 200
    } catch {
        return $false
    }
}

if (-not (Test-Path (Join-Path $project 'package.json'))) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show("Folder aplikasi tidak ditemukan:`n$project", 'Kasir Toko Bangunan') | Out-Null
    exit 1
}

if (-not (Test-App)) {
    if (-not (Test-Path $npm)) {
        Add-Type -AssemblyName PresentationFramework
        [System.Windows.MessageBox]::Show("Node.js/npm tidak ditemukan:`n$npm", 'Kasir Toko Bangunan') | Out-Null
        exit 1
    }
    Start-Process -FilePath $npm -ArgumentList 'run','dev','--','--host','127.0.0.1','--port','5173','--strictPort' -WorkingDirectory $project -WindowStyle Hidden
}

$ready = $false
for ($i = 0; $i -lt 45; $i++) {
    if (Test-App) { $ready = $true; break }
    Start-Sleep -Seconds 1
}

if ($ready) {
    Start-Process $url
} else {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show('Server kasir tidak berhasil menyala. Pastikan Node.js terpasang dan folder proyek tersedia.', 'Kasir Toko Bangunan') | Out-Null
    exit 1
}

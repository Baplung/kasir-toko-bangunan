# Kasir Toko Bangunan

Aplikasi POS offline untuk toko bahan bangunan. Satu basis UI React dipaketkan sebagai aplikasi Windows (Electron) dan Android (Capacitor). Data tersimpan lokal di masing-masing perangkat; pemindahan data dilakukan secara manual lewat XLSX.

## Fitur

- Login Admin/Kasir; setup pertama meminta pemilik membuat username dan PIN Admin sendiri.
- Produk, kategori, satuan, harga, dan stok.
- POS, pembayaran, kembalian, struk, dan validasi stok.
- Stok masuk dan penyesuaian stok.
- Pengeluaran operasional khusus Admin.
- Riwayat transaksi dan laporan.
- Ekspor/impor data XLSX.
- Pengaturan toko dan akun pengguna.

## Teknologi

React, TypeScript, Vite, TailwindCSS, Dexie/IndexedDB, Electron, Capacitor Android, Vitest.

## Persyaratan pengembangan

- Node.js/npm yang kompatibel dengan Vite 8.
- Untuk membangun Android: Android SDK dan JDK 21. Gradle wrapper proyek ini tidak kompatibel dengan JDK 25.

## Menjalankan untuk pengembangan

```bash
npm install
npm run dev
```

## Tes, lint, dan build web

```bash
npx vitest run
npx tsc --noEmit
npm run lint
npm run build
```

## Build aplikasi Windows

```bash
npm run package:win
```

Installer NSIS dibuat di `release/`. Installer tidak disertai sertifikat code-signing; Windows dapat menampilkan peringatan penerbit tak dikenal.

## Build aplikasi Android

Atur `JAVA_HOME` ke JDK 21 dan `ANDROID_HOME` ke lokasi Android SDK, lalu:

```bash
npm run android:apk
```

APK debug dihasilkan di `android/app/build/outputs/apk/debug/app-debug.apk`. APK debug cocok untuk sideload/testing, bukan rilis Google Play.

## Data dan backup

Data disimpan lokal (Dexie/IndexedDB), tidak dikirim ke server dan tidak otomatis tersinkronisasi antarperangkat. Ekspor XLSX dari perangkat sumber lalu impor pada perangkat tujuan. **Impor adalah pemulihan snapshot penuh**: tabel produk, transaksi, pergerakan stok, pengeluaran, dan pengaturan tujuan akan diganti dengan data workbook. Ekspor/backup data tujuan terlebih dahulu. Akun dan hash PIN tidak disertakan dalam workbook; buat akun pengguna secara terpisah di tiap perangkat.

## Struktur proyek penting

- `src/` — UI React, domain logic, database, tests.
- `electron/main.cjs` — Electron main process.
- `android/` — project Android native dan Gradle wrapper.
- `capacitor.config.ts` — konfigurasi Capacitor.
- `vite.config.ts` — relative asset base agar bundle dapat dimuat dari file lokal/offline.
- `Kasir Toko Bangunan Setup.exe`, `Kasir Toko Bangunan.apk` — artefak build lokal; tidak dimasukkan ke Git.

Generated/caches (`node_modules`, `dist`, Gradle build, `release`) diabaikan oleh Git dan bisa dibuat kembali dengan perintah build.

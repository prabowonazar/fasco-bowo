# Fasco Sanwira Mobile — Aplikasi Pengajuan & Persetujuan Stok

Aplikasi mobile untuk pengajuan dan alur persetujuan stok multi-tier (Purchasing, Mengetahui, Menyetujui 1-3) PT Fasco Sanwira.

---

## 📱 Cara Build File .APK di GitHub (Otomatis)

Repositori ini sudah dilengkapi dengan **GitHub Actions Workflow** otomatis di `.github/workflows/build-apk.yml`. Anda tidak perlu menginstall Android Studio di komputer.

### Langkah-langkah Build .APK:
1. Buka repositori Anda di GitHub: **[prabowonazar/fasco-bowo](https://github.com/prabowonazar/fasco-bowo)**
2. Klik tab **Actions** di bagian atas menu repositori.
3. Di panel sebelah kiri, klik workflow **"Build Android APK (Fasco Mobile)"**.
4. Klik tombol **"Run workflow"** (ada dropdown di sebelah kanan atas daftar workflow), lalu pilih branch `main` (atau `master`) dan klik tombol hijau **Run workflow**.
5. Proses kompilasi akan berjalan sekitar 2-3 menit:
   - Kompilasi web assets (Vite + Tailwind CSS).
   - Injeksi ikon resmi Fasco Sanwira.
   - Build Android Gradle project menjadi file `.apk`.
6. Setelah proses selesai bertanda centang hijau (✅), klik nama run tersebut.
7. Gulir ke bawah ke bagian **Artifacts**:
   - Unduh file zip bernama **`Fasco-Sanwira-Mobile-APK`**.
   - Ekstrak zip tersebut untuk mendapatkan file **`Fasco-Sanwira-Mobile.apk`**.

---

## 📲 Cara Pasang di HP Android

1. Kirim file `Fasco-Sanwira-Mobile.apk` ke HP Android (bisa lewat WhatsApp, Telegram, Google Drive, atau kabel USB).
2. Di HP Android, ketuk file `.apk` untuk menginstall.
3. Jika muncul peringatan *"Install unknown apps"* / *"Sumber tidak dikenal"*, pilih **Izinkan** / **Allow from this source**.
4. Aplikasi Fasco Sanwira Mobile akan terpasang di layar utama HP Anda dengan logo resmi dan dapat dibuka langsung secara offline maupun online!

---

## 💻 Menjalankan di Lokal (Development)

```bash
# Install dependencies
npm install

# Jalankan dev server
npm run dev

# Build web production
npm run build
```

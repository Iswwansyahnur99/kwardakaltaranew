# Panduan Setup Firebase - Pramuka Kaltara

Dokumen ini berisi panduan langkah demi langkah untuk menghubungkan Admin Dashboard Pramuka Kaltara dengan Firebase Firestore.

## 1. Persiapan Project Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Klik **Add project** dan beri nama `pramuka-kaltara`.
3. Matikan Google Analytics (opsional) dan klik **Create project**.

## 2. Setup Firestore Database
1. Di menu sidebar kiri, pilih **Build** > **Firestore Database**.
2. Klik **Create database**.
3. Pilih lokasi server: **asia-southeast1** (Singapore) agar latensi rendah.
4. Pada langkah Security Rules, pilih **Start in test mode**.
   - *Catatan: Mode ini mengizinkan read/write publik selama 30 hari. Untuk produksi, rules perlu diperketat.*
5. Klik **Create**.

## 3. Registrasi Web App
1. Di halaman Project Overview, klik icon **Web** (`</>`).
2. Masukkan nama aplikasi: `Pramuka Kaltara Web`.
3. Klik **Register app**.
4. Anda akan melihat konfigurasi `firebaseConfig`. Salin bagian object config-nya saja.

## 4. Konfigurasi Kode
1. Buka file `assets/firebase-config.js` di text editor.
2. Ganti nilai `firebaseConfig` dengan yang Anda salin dari Firebase Console.
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "pramuka-kaltara.firebaseapp.com",
     projectId: "pramuka-kaltara",
     storageBucket: "pramuka-kaltara.firebasestorage.app",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

## 5. Verifikasi Instalasi
1. Buka file `admin/index.html` di browser.
2. Login ke dashboard (default: `admin` / `admin123`).
3. Perhatikan indikator status di pojok kanan atas header:
   - **🟢 Firebase**: Berarti aplikasi berhasil terhubung ke Firestore.
   - **🟡 Offline**: Berarti aplikasi menggunakan LocalStorage (cek koneksi atau config).
4. Jika database Firestore masih kosong, aplikasi akan otomatis melakukan **Seeding** (mengupload data awal dari `assets/data.js` ke Firestore).

## Struktur Data Firestore
Aplikasi menggunakan collection berikut:
- `posts`: Artikel berita dan kegiatan.
- `events`: Agenda kegiatan mendatang dan lampau.
- `albums`: Galeri foto kegiatan.

## Troubleshooting
- **Error: "Firebase: Error (auth/invalid-api-key)"**
  - Pastikan `apiKey` di `firebase-config.js` sudah benar dan tidak ada spasi tambahan.
- **Data tidak muncul**
  - Cek Console browser (F12 > Console) untuk melihat pesan error spesifik.
  - Pastikan Firestore Security Rules dalam mode Test atau Public.
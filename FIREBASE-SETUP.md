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

## 6. Setup Firebase Storage (untuk Upload Gambar)
1. Di menu sidebar kiri, pilih **Build** > **Storage**.
2. Klik **Get started**.
3. Pilih lokasi: **us-central1** (gratis) atau lokasi lain sesuai kebutuhan.
4. Klik **Done**.
5. Pergi ke tab **Rules** dan ganti dengan rules berikut:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if true;
       }
     }
   }
   ```
6. Klik **Publish** untuk menyimpan rules.

## PENTING: Konfigurasi Firestore Security Rules

**Jika data gagal disimpan, kemungkinan besar masalahnya adalah Firestore Security Rules.**

### Cara Mengecek dan Update Firestore Rules:
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project **pramuka-kaltara**
3. Di menu sidebar, pilih **Firestore Database**
4. Klik tab **Rules** di bagian atas
5. Ganti rules dengan kode berikut:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. Klik **Publish** untuk menyimpan rules

**⚠️ PERINGATAN:** Rules di atas mengizinkan siapa saja membaca dan menulis data. Ini cocok untuk development/testing. Untuk produksi, gunakan rules yang lebih ketat dengan autentikasi.

### Rules untuk Produksi (dengan autentikasi):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read
    match /{document=**} {
      allow read: if true;
    }

    // Only authenticated users can write
    match /posts/{postId} {
      allow write: if request.auth != null;
    }
    match /events/{eventId} {
      allow write: if request.auth != null;
    }
    match /albums/{albumId} {
      allow write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Error: "AKSES DITOLAK" atau "permission-denied"
**Penyebab:** Firestore Security Rules tidak mengizinkan operasi write.
**Solusi:**
1. Buka Firebase Console > Firestore Database > Rules
2. Pastikan rules mengizinkan read/write (lihat bagian di atas)
3. Klik Publish dan tunggu beberapa detik
4. Refresh halaman admin dan coba lagi

### Error: "Firebase: Error (auth/invalid-api-key)"
- Pastikan `apiKey` di `firebase-config.js` sudah benar dan tidak ada spasi tambahan.

### Data tidak muncul
- Cek Console browser (F12 > Console) untuk melihat pesan error spesifik.
- Pastikan Firestore Security Rules dalam mode Test atau sudah dikonfigurasi dengan benar.

### Upload gambar gagal
- Pastikan Firebase Storage sudah diaktifkan di Firebase Console
- Pastikan Storage Rules sudah dikonfigurasi (lihat bagian 6)
- Cek Console browser untuk melihat error spesifik

### Test Mode Expired (30 hari)
Jika menggunakan test mode dan sudah lebih dari 30 hari:
1. Buka Firestore Database > Rules
2. Rules mungkin sudah otomatis diubah menjadi `allow read, write: if false;`
3. Update rules sesuai panduan di atas
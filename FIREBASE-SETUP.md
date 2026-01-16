# Panduan Setup Firebase untuk Pramuka Kaltara CMS

## Langkah 1: Buat Project Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Login dengan akun Google Cloud Anda (yang memiliki $300 credit)
3. Klik **"Create a project"** atau **"Add project"**
4. Masukkan nama project: `pramuka-kaltara` (atau nama lain yang Anda inginkan)
5. Enable Google Analytics jika diinginkan (opsional)
6. Klik **"Create project"**

## Langkah 2: Tambahkan Web App

1. Di dashboard project, klik ikon **Web** (`</>`)
2. Masukkan nama app: `Pramuka Kaltara Web`
3. Klik **"Register app"**
4. Anda akan mendapatkan konfigurasi Firebase seperti ini:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "pramuka-kaltara.firebaseapp.com",
  projectId: "pramuka-kaltara",
  storageBucket: "pramuka-kaltara.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijk"
};
```

## Langkah 3: Setup Firestore Database

1. Di sidebar Firebase Console, klik **"Firestore Database"**
2. Klik **"Create database"**
3. Pilih lokasi server terdekat (asia-southeast1 untuk Indonesia)
4. Pilih **"Start in test mode"** untuk development
5. Klik **"Create"**

### Atur Firestore Rules (Keamanan)

Setelah database dibuat, update rules untuk keamanan yang lebih baik:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to everyone (for website)
    match /posts/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /events/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /albums/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Langkah 4: Update Konfigurasi di Website

Buka file `assets/firebase-config.js` dan ganti dengan konfigurasi dari Firebase Console:

```javascript
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY_ANDA",
  authDomain: "GANTI_DENGAN_PROJECT_ID.firebaseapp.com",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_PROJECT_ID.appspot.com",
  messagingSenderId: "GANTI_DENGAN_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};
```

## Langkah 5: Test Koneksi

1. Buka halaman admin: `https://your-site.com/admin/`
2. Login dengan username/password
3. Cek di header dashboard - harus muncul "🟢 Firebase" jika terhubung
4. Jika muncul "🟡 Offline", berarti masih menggunakan localStorage (cek konfigurasi)

## Langkah 6: Seed Data Awal

Setelah Firebase terhubung:
1. Login ke admin dashboard
2. Data akan otomatis di-seed ke Firebase saat pertama kali
3. Atau gunakan tombol "Import Data" untuk upload data JSON

## Estimasi Biaya

Dengan $300 credit Google Cloud:

| Service | Free Tier | Estimasi Bulanan |
|---------|-----------|------------------|
| Firestore | 1GB storage, 50K reads/day | ~$0-5 |
| Authentication | 10K users | Free |
| Hosting (opsional) | 10GB/month | Free |

**Total estimasi: $0-5/bulan** - Credit $300 bisa bertahan 2-3 tahun untuk traffic website Pramuka!

## Troubleshooting

### "Firebase not configured"
- Pastikan `firebase-config.js` sudah diupdate dengan konfigurasi yang benar
- Pastikan Firebase SDK sudah di-load sebelum `firebase-config.js`

### "Permission denied"
- Cek Firestore Rules sudah diset dengan benar
- Pastikan database sudah dalam mode "test" atau rules sudah diupdate

### Data tidak sync
- Clear localStorage browser: `localStorage.clear()`
- Refresh halaman admin

## Kontak Support

Jika ada masalah, hubungi tim developer atau buka issue di repository GitHub.

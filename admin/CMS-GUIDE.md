# Panduan Penggunaan Admin Dashboard CMS - Pramuka Kaltara

## 📋 Daftar Isi
1. [Akses Dashboard](#akses-dashboard)
2. [Fitur Utama](#fitur-utama)
3. [Mengelola Berita (Posts)](#mengelola-berita-posts)
4. [Mengelola Agenda (Events)](#mengelola-agenda-events)
5. [Mengelola Galeri (Albums)](#mengelola-galeri-albums)
6. [Mengelola Download](#mengelola-download)
7. [Mengelola PPID](#mengelola-ppid)
8. [Pengaturan](#pengaturan)
9. [Tips & Trik](#tips--trik)
10. [Troubleshooting](#troubleshooting)

---

## 🔐 Akses Dashboard

### Login
1. Buka `admin/index.html` di browser
2. Masukkan kredensial default:
   - **Username:** `admin`
   - **Password:** `admin123`
3. Klik tombol **Masuk**

### Mengubah Password
1. Setelah login, klik menu **Pengaturan** di sidebar
2. Masukkan password baru di form "Pengaturan Akun"
3. Klik **Simpan Pengaturan**

> ⚠️ **Penting:** Simpan kredensial baru Anda dengan aman!

---

## 🎯 Fitur Utama

Dashboard CMS memiliki 5 bagian utama:

1. **Overview** - Ringkasan statistik dan berita terbaru
2. **Berita** - Kelola artikel berita dan kegiatan
3. **Agenda** - Kelola jadwal kegiatan
4. **Galeri** - Kelola album foto
5. **Download** - Kelola dokumen yang bisa diunduh
6. **PPID** - Kelola informasi publik
7. **Pengaturan** - Ubah password dan reset data

---

## 📰 Mengelola Berita (Posts)

### Menambah Berita Baru
1. Klik menu **Berita** di sidebar
2. Klik tombol **+ Tambah Berita**
3. Isi form:
   - **Judul Berita** (wajib)
   - **Kategori** (pilih: Kegiatan, Pelatihan, Pengabdian, Prestasi, Komunitas)
   - **Tanggal** (wajib)
   - **Lokasi** (wajib)
   - **Ringkasan** (wajib) - 1-2 kalimat singkat
   - **Isi Berita** (opsional) - Paragraf dipisahkan dengan baris kosong
   - **Tags** (opsional) - Pisahkan dengan koma
   - **Cover Image** - Upload gambar atau masukkan URL
4. Klik **Tambah Berita**

### Mengedit Berita
1. Di tabel berita, klik tombol **✏️ Edit** pada berita yang ingin diedit
2. Ubah data yang diperlukan
3. Klik **Simpan Perubahan**

### Menghapus Berita
1. Di tabel berita, klik tombol **🗑️ Hapus**
2. Konfirmasi penghapusan

### Mencari & Filter Berita
- Gunakan kotak pencarian untuk mencari berdasarkan judul atau ringkasan
- Gunakan dropdown kategori untuk filter berdasarkan kategori

### Tips Menulis Berita
- **Ringkasan:** Buat ringkasan yang menarik (1-2 kalimat) - ini akan muncul di halaman beranda
- **Isi Berita:** Pisahkan paragraf dengan baris kosong untuk format yang rapi
- **Tags:** Gunakan tags yang relevan untuk memudahkan pencarian
- **Cover Image:** Gunakan gambar berkualitas tinggi (direkomendasikan 1200x630px)

---

## 📅 Mengelola Agenda (Events)

### Menambah Agenda Baru
1. Klik menu **Agenda** di sidebar
2. Klik tombol **+ Tambah Agenda**
3. Isi form:
   - **Judul Agenda** (wajib)
   - **Tanggal Mulai** (wajib)
   - **Tanggal Selesai** (wajib)
   - **Lokasi** (wajib)
   - **Penyelenggara** (wajib)
   - **URL Pendaftaran** (opsional)
4. Klik **Tambah Agenda**

### Mengedit Agenda
1. Di tabel agenda, klik tombol **✏️ Edit**
2. Ubah data yang diperlukan
3. Klik **Simpan Perubahan**

### Menghapus Agenda
1. Di tabel agenda, klik tombol **🗑️ Hapus**
2. Konfirmasi penghapusan

### Tips Agenda
- Agenda dengan tanggal di masa depan akan muncul di bagian "Agenda Terdekat"
- Agenda dengan tanggal di masa lalu akan muncul di bagian "Yang sudah berlalu"
- Pastikan tanggal selesai tidak lebih awal dari tanggal mulai

---

## 🖼️ Mengelola Galeri (Albums)

### Menambah Album Baru
1. Klik menu **Galeri** di sidebar
2. Klik tombol **+ Tambah Album**
3. Isi form:
   - **Judul Album** (wajib)
   - **Lokasi** (wajib)
   - **Tahun** (wajib)
   - **Jumlah Foto** (wajib)
   - **Cover Album** - Upload gambar atau masukkan URL
4. Klik **Tambah Album**

### Mengedit Album
1. Di grid album, klik tombol **Edit**
2. Ubah data yang diperlukan
3. Klik **Simpan Perubahan**

### Menghapus Album
1. Di grid album, klik tombol **Hapus**
2. Konfirmasi penghapusan

---

## 📥 Mengelola Download

### Menambah Dokumen Download
1. Klik menu **Download** di sidebar
2. Klik tombol **+ Tambah Dokumen**
3. Isi form:
   - **Judul Dokumen** (wajib)
   - **Kategori** (wajib) - Pilih: Pendaftaran, SOP, Pedoman, Template, Surat
   - **Deskripsi** (wajib)
   - **File** - Upload file atau masukkan URL
   - **Tanggal Update** (wajib)
4. Klik **Tambah Dokumen**

### Mengedit Dokumen
1. Di tabel download, klik tombol **✏️ Edit**
2. Ubah data yang diperlukan
3. Klik **Simpan Perubahan**

### Menghapus Dokumen
1. Di tabel download, klik tombol **🗑️ Hapus**
2. Konfirmasi penghapusan

---

## 📄 Mengelola PPID

### Menambah Dokumen PPID
1. Klik menu **PPID** di sidebar
2. Klik tombol **+ Tambah Dokumen PPID**
3. Isi form:
   - **Judul** (wajib)
   - **Nomor** (wajib) - Contoh: 01/2025
   - **Tahun** (wajib)
   - **Jenis** (wajib) - Pilih: Berkala, Setiap Saat, Serta Merta
   - **Unit** (wajib)
   - **File** - Upload file atau masukkan URL
   - **Tanggal Publikasi** (wajib)
4. Klik **Tambah Dokumen**

### Mengedit Dokumen PPID
1. Di tabel PPID, klik tombol **✏️ Edit**
2. Ubah data yang diperlukan
3. Klik **Simpan Perubahan**

### Menghapus Dokumen PPID
1. Di tabel PPID, klik tombol **🗑️ Hapus**
2. Konfirmasi penghapusan

---

## ⚙️ Pengaturan

### Mengubah Password
1. Klik menu **Pengaturan** di sidebar
2. Di bagian "Pengaturan Akun":
   - Masukkan **Username Baru** (opsional)
   - Masukkan **Password Baru**
   - Masukkan **Konfirmasi Password**
3. Klik **Simpan Pengaturan**

### Reset Data ke Default
1. Di bagian "Reset Data"
2. Klik tombol **Reset ke Default**
3. Konfirmasi - **PERINGATAN:** Tindakan ini tidak dapat dibatalkan!

### Export Data
1. Di halaman Overview
2. Klik tombol **📤 Export Data (JSON)**
3. File JSON akan terunduh

### Import Data
1. Di halaman Overview
2. Klik tombol **📥 Import Data**
3. Pilih file JSON yang ingin diimport
4. Data akan diganti dengan data dari file

---

## 💡 Tips & Trik

### Upload Gambar
- **Firebase Storage:** Jika Firebase Storage dikonfigurasi, gambar akan diupload ke cloud
- **URL Eksternal:** Jika Firebase Storage tidak tersedia, gunakan URL gambar eksternal
- **Format:** JPG, PNG, WebP (Maksimal 5MB)
- **Kompresi:** Gambar akan otomatis dikompres untuk menghemat ruang

### Format Teks
- **Paragraf:** Pisahkan dengan baris kosong (double line break)
- **Tags:** Pisahkan dengan koma, contoh: `Kegiatan, Pelatihan, Bakti`

### Firebase vs LocalStorage
- **🟢 Firebase:** Data tersimpan di cloud, bisa diakses dari mana saja
- **🟡 Offline:** Data tersimpan di browser (localStorage), hanya bisa diakses di browser yang sama

### Sinkronisasi Data
- Data yang disimpan di admin dashboard otomatis tersinkron ke website utama
- Website membaca data dari localStorage
- Jika menggunakan Firebase, data juga tersimpan di cloud

---

## 🔧 Troubleshooting

### Tidak bisa login
- Pastikan username dan password benar
- Cek apakah kredensial sudah diubah di Pengaturan
- Coba hapus cache browser dan login lagi

### Data tidak tersimpan
- Cek indikator status Firebase di pojok kanan atas
- Jika **🟡 Offline**, data tersimpan di localStorage (hanya di browser ini)
- Jika **🟢 Firebase**, pastikan Firestore Security Rules sudah dikonfigurasi dengan benar

### Upload gambar gagal
- Pastikan Firebase Storage sudah diaktifkan
- Cek ukuran file (maksimal 5MB)
- Pastikan format file adalah gambar (JPG, PNG, WebP)
- Jika Firebase Storage tidak tersedia, gunakan URL eksternal

### Data tidak muncul di website
- Refresh halaman website
- Cek Console browser (F12) untuk melihat error
- Pastikan data sudah disimpan dengan benar di admin dashboard

### Error "permission-denied"
- Buka Firebase Console > Firestore Database > Rules
- Pastikan rules mengizinkan read/write
- Lihat panduan di `FIREBASE-SETUP.md`

---

## 📞 Bantuan

Jika mengalami masalah:
1. Cek Console browser (F12) untuk melihat error
2. Baca file `FIREBASE-SETUP.md` untuk panduan setup Firebase
3. Pastikan semua konfigurasi sudah benar

---

**Selamat menggunakan Admin Dashboard CMS Pramuka Kaltara! 🎉**

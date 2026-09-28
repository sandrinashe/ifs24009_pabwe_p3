# PABWE Praktikum 3 — JavaScript

## Informasi Mahasiswa

**Nama:** Sandrina Trianisa Sihite  
**NIM:** 11S24009  
**Mata Kuliah:** Pengembangan Aplikasi Berbasis Web  
**Praktikum:** Praktikum 3 — JavaScript

---

## Deskripsi Proyek

Proyek ini merupakan implementasi studi kasus Praktikum 3 PABWE yang menggunakan **JavaScript** untuk membangun aplikasi web interaktif dalam satu halaman (*single page application*).

Aplikasi terdiri dari tiga fitur utama yang dipisahkan menggunakan sistem **tab**, yaitu:

1. **Expense Tracker** — mencatat dan mengelola transaksi pemasukan serta pengeluaran.
2. **Bookmark Manager** — menyimpan dan mengelola tautan favorit.
3. **Quiz App** — kuis pilihan ganda interaktif dengan sistem skor dan *high score*.

Seluruh interaksi dan logika aplikasi ditangani menggunakan JavaScript pada file `assets/script.js`, sedangkan data yang perlu bertahan setelah halaman di-refresh disimpan menggunakan `localStorage`.

---

## Fitur

### 1. Expense Tracker

Fitur ini digunakan untuk mencatat transaksi keuangan harian.

Fitur yang tersedia:

- Menambahkan transaksi baru.
- Mengubah transaksi.
- Menghapus transaksi.
- Menampilkan total pemasukan.
- Menampilkan total pengeluaran.
- Menampilkan saldo.
- Mencari transaksi berdasarkan judul.
- Memfilter transaksi berdasarkan tipe atau kategori.
- Sorting transaksi.
- Validasi input transaksi.
- Menampilkan *empty state* ketika belum terdapat data.
- Menyimpan data transaksi menggunakan `localStorage`.

Setiap transaksi memiliki informasi berupa:

- Judul/deskripsi
- Kategori
- Jumlah
- Tipe transaksi: Pemasukan atau Pengeluaran
- Tanggal

Requirement tersebut mengikuti studi kasus Expense Tracker pada modul.

---

### 2. Bookmark Manager

Fitur ini digunakan untuk menyimpan dan mengelola tautan favorit.

Fitur yang tersedia:

- Menambahkan bookmark.
- Mengubah bookmark.
- Menghapus bookmark.
- Validasi URL.
- Kategori/tag bookmark.
- Catatan singkat.
- Membuka tautan pada tab baru.
- Mencari bookmark berdasarkan nama, URL, atau kategori.
- Sorting berdasarkan judul atau waktu.
- Menampilkan *empty state* ketika belum terdapat bookmark.
- Menyimpan data menggunakan `localStorage`.

Setiap bookmark memiliki:

- Nama/judul
- URL
- Kategori/tag
- Catatan singkat (opsional)

URL divalidasi agar menggunakan protokol `http://` atau `https://`.

---

### 3. Quiz App

Fitur ini merupakan kuis pilihan ganda yang menggunakan data berbentuk **array of object** pada JavaScript.

Fitur yang tersedia:

- Memulai atau mengulang kuis.
- Menampilkan pertanyaan secara dinamis.
- Menampilkan pilihan jawaban.
- Navigasi antar soal.
- Menghitung skor.
- Memberikan feedback jawaban.
- Menampilkan skor akhir.
- Menyimpan *high score* menggunakan `localStorage`.
- Menampilkan minimal 5 soal dengan minimal 4 pilihan jawaban.

Soal disimpan dalam JavaScript sebagai array of object dan dirender ke halaman menggunakan DOM.

---

## Teknologi yang Digunakan

- **HTML5**
- **JavaScript**
- **DOM Manipulation**
- **LocalStorage**
- **Tailwind CSS via CDN**
- **Google Fonts**
- **Tabler Icons**

Proyek menggunakan JavaScript eksternal melalui `assets/script.js`. Modul juga memperbolehkan penggunaan Tailwind CSS melalui CDN, Google Fonts, dan library ikon untuk styling. 
---

## Struktur Folder

```text
username-pabwe-p3/
│
├── index.html
│
├── assets/
│   ├── script.js
│   └── img/
│
└── README.md
```

Folder `assets/img/` bersifat opsional dan dapat digunakan apabila proyek membutuhkan gambar atau aset pendukung lainnya. Struktur tersebut sesuai dengan struktur yang disarankan pada modul.

---

## Konsep JavaScript yang Digunakan

Beberapa konsep JavaScript yang diterapkan dalam proyek ini meliputi:

- DOM Selection
- DOM Manipulation
- Event Listener
- Form Handling
- Array dan Object
- `map()`
- `filter()`
- `find()`
- `forEach()`
- `sort()`
- JSON
- `JSON.stringify()`
- `JSON.parse()`
- `localStorage`
- Validasi input
- Conditional Statement
- State Management sederhana
- Array of Object
- Modal Interaction

---

## Penyimpanan Data

Data aplikasi disimpan menggunakan `localStorage` pada browser sehingga data tetap tersedia setelah halaman di-*refresh*.

Setiap fitur menggunakan **key `localStorage` yang berbeda** agar data antarfitur tidak saling menimpa. Selain data fitur, tab terakhir yang dibuka juga disimpan sehingga aplikasi dapat membuka kembali tab tersebut setelah halaman di-*refresh*.

---

## Responsiveness

Aplikasi dirancang agar dapat digunakan pada:

- Desktop
- Tablet
- Mobile

Tampilan diuji menggunakan browser pada ukuran layar desktop maupun mobile/DevTools sesuai checklist pengumpulan pada modul.

---

## Cara Menjalankan

1. Clone atau download repository.
2. Buka folder proyek.
3. Jalankan file `index.html` menggunakan browser.
4. Gunakan navigasi tab untuk berpindah antara:
   - Expense Tracker
   - Bookmark Manager
   - Quiz App

Tidak diperlukan backend atau database untuk menjalankan proyek ini karena penyimpanan data menggunakan `localStorage`. Modul juga menyatakan bahwa backend/API tidak diperlukan untuk praktikum ini.

---

## Catatan

Proyek ini dibuat berdasarkan studi kasus Praktikum 3 PABWE dengan pengembangan dan modifikasi mandiri. File latihan dari modul digunakan sebagai referensi pembelajaran dan bukan sebagai hasil *copy-paste* mentah.

---

## Status Proyek

- [x] Struktur HTML
- [x] JavaScript eksternal
- [x] Tab Navigation
- [x] Expense Tracker
- [x] Bookmark Manager
- [x] Quiz App
- [x] CRUD
- [x] LocalStorage
- [x] Search & Filter
- [x] Sorting
- [x] Modal Edit/Hapus
- [x] Responsive Design
- [x] Quiz dengan minimal 5 soal
- [x] High Score
- [x] Persistensi tab setelah refresh
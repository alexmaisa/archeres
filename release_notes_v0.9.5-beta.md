# Archeres Release v0.9.5-beta 🚀

Kami dengan bangga mempersembahkan rilis **v0.9.5-beta**, sebuah pembaruan tonggak pencapaian besar (*milestone*) yang membawa Archeres ke tingkat keamanan, kepatuhan hukum, dan ketahanan sistem yang lebih matang. 

Pembaruan ini berfokus pada perlindungan platform dari spam robot secara mandiri (*self-hosted*), kepatuhan lisensi non-komersial, serta peningkatan kualitas UI/UX premium yang bersih dan profesional.

---

## 🔑 Ringkasan Fitur Utama & Perubahan

### 1. 🛡️ Mesin Captcha Matematika SVG Terenkripsi (Anti-Spam Mandiri)
Untuk melindungi platform dari serangan spam pendaftaran akun tanpa mengorbankan privasi pengguna (bebas dari kuki pelacakan pihak ketiga), kami telah membangun mesin Captcha kustom:
*   **Komputasi Distorsi Vektor**: Gambar captcha matematika dihasilkan secara dinamis di backend (Go) dalam format SVG dengan garis kebisingan (*noise lines*), titik acak (*scatter points*), dan rotasi karakter acak untuk menghalau pembaca OCR bot.
*   **Tanda Tangan Kriptografis (JWT)**: Jawaban captcha yang benar ditandatangani secara aman di backend menggunakan token JWT berumur singkat (kedaluwarsa dalam 5 menit) menggunakan kunci rahasia bersama.
*   **Widget UI Gelap Glassmorphism**: Dilengkapi tombol penyegar (*Refresh*) captcha interaktif dan masukan numerik yang memicu papan ketik angka secara otomatis di perangkat seluler (`inputMode="numeric"`).
*   **Stabilitas Koneksi (Retry Resilience)**: Menambahkan mekanisme percobaan ulang otomatis di frontend untuk mengatasi jeda waktu kompilasi server (*hot-reload/boot latency*) saat startup bersamaan.

### 2. ⚖️ Kepatuhan Lisensi Hukum (PolyForm Noncommercial 1.0.0)
Kami telah memperbarui seluruh basis hukum dan atribusi kepemilikan proyek:
*   **Atribusi Hak Cipta**: Hak cipta proyek Archeres dipegang sepenuhnya oleh **Benny Maisa**.
*   **Tautan Repositori Resmi**: Menghubungkan secara dinamis nama pemilik lisensi di bilah kaki (*footer*) ke repositori resmi Gitea/Forgejo: `https://repo.alexmaisa.my.id/alexmaisa`.
*   **Penerapan Lisensi**: Menetapkan lisensi **PolyForm Noncommercial License 1.0.0** di dalam berkas `LICENSE` utama, `README.md`, dan seluruh bilah kaki aplikasi. Penggunaan proyek ini 100% gratis untuk penelitian akademis, pribadi, dan non-komersial, serta melarang keras monetisasi komersial tanpa izin tertulis.

### 3. 🎨 Penyempurnaan Estetika UI & Visual Premium
*   **Pembersihan Tautan Bilah Kaki**: Menghilangkan garis bawah (*text underline*) default yang mengganggu estetika pada bilah kaki di 5 halaman utama (Home, About, Admin, Dashboard, dan Workspace Client) guna memberikan sentuhan minimalis dan sangat modern.

---

## 📦 Berkas yang Mengalami Perubahan

*   `LICENSE`: Teks lengkap lisensi PolyForm Noncommercial 1.0.0.
*   `README.md`: Pembaruan badge versi `v0.9.5-beta`, dokumentasi keamanan captcha, serta penjelasan legalitas non-komersial.
*   `backend/utils/captcha.go` & `captcha_test.go`: Kode komputasi pembuatan SVG dan pengujian unit penandatanganan JWT.
*   `backend/handlers/auth.go` & `main.go`: Integrasi validasi pendaftaran dan registrasi rute API `/api/auth/captcha`.
*   `web/package.json`: Pembaruan versi proyek menjadi `0.9.5-beta`.
*   `web/src/app/auth/register/page.tsx`: Integrasi state captcha, penanganan respons tangguh, serta antarmuka verifikasi keamanan.
*   Bilah Kaki Frontend (5 Halaman): Pembaruan tautan interaktif eksternal Benny Maisa dan penghapusan dekorasi garis bawah.

---

## 🛠️ Panduan Pembuatan Tag Rilis Manual (Untuk Benny Maisa)

Gunakan perintah git berikut untuk membuat tag rilis secara lokal dan mendorongnya ke repositori Forgejo:

```bash
# 1. Pastikan Anda berada di cabang main dan mengambil pembaruan terbaru
git checkout main
git pull origin main

# 2. Buat tag beranotasi baru untuk v0.9.5-beta
git tag -a v0.9.5-beta -m "Archeres Release v0.9.5-beta: Encrypted Math Captcha and License Compliance"

# 3. Dorong tag tersebut ke server Forgejo
git push origin v0.9.5-beta
```

Setelah didorong, alur kerja **Forgejo Actions** secara otomatis akan mendeteksi tag rilis ini, melakukan kompilasi otomatis (*multi-arch*), dan mengunggah gambar Docker terbaru (`archeres-web:latest` & `archeres-backend:latest`) ke registri pribadi Anda di `repo.alexmaisa.my.id`.

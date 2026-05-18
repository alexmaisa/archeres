# Aturan Keamanan & Privasi Pengguna (Security & Privacy Agent Rules)

Dokumen ini mendefinisikan aturan mutlak (*non-negotiable rules*) bagi seluruh pengembang dan kecerdasan buatan (AI Agents) yang bekerja pada repositori Archeres. Aturan ini dirancang untuk mempertahankan nilai-nilai **Privacy by Design**, keamanan data sensitif, dan pencegahan penyalahgunaan platform.

---

## 1. Perlindungan Administratif & Privasi Mutlak (Privacy-First Admin)

* **Larangan Pengambilan Massal (Anti-Scraping protective barrier)**:
  * Rute API administratif yang mengembalikan daftar lengkap akun pengguna (`/api/admin/users`) atau daftar proyek penelitian secara massal (`/api/admin/projects`) **harus tetap dinonaktifkan secara permanen** dan mengembalikan kode status `403 Forbidden`.
  * Tidak diperbolehkan membangun tabel rendering massal yang mengekspos data pribadi banyak pengguna sekaligus pada antarmuka admin.
* **Pencarian Aman Atas Permintaan (Secure On-Demand Lookup)**:
  * Akses pemeriksaan pengguna oleh administrator wajib menggunakan metode pencarian email presisi penuh (*exact-match*). Parameter pencarian parsial (*partial match* seperti `LIKE '%email%'`) sangat dilarang untuk mencegah tebakan massal (*email guessing attack*).
* **Cascading Delete Transaksional**:
  * Penghapusan akun pengguna oleh administrator harus menghapus bersih seluruh draf metodologi penelitian terkait secara transaksional di database untuk mematuhi hak penghapusan data pengguna (*Right to be Forgotten*).
* **Proteksi Diri Admin**:
  * Tindakan administratif (penghapusan akun atau penurunan peran) wajib memiliki pengecekan logika di backend untuk memastikan administrator tidak dapat menghapus atau menurunkan hak akses dirinya sendiri secara tidak sengaja.

---

## 2. Telemetri Deret Waktu Anonim (Zero-Identity Telemetry)

* **Larangan Relasi Data Sesi**:
  * Pencatatan statistik aktivitas login harian/bulanan tidak diperbolehkan menyimpan relasi ke `user_id`, nama, alamat email, atau alamat IP pengguna.
* **Arsitektur Model Sesi Anonim**:
  * Seluruh data telemetri aktivitas masuk wajib menggunakan model `LoginTelemetry` yang **hanya memiliki kolom ID dan stempel waktu (`CreatedAt`)**.
  * Setiap proses login sukses di backend hanya diperbolehkan menyisipkan baris kosong dengan penanda waktu kejadian saja.

---

## 3. Keamanan Akun & Kredensial Pengguna

* **Kekuatan Kata Sandi (Password Strength)**:
  * Proses registrasi wajib memiliki validasi kekuatan kata sandi baik di sisi frontend (indikator visual warna dinamis di bawah kolom input) maupun di sisi backend.
  * Form isian kata sandi diwajibkan memiliki fitur masking/unmasking (Toggle Eye Icon) untuk kenyamanan pengguna tanpa mengorbankan keamanan tampilan visual.
* **Manajemen Kunci & Sesi**:
  * Token JWT wajib disimpan pada HttpOnly Cookie dengan atribut `SameSite: Lax` untuk mencegah ancaman pencurian sesi via Cross-Site Scripting (XSS).

---

## 4. Konfigurasi Rahasia Berbasis Lingkungan (Environment-Only Config)

* **Larangan Penyimpanan Rahasia di Database**:
  * Seluruh kredensial infrastruktur sensitif (seperti SMTP Server, SMTP Port, SMTP Username, SMTP Password, dan JWT Secret Keys) **dilarang keras disimpan di dalam tabel database** atau disediakan antarmuka UI konfigurasinya pada frontend.
  * Kredensial wajib dideklarasikan secara eksklusif via berkas konfigurasi lingkungan (`.env` / Docker Environment Variables) untuk meminimalkan permukaan serangan kebocoran basis data (*database leak attack surface*).

---

## 5. Lokalisasi Tanpa Pelacakan Lokasi

* **Deteksi Bahasa Otomatis**:
  * Deteksi preferensi bahasa pengguna (Indonesia vs Inggris) wajib dilakukan secara dinamis berdasarkan preferensi browser (`navigator.language`) atau koordinat lokal peramban tanpa pernah melakukan log lokasi, koordinat GPS, atau alamat IP fisik pengguna ke server.

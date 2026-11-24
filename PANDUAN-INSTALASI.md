# Panduan Instalasi — HC Information Center

Aplikasi ini terdiri dari dua bagian:
- **Backend** (Google Apps Script): menyimpan data di Google Sheets dan Drive. Kodenya ada di berkas `Kode.gs`, `Migrasi.gs`, dan `appsscript.json` yang diberikan terpisah. Berkas itu TIDAK ada di dalam ZIP ini.
- **Frontend** (isi ZIP ini): halaman web yang dibuka karyawan, dipasang di GitHub Pages.

## A. Perbarui dan deploy backend

1. Buka proyek Apps Script Anda. Ganti isi file `Kode` dengan `Kode.gs` versi terbaru, lalu simpan (Ctrl+S).
2. Pastikan file `Migrasi` dan `appsscript.json` juga terpasang.
3. Klik **Deploy** → **New deployment** → ikon roda gigi → **Web app**.
4. Isi: **Execute as = Me**, **Who has access = Anyone**.
5. Klik **Deploy**, lalu **salin URL Web App** yang berakhiran `/exec`.
6. Setiap kali kode backend diubah, buat deployment baru lewat **Deploy → Manage deployments → Edit → New version** agar perubahan berlaku. URL tetap sama.

## B. Isi alamat API di frontend

1. Ekstrak ZIP. Folder hasil ekstraksi (`hc-information-center`) adalah folder proyek Anda.
2. Buka `js/config.js` dengan Notepad.
3. Ganti `GANTI_DENGAN_URL_EXEC` dengan URL `/exec` tadi. Simpan.

## C. Pasang di GitHub Pages

Folder yang di-`git init` adalah **folder `hc-information-center` itu sendiri**, yaitu folder yang langsung berisi `index.html`. Pemanduan langkah demi langkah diberikan di percakapan.

## D. Uji coba

1. Buka alamat GitHub Pages. Beranda harus menampilkan data.
2. Buka menu **Spv HC**, masuk dengan akun `admin` dan sandi sementara dari log setup.
3. Ganti sandi di tab **Akun**.
4. Isi **Daftar Karyawan** di tab yang sama.
5. Buat satu berita uji coba, tandai sebagai memo penting, lalu uji konfirmasi bacaan.

## Catatan keamanan

- Siapa pun yang memiliki link dapat membaca seluruh informasi dan membuka lampirannya.
- Jangan simpan sandi atau data rahasia di berkas mana pun di repository.
- Ganti sandi `admin` segera setelah login pertama.

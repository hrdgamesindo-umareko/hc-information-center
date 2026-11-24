// HC Information Center — panel Spv HC (login, berita, laporan, karyawan, akun)
(() => {
  'use strict';
  const H = window.HC, $ = H.$, esc = H.esc, tgl = H.tgl, toast = H.toast;
  const A = { tab: 'berita', info: [], edit: null, lap: [] };
  const token = () => sessionStorage.getItem('hc_token');
  const pesan = (r, ok) => '<div class="nt ' + (r.success ? 'ok' : 'er') + '">' + esc(r.message || ok || 'Terjadi kesalahan.') + '</div>';
  const opsi = (arr, pilih) => arr.map(x => '<option' + (x === pilih ? ' selected' : '') + '>' + esc(x) + '</option>').join('');
  H.spvTabs = H.spvTabs || {}; // tab tambahan dapat didaftarkan dari berkas lain
  const unduhCSV = (nama, baris) => { // awali sel berawalan = + - @ dengan ' agar aman dibuka di Excel
    const sel = v => { v = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + baris.map(r => r.map(sel).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  H.unduhCSV = unduhCSV; H.pesan = pesan; H.opsi = opsi;

  /* ---------- Login & kerangka panel ---------- */
  function renderSpv() {
    const el = $('#spv');
    if (!token()) {
      el.innerHTML = '<h2 class="t">Masuk Spv HC</h2><div class="box narrow"><form id="fl"><label for="lu">Username</label><input id="lu" autocomplete="username" required maxlength="50">' +
        '<label for="lp">Sandi</label><input id="lp" type="password" autocomplete="current-password" required maxlength="100"><p><button class="btn g" type="submit">Masuk</button></p><div id="ln" role="alert"></div></form></div>';
      $('#fl').addEventListener('submit', async ev => {
        ev.preventDefault(); const b = ev.submitter; b.disabled = true; b.textContent = 'Memeriksa...';
        const r = await API.post('login', { username: $('#lu').value, password: $('#lp').value });
        $('#lp').value = ''; b.disabled = false; b.textContent = 'Masuk';
        if (r.success) { sessionStorage.setItem('hc_token', r.data.token); sessionStorage.setItem('hc_nama', r.data.nama); toast('Selamat datang, ' + r.data.nama + '.'); renderSpv(); }
        else $('#ln').innerHTML = pesan(r);
      });
      return;
    }
    el.innerHTML = '<div class="bar2"><h2 class="t m0">Panel Spv HC</h2><span>' + esc(sessionStorage.getItem('hc_nama') || '') + ' <button type="button" class="btn o s" id="keluar">Keluar</button></span></div>' +
      '<div class="sp" role="tablist">' + Object.keys(H.spvTabs).map(k => '<button type="button" role="tab" data-spt="' + k + '" class="' + (A.tab === k ? 'on' : '') + '" aria-selected="' + (A.tab === k) + '">' + esc(H.spvTabs[k].label) + '</button>').join('') + '</div><div id="sp"></div>';
    $('#keluar').addEventListener('click', async () => { await API.post('logout', { token: token() }); sessionStorage.removeItem('hc_token'); renderSpv(); });
    el.querySelectorAll('[data-spt]').forEach(b => b.addEventListener('click', () => { A.tab = b.dataset.spt; renderSpv(); }));
    H.spvTabs[A.tab].render($('#sp'));
  }
  window.addEventListener('hc-auth-lost', () => { toast('Sesi berakhir. Silakan masuk lagi.', 'er'); renderSpv(); });

  /* ---------- Tab Berita ---------- */
  const bacaFile = (f, gambar) => new Promise((ok, gagal) => {
    if (!f) return ok(null);
    if (f.size > 6 * 1024 * 1024) return gagal(new Error('Ukuran berkas maksimal 6 MB: ' + f.name));
    if (gambar && f.type.indexOf('image/') !== 0) return gagal(new Error('Foto sampul harus berupa gambar.'));
    const fr = new FileReader();
    fr.onload = () => ok({ nama: f.name, mime: f.type, b64: String(fr.result).split(',')[1] });
    fr.onerror = () => gagal(new Error('Berkas tidak dapat dibaca.')); fr.readAsDataURL(f);
  });
  async function tabBerita(c) {
    c.innerHTML = '<p class="muted">Memuat...</p>';
    if (!H.S.data) await H.refresh(); // pastikan daftar kategori sudah termuat
    if (!H.S.data) { c.innerHTML = pesan({ success: false, message: 'Data portal belum dapat dimuat.' }); return; }
    const r = await API.admin('adminInformasi'); if (!r.success) { c.innerHTML = pesan(r); return; }
    A.info = r.data; gambarBerita(c);
  }
  function gambarBerita(c) {
    const e = A.edit || {}, d = H.S.data, hari = d.hariIni;
    const status = i => i.terbit > hari ? 'Terjadwal' : (i.kedaluwarsa && i.kedaluwarsa < hari ? 'Kedaluwarsa' : 'Tayang');
    c.innerHTML = '<h3>' + (e.id ? 'Ubah informasi' : 'Buat informasi baru') + '</h3><div class="box"><form id="fb"><div class="rw">' +
      '<div class="f"><label for="f-j">Judul</label><input id="f-j" maxlength="150" required value="' + esc(e.judul) + '"></div>' +
      '<div><label for="f-k">Kategori</label><select id="f-k">' + opsi(d.kategori.map(k => k.nama), e.kategori) + '</select></div>' +
      '<div><label for="f-n">Nomor surat (opsional)</label><input id="f-n" maxlength="60" value="' + esc(e.nomorSurat) + '"></div>' +
      '<div><label for="f-t">Tanggal terbit</label><input type="date" id="f-t" required value="' + esc(e.terbit || hari) + '"></div>' +
      '<div><label for="f-e">Tanggal kedaluwarsa (opsional)</label><input type="date" id="f-e" value="' + esc(e.kedaluwarsa) + '"></div>' +
      '<div><label for="f-a">Tanggal agenda (opsional, tampil di kalender)</label><input type="date" id="f-a" value="' + esc(e.agenda) + '"></div><div></div>' +
      '<div class="f"><label for="f-i">Isi</label><textarea id="f-i" maxlength="5000" required>' + esc(e.isi) + '</textarea></div>' +
      '<div><label for="f-l">Lampiran (PDF, Word, gambar; maks. 6 MB)</label><input type="file" id="f-l" accept=".pdf,.doc,.docx,image/*"></div>' +
      '<div><label for="f-s">Foto sampul (gambar; maks. 6 MB)</label><input type="file" id="f-s" accept="image/*"></div></div>' +
      '<div class="cek"><input type="checkbox" id="f-p"' + (e.pin ? ' checked' : '') + '><label for="f-p">Sematkan di atas (maksimal 3)</label></div>' +
      '<div class="cek"><input type="checkbox" id="f-w"' + (e.penting ? ' checked' : '') + '><label for="f-w">Memo penting (karyawan wajib konfirmasi bacaan)</label></div>' +
      (e.id && e.lampiranId ? '<div class="cek"><input type="checkbox" id="f-hl"><label for="f-hl">Hapus lampiran yang ada (' + esc(e.lampiranNama) + ')</label></div>' : '') +
      (e.id && e.sampulId ? '<div class="cek"><input type="checkbox" id="f-hs"><label for="f-hs">Hapus foto sampul yang ada</label></div>' : '') +
      '<p><button class="btn g" type="submit">Simpan dan terbitkan</button> ' + (e.id ? '<button class="btn o" type="button" id="f-batal">Batal</button>' : '') + '</p><div id="fn" role="alert"></div></form></div>' +
      '<h3>Daftar informasi</h3><div class="tw"><table><thead><tr><th>Judul</th><th>Kategori</th><th>Terbit</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' +
      (A.info.slice().sort((a, b) => b.terbit.localeCompare(a.terbit)).map(i => '<tr><td>' + esc(i.judul) + (i.pin ? ' (disematkan)' : '') + (i.penting ? ' (penting)' : '') + '</td><td>' + esc(i.kategori) + '</td><td>' + tgl(i.terbit) + '</td><td>' + status(i) +
        '</td><td class="acts"><button type="button" class="btn o s" data-ubah="' + esc(i.id) + '">Ubah</button><button type="button" class="btn d s" data-hapus="' + esc(i.id) + '">Hapus</button></td></tr>').join('') || '<tr><td colspan="5">Belum ada informasi.</td></tr>') + '</tbody></table></div>';
    $('#fb').addEventListener('submit', ev => { ev.preventDefault(); simpanBerita(ev.submitter, c); });
    const bt = $('#f-batal'); if (bt) bt.addEventListener('click', () => { A.edit = null; gambarBerita(c); });
    c.querySelectorAll('[data-ubah]').forEach(b => b.addEventListener('click', () => { A.edit = A.info.find(i => i.id === b.dataset.ubah); gambarBerita(c); scrollTo(0, 0); }));
    c.querySelectorAll('[data-hapus]').forEach(b => b.addEventListener('click', async () => {
      const i = A.info.find(x => x.id === b.dataset.hapus);
      if (!confirm('Hapus informasi "' + i.judul + '"? Lampiran akan dibuang, riwayat konfirmasi tetap tersimpan.')) return;
      b.disabled = true; const r = await API.admin('hapusInformasi', { id: i.id });
      toast(r.message || 'Selesai.', r.success ? '' : 'er'); if (r.success) { H.refresh(); tabBerita(c); } else b.disabled = false;
    }));
  }
  async function simpanBerita(btn, c) {
    const g = id => $('#' + id), e = A.edit || {}, o = g('fn');
    btn.disabled = true; btn.textContent = 'Menyimpan...';
    try {
      const lampiran = await bacaFile(g('f-l').files[0], false), sampul = await bacaFile(g('f-s').files[0], true);
      const r = await API.admin('simpanInformasi', { data: { id: e.id || '', judul: g('f-j').value, kategori: g('f-k').value, nomorSurat: g('f-n').value, terbit: g('f-t').value,
        kedaluwarsa: g('f-e').value, agenda: g('f-a').value, isi: g('f-i').value, pin: g('f-p').checked, penting: g('f-w').checked, lampiran, sampul,
        hapusLampiran: !!(g('f-hl') && g('f-hl').checked), hapusSampul: !!(g('f-hs') && g('f-hs').checked) } }, 180000);
      if (r.success) { toast(r.message); A.edit = null; H.refresh(); tabBerita(c); return; }
      o.innerHTML = pesan(r);
    } catch (err) { o.innerHTML = pesan({ success: false, message: err.message }); }
    btn.disabled = false; btn.textContent = 'Simpan dan terbitkan';
  }

  /* ---------- Tab Laporan konfirmasi bacaan ---------- */
  async function tabLaporan(c) {
    const memo = H.S.data.informasi.filter(i => i.penting);
    if (!memo.length) { c.innerHTML = '<p class="muted">Belum ada memo penting yang tayang.</p>'; return; }
    const d = H.S.data;
    c.innerHTML = '<label for="r-i">Pilih memo</label><select id="r-i">' + memo.map(i => '<option value="' + esc(i.id) + '">' + esc(i.judul) + '</option>').join('') + '</select>' +
      '<div class="fl"><div><label for="r-q">Cari nama atau nomor</label><input id="r-q" autocomplete="off"></div><div><label for="r-s">Status</label><select id="r-s"><option value="">Semua</option><option value="sudah">Sudah membaca</option><option value="belum">Belum membaca</option></select></div>' +
      '<div><label for="r-c">Counter</label><select id="r-c"><option value="">Semua</option>' + opsi(d.counter) + '</select></div><div><label for="r-j">Jabatan</label><select id="r-j"><option value="">Semua</option>' + opsi(d.jabatan) + '</select></div></div>' +
      '<div class="bar2"><span class="muted" id="r-n"></span><button type="button" class="btn o s" id="r-csv">Unduh CSV</button></div>' +
      '<div class="tw"><table><thead><tr><th>Nomor</th><th>Nama</th><th>Counter</th><th>Jabatan</th><th>Status</th><th>Waktu baca</th></tr></thead><tbody id="r-b"></tbody></table></div>';
    const muatLap = async () => { $('#r-b').innerHTML = '<tr><td colspan="6">Memuat...</td></tr>'; const r = await API.admin('laporan', { idInformasi: $('#r-i').value }); if (!r.success) { $('#r-b').innerHTML = '<tr><td colspan="6">' + esc(r.message) + '</td></tr>'; return; } A.lap = r.data; gambarLap(); };
    const baris = () => { const q = $('#r-q').value.toLowerCase(), s = $('#r-s').value, cc = $('#r-c').value, j = $('#r-j').value;
      return A.lap.filter(x => (!q || x.nomor.toLowerCase().includes(q) || x.nama.toLowerCase().includes(q)) && (!s || x.status === s) && (!cc || x.counter === cc) && (!j || x.jabatan === j)); };
    const gambarLap = () => { const b = baris(); $('#r-b').innerHTML = b.map(x => '<tr><td>' + esc(x.nomor) + '</td><td>' + esc(x.nama) + '</td><td>' + esc(x.counter) + '</td><td>' + esc(x.jabatan) + '</td><td>' + (x.status === 'sudah' ? 'Sudah' : 'Belum') + '</td><td>' + esc(x.waktu || '-') + '</td></tr>').join('') || '<tr><td colspan="6">Tidak ada data yang cocok.</td></tr>';
      $('#r-n').textContent = 'Menampilkan ' + b.length + ' dari ' + A.lap.length + ' karyawan. Sudah membaca: ' + b.filter(x => x.status === 'sudah').length + '.'; };
    $('#r-i').addEventListener('change', muatLap); ['r-q', 'r-s', 'r-c', 'r-j'].forEach(id => $('#' + id).addEventListener('input', gambarLap));
    $('#r-csv').addEventListener('click', () => unduhCSV('laporan-konfirmasi.csv', [['Nomor', 'Nama', 'Counter', 'Jabatan', 'Status', 'Waktu baca']].concat(baris().map(x => [x.nomor, x.nama, x.counter, x.jabatan, x.status, x.waktu]))));
    muatLap();
  }

  /* ---------- Tab Karyawan (impor daftar) ---------- */
  function tabKaryawan(c) {
    c.innerHTML = '<div class="box"><p>Tempel daftar karyawan dari Excel (satu baris per karyawan) dengan urutan kolom: <b>nomor karyawan, nama, counter, jabatan</b>, dipisah tab, titik koma, atau koma.</p>' +
      '<p class="nt er m0">Perhatian: daftar ini <b>menggantikan seluruh</b> daftar karyawan yang ada.</p><label for="k-t">Data karyawan</label><textarea id="k-t" rows="10" spellcheck="false"></textarea>' +
      '<p><button type="button" class="btn g" id="k-s">Simpan daftar karyawan</button></p><div id="k-o" role="alert"></div></div>';
    $('#k-s').addEventListener('click', async () => {
      const rows = $('#k-t').value.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => l.split(/\t|;|,/).map(x => x.trim()))
        .filter((r, i) => !(i === 0 && /^no/i.test(r[0]))).map(r => ({ nomor: r[0] || '', nama: r[1] || '', counter: r[2] || '', jabatan: r[3] || '' }));
      if (!rows.length) { $('#k-o').innerHTML = pesan({ success: false, message: 'Tempel data karyawan terlebih dahulu.' }); return; }
      if (!confirm('Ganti seluruh daftar karyawan dengan ' + rows.length + ' baris ini?')) return;
      const b = $('#k-s'); b.disabled = true; const r = await API.admin('simpanKaryawan', { rows }, 120000); b.disabled = false;
      $('#k-o').innerHTML = pesan(r); if (r.success) { $('#k-t').value = ''; H.refresh(); }
    });
  }

  /* ---------- Tab Akun (ubah sandi, tambah Spv HC) ---------- */
  function tabAkun(c) {
    c.innerHTML = '<div class="rw"><div class="box"><h3 class="m0">Ubah sandi saya</h3><form id="a-s"><label for="a-l">Sandi lama</label><input id="a-l" type="password" autocomplete="current-password" required>' +
      '<label for="a-b">Sandi baru (minimal 8 karakter)</label><input id="a-b" type="password" autocomplete="new-password" minlength="8" required><label for="a-u">Ulangi sandi baru</label><input id="a-u" type="password" autocomplete="new-password" required>' +
      '<p><button class="btn g" type="submit">Ubah sandi</button></p><div id="a-o" role="alert"></div></form></div>' +
      '<div class="box"><h3 class="m0">Tambah akun Spv HC</h3><form id="a-t"><label for="t-u">Username (huruf kecil, angka, titik, strip)</label><input id="t-u" maxlength="30" required>' +
      '<label for="t-n">Nama tampilan</label><input id="t-n" maxlength="80"><label for="t-p">Sandi awal (minimal 8 karakter)</label><input id="t-p" type="password" autocomplete="new-password" minlength="8" required>' +
      '<p><button class="btn g" type="submit">Tambah akun</button></p><div id="t-o" role="alert"></div></form></div></div>';
    $('#a-s').addEventListener('submit', async ev => { ev.preventDefault();
      if ($('#a-b').value !== $('#a-u').value) { $('#a-o').innerHTML = pesan({ success: false, message: 'Sandi baru dan ulangannya tidak sama.' }); return; }
      const r = await API.admin('ubahSandi', { lama: $('#a-l').value, baru: $('#a-b').value }); $('#a-o').innerHTML = pesan(r); if (r.success) ev.target.reset(); });
    $('#a-t').addEventListener('submit', async ev => { ev.preventDefault();
      const r = await API.admin('simpanPengguna', { username: $('#t-u').value, nama: $('#t-n').value, sandi: $('#t-p').value }); $('#t-o').innerHTML = pesan(r); if (r.success) ev.target.reset(); });
  }

  H.spvTabs.berita = { label: 'Berita', render: tabBerita };
  H.spvTabs.laporan = { label: 'Laporan Konfirmasi', render: tabLaporan };
  H.spvTabs.karyawan = { label: 'Daftar Karyawan', render: tabKaryawan };
  H.spvTabs.akun = { label: 'Akun', render: tabAkun };
  H.renderSpv = renderSpv;
  if ((location.hash || '') === '#/spv') renderSpv();
})();

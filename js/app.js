// HC Information Center — portal publik (beranda, detail, arsip, konfirmasi bacaan)
(() => {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const idOk = s => /^[\w-]{20,}$/.test(s || '');
  const tgl = s => s ? new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'tanpa batas';
  const IK = ['<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a4 4 0 0 1 0 6M17.5 6.5a8 8 0 0 1 0 11"/>',
    '<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>', '<path d="M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
    '<path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"/>', '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
    '<path d="M3 5h18v4H3zM5 9v10h14V9M10 13h4"/>'];
  const svg = n => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IK[n] + '</svg>';

  const S = { data: null, tab: -1, q: '', pg: 1, per: 6, mo: new Date().getMonth(), yr: new Date().getFullYear(), view: '', rendered: '' };
  let toastT;
  function toast(msg, jenis) {
    const t = $('#toast'); t.textContent = msg; t.className = 'show' + (jenis === 'er' ? ' er' : '');
    clearTimeout(toastT); toastT = setTimeout(() => { t.className = ''; }, 4500);
  }
  const katIdx = nama => Math.max(0, (S.data.kategori || []).findIndex(k => k.nama === nama));
  const aktif = i => !i.kedaluwarsa || i.kedaluwarsa >= S.data.hariIni;
  const urut = a => a.slice().sort((x, y) => (y.pin - x.pin) || y.terbit.localeCompare(x.terbit));
  const cocok = (i, q) => !q || [i.judul, i.isi, i.nomorSurat].join(' ').toLowerCase().includes(q.toLowerCase());

  function kartu(i) {
    const n = katIdx(i.kategori) % 5;
    const gambar = idOk(i.sampulId) ? '<img src="https://drive.google.com/thumbnail?id=' + i.sampulId + '&sz=w800" alt="" loading="lazy" referrerpolicy="no-referrer">' : '';
    return '<article class="nc" data-go="#/berita/' + esc(i.id) + '"><div class="th c' + n + '">' + svg(n) + gambar + (i.pin ? '<em>Disematkan</em>' : '') +
      '</div><div class="mt">Spv HC, ' + tgl(i.terbit) + '</div><h3><a href="#/berita/' + esc(i.id) + '">' + esc(i.judul) + '</a></h3>' +
      '<div class="ft">' + esc(i.kategori) + (i.penting ? ' <b>Memo penting</b>' : '') + '</div></article>';
  }

  /* ---------- Beranda ---------- */
  function renderNews() {
    const d = S.data, kat = d.kategori[S.tab];
    const arr = urut(d.informasi.filter(i => aktif(i) && (S.tab < 0 || (kat && i.kategori === kat.nama)) && cocok(i, S.q)));
    const hal = Math.max(1, Math.ceil(arr.length / S.per)); if (S.pg > hal) S.pg = 1;
    $('#news').innerHTML = arr.slice((S.pg - 1) * S.per, S.pg * S.per).map(kartu).join('') ||
      '<p class="muted">Belum ada informasi yang cocok. Coba kata kunci lain atau pilih kategori Semua.</p>';
    $('#pg').innerHTML = hal > 1 ? Array.from({ length: hal }, (_, n) => '<button type="button" data-pg="' + (n + 1) + '" class="' + (S.pg === n + 1 ? 'on' : '') + '" aria-label="Halaman ' + (n + 1) + '">' + (n + 1) + '</button>').join('') : '';
  }
  function renderCal() {
    const d = S.data, first = new Date(S.yr, S.mo, 1), hari = new Date(S.yr, S.mo + 1, 0).getDate(), pad = (first.getDay() + 6) % 7;
    $('#cm').textContent = first.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const kunci = n => S.yr + '-' + String(S.mo + 1).padStart(2, '0') + '-' + String(n).padStart(2, '0');
    const ev = new Set(d.informasi.filter(i => i.agenda).map(i => i.agenda));
    let h = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(x => '<div class="h">' + x + '</div>').join('') + '<div></div>'.repeat(pad);
    for (let n = 1; n <= hari; n++) h += '<div class="' + (ev.has(kunci(n)) ? 'ev' : '') + (kunci(n) === d.hariIni ? ' td' : '') + '">' + n + '</div>';
    $('#cal').innerHTML = h;
    $('#agd').innerHTML = d.informasi.filter(i => i.agenda && i.agenda >= d.hariIni).sort((a, b) => a.agenda.localeCompare(b.agenda)).slice(0, 4)
      .map(i => '<div class="agd"><b>' + tgl(i.agenda) + '</b><br>' + esc(i.judul) + '</div>').join('');
  }
  function renderHome() {
    const d = S.data; if (!d) return;
    $('#ic').innerHTML = d.kategori.map((k, n) => '<button type="button" data-tab="' + n + '"><span>' + svg(n % 5) + '</span>' + esc(k.singkat) + '</button>').join('') +
      '<button type="button" data-go="#/arsip"><span>' + svg(5) + '</span>Arsip</button>';
    $('#tabs').innerHTML = [{ singkat: 'Semua' }].concat(d.kategori).map((k, n) => '<button type="button" data-tab="' + (n - 1) + '" class="' + (S.tab === n - 1 ? 'on' : '') + '" aria-pressed="' + (S.tab === n - 1) + '">' + esc(k.singkat) + '</button>').join('');
    renderNews();
    const hidup = d.informasi.filter(aktif), memo = urut(hidup.filter(i => i.penting));
    $('#memo').innerHTML = memo.map(i => '<div class="memo"><div><b>' + esc(i.judul) + '</b><small>' + esc(i.nomorSurat || 'Tanpa nomor') + ', ' + i.sudahBaca + ' dari ' + d.totalKaryawan + ' karyawan sudah membaca</small></div><a class="btn g s" href="#/berita/' + esc(i.id) + '">Baca</a></div>').join('') || '<span class="muted">Tidak ada memo penting.</span>';
    renderCal();
    const st = [['Informasi tayang', hidup.length], ['Memo penting', memo.length], ['Konfirmasi tercatat', d.informasi.reduce((a, i) => a + i.sudahBaca, 0)], ['Di arsip', d.informasi.length - hidup.length], ['Kategori', d.kategori.length]];
    $('#st').innerHTML = st.map((x, n) => '<div class="t' + n + '"><strong>' + x[1] + '</strong>' + x[0] + '</div>').join('');
    $('#kontak').textContent = d.kontak ? 'Kontak HC: ' + d.kontak : '';
  }

  /* ---------- Detail + konfirmasi bacaan ---------- */
  function renderDetail(id) {
    const i = S.data.informasi.find(x => x.id === id), dt = $('#dt'), kf = $('#kf');
    if (!i) { dt.innerHTML = '<p>Informasi tidak ditemukan atau belum tayang.</p>'; kf.classList.add('hid'); return; }
    const n = katIdx(i.kategori) % 5;
    dt.innerHTML = '<div class="th c' + n + '">' + svg(n) + (idOk(i.sampulId) ? '<img src="https://drive.google.com/thumbnail?id=' + i.sampulId + '&sz=w1200" alt="" referrerpolicy="no-referrer">' : '') + '</div>' +
      '<h1>' + esc(i.judul) + '</h1><div class="mt">' + esc(i.kategori) + ', nomor surat ' + esc(i.nomorSurat || '-') + ', terbit ' + tgl(i.terbit) + ', berlaku sampai ' + tgl(i.kedaluwarsa) + '</div>' +
      '<div class="body">' + esc(i.isi) + '</div>' +
      (idOk(i.lampiranId) ? '<p><button type="button" class="btn o" data-prev="' + i.lampiranId + '" data-nm="' + esc(i.lampiranNama) + '">Lihat lampiran: ' + esc(i.lampiranNama) + '</button></p>' : '');
    kf.classList.remove('hid');
    if (!i.penting) { kf.innerHTML = '<span class="muted">Informasi ini tidak memerlukan konfirmasi bacaan.</span>'; return; }
    const opsi = a => a.map(x => '<option>' + esc(x) + '</option>').join('');
    kf.innerHTML = '<h2 class="m0">Konfirmasi telah membaca</h2><p class="muted">Isi nomor karyawan dan nama Anda. Data dicocokkan dengan daftar karyawan.</p>' +
      '<div class="rw"><div><label for="kn">Nomor karyawan</label><input id="kn" inputmode="numeric" autocomplete="off" maxlength="30"></div>' +
      '<div><label for="km">Nama lengkap</label><input id="km" autocomplete="off" maxlength="100"></div>' +
      '<div><label for="kc">Counter penempatan</label><select id="kc">' + opsi(S.data.counter) + '</select></div>' +
      '<div><label for="kj">Jabatan</label><select id="kj">' + opsi(S.data.jabatan) + '</select></div></div>' +
      '<p><button type="button" class="btn g" data-konf="' + esc(i.id) + '">Saya sudah membaca</button></p><div id="kt" role="alert"></div>';
  }
  async function kirimKonfirmasi(btn) {
    const nomor = $('#kn').value.trim(), nama = $('#km').value.trim(), o = $('#kt');
    if (!nomor || !nama) { o.innerHTML = '<div class="nt er">Nomor karyawan dan nama wajib diisi.</div>'; return; }
    btn.disabled = true; btn.textContent = 'Mengirim...';
    const r = await API.post('konfirmasi', { id: btn.dataset.konf, nomor, nama, counter: $('#kc').value, jabatan: $('#kj').value });
    btn.disabled = false; btn.textContent = 'Saya sudah membaca';
    o.innerHTML = '<div class="nt ' + (r.success ? 'ok' : 'er') + '">' + esc(r.message || 'Terjadi kesalahan.') + '</div>';
    if (r.success) muat(true);
  }

  function renderArsip() {
    const q = $('#qa').value;
    $('#al').innerHTML = urut(S.data.informasi.filter(i => cocok(i, q))).map(kartu).join('') || '<p class="muted">Tidak ada arsip yang cocok.</p>';
  }

  /* ---------- Pratinjau berkas (modal) ---------- */
  let fokusAsal = null;
  function bukaModal(id, nama) {
    if (!idOk(id)) return;
    fokusAsal = document.activeElement;
    $('#mjudul').textContent = nama || 'Lampiran';
    $('#mframe').src = 'https://drive.google.com/file/d/' + id + '/preview';
    $('#munduh').href = 'https://drive.google.com/uc?export=download&id=' + id;
    $('#modal').classList.remove('hid'); $('#mtutup').focus();
  }
  function tutupModal() { $('#modal').classList.add('hid'); $('#mframe').src = 'about:blank'; if (fokusAsal) fokusAsal.focus(); }

  /* ---------- Router & pemuatan data (tampilkan cache dulu, segarkan di latar) ---------- */
  function route(segar) {
    const h = location.hash || '#/', m = h.match(/^#\/berita\/([\w-]+)$/);
    const v = m ? 'detail' : h === '#/arsip' ? 'arsip' : h === '#/spv' ? 'spv' : 'home', kunci = v + (m ? m[1] : '');
    ['home', 'detail', 'arsip', 'spv'].forEach(x => $('#v-' + x).classList.toggle('hid', x !== v));
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === v));
    if (v === 'spv') { if (window.HC.renderSpv && !segar) window.HC.renderSpv(); return; }
    if (!S.data) return;
    if (v === 'home') renderHome();
    else if (v === 'arsip') renderArsip();
    else if (!segar || S.rendered !== kunci) renderDetail(m[1]); // jangan timpa formulir yang sedang diisi
    if (!segar || S.view !== v) { scrollTo(0, 0); $('#main').focus({ preventScroll: true }); }
    S.view = v; S.rendered = kunci;
  }
  async function muat(senyap) {
    if (!senyap) { try { const c = localStorage.getItem('hc_publik'); if (c) { S.data = JSON.parse(c); route(); } } catch (e) { /* cache rusak: abaikan */ } }
    const r = await API.get('publik');
    if (r.success) {
      S.data = r.data; try { localStorage.setItem('hc_publik', JSON.stringify(r.data)); } catch (e) { /* penyimpanan penuh: abaikan */ }
      route(true);
    } else if (!S.data) $('#news').innerHTML = '<p class="nt er" role="alert">' + esc(r.message || 'Data belum dapat dimuat.') + '</p>';
  }

  /* ---------- Event ---------- */
  document.addEventListener('click', e => {
    const t = e.target, tab = t.closest('[data-tab]'), go = t.closest('[data-go]'), pg = t.closest('[data-pg]'), pv = t.closest('[data-prev]'), kf = t.closest('[data-konf]');
    if (tab) { S.tab = +tab.dataset.tab; S.pg = 1; if ((location.hash || '#/') !== '#/') location.hash = '#/'; else renderHome(); return; }
    if (pg) { S.pg = +pg.dataset.pg; renderNews(); return; }
    if (pv) { bukaModal(pv.dataset.prev, pv.dataset.nm); return; }
    if (kf) { kirimKonfirmasi(kf); return; }
    if (t.id === 'mtutup') { tutupModal(); return; }
    if (t.id === 'cp' || t.id === 'cn') { S.mo += t.id === 'cn' ? 1 : -1; if (S.mo < 0) { S.mo = 11; S.yr--; } if (S.mo > 11) { S.mo = 0; S.yr++; } renderCal(); return; }
    if (t.id === 'tema') { const g = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches) ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', g); try { localStorage.setItem('hc_tema', g); } catch (x) { /* abaikan */ } return; }
    if (go && !t.closest('a')) location.hash = go.dataset.go;
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').classList.contains('hid')) tutupModal(); });
  window.addEventListener('hashchange', () => route());
  $('#q').addEventListener('input', e => { S.q = e.target.value; S.pg = 1; if (S.data) renderNews(); });
  $('#qa').addEventListener('input', () => { if (S.data) renderArsip(); });
  $('#thn').textContent = new Date().getFullYear();

  window.HC = { $, esc, idOk, tgl, toast, S, svg, refresh: () => muat(true), renderSpv: null };
  route(); muat();
})();

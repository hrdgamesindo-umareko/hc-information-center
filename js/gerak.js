// Gerak beranda (prototipe): parallax gulir, judul kata demi kata, magnet ikon, hitung angka.
// Seluruhnya dilewati bila perangkat meminta animasi dikurangi. Hapus berkas ini + tag <script>-nya untuk mematikan semua.
(() => {
  'use strict';
  const kurang = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  if (kurang) return;

  // 1) Judul: pecah per kata (teks asli tetap terbaca pembaca layar lewat aria-label)
  const h1 = $('.hero h1');
  if (h1) {
    const t = h1.textContent.trim(); h1.setAttribute('aria-label', t); h1.textContent = '';
    t.split(/\s+/).forEach((w, i) => { if (i) h1.appendChild(document.createTextNode(' ')); const s = document.createElement('span'); s.className = 'kt'; s.setAttribute('aria-hidden', 'true'); s.textContent = w; h1.appendChild(s); });
  }

  // 2) Parallax kedalaman: --p = seberapa jauh hero sudah tergulir (0 sampai 1), diperbarui paling banyak sekali per frame
  const hero = $('.hero'); let antre = false;
  const hitungP = () => {
    antre = false; const r = hero.getBoundingClientRect(), h = r.height || 1;
    hero.style.setProperty('--p', Math.min(1, Math.max(0, -r.top / h)).toFixed(3));
  };
  addEventListener('scroll', () => { if (!antre) { antre = true; requestAnimationFrame(hitungP); } }, { passive: true });
  hitungP();

  // 3) Magnet: ikon kategori sedikit mengikuti kursor (hanya perangkat dengan kursor)
  const ic = $('#ic');
  if (ic && matchMedia('(hover: hover)').matches) {
    ic.addEventListener('pointermove', e => {
      const b = e.target.closest('button'); if (!b) return;
      const s = b.querySelector('span'), r = s.getBoundingClientRect();
      s.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1) + 'px)';
    });
    ic.addEventListener('pointerout', e => {
      const b = e.target.closest('button'); if (b && !b.contains(e.relatedTarget)) b.querySelector('span').style.transform = '';
    });
  }

  // 4) Angka ringkas menghitung naik, sekali saja saat pertama terlihat
  const st = $('#st'); let sudah = false;
  const naik = el => {
    const akhir = parseInt(el.textContent, 10); if (!(akhir > 0)) return;
    const mulai = performance.now(), dur = 900;
    const f = t => { const k = Math.min(1, (t - mulai) / dur); el.textContent = Math.round(akhir * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); };
    el.textContent = '0'; requestAnimationFrame(f);
  };
  if (st && 'IntersectionObserver' in window) {
    new MutationObserver(() => {
      if (sudah || !st.children.length) return;
      const io = new IntersectionObserver(es => { es.forEach(x => { if (x.isIntersecting && !sudah) { sudah = true; io.disconnect(); st.querySelectorAll('strong').forEach(naik); } }); }, { threshold: 0.6 });
      io.observe(st);
    }).observe(st, { childList: true });
  }
})();

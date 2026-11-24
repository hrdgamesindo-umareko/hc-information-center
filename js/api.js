// Pembungkus fetch ke Apps Script. POST wajib text/plain agar tidak memicu CORS preflight.
window.API = (() => {
  'use strict';
  const alamat = () => (window.HC_CONFIG && window.HC_CONFIG.API_URL) || '';
  const siap = () => /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(alamat());

  async function kirim(url, opsi, batasMs) {
    if (!siap()) return { success: false, message: 'Alamat API belum diatur. Isi API_URL di berkas js/config.js.' };
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), batasMs);
    try {
      const r = await fetch(url, Object.assign({ signal: ctl.signal }, opsi));
      return await r.json();
    } catch (e) {
      return { success: false, message: e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' };
    } finally { clearTimeout(t); }
  }
  const get = a => kirim(alamat() + '?action=' + encodeURIComponent(a), { method: 'GET' }, 30000);
  const post = (a, d, ms) => kirim(alamat(), {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(Object.assign({ action: a }, d || {}))
  }, ms || 60000);
  const admin = async (a, d, ms) => { // sertakan token sesi; jika kedaluwarsa, paksa keluar
    const r = await post(a, Object.assign({ token: sessionStorage.getItem('hc_token') || '' }, d || {}), ms);
    if (r && r.code === 'AUTH') { sessionStorage.removeItem('hc_token'); window.dispatchEvent(new Event('hc-auth-lost')); }
    return r;
  };
  return { get, post, admin, siap };
})();

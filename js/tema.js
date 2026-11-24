// Terapkan tema tersimpan sebelum halaman digambar agar tidak berkedip
try { var t = localStorage.getItem('hc_tema'); if (t) document.documentElement.setAttribute('data-theme', t); } catch (e) { /* abaikan */ }

// Format angka & tanggal Bahasa Indonesia ala Play Store.

function one(v) {
  if (v >= 100) return String(Math.round(v));
  const s = v.toFixed(1).replace('.', ',');
  return s.endsWith(',0') ? s.slice(0, -2) : s;
}

export function compact(n) {
  const x = Number(n) || 0;
  if (x < 1000) return String(x);
  if (x < 1000000) return `${one(x / 1000)} rb`;
  return `${one(x / 1000000)} jt`;
}

export function timeAgo(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '-';
  const diff = Date.now() - d.getTime();
  if (diff < 0) return 'baru saja';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} mgg lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bln lalu`;
  return `${Math.floor(days / 365)} thn lalu`;
}

const BULAN = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export function dateFmt(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getDate()} ${BULAN[d.getMonth() + 1]} ${d.getFullYear()}`;
}

export function ratingFmt(r) {
  const x = Number(r) || 0;
  if (x <= 0) return '-';
  return x.toFixed(1).replace('.', ',');
}

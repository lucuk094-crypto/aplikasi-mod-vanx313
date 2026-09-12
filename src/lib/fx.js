// Efek visual profesional: ripple saat disentuh + spotlight mengikuti kursor.
// Nonaktif otomatis bila pengguna mengaktifkan reduce motion.

export function initFx() {
  if (
    typeof window === 'undefined' ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  // Ripple: lingkaran memudar dari titik sentuh pada tombol & kartu.
  document.addEventListener('pointerdown', (e) => {
    const t = e.target?.closest?.('.btn, .chip, .icon-btn, a.neo');
    if (!t) return;
    const r = t.getBoundingClientRect();
    const s = Math.max(r.width, r.height);
    const el = document.createElement('span');
    el.className = 'ripple';
    el.style.width = el.style.height = `${s}px`;
    el.style.left = `${e.clientX - r.left - s / 2}px`;
    el.style.top = `${e.clientY - r.top - s / 2}px`;
    t.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  });

  // Spotlight: cahaya lembut mengikuti posisi kursor/sentuh terakhir.
  const root = document.documentElement;
  let raf = 0;
  let x = window.innerWidth / 2;
  let y = 160;
  const apply = () => {
    raf = 0;
    root.style.setProperty('--mx', `${x}px`);
    root.style.setProperty('--my', `${y}px`);
  };
  window.addEventListener(
    'pointermove',
    (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    },
    { passive: true }
  );
  apply();
}

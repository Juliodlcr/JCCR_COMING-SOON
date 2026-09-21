/* ══════════════════════════════════════════════════
   INTRO — "ESTUDIO JCCR" letra por letra
══════════════════════════════════════════════════ */
(function () {
  const text      = 'ESTUDIO JCCR';
  const el        = document.getElementById('intro-text');
  const intro     = document.getElementById('intro');
  const introLogo = document.getElementById('intro-logo');

  const DELAY     = 280;  // ms entre letras
  const HOLD      = 900;  // pausa tras completar el texto
  const LOGO_IN   = 900;  // duración fade in del logo
  const LOGO_HOLD = 1200; // tiempo visible del logo
  const FADEOUT   = 800;  // fade out final

  // Construir spans por letra
  const chars = [];
  for (const ch of text) {
    if (ch === ' ') {
      const sp = document.createElement('span');
      sp.className = 'space';
      el.appendChild(sp);
    } else {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      el.appendChild(span);
      chars.push(span);
    }
  }

  // 1. Letras aparecen
  chars.forEach((span, i) => {
    setTimeout(() => {
      span.style.opacity = '1';
      span.style.transform = 'translateY(0)';
    }, i * DELAY);
  });

  const textDone = chars.length * DELAY + HOLD;

  // 2. Texto se desvanece, logo aparece
  setTimeout(() => {
    el.style.transition = 'opacity 0.7s ease';
    el.style.opacity = '0';
    setTimeout(() => {
      introLogo.style.opacity = '1';
    }, 400);
  }, textDone);

  // 3. Fade out total → página principal
  setTimeout(() => {
    intro.classList.add('fade-out');
    setTimeout(() => intro.remove(), FADEOUT);
  }, textDone + LOGO_IN + LOGO_HOLD);
})();


/* ══════════════════════════════════════════════════
   CANVAS — Puntos y malla en toda la pantalla
   Ciclo de 18s:
     0.00-0.22  puntos aparecen dispersos
     0.18-0.46  migran a la retícula
     0.42-0.66  malla de conexiones emerge
     0.64-0.78  pausa con todo visible
     0.76-1.00  disolución al blanco
   La zona central queda limpia con clip evenodd.
══════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  const CYCLE  = 18;
  const UNIT   = 72;
  const SAFE_W = 360;
  const SAFE_H = 520;

  let W, H, cx, cy;
  let COLS, ROWS, N;
  let gridPos = [], randPos = [], order = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
    buildGrid();
    initRandom();
  }

  function buildGrid() {
    COLS = Math.ceil(W / UNIT) + 2;
    ROWS = Math.ceil(H / UNIT) + 2;
    N    = COLS * ROWS;

    const ox = cx - Math.floor(COLS / 2) * UNIT;
    const oy = cy - Math.floor(ROWS / 2) * UNIT;

    gridPos = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        gridPos.push({ x: ox + c * UNIT, y: oy + r * UNIT });
  }

  function initRandom() {
    randPos = gridPos.map(() => ({
      x: W * 0.05 + Math.random() * W * 0.90,
      y: H * 0.05 + Math.random() * H * 0.90
    }));

    order = Array.from({ length: N }, (_, i) => i);
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }

  resize();
  window.addEventListener('resize', resize);

  const eio = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  function phP(tc, s, e) {
    if (tc <= s) return 0;
    if (tc >= e) return 1;
    return (tc - s) / (e - s);
  }

  function applyHoleMask() {
    const sx = cx - SAFE_W / 2;
    const sy = cy - SAFE_H / 2;
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy + SAFE_H);
    ctx.lineTo(sx + SAFE_W, sy + SAFE_H);
    ctx.lineTo(sx + SAFE_W, sy);
    ctx.closePath();
    ctx.clip('evenodd');
  }

  let startTime = null;

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!startTime) startTime = ts;

    const t  = (ts - startTime) / 1000;
    const tc = (t % CYCLE) / CYCLE;

    ctx.clearRect(0, 0, W, H);

    const pDots    = eio(phP(tc, 0.00, 0.22));
    const pMigrate = eio(phP(tc, 0.18, 0.46));
    const pMesh    = eio(phP(tc, 0.42, 0.66));
    const pFade    = eio(phP(tc, 0.76, 1.00));
    const gA       = 1 - pFade;

    if (gA <= 0.01) return;

    ctx.save();
    applyHoleMask();

    ctx.strokeStyle = '#1a1a18';
    ctx.fillStyle   = '#1a1a18';

    const nDots = Math.round(pDots * N);

    // Puntos
    for (let i = 0; i < nDots; i++) {
      const idx = order[i];
      const g   = gridPos[idx];
      const r   = randPos[idx];
      const x   = r.x + (g.x - r.x) * pMigrate;
      const y   = r.y + (g.y - r.y) * pMigrate;
      ctx.globalAlpha = gA * 0.40;
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Malla
    if (pMesh > 0.01) {
      ctx.lineWidth = 0.5;
      const totalSegs = (COLS - 1) * ROWS + COLS * (ROWS - 1);
      const nSegs     = Math.round(pMesh * totalSegs);
      let drawn = 0;

      outer:
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i0 = r * COLS + c;
          if (c < COLS - 1) {
            if (drawn++ >= nSegs) break outer;
            const a = gridPos[i0], b = gridPos[i0 + 1];
            ctx.globalAlpha = gA * pMesh * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
          if (r < ROWS - 1) {
            if (drawn++ >= nSegs) break outer;
            const a = gridPos[i0], b = gridPos[i0 + COLS];
            ctx.globalAlpha = gA * pMesh * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    }

    ctx.restore();
  }

  requestAnimationFrame(frame);
})();


/* ══════════════════════════════════════
   CORNER MARKS
══════════════════════════════════════ */
(function () {
  const PATH  = 'M 20,2 L 2,2 L 2,20';
  const PAD   = 18;
  const COUNT = 14;

  function buildPositions() {
    const p = PAD + 'px', all = [];
    [15, 30, 45, 55, 70, 85].forEach(pct => {
      const s = pct + '%';
      all.push(
        { left: s,   top: p,    rot: pct < 50 ? 0   : 90  },
        { left: s,   bottom: p, rot: pct < 50 ? 270 : 180 },
        { left: p,   top: s,    rot: pct < 50 ? 0   : 270 },
        { right: p,  top: s,    rot: pct < 50 ? 90  : 180 }
      );
    });
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, COUNT);
  }

  function createMark(pos) {
    const el = document.createElement('div');
    el.className = 'corner-mark';
    if (pos.left)   el.style.left   = pos.left;
    if (pos.right)  el.style.right  = pos.right;
    if (pos.top)    el.style.top    = pos.top;
    if (pos.bottom) el.style.bottom = pos.bottom;
    el.style.transform = `rotate(${pos.rot}deg)`;
    el.innerHTML = `<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
      <path d="${PATH}"/></svg>`;
    document.body.appendChild(el);
    return el;
  }

  function cycle(el) {
    const delay   = Math.random() * 5000;
    const visible = 900  + Math.random() * 2600;
    const fadeOut = 400  + Math.random() * 700;
    setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity    = '0.5';
      setTimeout(() => {
        el.style.transition = `opacity ${fadeOut}ms ease`;
        el.style.opacity    = '0';
        setTimeout(() => cycle(el), fadeOut + 1200 + Math.random() * 3500);
      }, visible);
    }, delay);
  }

  buildPositions().forEach(pos => cycle(createMark(pos)));
})();


/* ══════════════════════════════════════
   EMAIL
══════════════════════════════════════ */
async function handleSubmit() {
  const input   = document.getElementById('email-input');
  const btn     = document.querySelector('.input-row button');
  const success = document.getElementById('form-success');
  const email   = input.value.trim();
  if (!email || !email.includes('@')) { input.focus(); return; }

  btn.textContent = '...';
  btn.disabled = true;

  try {
    const res = await fetch('https://formspree.io/f/maqzvarq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      success.style.display = 'block';
      input.value = '';
    } else {
      success.textContent = 'Algo salió mal, intenta de nuevo.';
      success.style.display = 'block';
    }
  } catch {
    success.textContent = 'Sin conexión, intenta de nuevo.';
    success.style.display = 'block';
  } finally {
    btn.textContent = '→';
    btn.disabled = false;
  }
}

document.getElementById('email-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSubmit();
});

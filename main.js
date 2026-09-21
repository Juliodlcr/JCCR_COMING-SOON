/* ══════════════════════════════════════════════════
   INTRO — "ESTUDIO JCCR" letra por letra
══════════════════════════════════════════════════ */
(function () {
  const text    = 'ESTUDIO JCCR';
  const el      = document.getElementById('intro-text');
  const intro   = document.getElementById('intro');
  const contact = document.querySelector('.contact-section');

  const DELAY   = 280;
  const HOLD    = 900;
  const FADEOUT = 800;

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

  chars.forEach((span, i) => {
    setTimeout(() => {
      span.style.opacity = '1';
      span.style.transform = 'translateY(0)';
    }, i * DELAY);
  });

  const textDone = chars.length * DELAY + HOLD;

  setTimeout(() => {
    intro.classList.add('fade-out');
    setTimeout(() => {
      intro.remove();
      contact.style.opacity = '1';
    }, FADEOUT);
  }, textDone);
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



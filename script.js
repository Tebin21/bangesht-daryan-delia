'use strict';

/* ==========================================================================
   Luxury Kurdish Engagement Invitation — داریان ❤ دەلیا
   Sequencing: ReducedMotionGuard -> AssetGate -> VideoGateController ->
   RevealAndPetalBurst -> (ScrollRevealEngine + CountdownEngine +
   CalendarGenerator start together). CustomCursor and MusicPlayer init
   immediately/independently.
   ========================================================================== */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* --- Reduced motion: read once, react to live OS-setting changes --- */
const ReducedMotionGuard = {
  init() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = (matches) => {
      document.documentElement.dataset.motion = matches ? 'reduced' : 'full';
    };
    apply(mq.matches);
    mq.addEventListener('change', (e) => apply(e.matches));
  }
};

/* --- Intro Gate Controller:
   6-second gold perimeter border loader tracing around all 4 sides of the screen
   with blurred couple photo backdrop, "بانگهێشتنامە", and percentage counter.
   Single tap anywhere immediately advances. --- */
const IntroGateController = {
  DURATION: 6000,
  hasEnded: false,
  len: 0,

  init(onEnded) {
    this.gate = document.getElementById('intro-gate');
    this.svg = document.querySelector('.intro-gate__border-svg');
    this.track = document.getElementById('intro-gate__track');
    this.bar = document.getElementById('intro-gate__bar');
    this.percentEl = document.getElementById('intro-gate__percent');
    this.onEnded = onEnded || (() => {});

    if (!this.gate || !this.bar) {
      this.onEnded();
      return;
    }

    this._updateDimensions();

    const finish = () => {
      if (this.hasEnded) return;
      this.hasEnded = true;
      window.removeEventListener('resize', this._onResize);
      this.gate.classList.add('is-hidden');
      this.onEnded();
      this.gate.addEventListener('transitionend', () => this.gate.remove(), { once: true });
      setTimeout(() => {
        if (this.gate && this.gate.parentNode) this.gate.remove();
      }, 1200);
    };

    this.finish = finish;

    // Single tap anywhere advances immediately
    this.gate.addEventListener('click', finish);

    // Keep dimensions responsive on window resize / orientation change
    this._onResize = () => this._updateDimensions();
    window.addEventListener('resize', this._onResize);

    // Preload hero image in background while 6s animation runs
    AssetGate.preload();

    // Start 6-second progress loop
    const startTime = performance.now();
    const tick = (now) => {
      if (this.hasEnded) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / this.DURATION);
      if (this.len > 0) {
        const offset = this.len * (1 - progress);
        this.bar.style.strokeDashoffset = String(offset);
      }
      if (this.percentEl) {
        this.percentEl.textContent = Math.round(progress * 100) + '%';
      }
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(finish, 280);
      }
    };
    requestAnimationFrame(tick);
  },

  _updateDimensions() {
    if (!this.svg || !this.track || !this.bar) return;
    const inset = 3;
    const w = Math.max(0, this.svg.clientWidth - inset * 2);
    const h = Math.max(0, this.svg.clientHeight - inset * 2);
    this.track.setAttribute('x', String(inset));
    this.track.setAttribute('y', String(inset));
    this.track.setAttribute('width', String(w));
    this.track.setAttribute('height', String(h));
    this.bar.setAttribute('x', String(inset));
    this.bar.setAttribute('y', String(inset));
    this.bar.setAttribute('width', String(w));
    this.bar.setAttribute('height', String(h));
    try {
      this.len = this.bar.getTotalLength();
      this.bar.style.strokeDasharray = String(this.len);
    } catch (e) {
      this.len = 2 * (w + h);
      this.bar.style.strokeDasharray = String(this.len);
    }
  }
};

const AssetGate = {
  preload() {
    try { document.fonts.ready; } catch (e) {}
    const img = document.getElementById('invitation-image');
    if (img && img.decode) {
      img.decode().catch(() => {});
    }
  }
};

/* --- Reveal main content, focus it, fire the one-time petal burst --- */
const RevealAndPetalBurst = {
  hasFired: false,

  run() {
    const main = document.getElementById('main');
    if (!main) return;
    main.hidden = false;
    requestAnimationFrame(() => main.classList.add('is-revealed'));

    ScrollRevealEngine.init();
    CountdownEngine.init();
    CalendarGenerator.init();

    if (!this.hasFired) {
      this.hasFired = true;
      if (document.documentElement.dataset.motion !== 'reduced') {
        this.spawnPetals();
      }
    }
  },

  spawnPetals() {
    const layer = document.getElementById('petal-burst-layer');
    if (!layer) return;
    const count = 28;
    for (let i = 0; i < count; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.style.setProperty('--x', (3 + Math.random() * 92) + '%');
      petal.style.setProperty('--rot', (Math.random() * 360) + 'deg');
      petal.style.setProperty('--dur', (4 + Math.random() * 1) + 's');
      petal.style.setProperty('--delay', (Math.random() * 0.6) + 's');
      petal.style.setProperty('--scale', (0.6 + Math.random() * 0.7).toFixed(2));
      petal.addEventListener('animationend', () => petal.remove(), { once: true });
      layer.appendChild(petal);
    }
  }
};

/* --- Shared scroll-reveal engine over every [data-reveal] node --- */
const ScrollRevealEngine = {
  init() {
    const nodes = document.querySelectorAll('[data-reveal]');
    if (document.documentElement.dataset.motion === 'reduced') {
      nodes.forEach((n) => n.classList.add('is-revealed'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.04, rootMargin: '60px 0px 60px 0px' });
    nodes.forEach((n) => observer.observe(n));
  }
};

/* --- Countdown to 2026-11-21 17:00 Asia/Baghdad (fixed UTC+3, no DST) --- */
const CountdownEngine = {
  EVENT_DATE: new Date('2026-11-21T17:00:00+03:00'),
  intervalId: null,

  init() {
    const tiles = {
      d: document.querySelector('[data-cd="d"]'),
      h: document.querySelector('[data-cd="h"]'),
      m: document.querySelector('[data-cd="m"]'),
      s: document.querySelector('[data-cd="s"]')
    };
    if (!tiles.d || this.intervalId) return;
    Object.values(tiles).forEach((tile) => { tile.textContent = ''; });

    // Renders a value into per-digit <span>s, animating only the digits that actually
    // changed (never an instant swap). Digit-slot count self-adjusts for the rare
    // boundary crossing (e.g. days 9 -> 10, 99 -> 100), so a 3-digit day count is safe.
    const setTile = (tile, rawValue) => {
      const chars = String(rawValue).split('');
      const digits = Array.from(tile.children);
      while (digits.length < chars.length) {
        const digit = document.createElement('span');
        digit.className = 'countdown__digit';
        tile.insertBefore(digit, tile.firstChild);
        digits.unshift(digit);
      }
      while (digits.length > chars.length) {
        tile.removeChild(digits.shift());
      }
      chars.forEach((ch, i) => {
        if (digits[i].textContent === ch) return;
        digits[i].textContent = ch;
        digits[i].classList.remove('is-flipping');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => digits[i].classList.add('is-flipping'));
        });
      });
    };

    const tick = () => {
      const diff = this.EVENT_DATE.getTime() - Date.now();
      if (diff <= 0) {
        setTile(tiles.d, '0');
        setTile(tiles.h, '00');
        setTile(tiles.m, '00');
        setTile(tiles.s, '00');
        clearInterval(this.intervalId);
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTile(tiles.d, String(days));
      setTile(tiles.h, String(hours).padStart(2, '0'));
      setTile(tiles.m, String(minutes).padStart(2, '0'));
      setTile(tiles.s, String(seconds).padStart(2, '0'));
    };
    tick();
    this.intervalId = setInterval(tick, 1000);
  }
};

/* --- November 2026 calendar grid, computed (never hand-hardcoded) --- */
const CalendarGenerator = {
  WEEKDAYS: ['یەکشەم', 'دووشەم', 'سێشەم', 'چوارشەم', 'پێنجشەم', 'هەینی', 'شەممە'],
  TARGET_DAY: 21,

  init() {
    const weekdaysEl = document.getElementById('calendar-weekdays');
    const gridEl = document.getElementById('calendar-grid');
    if (!weekdaysEl || !gridEl || gridEl.childElementCount) return;

    this.WEEKDAYS.forEach((label) => {
      const span = document.createElement('span');
      span.textContent = label;
      weekdaysEl.appendChild(span);
    });

    const firstDayOfWeek = new Date(2026, 10, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(2026, 11, 0).getDate();

    for (let i = 0; i < firstDayOfWeek; i++) {
      gridEl.appendChild(document.createElement('span'));
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const span = document.createElement('span');
      span.textContent = String(day);
      if (day === this.TARGET_DAY) {
        span.classList.add('is-target');
        span.setAttribute('aria-current', 'date');
      }
      gridEl.appendChild(span);
    }
  }
};

/* --- Desktop-only custom cursor (fine pointer), reacts to hybrid devices --- */
const CustomCursor = {
  bound: false,
  target: { x: 0, y: 0 },
  ringPos: { x: 0, y: 0 },
  raf: null,
  onMove: null,

  init() {
    const mq = window.matchMedia('(pointer: fine)');
    const apply = (matches) => {
      document.body.classList.toggle('custom-cursor-active', matches);
      if (matches) this._bind(); else this._unbind();
    };
    apply(mq.matches);
    mq.addEventListener('change', (e) => apply(e.matches));
  },

  _bind() {
    if (this.bound) return;
    this.bound = true;
    this.dot = document.getElementById('cursor-dot');
    this.ring = document.getElementById('cursor-ring');
    this.looping = false;
    this.onMove = (e) => {
      this.target.x = e.clientX;
      this.target.y = e.clientY;
      this._ensureLoop();
    };
    window.addEventListener('pointermove', this.onMove, { passive: true });
  },

  // Runs the dot/ring rAF loop only while the ring is still catching up to
  // the pointer. Profiling showed this loop previously ran unconditionally
  // forever (~60 style-recalculating writes/sec even with a motionless
  // mouse) -- now it self-stops once converged and only restarts on the
  // next real pointermove, so a stationary cursor costs nothing per frame.
  _ensureLoop() {
    if (this.looping) return;
    this.looping = true;
    const loop = () => {
      if (this.dot) {
        this.dot.style.transform = `translate3d(${this.target.x}px, ${this.target.y}px, 0) translate(-50%,-50%)`;
      }
      const dx = this.target.x - this.ringPos.x;
      const dy = this.target.y - this.ringPos.y;
      this.ringPos.x += dx * 0.18;
      this.ringPos.y += dy * 0.18;
      if (this.ring) {
        this.ring.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0) translate(-50%,-50%)`;
      }
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        this.looping = false;
        return;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  },

  _unbind() {
    if (!this.bound) return;
    this.bound = false;
    this.looping = false;
    window.removeEventListener('pointermove', this.onMove);
    if (this.raf) cancelAnimationFrame(this.raf);
  }
};

/* --- Final "I'll be there" CTA: fades the button, then runs a 5s
   celebration (flowers + petals falling again into the existing
   petal-burst layer) alongside a centered frosted-glass thank-you panel.
   Mirrors RevealAndPetalBurst's reduced-motion handling. --- */
const EndingCelebration = {
  DURATION_MS: 5000,
  FLOWER_INTERVAL_MS: 850,
  PETAL_INTERVAL_MS: 250,

  init() {
    this.btn = document.getElementById('ending-cta-btn');
    this.layer = document.getElementById('petal-burst-layer');
    this.message = document.getElementById('ending-message');
    if (!this.btn || !this.layer || !this.message) return;
    this.btn.addEventListener('click', () => this.trigger());
  },

  trigger() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.btn.classList.add('is-fading');

    this.showMessage();
    this.runFall();
  },

  showMessage() {
    document.body.classList.add('has-ending-modal');
    this.message.setAttribute('aria-hidden', 'false');
    this.message.classList.add('is-visible');

    const hide = () => {
      this.message.classList.remove('is-visible');
      this.message.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('has-ending-modal');
      // Return button back to normal as it was after 5 seconds
      setTimeout(() => {
        if (this.btn) this.btn.classList.remove('is-fading');
        this.isRunning = false;
      }, 350);
    };

    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(hide, this.DURATION_MS);

    // Tap anywhere on backdrop to dismiss immediately
    this.message.addEventListener('click', () => {
      clearTimeout(this.hideTimeout);
      hide();
    }, { once: true });
  },

  runFall() {
    const reduced = document.documentElement.dataset.motion === 'reduced';

    if (reduced) {
      // No continuous spawn loop under reduced motion — a small static-ish
      // batch instead, same as RevealAndPetalBurst's one-time burst.
      for (let i = 0; i < 4; i++) this.spawnFlower();
      for (let i = 0; i < 6; i++) this.spawnPetal();
      return;
    }

    // Seed immediately so the burst is never empty-looking at t=0.
    for (let i = 0; i < 4; i++) this.spawnFlower();
    for (let i = 0; i < 5; i++) this.spawnPetal();

    const flowerTimer = setInterval(() => this.spawnFlower(), this.FLOWER_INTERVAL_MS);
    const petalTimer = setInterval(() => this.spawnPetal(), this.PETAL_INTERVAL_MS);

    // Stop spawning at the 5s mark; elements already falling finish their
    // own animation and self-remove via animationend, so nothing is cut
    // off mid-fall.
    setTimeout(() => {
      clearInterval(flowerTimer);
      clearInterval(petalTimer);
    }, this.DURATION_MS);
  },

  spawnFlower() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('ending-flower');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');

    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#icon-rose');
    svg.appendChild(use);

    svg.style.setProperty('--x', (6 + Math.random() * 84) + '%');
    svg.style.setProperty('--ef-size', (34 + Math.random() * 24) + 'px');
    svg.style.setProperty('--ef-dur', (3.6 + Math.random() * 1.6) + 's');
    svg.style.setProperty('--ef-op', (0.75 + Math.random() * 0.22).toFixed(2));
    svg.style.setProperty('--ef-x1', (Math.random() * 44 - 22) + 'px');
    svg.style.setProperty('--ef-x2', (Math.random() * 56 - 28) + 'px');
    svg.style.setProperty('--ef-r', (Math.random() * 300 - 150) + 'deg');

    svg.addEventListener('animationend', () => svg.remove(), { once: true });
    this.layer.appendChild(svg);
  },

  spawnPetal() {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.setProperty('--x', (3 + Math.random() * 92) + '%');
    petal.style.setProperty('--rot', (Math.random() * 360) + 'deg');
    petal.style.setProperty('--dur', (2.8 + Math.random() * 1.6) + 's');
    petal.style.setProperty('--delay', (Math.random() * 0.3) + 's');
    petal.style.setProperty('--scale', (0.6 + Math.random() * 0.7).toFixed(2));
    petal.addEventListener('animationend', () => petal.remove(), { once: true });
    this.layer.appendChild(petal);
  }
};

/* --- Bootstrap --- */
document.addEventListener('DOMContentLoaded', () => {
  ReducedMotionGuard.init();
  CustomCursor.init();
  EndingCelebration.init();

  IntroGateController.init(() => RevealAndPetalBurst.run());
});

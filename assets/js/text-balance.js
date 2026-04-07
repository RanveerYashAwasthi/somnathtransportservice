import { prepare, layout } from '../../lib/layout.js';

const SELECTORS = 'h1, h2, h3, .hero__sub, .testimonial__text, .service-item__desc, .cta-band h2';
const DEBOUNCE_MS = 120;

function getFontString(el) {
  const s = getComputedStyle(el);
  return `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
}

function balanceWidth(prepared, containerWidth) {
  const { lineCount } = layout(prepared, containerWidth, 1);
  if (lineCount <= 1) return null;

  let lo = 0;
  let hi = containerWidth;
  let best = containerWidth;

  while (hi - lo > 1) {
    const mid = (lo + hi) >>> 1;
    const { lineCount: lc } = layout(prepared, mid, 1);
    if (lc === lineCount) {
      best = mid;
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return best;
}

let items = [];
let resizeTimer = null;

function measure() {
  for (const item of items) {
    const parent = item.el.parentElement;
    if (!parent) continue;
    item.el.style.maxWidth = '';
    const cw = parent.clientWidth;
    const balanced = balanceWidth(item.prepared, cw);
    if (balanced !== null) {
      item.el.style.maxWidth = balanced + 'px';
    }
  }
}

function init() {
  const els = document.querySelectorAll(SELECTORS);
  items = [];
  for (const el of els) {
    const text = el.textContent.trim();
    if (!text) continue;
    const font = getFontString(el);
    try {
      const prepared = prepare(text, font);
      items.push({ el, prepared });
    } catch (_) {
      // skip elements that fail to prepare
    }
  }
  measure();
}

function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(measure, DEBOUNCE_MS);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(init);
  });
} else {
  requestAnimationFrame(init);
}

window.addEventListener('resize', onResize);

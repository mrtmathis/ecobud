import i18n from './i18n.js';

// A double tap on an empty spot or on text makes everything 25 % bigger; another double tap goes back
const DOUBLE_TAP_MS = 300;
const MAX_MOVE_PX = 30;
const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"]';

let lastTap = null;
let toastTimer;

function showToast(text) {
  let toast = document.querySelector('.zoom-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'zoom-toast';
    toast.setAttribute('role', 'status');
    document.body.append(toast);
  }
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 2000);
}

function toggle() {
  const root = document.documentElement;
  const on = !root.classList.contains('large-text');
  root.classList.toggle('large-text', on);
  showToast(i18n.t(on ? 'zoom.on' : 'zoom.off'));
}

document.addEventListener(
  'touchend',
  (event) => {
    // Only one finger, never on a control, so taps on buttons keep working normally
    if (event.changedTouches.length !== 1 || event.touches.length > 0 || event.target.closest(INTERACTIVE)) {
      lastTap = null;
      return;
    }
    const touch = event.changedTouches[0];
    const now = Date.now();
    const close =
      lastTap &&
      now - lastTap.time < DOUBLE_TAP_MS &&
      Math.abs(touch.clientX - lastTap.x) < MAX_MOVE_PX &&
      Math.abs(touch.clientY - lastTap.y) < MAX_MOVE_PX;

    if (close) {
      lastTap = null;
      toggle();
    } else {
      lastTap = { time: now, x: touch.clientX, y: touch.clientY };
    }
  },
  { passive: true },
);

export const SKINS = ['ticket', 'bocal', 'pop'];
export const APPEARANCES = ['auto', 'light', 'dark'];
const STORAGE_KEY = 'ecobud_theme';

// Each theme only downloads its own fonts, when it is first shown
const fontLoaders = {
  ticket: () =>
    Promise.all([
      import('@fontsource-variable/bricolage-grotesque/wght.css'),
      import('@fontsource/dm-mono/400.css'),
      import('@fontsource/dm-mono/500.css'),
    ]),
  bocal: () => Promise.all([import('@fontsource-variable/fredoka/wght.css'), import('@fontsource-variable/nunito-sans/wght.css')]),
  pop: () => Promise.all([import('@fontsource-variable/unbounded/wght.css'), import('@fontsource-variable/archivo/wght.css')]),
};
const loaded = new Set();

export function loadFonts(skin) {
  if (loaded.has(skin) || !fontLoaders[skin]) return;
  loaded.add(skin);
  fontLoaders[skin]().catch(() => loaded.delete(skin));
}

// Color of the phone status bar, taken from the page background once the theme is applied
function updateThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
}

// Last theme used on this device, so the first screen is drawn in the right colors
export function savedTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (SKINS.includes(saved?.skin) && APPEARANCES.includes(saved?.appearance)) return saved;
  } catch {
    // Nothing saved or storage blocked
  }
  return { skin: 'ticket', appearance: 'auto' };
}

export function applyTheme({ skin, appearance }) {
  if (!SKINS.includes(skin) || !APPEARANCES.includes(appearance)) return;
  const root = document.documentElement;
  root.dataset.skin = skin;
  root.dataset.mode = appearance;
  loadFonts(skin);
  updateThemeColor();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ skin, appearance }));
  } catch {
    // Not saved locally, the account still keeps it
  }
}

// "Auto" mode changes with the device: keep the status bar color in step
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor);

applyTheme(savedTheme());

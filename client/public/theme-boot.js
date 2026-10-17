// Applies the last theme before the page is drawn, so it never flashes in the wrong colors
try {
  var theme = JSON.parse(localStorage.getItem('ecobud_theme')) || {};
  document.documentElement.dataset.skin = theme.skin || 'ticket';
  document.documentElement.dataset.mode = theme.appearance || 'auto';
} catch (e) {}

// Run in the head so the saved appearance is applied before the page is painted.
(() => {
  const key = 'axzify-theme';
  const valid = value => ['system', 'light', 'dark'].includes(value) ? value : 'system';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { preference = valid(window.localStorage.getItem(key)); } catch { /* Storage may be disabled. */ }
  const apply = () => {
    document.documentElement.setAttribute('data-theme', preference === 'system' ? (system.matches ? 'dark' : 'light') : preference);
  };
  apply();
  system.addEventListener('change', apply);
  document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('theme-select');
    selector.value = preference;
    selector.addEventListener('change', () => {
      preference = valid(selector.value);
      try { window.localStorage.setItem(key, preference); } catch { /* The current visit still works. */ }
      apply();
    });
    window.addEventListener('storage', event => {
      if (event.key !== key && event.key !== null) return;
      preference = valid(event.newValue);
      selector.value = preference;
      apply();
    });
  });
})();

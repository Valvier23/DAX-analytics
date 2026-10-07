(() => {
  const selector = document.getElementById('language-select');
  selector.value = document.documentElement.lang === 'en' ? 'en' : 'es';
  selector.addEventListener('change', () => {
    const page = selector.value === 'en' ? 'en.html' : 'index.html';
    window.location.assign(page + window.location.hash);
  });
})();

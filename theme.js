(() => {
  const device = matchMedia('(prefers-color-scheme: dark)');
  const key = 'gallery-night:theme';
  let choice;
  try { choice = localStorage.getItem(key); } catch {}
  if (!['light','dark'].includes(choice)) choice = null;
  function applyTheme() {
    const dark = choice ? choice === 'dark' : device.matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]').setAttribute('content',dark ? '#071910' : '#145530');
    const button = document.querySelector('#theme-toggle');
    if (button) {
      button.textContent = dark ? '☾' : '☀';
      button.setAttribute('aria-pressed',String(dark));
      button.title = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    }
  }
  applyTheme();
  device.addEventListener('change',applyTheme);
  document.addEventListener('DOMContentLoaded',() => {
    applyTheme();
    document.querySelector('#theme-toggle').addEventListener('click',() => {
      choice = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key,choice); } catch {}
      applyTheme();
    });
  });
})();

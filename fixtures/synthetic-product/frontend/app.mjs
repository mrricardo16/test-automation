const button = document.querySelector('#load-flags');
const output = document.querySelector('#feature-status');

button?.addEventListener('click', async () => {
  const response = await fetch('/api/feature-flags');
  const flags = await response.json();
  output.textContent = `newDashboard=${String(flags.newDashboard)}`;
});

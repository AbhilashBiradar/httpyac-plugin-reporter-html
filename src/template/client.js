let currentFilter = 'all';

function toggle(id) {
  document.getElementById(id).classList.toggle('open');
}

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilters();
}

function applyFilters() {
  const q = document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    const url      = card.querySelector('.url')?.textContent.toLowerCase() || '';
    const name     = card.querySelector('.region-name')?.textContent.toLowerCase() || '';
    const file     = card.querySelector('.meta-file')?.textContent.toLowerCase() || '';
    const title    = card.querySelector('.meta-title')?.textContent.toLowerCase() || '';
    const matchSearch = !q || url.includes(q) || name.includes(q) || file.includes(q) || title.includes(q);
    const outcome  = card.dataset.outcome;
    const sc       = card.dataset.sc;
    const matchFilter =
      currentFilter === 'all' ||
      currentFilter === outcome ||
      currentFilter === sc;
    card.classList.toggle('hidden', !(matchSearch && matchFilter));
  });
}

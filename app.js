let quotes = [...(window.CF_CONTENT?.quotes || [])];
let poems = [...(window.CF_CONTENT?.poems || [])];
let writings = [...(window.CF_CONTENT?.writings || [])];
let cfClient = null;

const poemGrid = document.getElementById('poemGrid');
const writingList = document.getElementById('writingList');
const modal = document.getElementById('contentModal');
const modalTitle = document.getElementById('modalTitle');
const modalMeta = document.getElementById('modalMeta');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const dailyQuote = document.getElementById('dailyQuote');
const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');

function formatDate(dateValue) {
  if (!dateValue) return '';
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(date);
}

function categoryLabel(category = '') {
  const map = {
    'yalnizlik': 'Yalnızlık',
    'insan': 'İnsan',
    'cocukluk': 'Çocukluk',
    'eski-zamanlar': 'Eski Zamanlar',
    'hayat': 'Hayat'
  };
  return map[category] || category || 'Şiir';
}

async function loadPublishedContent() {
  if (!window.CF_HAS_SUPABASE || !window.supabase?.createClient) return;

  try {
    cfClient = window.supabase.createClient(window.CF_SUPABASE.url, window.CF_SUPABASE.key);

    const [poemRes, writingRes] = await Promise.all([
      cfClient.from('poems')
        .select('id,title,category,excerpt,body,published_at,featured,created_at')
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('published_at', { ascending: false, nullsFirst: false }),
      cfClient.from('writings')
        .select('id,title,category,excerpt,body,published_at,featured,created_at')
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('published_at', { ascending: false, nullsFirst: false })
    ]);

    if (poemRes.error) throw poemRes.error;
    if (writingRes.error) throw writingRes.error;

    poems = (poemRes.data || []).map(p => ({
      ...p,
      categoryLabel: categoryLabel(p.category),
      date: formatDate(p.published_at || p.created_at),
      excerpt: p.excerpt || (p.body || '').replace(/\s+/g, ' ').slice(0, 120) + '…'
    }));

    writings = (writingRes.data || []).map(w => ({
      ...w,
      category: categoryLabel(w.category),
      date: formatDate(w.published_at || w.created_at)
    }));
  } catch (err) {
    console.warn('Supabase içeriği alınamadı; yerel örnek içerik gösteriliyor.', err);
  }
}

function renderPoems(filter = 'all') {
  const visible = filter === 'all' ? poems : poems.filter(p => p.category === filter);
  if (!visible.length) {
    poemGrid.innerHTML = '<div class="empty-state">Bu kategoride henüz yayımlanmış bir şiir yok.</div>';
    return;
  }

  poemGrid.innerHTML = visible.map((p, i) => `
    <article class="poem-card reveal visible" data-kind="poem" data-id="${p.id}" tabindex="0">
      <span class="card-index">${String(i + 1).padStart(2, '0')}</span>
      <h3>${escapeHtml(p.title)}</h3>
      <p>“${escapeHtml(p.excerpt || '')}”</p>
      <div class="card-footer"><span>${escapeHtml(p.categoryLabel || categoryLabel(p.category))}</span><span>${escapeHtml(p.date || '')}</span></div>
    </article>
  `).join('');
  bindContentCards();
}

function renderWritings() {
  if (!writings.length) {
    writingList.innerHTML = '<div class="empty-state">Henüz yayımlanmış bir yazı yok.</div>';
    return;
  }

  writingList.innerHTML = writings.map((w, i) => `
    <article class="writing-item reveal" data-kind="writing" data-id="${w.id}" tabindex="0">
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <span class="category">${escapeHtml(w.category || '')}</span>
      <h3>${escapeHtml(w.title)}</h3>
      <span class="arrow">↗</span>
    </article>
  `).join('');
  bindContentCards();
  observeReveals();
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
}

function openContent(kind, rawId) {
  const id = String(rawId);
  const item = kind === 'poem'
    ? poems.find(p => String(p.id) === id)
    : writings.find(w => String(w.id) === id);
  if (!item) return;
  modalMeta.textContent = `${kind === 'poem' ? (item.categoryLabel || categoryLabel(item.category)) : item.category} · ${item.date || ''}`;
  modalTitle.textContent = item.title;
  modalBody.textContent = item.body;
  modal.showModal();
  document.body.classList.add('modal-open');
}

function bindContentCards() {
  document.querySelectorAll('[data-kind][data-id]').forEach(el => {
    el.onclick = () => openContent(el.dataset.kind, el.dataset.id);
    el.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openContent(el.dataset.kind, el.dataset.id);
      }
    };
  });
}

function changeQuote() {
  if (!quotes.length) return;
  let next = quotes[Math.floor(Math.random() * quotes.length)];
  if (`“${next}”` === dailyQuote.textContent && quotes.length > 1) return changeQuote();
  dailyQuote.animate([{opacity: 0, transform:'translateY(8px)'},{opacity: 1, transform:'none'}], {duration: 420, easing:'ease'});
  dailyQuote.textContent = `“${next}”`;
}

document.querySelectorAll('.filter-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderPoems(btn.dataset.filter);
  });
});

document.getElementById('showAllPoems').addEventListener('click', () => {
  document.querySelector('.filter-chip[data-filter="all"]').click();
  document.getElementById('siirler').scrollIntoView({behavior:'smooth'});
});

document.getElementById('quoteRefresh').addEventListener('click', changeQuote);
document.getElementById('randomWordBtn').addEventListener('click', () => {
  changeQuote();
  document.querySelector('.quote-band').scrollIntoView({behavior:'smooth', block:'center'});
});

modalClose.addEventListener('click', () => modal.close());
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
modal.addEventListener('close', () => document.body.classList.remove('modal-open'));

menuToggle.addEventListener('click', () => {
  const open = siteNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
siteNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  siteNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

const playerCard = document.querySelector('.player-card');
const playButton = document.getElementById('playButton');
const waveform = document.getElementById('waveform');
for (let i = 0; i < 86; i++) {
  const bar = document.createElement('span');
  const h = 10 + ((i * 17) % 38);
  bar.style.height = `${h}px`;
  waveform.appendChild(bar);
}
let playing = false;
playButton.addEventListener('click', () => {
  playing = !playing;
  playerCard.classList.toggle('playing', playing);
  playButton.textContent = playing ? 'Ⅱ' : '▶';
});

function observeReveals() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
}

window.addEventListener('scroll', () => {
  document.querySelector('.site-header').classList.toggle('scrolled', window.scrollY > 18);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  document.getElementById('readingProgress').style.width = `${pct}%`;
});

(async function init() {
  await loadPublishedContent();
  renderPoems();
  renderWritings();
  observeReveals();
})();

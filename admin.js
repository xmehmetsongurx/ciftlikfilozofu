const setupView = document.getElementById('setupView');
const loginView = document.getElementById('loginView');
const adminView = document.getElementById('adminView');
const editorDialog = document.getElementById('editorDialog');
const confirmDialog = document.getElementById('confirmDialog');
const toast = document.getElementById('toast');

let client = null;
let poems = [];
let writings = [];
let activeSection = 'dashboard';
let deleteTarget = null;

const catLabels = {
  hayat: 'Hayat', yalnizlik: 'Yalnızlık', insan: 'İnsan',
  cocukluk: 'Çocukluk', 'eski-zamanlar': 'Eski Zamanlar'
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric' }).format(new Date(value));
}

function setVisible(view) {
  [setupView, loginView, adminView].forEach(v => v.classList.add('hidden'));
  view.classList.remove('hidden');
}

async function init() {
  if (!window.CF_HAS_SUPABASE || !window.supabase?.createClient) {
    setVisible(setupView);
    return;
  }

  client = window.supabase.createClient(window.CF_SUPABASE.url, window.CF_SUPABASE.key);
  const { data } = await client.auth.getSession();
  if (data.session) {
    setVisible(adminView);
    await loadAll();
  } else {
    setVisible(loginView);
  }

  client.auth.onAuthStateChange(async (_event, session) => {
    if (session) {
      setVisible(adminView);
      await loadAll();
    } else setVisible(loginView);
  });
}

async function loadAll() {
  const [pRes, wRes] = await Promise.all([
    client.from('poems').select('*').order('created_at', { ascending:false }),
    client.from('writings').select('*').order('created_at', { ascending:false })
  ]);

  if (pRes.error || wRes.error) {
    const error = pRes.error || wRes.error;
    showToast('Veriler alınamadı: ' + error.message);
    return;
  }
  poems = pRes.data || [];
  writings = wRes.data || [];
  renderEverything();
}

function renderEverything() {
  document.getElementById('statPoems').textContent = poems.length;
  document.getElementById('statPublished').textContent = poems.filter(x => x.status === 'published').length;
  document.getElementById('statDrafts').textContent = poems.filter(x => x.status === 'draft').length;
  document.getElementById('statWritings').textContent = writings.length;

  const recent = [...poems.map(x => ({...x, _type:'poem'})), ...writings.map(x => ({...x, _type:'writing'}))]
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,5);
  renderRows(document.getElementById('recentList'), recent);
  filterPoems();
  filterWritings();
}

function renderRows(container, items) {
  if (!items.length) {
    container.innerHTML = '<div class="list-empty">Henüz burada bir içerik yok.</div>';
    return;
  }
  container.innerHTML = items.map(item => {
    const type = item._type || (poems.some(p => p.id === item.id) ? 'poem' : 'writing');
    const excerpt = item.excerpt || (item.body || '').replace(/\s+/g,' ').slice(0,95);
    return `<article class="content-row">
      <span class="type-mark">${type === 'poem' ? '✦' : '≋'}</span>
      <div class="title"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(excerpt || 'Açıklama yok')}</small></div>
      <span class="category">${escapeHtml(catLabels[item.category] || item.category || '—')}</span>
      <span class="status ${item.status}">${item.status === 'published' ? 'Yayında' : 'Taslak'}</span>
      <time>${formatDate(item.published_at || item.created_at)}</time>
      <button class="row-action" data-edit-type="${type}" data-edit-id="${item.id}" aria-label="Düzenle">↗</button>
    </article>`;
  }).join('');
  container.querySelectorAll('[data-edit-id]').forEach(btn => btn.addEventListener('click', () => openEditor(btn.dataset.editType, btn.dataset.editId)));
}

function filterPoems() {
  const q = (document.getElementById('poemSearch').value || '').toLocaleLowerCase('tr-TR');
  const status = document.getElementById('poemStatusFilter').value;
  const list = poems.filter(p => (!q || `${p.title} ${p.body}`.toLocaleLowerCase('tr-TR').includes(q)) && (status === 'all' || p.status === status));
  renderRows(document.getElementById('poemList'), list.map(x => ({...x,_type:'poem'})));
}
function filterWritings() {
  const q = (document.getElementById('writingSearch').value || '').toLocaleLowerCase('tr-TR');
  const list = writings.filter(w => !q || `${w.title} ${w.body}`.toLocaleLowerCase('tr-TR').includes(q));
  renderRows(document.getElementById('writingListAdmin'), list.map(x => ({...x,_type:'writing'})));
}

function switchSection(section) {
  activeSection = section;
  document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.section === section));
  document.querySelectorAll('.panel-section').forEach(x => x.classList.add('hidden'));
  document.getElementById(`${section}Section`).classList.remove('hidden');
  const titles = {dashboard:['Yönetim','Genel Bakış'],poems:['İçerik','Şiirler'],writings:['İçerik','Yazılar']};
  document.getElementById('pageEyebrow').textContent = titles[section][0];
  document.getElementById('pageTitle').textContent = titles[section][1];
  const btn = document.getElementById('newContentBtn');
  btn.textContent = section === 'writings' ? '+ Yeni yazı' : '+ Yeni şiir';
}

function resetEditor(type) {
  document.getElementById('editorForm').reset();
  document.getElementById('contentId').value = '';
  document.getElementById('contentType').value = type;
  document.getElementById('contentDate').value = new Date().toISOString().slice(0,10);
  document.getElementById('contentStatus').value = 'draft';
  document.getElementById('editorEyebrow').textContent = 'Yeni içerik';
  document.getElementById('editorTitle').textContent = type === 'poem' ? 'Yeni şiir' : 'Yeni yazı';
  document.getElementById('deleteContentBtn').classList.add('hidden');
  document.getElementById('editorMessage').textContent = '';
}

function openEditor(type, id = null) {
  resetEditor(type);
  if (id) {
    const list = type === 'poem' ? poems : writings;
    const item = list.find(x => String(x.id) === String(id));
    if (!item) return;
    document.getElementById('contentId').value = item.id;
    document.getElementById('contentTitle').value = item.title || '';
    document.getElementById('contentExcerpt').value = item.excerpt || '';
    document.getElementById('contentBody').value = item.body || '';
    document.getElementById('contentCategory').value = item.category || 'hayat';
    document.getElementById('contentDate').value = (item.published_at || item.created_at || '').slice(0,10);
    document.getElementById('contentStatus').value = item.status || 'draft';
    document.getElementById('contentFeatured').checked = !!item.featured;
    document.getElementById('editorEyebrow').textContent = 'İçeriği düzenle';
    document.getElementById('editorTitle').textContent = item.title;
    document.getElementById('deleteContentBtn').classList.remove('hidden');
  }
  editorDialog.showModal();
}

async function saveContent(e) {
  e.preventDefault();
  const type = document.getElementById('contentType').value;
  const table = type === 'poem' ? 'poems' : 'writings';
  const id = document.getElementById('contentId').value;
  const status = document.getElementById('contentStatus').value;
  const payload = {
    title: document.getElementById('contentTitle').value.trim(),
    excerpt: document.getElementById('contentExcerpt').value.trim(),
    body: document.getElementById('contentBody').value.trim(),
    category: document.getElementById('contentCategory').value,
    status,
    featured: document.getElementById('contentFeatured').checked,
    published_at: status === 'published' ? document.getElementById('contentDate').value || new Date().toISOString().slice(0,10) : null,
    updated_at: new Date().toISOString()
  };

  const msg = document.getElementById('editorMessage');
  msg.style.color = '#858a80';
  msg.textContent = 'Kaydediliyor…';
  document.getElementById('saveContentBtn').disabled = true;

  let res;
  if (id) res = await client.from(table).update(payload).eq('id', id).select().single();
  else res = await client.from(table).insert(payload).select().single();

  document.getElementById('saveContentBtn').disabled = false;
  if (res.error) {
    msg.style.color = '#d99886';
    msg.textContent = res.error.message;
    return;
  }

  editorDialog.close();
  showToast(status === 'published' ? 'İçerik yayımlandı.' : 'Taslak kaydedildi.');
  await loadAll();
}

function askDelete() {
  deleteTarget = { type: document.getElementById('contentType').value, id: document.getElementById('contentId').value };
  if (!deleteTarget.id) return;
  confirmDialog.showModal();
}

async function confirmDelete() {
  if (!deleteTarget) return;
  const table = deleteTarget.type === 'poem' ? 'poems' : 'writings';
  const { error } = await client.from(table).delete().eq('id', deleteTarget.id);
  if (error) return showToast('Silinemedi: ' + error.message);
  confirmDialog.close();
  editorDialog.close();
  deleteTarget = null;
  showToast('İçerik silindi.');
  await loadAll();
}

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = document.getElementById('loginMessage');
  msg.textContent = 'Giriş yapılıyor…';
  const { error } = await client.auth.signInWithPassword({
    email: document.getElementById('loginEmail').value.trim(),
    password: document.getElementById('loginPassword').value
  });
  msg.textContent = error ? 'E-posta veya şifre hatalı.' : '';
});

document.getElementById('logoutBtn').addEventListener('click', () => client.auth.signOut());
document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => switchSection(btn.dataset.section)));
document.getElementById('newContentBtn').addEventListener('click', () => openEditor(activeSection === 'writings' ? 'writing' : 'poem'));
document.getElementById('poemSearch').addEventListener('input', filterPoems);
document.getElementById('poemStatusFilter').addEventListener('change', filterPoems);
document.getElementById('writingSearch').addEventListener('input', filterWritings);
document.getElementById('editorForm').addEventListener('submit', saveContent);
document.getElementById('closeEditor').addEventListener('click', () => editorDialog.close());
document.getElementById('cancelEditor').addEventListener('click', () => editorDialog.close());
document.getElementById('deleteContentBtn').addEventListener('click', askDelete);
document.getElementById('confirmCancel').addEventListener('click', () => confirmDialog.close());
document.getElementById('confirmDelete').addEventListener('click', confirmDelete);

init();

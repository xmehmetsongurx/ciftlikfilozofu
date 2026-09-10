const F = window.CF_FALLBACK || { poems:[], writings:[] };
const kind = document.body.dataset.readerKind === 'writing' ? 'writing' : 'poem';
const table = kind === 'poem' ? 'poems' : 'writings';
const fallbackItems = kind === 'poem' ? [...(F.poems || [])] : [...(F.writings || [])];
let items = fallbackItems;
let client = null;

const $ = s => document.querySelector(s);
function label(v='') { const m={yalnizlik:'Yalnızlık',insan:'İnsan',cocukluk:'Çocukluk','eski-zamanlar':'Eski Zamanlar',hayat:'Hayat'}; return m[v]||v||''; }
function dateLabel(value) { if(!value)return''; const d=new Date(String(value).slice(0,10)+'T12:00:00'); return Number.isNaN(d.getTime())?value:new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'long',year:'numeric'}).format(d); }
function itemUrl(i) { return kind==='poem' ? `/siir/${encodeURIComponent(i.slug||i.id)}` : `/yazi/${encodeURIComponent(i.slug||i.id)}`; }
function keyFromUrl() {
  const q = new URLSearchParams(location.search).get('slug');
  if (q) return decodeURIComponent(q);
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'siir' || parts[0] === 'yazi') return decodeURIComponent(parts[1] || '');
  return '';
}
async function load() {
  if (window.CF_SUPABASE?.url && window.CF_SUPABASE?.key && window.supabase?.createClient) {
    try {
      client = window.supabase.createClient(window.CF_SUPABASE.url, window.CF_SUPABASE.key);
      const res = await client.from(table).select('id,slug,title,excerpt,body,category,status,featured,published_at,created_at').eq('status','published').order('published_at',{ascending:false,nullsFirst:false});
      if (!res.error && res.data?.length) items = res.data;
    } catch(e) { console.warn(e); }
  }
  render();
}
function render() {
  const key = keyFromUrl();
  let item = items.find(x => String(x.slug||'')===key || String(x.id)===key);
  if (!item) item = items[0];
  if (!item) {
    $('#readerTitle').textContent = 'Bu sayfa sessiz kaldı.';
    $('#readerContent').textContent = 'Aradığın içerik bulunamadı.';
    return;
  }
  const date = dateLabel(item.published_at || item.created_at);
  $('#readerTitle').textContent = item.title;
  $('#readerExcerpt').textContent = item.excerpt ? `“${item.excerpt}”` : '';
  $('#readerExcerpt').hidden = !item.excerpt;
  $('#readerContent').textContent = item.body || '';
  $('#readerDate').textContent = date;
  $('#readerKicker').textContent = `${kind==='poem'?'ŞİİR':'YAZI'} / ${label(item.category)} / ÇİFTLİK FİLOZOFU`;
  document.title = `${item.title} — Çiftlik Filozofu`;
  const desc = item.excerpt || String(item.body||'').replace(/\s+/g,' ').slice(0,155);
  document.querySelector('meta[name="description"]')?.setAttribute('content',desc);
  const index = items.findIndex(x=>String(x.id)===String(item.id));
  const next = items[index+1] || items[0];
  if (next && String(next.id)!==String(item.id)) {
    $('#readerNext').innerHTML = `<small>Sonraki ${kind==='poem'?'şiir':'yazı'}</small><a href="${itemUrl(next)}"><span>${escapeHtml(next.title)}</span><span>↗</span></a>`;
  } else $('#readerNext').hidden = true;
}
function escapeHtml(v='') { return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
$('#copyLinkBtn')?.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href); $('#copyLinkBtn').textContent='Kopyalandı ✓'; setTimeout(()=>$('#copyLinkBtn').textContent='Bağlantıyı kopyala ↗',1600); }
  catch { prompt('Bağlantıyı kopyala:',location.href); }
});
const themeToggle=$('#themeToggle');
if(localStorage.getItem('cf-theme')==='paper') document.body.classList.add('theme-paper');
function themeLabel(){ if($('#themeText')) $('#themeText').textContent=document.body.classList.contains('theme-paper')?'Gece':'Kâğıt'; }
themeLabel();
themeToggle?.addEventListener('click',()=>{document.body.classList.toggle('theme-paper');localStorage.setItem('cf-theme',document.body.classList.contains('theme-paper')?'paper':'night');themeLabel();});
window.addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight; $('#readingProgress').style.width=`${max>0?(scrollY/max)*100:0}%`;},{passive:true});
load();

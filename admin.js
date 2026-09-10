const setupView = document.getElementById('setupView');
const loginView = document.getElementById('loginView');
const recoveryView = document.getElementById('recoveryView');
const adminView = document.getElementById('adminView');
const editorDialog = document.getElementById('editorDialog');
const quoteDialog = document.getElementById('quoteDialog');
const audioDialog = document.getElementById('audioDialog');
const confirmDialog = document.getElementById('confirmDialog');
const FALLBACK = window.CF_FALLBACK || {settings:{}};
let client = null;
let poems = [], writings = [], quotes = [], audioItems = [];
let settings = {...(FALLBACK.settings || {})};
let activeSection = 'dashboard';
let deleteTarget = null;

const catLabels = {yalnizlik:'Yalnızlık', insan:'İnsan', cocukluk:'Çocukluk','eski-zamanlar':'Eski Zamanlar', hayat:'Hayat'};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function slugify(v=''){return String(v).toLocaleLowerCase('tr-TR').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
function formatDate(v){if(!v)return'—';const d=new Date(String(v).slice(0,10)+'T12:00:00');return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'short',year:'numeric'}).format(d);}
function setVisible(view){[setupView,loginView,recoveryView,adminView].forEach(v=>v.classList.add('hidden'));view.classList.remove('hidden');}
function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),2400);}

async function init(){
  if(!window.CF_SUPABASE?.url||!window.CF_SUPABASE?.key||!window.supabase?.createClient){setVisible(setupView);return;}
  client=window.supabase.createClient(window.CF_SUPABASE.url,window.CF_SUPABASE.key);
  const params=new URLSearchParams(location.search);const recoveryRequested=params.get('recovery')==='1'||location.hash.includes('type=recovery');
  if(recoveryRequested)setVisible(recoveryView);
  const {data}=await client.auth.getSession();
  if(data.session&&!recoveryRequested){setVisible(adminView);await loadAll();}
  else if(!data.session&&!recoveryRequested)setVisible(loginView);
  client.auth.onAuthStateChange(async(event,session)=>{
    if(event==='PASSWORD_RECOVERY'){setVisible(recoveryView);return;}
    if(session&&!recoveryRequested){setVisible(adminView);await loadAll();}
    if(!session&&!recoveryRequested)setVisible(loginView);
  });
}

async function loadAll(){
  const reqs=[
    client.from('poems').select('*').order('created_at',{ascending:false}),
    client.from('writings').select('*').order('created_at',{ascending:false}),
    client.from('quotes').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false}),
    client.from('audio_poems').select('*').order('featured',{ascending:false}).order('created_at',{ascending:false}),
    client.from('site_settings').select('*').eq('id',1).maybeSingle()
  ];
  const [p,w,q,a,s]=await Promise.all(reqs);
  const missing=[q,a,s].find(r=>r.error&&String(r.error.message||'').toLowerCase().includes('does not exist'));
  if(missing){showToast('Yeni yönetim alanları için supabase-upgrade.sql dosyasını bir kez çalıştır.');}
  if(p.error||w.error){showToast('İçerikler alınamadı: '+(p.error||w.error).message);return;}
  poems=p.data||[]; writings=w.data||[]; if(!q.error)quotes=q.data||[]; if(!a.error)audioItems=a.data||[]; if(!s.error&&s.data)settings={...settings,...s.data};
  renderEverything(); fillSettings();
}

function renderEverything(){
  $('#statPoems').textContent=poems.length; $('#statPublished').textContent=poems.filter(x=>x.status==='published').length; $('#statDrafts').textContent=poems.filter(x=>x.status==='draft').length; $('#statWritings').textContent=writings.length; $('#statQuotes').textContent=quotes.length; $('#statAudio').textContent=audioItems.length;
  const recent=[...poems.map(x=>({...x,_type:'poem'})),...writings.map(x=>({...x,_type:'writing'}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,6);
  renderRows($('#recentList'),recent); filterPoems(); filterWritings(); renderQuotes(); renderAudio();
}
function renderRows(container,items){
  if(!items.length){container.innerHTML='<div class="list-empty">Henüz burada bir içerik yok.</div>';return;}
  container.innerHTML=items.map(item=>{
    const type=item._type||'poem'; const excerpt=item.excerpt||(item.body||'').replace(/\s+/g,' ').slice(0,80); return `<article class="content-row"><span class="type-mark">${type==='poem'?'✦':'≋'}</span><div class="title"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(excerpt||'Açıklama yok')}</small></div><span class="category">${escapeHtml(catLabels[item.category]||item.category||'—')}</span><span class="status ${item.status}">${item.status==='published'?'Yayında':'Taslak'}</span><time>${formatDate(item.published_at||item.created_at)}</time><button class="row-action" data-edit-type="${type}" data-edit-id="${item.id}" type="button">↗</button></article>`;
  }).join('');
  container.querySelectorAll('[data-edit-id]').forEach(btn=>btn.addEventListener('click',()=>openEditor(btn.dataset.editType,btn.dataset.editId)));
}
function filterPoems(){const q=($('#poemSearchAdmin').value||'').toLocaleLowerCase('tr-TR'),status=$('#poemStatusFilter').value;const list=poems.filter(p=>(!q||`${p.title} ${p.body}`.toLocaleLowerCase('tr-TR').includes(q))&&(status==='all'||p.status===status));renderRows($('#poemListAdmin'),list.map(x=>({...x,_type:'poem'})));}
function filterWritings(){const q=($('#writingSearchAdmin').value||'').toLocaleLowerCase('tr-TR');renderRows($('#writingListAdmin'),writings.filter(w=>!q||`${w.title} ${w.body}`.toLocaleLowerCase('tr-TR').includes(q)).map(x=>({...x,_type:'writing'})));}
function renderQuotes(){const el=$('#quoteListAdmin');if(!quotes.length){el.innerHTML='<div class="list-empty">Henüz söz eklenmedi.</div>';return;}el.innerHTML=quotes.map(q=>`<article class="content-row"><span class="type-mark">“</span><div class="title"><strong>${escapeHtml(q.text)}</strong><small>Sıra: ${q.sort_order??0}</small></div><span class="category">Günün sözü</span><span class="status ${q.status}">${q.status==='published'?'Yayında':'Taslak'}</span><time>${formatDate(q.created_at)}</time><button class="row-action" data-quote-id="${q.id}" type="button">↗</button></article>`).join('');el.querySelectorAll('[data-quote-id]').forEach(b=>b.addEventListener('click',()=>openQuote(b.dataset.quoteId)));}
function renderAudio(){const el=$('#audioListAdmin');if(!audioItems.length){el.innerHTML='<div class="list-empty">Henüz ses kaydı eklenmedi.</div>';return;}el.innerHTML=audioItems.map(a=>`<article class="content-row"><span class="type-mark">◉</span><div class="title"><strong>${escapeHtml(a.title)}</strong><small>${escapeHtml(a.subtitle||'Sesli şiir')}</small></div><span class="category">${a.featured?'Öne çıkan':'Ses arşivi'}</span><span class="status ${a.status}">${a.status==='published'?'Yayında':'Taslak'}</span><time>${formatDate(a.created_at)}</time><button class="row-action" data-audio-id="${a.id}" type="button">↗</button></article>`).join('');el.querySelectorAll('[data-audio-id]').forEach(b=>b.addEventListener('click',()=>openAudio(b.dataset.audioId)));}

function switchSection(section){activeSection=section;$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.section===section));$$('.panel-section').forEach(x=>x.classList.add('hidden'));$('#'+section+'Section').classList.remove('hidden');const titles={dashboard:['YÖNETİM','Genel Bakış'],poems:['İÇERİK','Şiirler'],writings:['İÇERİK','Yazılar'],quotes:['SÖZ HAVUZU','Sözler'],audio:['SES ARŞİVİ','Sesli Şiirler'],settings:['SİTE','Site Ayarları']};$('#pageEyebrow').textContent=titles[section][0];$('#pageTitle').textContent=titles[section][1];const btn=$('#newContentBtn');btn.classList.toggle('hidden',['quotes','audio','settings'].includes(section));if(!btn.classList.contains('hidden'))btn.textContent=section==='writings'?'+ Yeni yazı':'+ Yeni şiir';}

function resetEditor(type){$('#editorForm').reset();$('#contentId').value='';$('#contentType').value=type;$('#contentDate').value=new Date().toISOString().slice(0,10);$('#contentStatus').value='draft';$('#contentSlug').value='';delete $('#contentSlug').dataset.touched;$('#editorEyebrow').textContent='YENİ İÇERİK';$('#editorTitle').textContent=type==='poem'?'Yeni şiir':'Yeni yazı';$('#deleteContentBtn').classList.add('hidden');$('#editorMessage').textContent='';}
function openEditor(type,id=null){resetEditor(type);if(id){const item=(type==='poem'?poems:writings).find(x=>String(x.id)===String(id));if(!item)return;$('#contentId').value=item.id;$('#contentTitle').value=item.title||'';$('#contentSlug').value=item.slug||'';$('#contentExcerpt').value=item.excerpt||'';$('#contentBody').value=item.body||'';$('#contentCategory').value=item.category||'hayat';$('#contentDate').value=String(item.published_at||item.created_at||'').slice(0,10);$('#contentStatus').value=item.status||'draft';$('#contentFeatured').checked=!!item.featured;$('#editorEyebrow').textContent='İÇERİĞİ DÜZENLE';$('#editorTitle').textContent=item.title;$('#deleteContentBtn').classList.remove('hidden');}editorDialog.showModal();}
async function saveContent(e){e.preventDefault();const type=$('#contentType').value,table=type==='poem'?'poems':'writings',id=$('#contentId').value,status=$('#contentStatus').value;const title=$('#contentTitle').value.trim();let slug=$('#contentSlug').value.trim();if(!id&&!$('#contentSlug').dataset.touched){slug=(slugify(title)||'icerik')+'-'+crypto.randomUUID().slice(0,6);}else if(!slug){slug=(slugify(title)||'icerik')+'-'+crypto.randomUUID().slice(0,6);}$('#contentSlug').value=slug;const payload={title,slug,excerpt:$('#contentExcerpt').value.trim(),body:$('#contentBody').value.trim(),category:$('#contentCategory').value,status,featured:$('#contentFeatured').checked,published_at:status==='published'?($('#contentDate').value||new Date().toISOString().slice(0,10)):null,updated_at:new Date().toISOString()};$('#editorMessage').textContent='Kaydediliyor…';$('#saveContentBtn').disabled=true;let res=id?await client.from(table).update(payload).eq('id',id).select().single():await client.from(table).insert(payload).select().single();$('#saveContentBtn').disabled=false;if(res.error){$('#editorMessage').textContent=res.error.message;return;}editorDialog.close();showToast(status==='published'?'İçerik yayımlandı.':'Taslak kaydedildi.');await loadAll();}

function openQuote(id=null){$('#quoteForm').reset();$('#quoteId').value='';$('#quoteStatus').value='published';$('#quoteSort').value='0';$('#deleteQuoteBtn').classList.add('hidden');$('#quoteEditorTitle').textContent='Yeni söz';if(id){const q=quotes.find(x=>String(x.id)===String(id));if(!q)return;$('#quoteId').value=q.id;$('#quoteText').value=q.text||'';$('#quoteStatus').value=q.status||'published';$('#quoteSort').value=q.sort_order??0;$('#deleteQuoteBtn').classList.remove('hidden');$('#quoteEditorTitle').textContent='Sözü düzenle';}quoteDialog.showModal();}
async function saveQuote(e){e.preventDefault();const id=$('#quoteId').value,payload={text:$('#quoteText').value.trim(),status:$('#quoteStatus').value,sort_order:Number($('#quoteSort').value||0),updated_at:new Date().toISOString()};const res=id?await client.from('quotes').update(payload).eq('id',id):await client.from('quotes').insert(payload);if(res.error)return showToast(res.error.message);quoteDialog.close();showToast('Söz kaydedildi.');await loadAll();}

function openAudio(id=null){$('#audioForm').reset();$('#audioId').value='';$('#audioStatusInput').value='draft';$('#deleteAudioBtn').classList.add('hidden');$('#audioEditorTitle').textContent='Yeni sesli şiir';if(id){const a=audioItems.find(x=>String(x.id)===String(id));if(!a)return;$('#audioId').value=a.id;$('#audioTitleInput').value=a.title||'';$('#audioSubtitleInput').value=a.subtitle||'';$('#audioUrlInput').value=a.audio_url||'';$('#audioDurationInput').value=a.duration_label||'';$('#audioStatusInput').value=a.status||'draft';$('#audioFeaturedInput').checked=!!a.featured;$('#deleteAudioBtn').classList.remove('hidden');$('#audioEditorTitle').textContent=a.title;}audioDialog.showModal();}
async function saveAudio(e){e.preventDefault();const id=$('#audioId').value,payload={title:$('#audioTitleInput').value.trim(),subtitle:$('#audioSubtitleInput').value.trim(),audio_url:$('#audioUrlInput').value.trim(),duration_label:$('#audioDurationInput').value.trim(),status:$('#audioStatusInput').value,featured:$('#audioFeaturedInput').checked,updated_at:new Date().toISOString()};const res=id?await client.from('audio_poems').update(payload).eq('id',id):await client.from('audio_poems').insert(payload);if(res.error)return showToast(res.error.message);audioDialog.close();showToast('Ses kaydı kaydedildi.');await loadAll();}

function fillSettings(){const map={setHeroEyebrow:'hero_eyebrow',setHeroLine1:'hero_line1',setHeroEmphasis:'hero_emphasis',setHeroLine3:'hero_line3',setHeroLede:'hero_lede',setAboutLabel:'about_label',setAboutLine1:'about_line1',setAboutEmphasis:'about_emphasis',setAboutP1:'about_p1',setAboutP2:'about_p2',setAboutP3:'about_p3',setEmail:'email',setInstagram:'instagram'};Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.value=settings[key]||'';});}
async function saveSettings(e){e.preventDefault();const payload={id:1,hero_eyebrow:$('#setHeroEyebrow').value.trim(),hero_line1:$('#setHeroLine1').value.trim(),hero_emphasis:$('#setHeroEmphasis').value.trim(),hero_line3:$('#setHeroLine3').value.trim(),hero_lede:$('#setHeroLede').value.trim(),about_label:$('#setAboutLabel').value.trim(),about_line1:$('#setAboutLine1').value.trim(),about_emphasis:$('#setAboutEmphasis').value.trim(),about_p1:$('#setAboutP1').value.trim(),about_p2:$('#setAboutP2').value.trim(),about_p3:$('#setAboutP3').value.trim(),email:$('#setEmail').value.trim(),instagram:$('#setInstagram').value.trim(),updated_at:new Date().toISOString()};$('#settingsMessage').textContent='Kaydediliyor…';const {error}=await client.from('site_settings').upsert(payload,{onConflict:'id'});$('#settingsMessage').textContent=error?error.message:'Kaydedildi ✓';if(!error){settings={...settings,...payload};showToast('Site ayarları güncellendi.');}}

function askDelete(type,id){deleteTarget={type,id};confirmDialog.showModal();}
async function confirmDelete(){if(!deleteTarget)return;const tableMap={poem:'poems',writing:'writings',quote:'quotes',audio:'audio_poems'};const {error}=await client.from(tableMap[deleteTarget.type]).delete().eq('id',deleteTarget.id);if(error)return showToast(error.message);confirmDialog.close();editorDialog.close();quoteDialog.close();audioDialog.close();deleteTarget=null;showToast('Silindi.');await loadAll();}

$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();$('#loginMessage').textContent='Giriş yapılıyor…';const {error}=await client.auth.signInWithPassword({email:$('#loginEmail').value.trim(),password:$('#loginPassword').value});$('#loginMessage').textContent=error?(error.message||'Giriş yapılamadı.'):'';});
$('#forgotPasswordBtn').addEventListener('click',async()=>{const email=$('#loginEmail').value.trim();if(!email){$('#loginMessage').textContent='Önce e-posta adresini yaz.';return;}const redirectTo=`${location.origin}${location.pathname}?recovery=1`;const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});$('#loginMessage').textContent=error?`Bağlantı gönderilemedi: ${error.message}`:'Şifre yenileme bağlantısı e-postana gönderildi.';});
$('#recoveryForm').addEventListener('submit',async e=>{e.preventDefault();const p=$('#newPassword').value,a=$('#newPasswordAgain').value;if(p.length<8){$('#recoveryMessage').textContent='Şifre en az 8 karakter olmalı.';return;}if(p!==a){$('#recoveryMessage').textContent='Şifreler aynı değil.';return;}const {error}=await client.auth.updateUser({password:p});if(error){$('#recoveryMessage').textContent=error.message;return;}history.replaceState({},'',location.pathname);setVisible(adminView);await loadAll();showToast('Şifren güncellendi.');});
$('#logoutBtn').addEventListener('click',()=>client.auth.signOut());
$$('.nav-item').forEach(b=>b.addEventListener('click',()=>switchSection(b.dataset.section)));
$('#newContentBtn').addEventListener('click',()=>openEditor(activeSection==='writings'?'writing':'poem'));
$('#poemSearchAdmin').addEventListener('input',filterPoems);$('#poemStatusFilter').addEventListener('change',filterPoems);$('#writingSearchAdmin').addEventListener('input',filterWritings);
$('#editorForm').addEventListener('submit',saveContent);$('#closeEditor').addEventListener('click',()=>editorDialog.close());$('#cancelEditor').addEventListener('click',()=>editorDialog.close());$('#deleteContentBtn').addEventListener('click',()=>askDelete($('#contentType').value,$('#contentId').value));
$('#contentTitle').addEventListener('input',()=>{if(!$('#contentId').value&&!$('#contentSlug').dataset.touched)$('#contentSlug').value=slugify($('#contentTitle').value);});$('#contentSlug').addEventListener('input',()=>$('#contentSlug').dataset.touched='1');
$('#newQuoteBtn').addEventListener('click',()=>openQuote());$('#quoteForm').addEventListener('submit',saveQuote);$('#closeQuoteEditor').addEventListener('click',()=>quoteDialog.close());$('#cancelQuote').addEventListener('click',()=>quoteDialog.close());$('#deleteQuoteBtn').addEventListener('click',()=>askDelete('quote',$('#quoteId').value));
$('#newAudioBtn').addEventListener('click',()=>openAudio());$('#audioForm').addEventListener('submit',saveAudio);$('#closeAudioEditor').addEventListener('click',()=>audioDialog.close());$('#cancelAudio').addEventListener('click',()=>audioDialog.close());$('#deleteAudioBtn').addEventListener('click',()=>askDelete('audio',$('#audioId').value));
$('#settingsForm').addEventListener('submit',saveSettings);$('#confirmCancel').addEventListener('click',()=>confirmDialog.close());$('#confirmDelete').addEventListener('click',confirmDelete);

init();

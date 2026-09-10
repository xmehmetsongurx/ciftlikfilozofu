const F = window.CF_FALLBACK || {settings:{},quotes:[],poems:[],writings:[],audio:[]};
let settings={...(F.settings||{})}, quotes=[...(F.quotes||[])], poems=[...(F.poems||[])], writings=[...(F.writings||[])], audio=[...(F.audio||[])];
let client=null;
const $=(s,r=document)=>r.querySelector(s);
const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const label=(v='')=>({gece:'Gece',hayat:'Hayat',insan:'İnsan',hatira:'Hatıra',yalnizlik:'Yalnızlık',cocukluk:'Çocukluk','eski-zamanlar':'Eski Zamanlar'}[v]||v||'Şiir');
const dateLabel=v=>{if(!v)return'';const d=new Date(String(v).slice(0,10)+'T12:00:00');return isNaN(d)?v:new Intl.DateTimeFormat('tr-TR',{month:'long',year:'numeric'}).format(d)};
const poemUrl=p=>`/siir/${encodeURIComponent(p.slug||p.id)}`;
const writingUrl=w=>`/yazi/${encodeURIComponent(w.slug||w.id)}`;

async function load(){
  if(!window.CF_SUPABASE?.url||!window.CF_SUPABASE?.key||!window.supabase?.createClient)return;
  try{
    client=window.supabase.createClient(window.CF_SUPABASE.url,window.CF_SUPABASE.key);
    const [pr,wr,qr,sr,ar]=await Promise.all([
      client.from('poems').select('*').eq('status','published').order('featured',{ascending:false}).order('published_at',{ascending:false,nullsFirst:false}),
      client.from('writings').select('*').eq('status','published').order('featured',{ascending:false}).order('published_at',{ascending:false,nullsFirst:false}),
      client.from('quotes').select('*').eq('status','published').order('sort_order',{ascending:true}).order('created_at',{ascending:false}),
      client.from('site_settings').select('*').eq('id',1).maybeSingle(),
      client.from('audio_poems').select('*').eq('status','published').order('featured',{ascending:false}).order('created_at',{ascending:false})
    ]);
    if(!pr.error) poems = pr.data || [];
    if(!wr.error) writings = wr.data || [];
    if(!qr.error) quotes = qr.data || [];
    if(!sr.error&&sr.data)settings={...settings,...sr.data};
    if(!ar.error) audio = ar.data || [];
  }catch(e){console.warn('Supabase yüklenemedi, yedek içerik gösteriliyor.',e)}
}

function setText(id,value){const el=$(id);if(el&&value)el.textContent=value}
function applySettings(){
  setText('#heroEyebrow',settings.hero_eyebrow);
  setText('#heroLine1',settings.hero_line1);
  setText('#heroEmphasis',settings.hero_emphasis);
  setText('#heroLine3',settings.hero_line3);
  setText('#heroLede',settings.hero_lede);
  setText('#aboutLabel',settings.about_label);
  if($('#aboutLine1')&&settings.about_line1) $('#aboutLine1').innerHTML=esc(settings.about_line1).replace(/\n/g,'<br>');
  if($('#aboutEmphasis')&&settings.about_emphasis) $('#aboutEmphasis').innerHTML=esc(settings.about_emphasis).replace(/\n/g,'<br>');
  setText('#aboutP1',settings.about_p1); setText('#aboutP2',settings.about_p2); setText('#aboutP3',settings.about_p3);
  if(settings.email) $('#emailLink').href=`mailto:${settings.email}`;
  if(settings.instagram) $('#instagramLink').href=settings.instagram;
}

function renderPoems(){
  const grid=$('#poemGrid');
  if(!poems.length){grid.innerHTML='<div class="empty-state">Henüz yayımlanmış bir şiir yok.</div>';return}
  grid.innerHTML=poems.slice(0,8).map((p,i)=>`
    <article class="poem reveal">
      <div class="poem-meta"><span>${esc(label(p.category))}</span><span>${esc(dateLabel(p.published_at||p.created_at))}</span></div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.excerpt||String(p.body||'').replace(/\s+/g,' ').slice(0,150)+'…')}</p>
      <a class="poem-open btn" href="${poemUrl(p)}">Oku</a>
      <span class="index">${String(i+1).padStart(2,'0')}</span>
    </article>`).join('');
}

function renderWritings(){
  const el=$('#writingList');
  if(!writings.length){el.innerHTML='<div class="empty-state">Henüz yayımlanmış bir yazı yok.</div>';return}
  el.innerHTML=writings.slice(0,6).map((w,i)=>`
    <a class="writing-row reveal" href="${writingUrl(w)}">
      <span class="num">${String(i+1).padStart(2,'0')}</span>
      <h3>${esc(w.title)}</h3>
      <p>${esc(w.excerpt||String(w.body||'').replace(/\s+/g,' ').slice(0,180)+'…')}</p>
      <span class="arrow">↗</span>
    </a>`).join('');
}

function setQuote(q){
  if(!q)return;
  $('#quoteText').textContent=`“${q.text||q}”`;
}
function dailyQuote(){
  if(!quotes.length)return;
  const k=new Date().toISOString().slice(0,10).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  setQuote(quotes[k%quotes.length]);
}
function randomQuote(){
  if(!quotes.length)return;
  setQuote(quotes[Math.floor(Math.random()*quotes.length)]);
}
function setupAudio(){
  const item=audio.find(x=>x.featured)||audio[0];
  if(!item)return;
  setText('#audioTitle',item.title||'Sesli Şiir');
  setText('#audioSubtitle',item.subtitle||'Çiftlik Filozofu · Sesli Şiir');
  setText('#audioDuration',item.duration_label||'00:00');
  const a=$('#audioElement');
  if(!item.audio_url){$('#audioEmpty').hidden=false;return}
  a.src=item.audio_url;
  a.addEventListener('loadedmetadata',()=>{if(isFinite(a.duration))setText('#audioDuration',time(a.duration))});
  a.addEventListener('timeupdate',()=>{
    setText('#audioCurrent',time(a.currentTime));
    $('#progressBar').style.width=(a.duration?(a.currentTime/a.duration)*100:0)+'%';
  });
  a.addEventListener('ended',()=>$('#playBtn').textContent='▶');
}
function time(s=0){s=Math.max(0,Math.floor(s));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}

function interactions(){
  $('#newQuote')?.addEventListener('click',randomQuote);
  $('#randomPoem')?.addEventListener('click',()=>{
    if(!poems.length)return;
    location.href=poemUrl(poems[Math.floor(Math.random()*poems.length)]);
  });
  $('#playBtn')?.addEventListener('click',async()=>{
    const a=$('#audioElement'); if(!a?.src)return;
    if(a.paused){try{await a.play();$('#playBtn').textContent='❚❚'}catch{}}
    else{a.pause();$('#playBtn').textContent='▶'}
  });
  $('#menuBtn')?.addEventListener('click',()=>$('#mobileNav').classList.toggle('open'));
  document.querySelectorAll('#mobileNav a').forEach(a=>a.addEventListener('click',()=>$('#mobileNav').classList.remove('open')));
  $('#sendMessage')?.addEventListener('click',()=>{
    const text=$('#messageText').value.trim();
    const mail=settings.email||'';
    if(!mail)return;
    location.href=`mailto:${mail}?subject=${encodeURIComponent('Çiftlik Filozofu sitesinden mesaj')}&body=${encodeURIComponent(text)}`;
  });
}

function reveal(){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}
(async()=>{await load();applySettings();renderPoems();renderWritings();dailyQuote();setupAudio();interactions();requestAnimationFrame(reveal)})();

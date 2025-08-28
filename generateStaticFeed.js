// generateStaticFeed.js — CommonJS, sortie dans public/index.html
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_KEY   = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';
const OUT_DIR   = path.join(process.cwd(), 'public');
const OUT_FILE  = path.join(OUT_DIR, 'index.html');

if (!API_KEY) {
  console.error('❌ EMBEDSOCIAL_API_KEY manquante. Ajoute-la dans Vercel > Settings > Environment Variables.');
  process.exit(1);
}

function cardHtml(p, i) {
  const videoSrc = p?.video?.source || '';
  const imageSrc = p?.image || p?.thumbnail || '';
  const deferred = i >= 5 ? ' deferred' : '';

  const media = videoSrc
    ? (i >= 5
        ? `<div class="video-wrapper">
             <video data-src="${videoSrc}" autoplay muted loop playsinline preload="none"></video>
             <button class="sound-btn" title="Ouvrir le calendrier"></button>
           </div>`
        : `<div class="video-wrapper">
             <video src="${videoSrc}" autoplay muted loop playsinline preload="auto"></video>
             <button class="sound-btn" title="Ouvrir le calendrier"></button>
           </div>`)
    : `<img src="${imageSrc}" alt="post" style="width:100%;display:block">`;

  return `
    <div class="card${deferred}">
      ${media}
      <div class="info">
        <div class="emoji">🥳</div>
        <div class="date">In 2025 ! 🌍</div>
        <div class="tag">
          <a href="https://www.theushuaiaexperience.com/en/club/calendar"
             target="_blank" rel="noopener noreferrer">🥳➡️</a>
        </div>
      </div>
    </div>`;
}

async function generate() {
  try {
    console.log('📱 Appel EmbedSocial…');
    const res = await axios.get(
      `https://embedsocial.com/admin/v2/api/social-feed/hashtag-album/media?album_ref=${ALBUM_REF}`,
      { headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' }, timeout: 20000 }
    );

    const posts = Array.isArray(res.data?.data) ? res.data.data : [];
    console.log(`✅ ${posts.length} posts récupérés`);

    const cardsHtml = posts.map(cardHtml).join('\n');

    let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Flux vidéos</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="referrer" content="no-referrer" />
  <style>
    html,body{margin:0;padding:0;background:#fff;font-family:sans-serif}
    .grid{display:flex;flex-direction:column;gap:14px;padding:10px;box-sizing:border-box}
    .card{width:100%;max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.1)}
    .video-wrapper{position:relative}
    video{width:100%;display:block;opacity:0;transition:opacity .8s ease-in-out}
    video.loaded{opacity:1}
    .sound-btn{position:absolute;bottom:10px;right:6px;width:26px;height:26px;background:rgba(0,0,0,.6);border:none;border-radius:50%;cursor:pointer;
      background-image:url('data:image/svg+xml;charset=UTF-8,<svg fill="white" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 5V4L5 9H4zm14.5 12.1L3.9 4.5 2.5 5.9 18.1 21.5l.4.4 1.4-1.4-.4-.4z"/></svg>');
      background-repeat:no-repeat;background-position:center;background-size:60%}
    .info{padding:6px 10px 10px;text-align:center}
    .emoji{font-size:24px}
    .date{font-size:15px;color:#444;font-weight:bold}
    .tag{margin-top:6px;display:inline-block}
    .tag a{color:inherit;text-decoration:none;display:inline-block;background:yellow;font-weight:bold;padding:6px;border-radius:6px}
    .card.deferred{display:none}
    #feed-sentinel{height:1px}
    /* Ceinture + bretelles : remplace visuellement toute date restante */
    .date{font-size:0!important}
    .date::after{content:"In 2025 ! 🌍";font-size:15px;color:#444;font-weight:bold}
  </style>
</head>
<body>
  <div class="grid">
    ${cardsHtml}
  </div>
  <div id="feed-sentinel"></div>

  <script>
  document.addEventListener('DOMContentLoaded',function(){
    const CAL_URL='https://www.theushuaiaexperience.com/en/club/calendar';
    const BATCH=5;
    const cards=[...document.querySelectorAll('.card')];
    const videos=[...document.querySelectorAll('video')];

    // Forcer le libellé (si un script externe modifie .date)
    const LABEL='In 2025 ! 🌍';
    const applyDates=()=>document.querySelectorAll('.date').forEach(el=>{ if(el.textContent!==LABEL) el.textContent=LABEL; });
    applyDates();
    new MutationObserver(applyDates).observe(document.body,{subtree:true,childList:true,characterData:true});

    // Lazy: data-src -> src à l’affichage
    videos.forEach(v=>{ if(v.src){v.dataset.src=v.src;v.removeAttribute('src')} v.preload='none';v.muted=true;v.playsInline=true;v.load(); });
    cards.forEach((c,i)=>{ if(i>=BATCH) c.classList.add('deferred'); });

    function activateVideo(v){ if(!v||v.src) return; if(v.dataset.src) v.src=v.dataset.src; v.addEventListener('loadeddata',()=>v.classList.add('loaded'),{once:true}); v.load(); }
    const playObserver=new IntersectionObserver((entries)=>{ entries.forEach(({target,isIntersecting})=>{ if(isIntersecting){activateVideo(target);target.play().catch(()=>{})} else target.pause(); }); },{threshold:.25});

    let nextIndex=BATCH;
    function loadNextBatch(){
      const start=nextIndex,end=Math.min(start+BATCH,cards.length);
      for(let i=start;i<end;i++){
        const card=cards[i];
        const vid=card.querySelector('video');
        const d=card.querySelector('.date'); if(d) d.textContent=LABEL;
        card.classList.remove('deferred');
        activateVideo(vid);
        playObserver.observe(vid);
      }
      nextIndex=end; if(nextIndex>=cards.length) io.disconnect();
    }

    const sentinel=document.getElementById('feed-sentinel');
    const io=new IntersectionObserver((entries)=>{ entries.forEach(e=>{ if(e.isIntersecting) loadNextBatch(); }); },{root:null,rootMargin:'400px 0'});
    io.observe(sentinel);

    // activer les 5 premières
    videos.slice(0,BATCH).forEach(v=>{ activateVideo(v); playObserver.observe(v); });

    // clic calendrier
    function openCalendar(){ const w=window.open(CAL_URL,'_blank'); if(!w){ try{ parent.postMessage({type:'openExternal',url:CAL_URL},'*'); }catch(e){} } }
    const btns=document.querySelectorAll('.sound-btn');
    videos.forEach((video,i)=>{ video.addEventListener('click',openCalendar); if(btns[i]) btns[i].addEventListener('click',(e)=>{ e.stopPropagation(); openCalendar(); }); });

    // liens externes
    document.querySelectorAll('.tag a').forEach(a=>{
      a.addEventListener('click',(e)=>{ const w=window.open(a.href,'_blank'); if(!w){ e.preventDefault(); try{ parent.postMessage({type:'openExternal',url:a.href},'*'); }catch(e){} } });
    });
  });
  </script>
</body>
</html>`;

    // Écrit le fichier final (dossier public)
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, html);
    console.log(`✅ ${OUT_FILE} écrit`);
  } catch (err) {
    const msg = err?.response?.data || err?.message || err;
    console.error('❌ Build failed:', typeof msg === 'object' ? JSON.stringify(msg) : msg);
    process.exit(1);
  }
}

generate();


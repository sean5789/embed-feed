cat > generateStaticFeed.js <<'EOF'
// generateStaticFeed.js (CommonJS)
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY   = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';

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

async function generateStaticFeed() {
  try {
    console.log('📱 Connexion à l’API EmbedSocial...');
    const res = await axios.get(
      `https://embedsocial.com/admin/v2/api/social-feed/hashtag-album/media?album_ref=${ALBUM_REF}`,
      { headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' } }
    );

    const posts = Array.isArray(res.data?.data) ? res.data.data : [];
    console.log(`✅ ${posts.length} posts récupérés`);

    const cardsHtml = posts.map(cardHtml).join('\n');

    // Page HTML finale
    let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Flux EmbedSocial</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="no-referrer">
  <style>
    html, body { margin:0; padding:0; background:#fff; font-family:sans-serif; }
    .grid { display:flex; flex-direction:column; gap:14px; padding:10px; box-sizing:border-box; }
    .card { width:100%; max-width:500px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1); }
    .video-wrapper { position:relative; }
    video { width:100%; display:block; opacity:0; transition:opacity .8s ease-in-out; }
    video.loaded { opacity:1; }
    .sound-btn { position:absolute; bottom:10px; right:6px; width:26px; height:26px; background:rgba(0,0,0,.6); border:none; border-radius:50%; cursor:pointer;
      background-image:url('data:image/svg+xml;charset=UTF-8,<svg fill="white" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 5V4L5 9H4zm14.5 12.1L3.9 4.5 2.5 5.9 18.1 21.5l.4.4 1.4-1.4-.4-.4z"/></svg>');
      background-repeat:no-repeat; background-position:center; background-size:60%; }
    .info { padding:6px 10px 10px; text-align:center; }
    .emoji { font-size:24px; }
    .date { font-size:15px; color:#444; font-weight:bold; }
    .tag { margin-top:6px; display:inline-block; }
    .tag a { color:inherit; text-decoration:none; display:inline-block; background:yellow; font-weight:bold; padding:6px; border-radius:6px; }
    .card.deferred { display:none }
    #feed-sentinel { height:1px }
  </style>
</head>
<body>
  <div class="grid">
    ${cardsHtml}
  </div>
  <div id="feed-sentinel"></div>

  <script>
  document.addEventListener('DOMContentLoaded', function () {
    const CAL_URL = 'https://www.theushuaiaexperience.com/en/club/calendar';
    const BATCH = 5;
    const cards  = Array.from(document.querySelectorAll('.card'));
    const videos = Array.from(document.querySelectorAll('video'));

    // Forcer l'étiquette fixe
    const DATE_LABEL = 'In 2025 ! 🌍';
    document.querySelectorAll('.date').forEach(el => el.textContent = DATE_LABEL);

    // lazy src -> data-src
    videos.forEach(v => {
      if (v.src) { v.dataset.src = v.src; v.removeAttribute('src'); }
      v.preload = 'none'; v.muted = true; v.playsInline = true; v.load();
    });

    // cacher >= 5
    cards.forEach((c,i)=>{ if(i>=BATCH) c.classList.add('deferred'); });

    function activateVideo(v){
      if (!v || v.src) return;
      if (v.dataset.src) v.src = v.dataset.src;
      v.addEventListener('loadeddata', ()=> v.classList.add('loaded'), {once:true});
      v.load();
    }

    const playObserver = new IntersectionObserver((entries)=>{
      entries.forEach(({target,isIntersecting})=>{
        if (isIntersecting) { activateVideo(target); target.play().catch(()=>{}); }
        else target.pause();
      });
    },{ threshold:0.25 });

    let nextIndex = BATCH;
    function loadNextBatch(){
      const start = nextIndex;
      const end = Math.min(start+BATCH, cards.length);
      for (let i=start; i<end; i++){
        const card = cards[i];
        const vid  = card.querySelector('video');
        const dateEl = card.querySelector('.date');
        if (dateEl) dateEl.textContent = DATE_LABEL;
        card.classList.remove('deferred');
        activateVideo(vid);
        playObserver.observe(vid);
      }
      nextIndex = end;
      if (nextIndex>=cards.length) io.disconnect();
    }

    const sentinel = document.getElementById('feed-sentinel');
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting) loadNextBatch(); });
    },{ root:null, rootMargin:'400px 0px' });
    io.observe(sentinel);

    videos.slice(0,BATCH).forEach(v=>{ activateVideo(v); playObserver.observe(v); });

    function openCalendar() {
      const w = window.open(CAL_URL,'_blank');
      if (!w) { try { parent.postMessage({type:'openExternal', url: CAL_URL}, '*'); } catch{} }
    }
    const buttons = document.querySelectorAll('.sound-btn');
    videos.forEach((video,i)=>{
      video.addEventListener('click', openCalendar);
      if (buttons[i]) {
        buttons[i].addEventListener('click', (e)=>{ e.stopPropagation(); openCalendar(); });
      }
    });

    document.querySelectorAll('.tag a').forEach(a=>{
      a.addEventListener('click',(e)=>{
        const w = window.open(a.href,'_blank');
        if (!w) { e.preventDefault(); try { parent.postMessage({type:'openExternal', url:a.href}, '*'); } catch{} }
      });
    });
  });
  </script>
</body>
</html>`;

    // Sécurité: remplace toute balise .date par le libellé voulu
    html = html.replace(/<div class="date">[\s\S]*?<\/div>/g, '<div class="date">In 2025 ! 🌍</div>');

    fs.writeFileSync('index.html', html);
    console.log('✅ index.html généré avec succès.');
  } catch (e) {
    console.error('❌ Erreur :', e.message);
  }
}

generateStaticFeed();
EOF

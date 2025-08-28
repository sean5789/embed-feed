// generateStaticFeed.js
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';

async function generateStaticFeed() {
  try {
    console.log('📱 Connexion à l’API EmbedSocial...');
    const res = await axios.get(
      `https://embedsocial.com/admin/v2/api/social-feed/hashtag-album/media?album_ref=${ALBUM_REF}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: 'application/json',
        },
      }
    );

    const posts = res.data?.data || [];
    if (!Array.isArray(posts)) {
      console.error('❌ Format inattendu');
      return;
    }

    console.log(`✅ ${posts.length} posts récupérés`);

    // Génération des cartes
    const cardsHtml = posts
      .map((p, i) => {
        const isDeferred = i >= 5;
        const cls = isDeferred ? 'card deferred' : 'card';

        const videoSrc = p?.video?.source || '';
        const imageSrc = p?.image || p?.thumbnail || '';

        const media = videoSrc
          ? (isDeferred
              ? `<div class="video-wrapper">
                   <video data-src="${videoSrc}" autoplay muted loop playsinline preload="none"></video>
                   <button class="sound-btn"></button>
                 </div>`
              : `<div class="video-wrapper">
                   <video src="${videoSrc}" autoplay muted loop playsinline preload="auto"></video>
                   <button class="sound-btn"></button>
                 </div>`)
          : `<img src="${imageSrc}" alt="post" style="width:100%;display:block">`;

        return `
        <div class="${cls}">
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
      })
      .join('\n');

    // Gabarit HTML complet
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Flux EmbedSocial</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="no-referrer">
  <style>
    html, body { margin:0; padding:0; background:#fff; font-family:sans-serif; }
    .grid { display:flex; flex-direction:row; gap:14px; padding:10px; overflow-x:auto; }
    .card { flex:0 0 auto; width:280px; background:#fff; border-radius:16px;
            box-shadow:0 2px 6px rgba(0,0,0,0.1); overflow:hidden; }
    .video-wrapper { position:relative; }
    video { width:100%; display:block; opacity:0; transition:opacity 0.8s ease-in-out; }
    video.loaded { opacity:1; }
    .sound-btn { position:absolute; bottom:10px; right:6px; width:26px; height:26px;
                 background:rgba(0,0,0,0.6); border:none; border-radius:50%; cursor:pointer; }
    .info { padding:6px 10px 10px; text-align:center; }
    .emoji { font-size:24px; }
    .date { font-size:15px; color:#444; font-weight:bold; }
    .tag { margin-top:6px; display:inline-block; }
    .tag a { color:inherit; text-decoration:none; background:yellow; padding:6px;
             font-weight:bold; border-radius:6px; }
    .card.deferred { display:none; }
    #feed-sentinel { height:1px; }
  </style>
</head>
<body>
  <div class="grid">
    ${cardsHtml}
  </div>
  <div id="feed-sentinel"></div>

  <script>
  document.addEventListener("DOMContentLoaded", function () {
    const CAL_URL = "https://www.theushuaiaexperience.com/en/club/calendar";
    const BATCH = 5;
    const cards  = Array.from(document.querySelectorAll(".card"));
    const videos = Array.from(document.querySelectorAll("video"));

    function activateVideo(v) {
      if (!v) return;
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      v.addEventListener("loadeddata", () => v.classList.add("loaded"), { once:true });
      v.load();
    }

    const playObserver = new IntersectionObserver((entries)=>{
      entries.forEach(({target,isIntersecting})=>{
        if (isIntersecting) { activateVideo(target); target.play().catch(()=>{}); }
        else target.pause();
      });
    },{ threshold:0.25 });

    videos.slice(0,BATCH).forEach(v=>{ activateVideo(v); playObserver.observe(v); });

    let nextIndex = BATCH;
    function loadNextBatch(){
      const start = nextIndex;
      const end = Math.min(start+BATCH, cards.length);
      for (let i=start;i<end;i++){
        const card = cards[i];
        const vid = card.querySelector("video");
        card.classList.remove("deferred");
        activateVideo(vid);
        playObserver.observe(vid);
      }
      nextIndex = end;
      if (nextIndex>=cards.length) io.disconnect();
    }

    const sentinel = document.getElementById("feed-sentinel");
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting) loadNextBatch(); });
    },{ root:null, rootMargin:"400px 0px" });
    io.observe(sentinel);

    function openCalendar() {
      const w = window.open(CAL_URL,"_blank");
      if (!w) { try { parent.postMessage({type:"openExternal",url:CAL_URL},"*"); } catch{} }
    }
    document.querySelectorAll(".sound-btn").forEach(btn=>{
      btn.addEventListener("click", (e)=>{ e.stopPropagation(); openCalendar(); });
    });
    videos.forEach(v=>v.addEventListener("click", openCalendar));
  });
  </script>
</body>
</html>`;

    fs.writeFileSync('index.html', html);
    console.log('✅ index.html généré avec succès.');
  } catch (error) {
    console.error('❌ Erreur :', error.message);
  }
}

generateStaticFeed();

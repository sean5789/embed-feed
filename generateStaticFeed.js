// generate-feed.js
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';

async function generateStaticFeed() {
  try {
    if (!API_KEY) throw new Error('EMBEDSOCIAL_API_KEY manquant.');

    const url = `https://embedsocial.com/admin/v2/api/social-feed/hashtag-album/media?album_ref=${encodeURIComponent(ALBUM_REF)}`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      timeout: 20000,
    });

    const posts = Array.isArray(res?.data?.data) ? res.data.data : [];
    console.log(`✅ ${posts.length} posts récupérés`);

    const postsForClient = posts.map(p => ({
      video: p?.video?.source || null,
      image: p.image || p.thumbnail || '',
    }));

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Flux EmbedSocial</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin:0; padding:0; font-family:sans-serif; background:#fff; }
    .grid { display:flex; flex-wrap:wrap; gap:14px; padding:10px; justify-content:center; }
    .card {
      width:165px; background:#fff; border-radius:16px;
      overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);
    }
    video, img { width:100%; display:block; object-fit:cover; }
    video { opacity:0; transition:opacity .4s ease-in-out; }
    video.loaded { opacity:1; }
    .sound-btn {
      position:absolute; bottom:10px; right:6px; width:26px; height:26px;
      background:rgba(0,0,0,.6); border:none; border-radius:50%; cursor:pointer;
      background-image:url('data:image/svg+xml;charset=UTF-8,<svg fill="white" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 5V4L5 9H4zm14.5 12.1L3.9 4.5 2.5 5.9 18.1 21.5l.4.4 1.4-1.4-.4-.4z"/></svg>');
      background-repeat:no-repeat; background-position:center; background-size:60%;
    }
    .info { padding:6px 10px 10px; text-align:center; }
    .emoji { font-size:20px; }
    .tag a {
      display:inline-block; padding:6px 10px; background:yellow;
      font-weight:bold; border-radius:6px; text-decoration:none; color:#000;
    }
    #load-more {
      margin: 20px auto; display: block; padding: 10px 20px;
      background: #111; color: #fff; border: none; border-radius: 8px;
      font-weight: bold; cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="grid" id="feed"></div>
  <button id="load-more">+ Afficher plus</button>

  <script>
    const posts = ${JSON.stringify(postsForClient)};
    const FEED = document.getElementById('feed');
    const btn = document.getElementById('load-more');
    const BATCH = 5;
    let index = 0;

    const CAL_URL = "https://www.theushuaiaexperience.com/en/club/calendar";

    function createCard(p) {
      const video = p.video ? \`
        <div class="video-wrapper">
          <video muted loop playsinline preload="none" data-src="\${p.video}"></video>
          <button class="sound-btn" title="Ouvrir le calendrier"></button>
        </div>\` : \`
        <div class="video-wrapper">
          <img src="\${p.image}" alt="post" loading="lazy" />
        </div>\`;

      return \`
        <div class="card">
          \${video}
          <div class="info">
            <div class="emoji">🎉</div>
            <div class="tag"><a href="\${CAL_URL}" target="_blank">Voir +</a></div>
          </div>
        </div>\`;
    }

    function loadNext() {
      const next = posts.slice(index, index + BATCH);
      next.forEach(p => FEED.insertAdjacentHTML("beforeend", createCard(p)));
      index += BATCH;
      if (index >= posts.length) btn.style.display = "none";
      wireUp();
    }

    function wireUp() {
      const videos = FEED.querySelectorAll("video[data-src]:not([data-ready])");
      videos.forEach(v => {
        v.dataset.ready = "true";
        v.src = v.dataset.src;
        v.load();
        v.addEventListener("loadeddata", () => v.classList.add("loaded"), { once: true });
        v.addEventListener("click", () => window.open(CAL_URL, "_blank"));
      });

      const buttons = FEED.querySelectorAll(".sound-btn:not([data-wired])");
      buttons.forEach(btn => {
        btn.dataset.wired = "true";
        btn.addEventListener("click", e => {
          e.stopPropagation();
          window.open(CAL_URL, "_blank");
        });
      });
    }

    btn.addEventListener("click", loadNext);
    loadNext(); // charge les 5 premiers
  </script>
</body>
</html>`;

    fs.writeFileSync('index.html', html, 'utf8');
    console.log('✅ index.html généré avec le bouton "Afficher plus".');
  } catch (err) {
    console.error('❌ Erreur :', err?.response?.data || err.message);
  }
}

generateStaticFeed();


require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';
const CAL_URL = "https://www.theushuaiaexperience.com/en/club/calendar";
const OUTPUT_FILE = 'index.html';
const BATCH_SIZE = 5;

async function generateStaticFeed() {
  try {
    if (!API_KEY) throw new Error('❌ EMBEDSOCIAL_API_KEY est manquant.');

    const url = `https://embedsocial.com/admin/v2/api/social-feed/hashtag-album/media?album_ref=${ALBUM_REF}`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' },
      timeout: 20000,
    });

    const posts = Array.isArray(res?.data?.data) ? res.data.data : [];

    const postsForClient = posts.map(p => ({
      video: p?.video?.source || null,
      image: p.image || p.thumbnail || '',
    }));

    const firstBatch = postsForClient.slice(0, BATCH_SIZE).map(post => `
      <div class="card">
        <div class="video-wrapper">
          ${
            post.video
              ? `<video
                   src="${post.video}"
                   autoplay
                   muted
                   loop
                   playsinline
                   webkit-playsinline
                   preload="metadata"
                   disablepictureinpicture
                 ></video>
                 <button class="sound-btn"></button>`
              : `<img src="${post.image}" loading="lazy" />`
          }
        </div>
        <div class="info"></div>
      </div>
    `).join("");

    const postsJSON = JSON.stringify(postsForClient.slice(BATCH_SIZE));

    const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
html, body { margin:0; height:100%; overflow:hidden; }

video {
  transform: translateZ(0);
  will-change: transform;
}

#track {
  display:flex;
  gap:14px;
  transition: transform .3s;
}

.card {
  width: calc((100vh) * 9 / 16);
  height: 100vh;
}

video, img {
  width:100%;
  height:100%;
  object-fit:cover;
}
</style>
</head>

<body>

<div id="track">
${firstBatch}
</div>

<script>

const remainingPosts = ${postsJSON};

function tryPlay(v){
  v.play().catch(()=>{});
}

// 🔥 AUTOPLAY LIMITÉ
requestAnimationFrame(() => {
  const videos = document.querySelectorAll('video');
  videos.forEach((v, i) => {
    if (i <= 1) tryPlay(v);
  });
});

// 🔥 WATCHDOG OPTIMISÉ
function watchdogTick(){
  document.querySelectorAll('video').forEach(v=>{
    if(v.paused) tryPlay(v);
  });
}

setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  watchdogTick();
}, 1500);

</script>

</body>
</html>`;

    fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
    console.log('✅ index.html généré');

  } catch (err) {
    console.error(err);
  }
}

generateStaticFeed();
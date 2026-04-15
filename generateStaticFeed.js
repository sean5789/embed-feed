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

    console.log('📡 Connexion à l’API EmbedSocial...');
    const url = `https://embedsocial.com/admin/v2/api/social-feed/hashtag-album/media?album_ref=${ALBUM_REF}`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' },
      timeout: 20000,
    });

    const posts = Array.isArray(res?.data?.data) ? res.data.data : [];
    console.log(`✅ ${posts.length} posts récupérés`);

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
                   preload="auto"
                   disablepictureinpicture
                 ></video>
                 <button class="sound-btn" title="Ouvrir le calendrier"></button>`
              : `<img src="${post.image}" alt="post" loading="lazy" />`
          }
        </div>
        <div class="info"></div>
      </div>
    `).join("\n");

    const postsJSON = JSON.stringify(postsForClient.slice(BATCH_SIZE));

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Flux EmbedSocial</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<style>
html, body {
  margin:0;
  padding:0;
  height:100%;
  background:#fff;
  font-family:sans-serif;
  overflow:hidden;
}

#viewport {
  width:100%;
  height:100vh;
  overflow:hidden;
}

#stage {
  transform-origin: top left;
  will-change: transform;
  transform: scale(0.75);
}

#track {
  display:flex;
  gap:18px;
  width:max-content;
  transform:translate3d(0,0,0);
}

/* 🔥 PLUS GROS DIRECT */
.card {
  flex:0 0 auto;
  width:260px;
  height:472px;
  border-radius:16px;
  overflow:hidden;
  background:#fff;
}

/* 🔥 VIDÉO À LA BONNE TAILLE DIRECT */
.video-wrapper {
  width:100%;
  height:462px;
  overflow:hidden;
  border-radius:16px;
}

video, img {
  width:100%;
  height:100%;
  object-fit:cover;
}

.sound-btn {
  position:absolute;
  bottom:10px;
  right:6px;
  width:26px;
  height:26px;
  border-radius:50%;
  background:rgba(0,0,0,.6);
}

.info {
  height:10px;
}

.show-more-card {
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:28px;
  background:yellow;
  height:100%;
}
</style>
</head>

<body>

<div id="viewport">
  <div id="stage">
    <div id="track">
      ${firstBatch}
      <div class="card" id="show-more-btn">
        <div class="show-more-card" onclick="showMore()">➕</div>
      </div>
    </div>
  </div>
</div>

<script>
const CAL_URL = "${CAL_URL}";
const BATCH_SIZE = ${BATCH_SIZE};
const remainingPosts = ${postsJSON};

let currentIndex = 0;
let stepPx = 278;

function goTo(i){
  currentIndex = i;
  document.getElementById('track').style.transform =
    'translate3d(' + (-i * stepPx) + 'px,0,0)';
}

function showMore(){
  const btn = document.getElementById("show-more-btn");
  remainingPosts.splice(0,BATCH_SIZE).forEach(p=>{
    btn.insertAdjacentHTML("beforebegin", createCard(p));
  });
}

function createCard(post){
  return \`
    <div class="card">
      <div class="video-wrapper">
        \${post.video
          ? '<video src="'+post.video+'" autoplay muted loop playsinline></video>'
          : '<img src="'+post.image+'" />'}
      </div>
      <div class="info"></div>
    </div>
  \`;
}
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

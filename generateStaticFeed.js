require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';
const CAL_URL = "https://www.theushuaiaexperience.com/en/club/news";
const OUTPUT_FILE = 'index.html';
const BATCH_SIZE = 5;

const LOGO_URL = "https://res.cloudinary.com/dfjpxdqd4/image/upload/v1766535916/fbk_qs65lv.jpg";

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
              ? `<video src="${post.video}" autoplay muted loop playsinline loading="lazy"></video>
                 <button class="sound-btn" title="Ouvrir le calendrier"></button>`
              : `<img src="${post.image}" alt="post" loading="lazy" />`
          }
        </div>
        <div class="info">
          <div class="emoji">
            <img src="${LOGO_URL}" alt="logo" />
          </div>
          <div class="date">In 2025 ! ✈️🌍</div>
          <div class="tag">
            <a href="${CAL_URL}" target="_blank" rel="noopener noreferrer">✈️🥳🎉➡️</a>
          </div>
        </div>
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
  overscroll-behavior:none;
}

#viewport {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  touch-action: pan-y;
}

#stage {
  transform-origin: top left;
  will-change: transform;
}

#track {
  display: flex;
  gap: 14px;
  width: max-content;
  transition: transform 320ms cubic-bezier(.25,.8,.25,1);
}

.card {
  width:165px;
  background:#fff;
  border-radius:16px;
  overflow:hidden;
  text-align:center;
}

.video-wrapper { position:relative; }
video, img { width:100%; display:block; object-fit:cover; }

.sound-btn {
  position:absolute;
  bottom:10px;
  right:6px;
  width:26px;
  height:26px;
  background:rgba(0,0,0,.6);
  border:none;
  border-radius:50%;
  cursor:pointer;
}

.info { padding:6px 10px 2px; }

.emoji {
  display:flex;
  justify-content:center;
  align-items:center;
  margin-bottom:2px;
}

.emoji img {
  width:35px;
  height:35px;
  object-fit:contain;
}

.date {
  font-size:15px;
  font-weight:bold;
  color:#444;
}

.tag {
  margin-top:6px;
  display:inline-block;
}

.tag a {
  background:yellow;
  padding:6px;
  border-radius:6px;
  font-weight:bold;
  text-decoration:none;
  color:inherit;
}

.show-more-card {
  display:flex;
  justify-content:center;
  align-items:center;
  font-size:28px;
  background:yellow;
  height:100%;
  cursor:pointer;
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
let stepPx = 179;

function openCalendar() {
  window.open(CAL_URL, "_blank", "noopener,noreferrer");
}

function createCard(post) {
  const media = post.video
    ? \`<video src="\${post.video}" autoplay muted loop playsinline></video>\`
    : \`<img src="\${post.image}" loading="lazy"/>\`;

  return \`
  <div class="card">
    <div class="video-wrapper">\${media}</div>
    <div class="info">
      <div class="emoji"><img src="${LOGO_URL}" alt="logo"/></div>
      <div class="date">In 2025 ! ✈️🌍</div>
      <div class="tag"><a href="\${CAL_URL}" target="_blank">✈️🥳🎉➡️</a></div>
    </div>
  </div>\`;
}

function showMore() {
  const btn = document.getElementById("show-more-btn");
  const slice = remainingPosts.splice(0, BATCH_SIZE);
  slice.forEach(p => btn.insertAdjacentHTML("beforebegin", createCard(p)));
  if (!remainingPosts.length) btn.remove();
}
</script>
</body>
</html>`;

    fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
    console.log(`✅ ${OUTPUT_FILE} généré avec succès.`);
  } catch (err) {
    console.error('❌ Erreur :', err.message);
  }
}

generateStaticFeed();



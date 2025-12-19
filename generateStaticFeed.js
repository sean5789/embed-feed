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
      headers: { Authorization: `Bearer ${API_KEY}` },
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
              ? `<video src="${post.video}" autoplay muted loop playsinline></video>`
              : `<img src="${post.image}" />`
          }
        </div>
        <div class="info">
          <div class="emoji">🥳</div>
          <div class="date">In 2025 ! ✈️🌍</div>
        </div>
      </div>
    `).join("");

    const postsJSON = JSON.stringify(postsForClient.slice(BATCH_SIZE));

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
html, body {
  margin:0;
  padding:0;
  height:100%;
  overflow:hidden;
  background:#fff;
  font-family:sans-serif;
}

#viewport {
  width:100%;
  height:100%;
  overflow:hidden;
  touch-action: pan-y;
}

#track {
  display:flex;
  gap:14px;
  padding:10px;
  will-change: transform;
  transition: transform 320ms cubic-bezier(.25,.8,.25,1);
  transform-origin: top left;
}

.card {
  width:165px;
  flex:0 0 auto;
  border-radius:16px;
  overflow:hidden;
  background:#fff;
}

.video-wrapper video,
.video-wrapper img {
  width:100%;
  display:block;
  object-fit:cover;
}

.info {
  padding:6px;
  text-align:center;
}
</style>
</head>

<body>
<div id="viewport">
  <div id="track">
    ${firstBatch}
  </div>
</div>

<script>
const remainingPosts = ${postsJSON};
const BATCH_SIZE = ${BATCH_SIZE};

let index = 0;
let scale = 1;
let baseHeight = 0;
let currentIndex = 0;

const track = document.getElementById("track");
const viewport = document.getElementById("viewport");

function measureBaseHeight() {
  const prev = track.style.transform;
  track.style.transform = 'none';
  baseHeight = track.scrollHeight;
  track.style.transform = prev;
}

function updateScale() {
  if (!baseHeight) measureBaseHeight();
  const vh = window.innerHeight;
  scale = vh / baseHeight;
}

function cardStep() {
  const c = document.querySelector(".card");
  if (!c) return 0;
  return c.offsetWidth + 14;
}

function applyTransform() {
  const x = -(index * cardStep());
  track.style.transform = \`translate3d(\${x}px,0,0) scale(\${scale})\`;
}

function clampIndex() {
  const max = track.children.length - 1;
  index = Math.max(0, Math.min(index, max));
}

function snap() {
  clampIndex();
  applyTransform();
}

function showMore() {
  const slice = remainingPosts.slice(currentIndex, currentIndex + BATCH_SIZE);
  slice.forEach(p => {
    track.insertAdjacentHTML("beforeend", \`
      <div class="card">
        <div class="video-wrapper">
          \${p.video ? \`<video src="\${p.video}" autoplay muted loop playsinline></video>\`
                     : \`<img src="\${p.image}" />\`}
        </div>
        <div class="info">
          <div class="emoji">🥳</div>
          <div class="date">In 2025 ! ✈️🌍</div>
        </div>
      </div>\`);
  });
  currentIndex += BATCH_SIZE;
  measureBaseHeight();
  updateScale();
  snap();
}

let startX = 0;
let startY = 0;
let active = false;

viewport.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  active = true;
}, { passive:true });

viewport.addEventListener("touchend", e => {
  if (!active) return;
  active = false;

  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;

  if (Math.abs(dy) > Math.abs(dx)) return;
  if (Math.abs(dx) < 40) return;

  index += dx < 0 ? 1 : -1;
  snap();
}, { passive:true });

window.addEventListener("resize", () => {
  measureBaseHeight();
  updateScale();
  snap();
});

window.addEventListener("load", () => {
  measureBaseHeight();
  updateScale();
  snap();
});
</script>
</body>
</html>`;

    fs.writeFileSync(OUTPUT_FILE, html, "utf8");
    console.log("✅ index.html généré");
  } catch (err) {
    console.error(err.message);
  }
}

generateStaticFeed();



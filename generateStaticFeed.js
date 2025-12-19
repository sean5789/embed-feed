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
              ? `<video src="${post.video}" autoplay muted loop playsinline loading="lazy"></video>
                 <button class="sound-btn" title="Ouvrir le calendrier"></button>`
              : `<img src="${post.image}" alt="post" loading="lazy" />`
          }
        </div>
        <div class="info">
          <div class="emoji">🥳</div>
          <div class="date">In 2025 ! ✈️🌍</div>
          <div class="tag"><a href="${CAL_URL}" target="_blank" rel="noopener noreferrer">🥳➡️</a></div>
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
      overflow:hidden; /* évite les scrollbars dans l'iframe */
    }

    /* Root scalable : plus de width/height fixes -> on mesure la vraie hauteur */
    #root {
      transform-origin: top left;
      display: inline-block;
    }

    .grid {
      display:flex;
      overflow-x:auto;
      gap:14px;
      padding:10px;
      scroll-behavior:smooth;
    }

    .grid::-webkit-scrollbar { display:none; }

    .card {
      flex:0 0 auto;
      width:165px;
      background:#fff;
      border-radius:16px;
      overflow:hidden;
      text-align:center;
    }

    .video-wrapper {
      position:relative;
      width:100%;
    }

    video, img {
      width:100%;
      height:100%;
      display:block;
      object-fit:cover;
    }

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
      background-image:url('data:image/svg+xml;charset=UTF-8,<svg fill="white" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 5V4L5 9H4zm14.5 12.1L3.9 4.5 2.5 5.9 18.1 21.5l.4.4 1.4-1.4-.4-.4z"/></svg>');
      background-repeat:no-repeat;
      background-position:center;
      background-size:60%;
    }

    .info { padding:6px 10px 2px; text-align:center; }
    .emoji { font-size:24px; }
    .date { font-size:15px; color:#444; font-weight:bold; }
    .tag { margin-top:6px; display:inline-block; }
    .tag a {
      color:inherit;
      text-decoration:none;
      display:inline-block;
      background:yellow;
      font-weight:bold;
      padding:6px;
      border-radius:6px;
    }

    .show-more-card {
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:28px;
      background:yellow;
      height:100%;
      cursor:pointer;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="grid" id="feed">
      ${firstBatch}
      <div class="card" id="show-more-btn">
        <div class="show-more-card" onclick="showMore()">➕</div>
      </div>
    </div>
  </div>

  <script>
    const CAL_URL = "${CAL_URL}";
    const BATCH_SIZE = ${BATCH_SIZE};
    const remainingPosts = ${postsJSON};
    let currentIndex = 0;

    function openCalendar() {
      const w = window.open(CAL_URL, "_blank", "noopener,noreferrer");
      if (!w) {
        try { parent.postMessage({ type:"openExternal", url: CAL_URL }, "*"); } catch(_) {}
      }
    }

    function createCard(post) {
      const media = post.video
        ? \`
          <div class="video-wrapper">
            <video src="\${post.video}" autoplay muted loop playsinline loading="lazy"></video>
            <button class="sound-btn" title="Ouvrir le calendrier"></button>
          </div>\`
        : \`
          <div class="video-wrapper">
            <img src="\${post.image}" alt="post" loading="lazy" />
          </div>\`;

      return \`
        <div class="card">
          \${media}
          <div class="info">
            <div class="emoji">🥳</div>
            <div class="date">In 2025 ! ✈️🌍</div>
            <div class="tag"><a href="\${CAL_URL}" target="_blank" rel="noopener noreferrer">🥳➡️</a></div>
          </div>
        </div>\`;
    }

    function showMore() {
      const slice = remainingPosts.slice(currentIndex, currentIndex + BATCH_SIZE);
      const feed = document.getElementById("feed");
      const btn = document.getElementById("show-more-btn");

      slice.forEach(post => {
        btn.insertAdjacentHTML("beforebegin", createCard(post));
      });

      currentIndex += BATCH_SIZE;

      if (currentIndex >= remainingPosts.length) {
        btn.style.display = "none";
      }

      wireUpButtons();

      // Re-mesure & rescale (au cas où le layout change)
      measureBaseHeight();
      resizeRoot();
    }

    function wireUpButtons() {
      document.querySelectorAll("video").forEach(v => {
        if (!v.dataset.bound) {
          v.dataset.bound = "1";
          v.addEventListener("click", openCalendar);
        }
        // Re-mesure quand la vidéo connaît ses dimensions
        if (!v.dataset.measured) {
          v.dataset.measured = "1";
          v.addEventListener("loadedmetadata", () => {
            measureBaseHeight();
            resizeRoot();
          }, { once: true });
        }
      });

      document.querySelectorAll("img").forEach(img => {
        if (!img.dataset.measured) {
          img.dataset.measured = "1";
          img.addEventListener("load", () => {
            measureBaseHeight();
            resizeRoot();
          }, { once: true });
        }
      });

      document.querySelectorAll(".sound-btn").forEach(btn => {
        if (!btn.dataset.bound) {
          btn.dataset.bound = "1";
          btn.addEventListener("click", e => {
            e.stopPropagation();
            openCalendar();
          });
        }
      });
    }

    // ===== SCALE PROPORTIONNEL BASÉ SUR LA HAUTEUR, SANS COUPER LE BAS =====
    let BASE_HEIGHT = null;

    function measureBaseHeight() {
      const root = document.getElementById('root');
      if (!root) return;

      // Mesure SANS transform pour obtenir la vraie hauteur du contenu
      const prev = root.style.transform;
      root.style.transform = 'none';

      BASE_HEIGHT = root.scrollHeight;

      root.style.transform = prev;
    }

    function resizeRoot() {
      const root = document.getElementById('root');
      if (!root) return;

      if (!BASE_HEIGHT) measureBaseHeight();

      const vh = window.innerHeight || document.documentElement.clientHeight || BASE_HEIGHT;
      const scale = vh / BASE_HEIGHT;

      root.style.transform = 'scale(' + scale + ')';
    }

    window.addEventListener('load', () => {
      wireUpButtons();

      // 2 frames pour laisser le layout se stabiliser
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          measureBaseHeight();
          resizeRoot();
        });
      });
    });

    window.addEventListener('resize', () => {
      measureBaseHeight();
      resizeRoot();
    });
    // =======================================================================
  </script>
</body>
</html>`;

    fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
    console.log(`✅ ${OUTPUT_FILE} généré avec succès.`);
  } catch (err) {
    console.error('❌ Erreur :', err?.response?.data || err.message);
  }
}

generateStaticFeed();


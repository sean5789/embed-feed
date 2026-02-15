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

    // ✅ Plus de flèche, plus de date
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
      box-sizing: border-box;
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
      will-change: transform;
      transform: translate3d(0,0,0);
      transition: transform 320ms cubic-bezier(.25,.8,.25,1);
    }

    .card {
      flex: 0 0 auto;
      width: 165px;
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

    .show-more-card {
      display:flex; 
      align-items:center; 
      justify-content:center;
      font-size:28px; 
      background:yellow; 
      height:100%; 
      cursor:pointer;
      min-height: 100px;
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
    let maxIndex = 0;
    let currentIndexLoaded = 0;
    let stageScale = 1;

    function openCalendar() {
      const w = window.open(CAL_URL, "_blank", "noopener,noreferrer");
      if (!w) {
        try { parent.postMessage({ type:"openExternal", url: CAL_URL }, "*"); } catch(_) {}
      }
    }

    function wireUpButtons() {
      document.querySelectorAll("video").forEach(v => {
        v.muted = true;
        v.playsInline = true;
        v.setAttribute("playsinline", "");
        v.setAttribute("webkit-playsinline", "");
        v.setAttribute("preload", "auto");
        v.setAttribute("disablepictureinpicture", "");

        if (!v.dataset.bound) {
          v.dataset.bound = "1";
          v.addEventListener("click", openCalendar);
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

    function createCard(post) {
      const media = post.video
        ? \`
          <div class="video-wrapper">
            <video
              src="\${post.video}"
              autoplay
              muted
              loop
              playsinline
              webkit-playsinline
              preload="auto"
              disablepictureinpicture
            ></video>
            <button class="sound-btn" title="Ouvrir le calendrier"></button>
          </div>\`
        : \`
          <div class="video-wrapper">
            <img src="\${post.image}" alt="post" loading="lazy" />
          </div>\`;

      return \`
        <div class="card">\${media}</div>\`;
    }

    function showMore() {
      const slice = remainingPosts.slice(currentIndexLoaded, currentIndexLoaded + BATCH_SIZE);
      const btnCard = document.getElementById("show-more-btn");

      slice.forEach(post => {
        btnCard.insertAdjacentHTML("beforebegin", createCard(post));
      });

      currentIndexLoaded += BATCH_SIZE;

      if (currentIndexLoaded >= remainingPosts.length) {
        btnCard.style.display = "none";
      }

      wireUpButtons();
    }

    window.addEventListener('load', () => {
      wireUpButtons();
    });

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



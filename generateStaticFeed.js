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
      background:#fff;
      font-family:sans-serif;

      /* ✅ pas de scroll horizontal global */
      overflow-x:hidden;
      overscroll-behavior:none;
    }

    /* viewport : pas de hauteur figée, Bubble peut agrandir sans couper le bas */
    #viewport {
      position: relative;
      width: 100%;

      overflow-x: hidden;
      overflow-y: visible;

      padding: 10px;
      box-sizing: border-box;

      touch-action: pan-y; /* swipe horizontal géré par JS */
    }

    /* track qui bouge horizontalement */
    #track {
      position: relative;
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

    .video-wrapper { position:relative; width:100%; }
    video, img { width:100%; height:100%; display:block; object-fit:cover; }

    .sound-btn {
      position:absolute; bottom:10px; right:6px;
      width:26px; height:26px;
      background:rgba(0,0,0,.6);
      border:none; border-radius:50%; cursor:pointer;
      background-image:url('data:image/svg+xml;charset=UTF-8,<svg fill="white" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 5V4L5 9H4zm14.5 12.1L3.9 4.5 2.5 5.9 18.1 21.5l.4.4 1.4-1.4-.4-.4z"/></svg>');
      background-repeat:no-repeat; background-position:center; background-size:60%;
    }

    .info { padding:6px 10px 2px; text-align:center; }
    .emoji { font-size:24px; }
    .date { font-size:15px; color:#444; font-weight:bold; }
    .tag { margin-top:6px; display:inline-block; }
    .tag a {
      color:inherit; text-decoration:none; display:inline-block;
      background:yellow; font-weight:bold; padding:6px; border-radius:6px;
    }

    .show-more-card {
      display:flex; align-items:center; justify-content:center;
      font-size:28px; background:yellow; height:100%; cursor:pointer;
      min-height: 100px;
    }

    /* boutons */
    .nav-btn {
      position: sticky; /* reste visible même si le contenu est plus haut */
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 999px;
      background: rgba(0,0,0,.55);
      color: #fff;
      font-size: 22px;
      line-height: 44px;
      text-align: center;
      cursor: pointer;
      z-index: 10;
      user-select: none;
      -webkit-user-select: none;
    }
    .nav-btn:active { transform: translateY(-50%) scale(0.98); }
    #btn-prev { left: 10px; }
    #btn-next { right: 10px; float: right; }

    .nav-btn[disabled] {
      opacity: .25;
      cursor: default;
    }

    /* wrapper boutons pour les placer au-dessus du track */
    #nav {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: 100%;
      pointer-events: none; /* laisse cliquer le contenu */
    }
    #nav .nav-btn {
      pointer-events: auto; /* mais boutons cliquables */
    }
  </style>
</head>
<body>
  <div id="viewport">
    <div id="nav">
      <button id="btn-prev" class="nav-btn" aria-label="Précédent">←</button>
      <button id="btn-next" class="nav-btn" aria-label="Suivant">→</button>
    </div>

    <div id="track">
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
    let stepPx = 179;  // 165 + 14 (mesuré au load)
    let maxIndex = 0;

    let currentIndexLoaded = 0;

    function openCalendar() {
      const w = window.open(CAL_URL, "_blank", "noopener,noreferrer");
      if (!w) {
        try { parent.postMessage({ type:"openExternal", url: CAL_URL }, "*"); } catch(_) {}
      }
    }

    function wireUpButtons() {
      document.querySelectorAll("video").forEach(v => {
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
      const slice = remainingPosts.slice(currentIndexLoaded, currentIndexLoaded + BATCH_SIZE);
      const track = document.getElementById("track");
      const btnCard = document.getElementById("show-more-btn");

      slice.forEach(post => {
        btnCard.insertAdjacentHTML("beforebegin", createCard(post));
      });

      currentIndexLoaded += BATCH_SIZE;

      if (currentIndexLoaded >= remainingPosts.length) {
        btnCard.style.display = "none";
      }

      wireUpButtons();
      recalc();
      updateUI();
    }

    function recalc() {
      const track = document.getElementById('track');
      const firstCard = track.querySelector('.card');

      if (firstCard) {
        const rect = firstCard.getBoundingClientRect();
        stepPx = (rect.width || 165) + 14;
      } else {
        stepPx = 165 + 14;
      }

      const cards = track.querySelectorAll('.card');
      maxIndex = Math.max(0, cards.length - 1);

      if (currentIndex > maxIndex) currentIndex = maxIndex;
      updateUI();
    }

    function goTo(index) {
      const track = document.getElementById('track');
      currentIndex = Math.max(0, Math.min(maxIndex, index));

      const x = -(currentIndex * stepPx);
      track.style.transform = 'translate3d(' + x + 'px, 0, 0)';

      updateUI();
    }

    function updateUI() {
      const btnPrev = document.getElementById('btn-prev');
      const btnNext = document.getElementById('btn-next');
      btnPrev.disabled = currentIndex <= 0;
      btnNext.disabled = currentIndex >= maxIndex;
    }

    function next() { goTo(currentIndex + 1); }
    function prev() { goTo(currentIndex - 1); }

    function setupNavButtons() {
      document.getElementById('btn-prev').addEventListener('click', prev);
      document.getElementById('btn-next').addEventListener('click', next);
    }

    // swipe (optionnel)
    function setupSwipe() {
      const viewport = document.getElementById('viewport');
      let startX = 0;
      let startY = 0;

      viewport.addEventListener('touchstart', (e) => {
        const t = e.touches && e.touches[0];
        if (!t) return;
        startX = t.clientX;
        startY = t.clientY;
      }, { passive: true });

      viewport.addEventListener('touchend', (e) => {
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;

        const dx = t.clientX - startX;
        const dy = t.clientY - startY;

        if (Math.abs(dy) > Math.abs(dx)) return;

        if (dx <= -40) next();
        else if (dx >= 40) prev();
      }, { passive: true });
    }

    window.addEventListener('load', () => {
      wireUpButtons();
      setupNavButtons();
      setupSwipe();
      recalc();
      goTo(0);
    });

    window.addEventListener('resize', () => {
      recalc();
      goTo(currentIndex);
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



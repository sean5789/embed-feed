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

      /* pas de scroll vertical global */
      overflow:hidden;
      overscroll-behavior:none;
      touch-action: pan-x; /* on veut favoriser l'horizontal */
    }

    /* viewport scrollable (on garde overflow-x, mais on force surtout via drag JS) */
    #feed {
      position:relative;
      height:100%;
      overflow-x: scroll;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;

      padding:10px;
      box-sizing:border-box;

      /* pas de sélection pendant le drag */
      user-select:none;
      -webkit-user-select:none;
      -webkit-touch-callout:none;
      cursor: grab;
    }
    #feed.dragging { cursor: grabbing; }

    #feed::-webkit-scrollbar { display:none; }
    #feed { scrollbar-width:none; }

    /* spacer = largeur réelle scrollable (sinon iOS + transform = scrollWidth faux) */
    #spacer {
      height: 1px;
      width: 1px; /* set en JS */
    }

    /* contenu affiché et scalé (ne scrolle pas lui-même) */
    #content {
      position:absolute;
      top:10px;  /* doit matcher padding #feed */
      left:10px; /* doit matcher padding #feed */
      transform-origin: top left;
      display:flex;
      gap:14px;
      width:max-content;
      align-items:stretch;
      will-change: transform;
    }

    .card {
      flex:0 0 auto;
      width:165px;
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
  </style>
</head>
<body>
  <div id="feed">
    <div id="spacer"></div>

    <div id="content">
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
      const btn = document.getElementById("show-more-btn");

      slice.forEach(post => {
        btn.insertAdjacentHTML("beforebegin", createCard(post));
      });

      currentIndex += BATCH_SIZE;
      if (currentIndex >= remainingPosts.length) btn.style.display = "none";

      wireUpButtons();
      refreshLayout();
    }

    function wireUpButtons() {
      document.querySelectorAll("video").forEach(v => {
        if (!v.dataset.bound) {
          v.dataset.bound = "1";
          v.addEventListener("click", openCalendar);
        }
        if (!v.dataset.measured) {
          v.dataset.measured = "1";
          v.addEventListener("loadedmetadata", refreshLayout, { once: true });
        }
      });

      document.querySelectorAll("img").forEach(img => {
        if (!img.dataset.measured) {
          img.dataset.measured = "1";
          img.addEventListener("load", refreshLayout, { once: true });
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

    // ===== Scale basé sur hauteur + spacer pour scrollWidth correct =====
    function refreshLayout() {
      const content = document.getElementById('content');
      const spacer = document.getElementById('spacer');
      const feed = document.getElementById('feed');
      if (!content || !spacer || !feed) return;

      const prev = content.style.transform;
      content.style.transform = 'none';

      const baseW = content.scrollWidth;
      const baseH = content.scrollHeight;

      content.style.transform = prev;

      const vh = window.innerHeight || document.documentElement.clientHeight || baseH;
      const scale = vh / baseH;

      content.style.transform = 'scale(' + scale + ')';

      const scaledW = Math.ceil(baseW * scale);
      spacer.style.width = (scaledW + 20) + 'px'; // + padding left/right (10+10)
    }

    // ===== Drag-to-scroll (force le scroll horizontal même si iOS bloque) =====
    function enableDragScroll() {
      const feed = document.getElementById('feed');
      if (!feed) return;

      let isDown = false;
      let startX = 0;
      let startY = 0;
      let startScrollLeft = 0;
      let dragged = false;

      const THRESH = 6; // px

      function onDown(x, y) {
        isDown = true;
        dragged = false;
        startX = x;
        startY = y;
        startScrollLeft = feed.scrollLeft;
        feed.classList.add('dragging');
      }

      function onMove(x, y, e) {
        if (!isDown) return;

        const dx = x - startX;
        const dy = y - startY;

        // On ne déclenche le drag que si c'est majoritairement horizontal
        if (!dragged) {
          if (Math.abs(dx) < THRESH) return;
          if (Math.abs(dy) > Math.abs(dx)) {
            // c'était plutôt vertical -> on annule le drag
            isDown = false;
            feed.classList.remove('dragging');
            return;
          }
          dragged = true;
        }

        // IMPORTANT : empêcher le scroll/zoom/bounce iOS
        if (e && e.cancelable) e.preventDefault();

        feed.scrollLeft = startScrollLeft - dx;
      }

      function onUp() {
        isDown = false;
        feed.classList.remove('dragging');
      }

      // Touch (iOS)
      feed.addEventListener('touchstart', (e) => {
        if (!e.touches || !e.touches[0]) return;
        const t = e.touches[0];
        onDown(t.clientX, t.clientY);
      }, { passive: true });

      feed.addEventListener('touchmove', (e) => {
        if (!e.touches || !e.touches[0]) return;
        const t = e.touches[0];
        onMove(t.clientX, t.clientY, e);
      }, { passive: false });

      feed.addEventListener('touchend', onUp, { passive: true });
      feed.addEventListener('touchcancel', onUp, { passive: true });

      // Mouse (desktop)
      feed.addEventListener('mousedown', (e) => {
        onDown(e.clientX, e.clientY);
      });

      window.addEventListener('mousemove', (e) => {
        onMove(e.clientX, e.clientY, e);
      }, { passive: false });

      window.addEventListener('mouseup', onUp);
    }

    window.addEventListener('load', () => {
      wireUpButtons();
      enableDragScroll();
      requestAnimationFrame(() => {
        requestAnimationFrame(refreshLayout);
      });
    });

    window.addEventListener('resize', refreshLayout);
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



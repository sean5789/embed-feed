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

      /* pas de scroll vertical, on gère le pan horizontal nous-mêmes */
      overflow:hidden;
      overscroll-behavior:none;
    }

    /* viewport (pas de scroll natif) */
    #feed {
      position:relative;
      height:100%;
      overflow:hidden;

      padding:10px;
      box-sizing:border-box;

      user-select:none;
      -webkit-user-select:none;
      -webkit-touch-callout:none;

      touch-action: pan-x; /* on veut le geste horizontal */
      cursor: grab;
    }
    #feed.dragging { cursor: grabbing; }

    /* contenu (scalé + translaté GPU) */
    #content {
      position:absolute;
      top:10px;
      left:10px;

      display:flex;
      gap:14px;
      width:max-content;
      align-items:stretch;

      transform-origin: top left;
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

    // ===== SCALE (basé sur hauteur) + "scroll" via translate3d =====
    let scale = 1;
    let baseW = 0;
    let baseH = 0;

    // position de scroll en px (positif = on va vers la droite dans le contenu)
    let scrollX = 0;

    function measureContent() {
      const content = document.getElementById('content');
      if (!content) return;

      const prev = content.style.transform;
      content.style.transform = 'none';
      baseW = content.scrollWidth;
      baseH = content.scrollHeight;
      content.style.transform = prev;
    }

    function clampScrollX(x) {
      const feed = document.getElementById('feed');
      if (!feed) return 0;

      const vw = feed.clientWidth - 20; // padding left+right (10+10)
      const scaledW = baseW * scale;

      const maxX = Math.max(0, scaledW - vw);
      if (x < 0) return 0;
      if (x > maxX) return maxX;
      return x;
    }

    function applyTransform() {
      const content = document.getElementById('content');
      if (!content) return;

      // translate = -scrollX (on déplace le contenu vers la gauche)
      const tx = -scrollX;

      // GPU transform: translate3d + scale
      content.style.transform = 'translate3d(' + tx + 'px, 0, 0) scale(' + scale + ')';
    }

    function refreshLayout() {
      const feed = document.getElementById('feed');
      if (!feed) return;

      measureContent();
      const vh = window.innerHeight || document.documentElement.clientHeight || baseH;

      scale = vh / baseH;

      // clamp la position actuelle avec la nouvelle scale
      scrollX = clampScrollX(scrollX);

      applyTransform();
    }

    // ===== Drag fluide + inertie (sur scrollX) =====
    function enableDragScroll() {
      const feed = document.getElementById('feed');
      if (!feed) return;

      let isDown = false;
      let startX = 0;
      let startY = 0;
      let startScrollX = 0;

      // rAF
      let rafId = null;
      let targetX = 0;

      // inertie
      let lastX = 0;
      let lastT = 0;
      let v = 0;
      let inertiaRaf = null;

      const THRESH = 6;
      const FRICTION = 0.95;

      function schedule() {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          scrollX = clampScrollX(targetX);
          applyTransform();
        });
      }

      function stopInertia() {
        if (inertiaRaf) cancelAnimationFrame(inertiaRaf);
        inertiaRaf = null;
      }

      function runInertia() {
        function step() {
          v *= FRICTION;
          if (Math.abs(v) < 0.02) {
            inertiaRaf = null;
            return;
          }

          targetX = scrollX + v * 16; // 16ms approx
          scrollX = clampScrollX(targetX);
          applyTransform();

          // stop aux bords
          const clamped = clampScrollX(targetX);
          if (clamped !== targetX) {
            inertiaRaf = null;
            return;
          }

          inertiaRaf = requestAnimationFrame(step);
        }
        inertiaRaf = requestAnimationFrame(step);
      }

      function onDown(x, y) {
        isDown = true;
        startX = x;
        startY = y;
        startScrollX = scrollX;

        lastX = x;
        lastT = performance.now();
        v = 0;

        stopInertia();
        feed.classList.add('dragging');
      }

      function onMove(x, y, e) {
        if (!isDown) return;

        const dx = x - startX;
        const dy = y - startY;

        if (Math.abs(dx) < THRESH) return;
        if (Math.abs(dy) > Math.abs(dx)) return;

        if (e && e.cancelable) e.preventDefault();

        // dx>0 (finger to right) => on veut aller vers la gauche => scrollX diminue
        targetX = startScrollX - dx;
        schedule();

        const now = performance.now();
        const dt = Math.max(1, now - lastT);
        const vx = (lastX - x) / dt; // px/ms
        // px/s -> puis converti en px/frame plus bas
        const vps = vx * 1000;
        // smoothing
        v = v * 0.8 + vps * 0.2;

        lastX = x;
        lastT = now;
      }

      function onUp() {
        if (!isDown) return;
        isDown = false;
        feed.classList.remove('dragging');

        // px/s -> px/frame (~16ms)
        v = v * 0.016;

        if (Math.abs(v) > 0.5) runInertia();
      }

      // Touch
      feed.addEventListener('touchstart', (e) => {
        const t = e.touches && e.touches[0];
        if (!t) return;
        onDown(t.clientX, t.clientY);
      }, { passive: true });

      feed.addEventListener('touchmove', (e) => {
        const t = e.touches && e.touches[0];
        if (!t) return;
        onMove(t.clientX, t.clientY, e);
      }, { passive: false });

      feed.addEventListener('touchend', onUp, { passive: true });
      feed.addEventListener('touchcancel', onUp, { passive: true });

      // Mouse
      feed.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
      window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY, e), { passive: false });
      window.addEventListener('mouseup', onUp);
    }

    window.addEventListener('load', () => {
      wireUpButtons();
      enableDragScroll();
      requestAnimationFrame(() => requestAnimationFrame(refreshLayout));
    });

    window.addEventListener('resize', () => {
      refreshLayout();
    });
    // ==========================================================
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



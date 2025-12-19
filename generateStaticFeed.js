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
      overflow:hidden;
      overscroll-behavior:none;
    }

    /* ✅ padding ici (non scalé) */
    #viewport {
      width:100%;
      height:100%;
      overflow:hidden;
      position:relative;
      touch-action: pan-y;
      padding:10px;
      box-sizing:border-box;
    }

    /* ✅ plus de padding ici (car scalé) */
    #track {
      display:flex;
      gap:14px;

      transform-origin: top left;
      will-change: transform;
      transition: transform 320ms cubic-bezier(.25,.8,.25,1);
      transform: translate3d(0,0,0) scale(1);
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
    video, img { width:100%; display:block; object-fit:cover; }

    .sound-btn {
      position:absolute; bottom:10px; right:6px; width:26px; height:26px;
      background:rgba(0,0,0,.6); border:none; border-radius:50%; cursor:pointer;
      background-image:url('data:image/svg+xml;charset=UTF-8,<svg fill="white" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 5V4L5 9H4zm14.5 12.1L3.9 4.5 2.5 5.9 18.1 21.5l.4.4 1.4-1.4-.4-.4z"/></svg>');
      background-repeat:no-repeat; background-position:center; background-size:60%;
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
      min-height:100px;
    }
  </style>
</head>
<body>
  <div id="viewport">
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

    function wireUpButtons() {
      document.querySelectorAll("video").forEach(v => {
        if (!v.dataset.bound) {
          v.dataset.bound = "1";
          v.addEventListener("click", openCalendar);
        }
        if (!v.dataset.measured) {
          v.dataset.measured = "1";
          v.addEventListener("loadedmetadata", () => {
            measureBaseHeight();
            computeScale();
            snapToIndex(false);
          }, { once: true });
        }
      });

      document.querySelectorAll("img").forEach(img => {
        if (!img.dataset.measured) {
          img.dataset.measured = "1";
          img.addEventListener("load", () => {
            measureBaseHeight();
            computeScale();
            snapToIndex(false);
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

    function showMore() {
      const slice = remainingPosts.slice(currentIndex, currentIndex + BATCH_SIZE);
      const btn = document.getElementById("show-more-btn");

      slice.forEach(post => {
        btn.insertAdjacentHTML("beforebegin", createCard(post));
      });

      currentIndex += BATCH_SIZE;

      if (currentIndex >= remainingPosts.length) {
        btn.style.display = "none";
      }

      wireUpButtons();

      measureBaseHeight();
      computeScale();
      snapToIndex(false);
    }

    // ====== SNAP 1 PAR 1 + SCALE DYNAMIQUE ======
    const viewport = document.getElementById("viewport");
    const track = document.getElementById("track");

    let index = 0;
    let baseHeight = 0;
    let scale = 1;

    function cardsCount() {
      return track ? track.children.length : 0;
    }

    function clampIndex(i) {
      const max = Math.max(0, cardsCount() - 1);
      return Math.max(0, Math.min(i, max));
    }

    function measureBaseHeight() {
      if (!track) return;
      const prev = track.style.transform;
      const prevTr = track.style.transition;
      track.style.transition = 'none';
      track.style.transform = 'none';
      baseHeight = track.scrollHeight || track.getBoundingClientRect().height || 1;
      track.style.transform = prev;
      track.style.transition = prevTr;
    }

    function computeScale() {
      if (!baseHeight) measureBaseHeight();
      const vh = window.innerHeight || document.documentElement.clientHeight || baseHeight;
      scale = vh / baseHeight;
    }

    function stepWidthScaled() {
      const first = track.querySelector(".card");
      if (!first) return 0;
      const GAP = 14;

      // Mesure largeur de base sans transform (fiable)
      const prev = track.style.transform;
      const prevTr = track.style.transition;
      track.style.transition = 'none';
      track.style.transform = 'none';
      const baseCardW = first.getBoundingClientRect().width;
      track.style.transform = prev;
      track.style.transition = prevTr;

      return (baseCardW + GAP) * scale;
    }

    function snapToIndex(animate = true) {
      index = clampIndex(index);
      const step = stepWidthScaled();
      const x = -(index * step);

      if (!animate) {
        const prevTr = track.style.transition;
        track.style.transition = 'none';
        track.style.transform = \`translate3d(\${x}px, 0, 0) scale(\${scale})\`;
        track.offsetHeight;
        track.style.transition = prevTr || 'transform 320ms cubic-bezier(.25,.8,.25,1)';
      } else {
        track.style.transform = \`translate3d(\${x}px, 0, 0) scale(\${scale})\`;
      }
    }

    // Swipe 1 par 1 (comme ton script précédent)
    let startX = 0, startY = 0, touching = false;

    viewport.addEventListener("touchstart", (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      touching = true;
      startX = t.clientX;
      startY = t.clientY;
    }, { passive: true });

    viewport.addEventListener("touchend", (e) => {
      if (!touching) return;
      touching = false;

      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (Math.abs(dy) > Math.abs(dx)) return;
      if (Math.abs(dx) < 40) return;

      if (dx < 0) index += 1;
      else index -= 1;

      snapToIndex(true);
    }, { passive: true });

    window.addEventListener("resize", () => {
      measureBaseHeight();
      computeScale();
      snapToIndex(false);
    });

    window.addEventListener("load", () => {
      wireUpButtons();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          measureBaseHeight();
          computeScale();
          snapToIndex(false);
        });
      });
    });
  </script>
</body>
</html>`;

    fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
    console.log(\`✅ \${OUTPUT_FILE} généré avec succès.\`);
  } catch (err) {
    console.error('❌ Erreur :', err?.response?.data || err.message);
  }
}

generateStaticFeed();





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

    /* viewport = suit la hauteur Bubble (petit +2vh anti-coupe iOS) */
    #viewport {
      position: relative;
      width: 100%;
      height: 102vh;
      overflow: hidden;
      padding: 10px;
      box-sizing: border-box;

      /* on laisse le vertical au navigateur, l’horizontal est géré par JS */
      touch-action: pan-y;
    }

    /* stage = se scale pour remplir la hauteur */
    #stage {
      transform-origin: top left;
      will-change: transform;
    }

    /* track = se translate horizontalement (drag + snap) */
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
    let stepPx = 179; // 165 + 14
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
        if (!v.dataset.bound) {
          v.dataset.bound = "1";
          v.addEventListener("click", openCalendar);
        }
        if (!v.dataset.measured) {
          v.dataset.measured = "1";
          v.addEventListener("loadedmetadata", () => { recalcAll(); }, { once: true });
        }
      });

      document.querySelectorAll("img").forEach(img => {
        if (!img.dataset.measured) {
          img.dataset.measured = "1";
          img.addEventListener("load", () => { recalcAll(); }, { once: true });
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
      const btnCard = document.getElementById("show-more-btn");

      slice.forEach(post => {
        btnCard.insertAdjacentHTML("beforebegin", createCard(post));
      });

      currentIndexLoaded += BATCH_SIZE;

      if (currentIndexLoaded >= remainingPosts.length) {
        btnCard.style.display = "none";
      }

      wireUpButtons();
      recalcAll();
    }

    function recalcStepAndMax() {
      const track = document.getElementById('track');
      const firstCard = track.querySelector('.card');

      if (firstCard) {
        const rect = firstCard.getBoundingClientRect();
        const visualW = rect.width || 165;
        const baseW = visualW / (stageScale || 1);
        stepPx = baseW + 14;
      } else {
        stepPx = 165 + 14;
      }

      const cards = track.querySelectorAll('.card');
      maxIndex = Math.max(0, cards.length - 1);

      if (currentIndex > maxIndex) currentIndex = maxIndex;
    }

    function recalcScaleToFitHeight() {
      const viewport = document.getElementById('viewport');
      const stage = document.getElementById('stage');
      if (!viewport || !stage) return;

      const prev = stage.style.transform;
      stage.style.transform = 'none';

      const baseH = stage.scrollHeight || stage.getBoundingClientRect().height || 1;

      stage.style.transform = prev;

      const vh = viewport.clientHeight || window.innerHeight || baseH;

      stageScale = vh / baseH;
      stage.style.transform = 'scale(' + stageScale + ')';
    }

    function setTrackX(x) {
      const track = document.getElementById('track');
      track.style.transform = 'translate3d(' + x + 'px, 0, 0)';
    }

    function goTo(index) {
      const track = document.getElementById('track');
      currentIndex = Math.max(0, Math.min(maxIndex, index));

      const x = -(currentIndex * stepPx);
      track.style.transition = 'transform 320ms cubic-bezier(.25,.8,.25,1)';
      setTrackX(x);
    }

    // ✅ Drag fluide (suivi doigt) + Snap (carte la plus proche)
    function setupDragSnap() {
      const viewport = document.getElementById('viewport');
      const track = document.getElementById('track');

      let dragging = false;
      let startX = 0;
      let startY = 0;
      let startOffset = 0; // offset actuel du track au début du drag
      let lastOffset = 0;  // offset courant pendant drag

      function minOffset() { return -(maxIndex * stepPx); } // le plus à gauche
      function maxOffset() { return 0; }                   // le plus à droite

      function applyResistance(x) {
        const min = minOffset();
        const max = maxOffset();

        if (x > max) return max + (x - max) * 0.35;
        if (x < min) return min + (x - min) * 0.35;
        return x;
      }

      viewport.addEventListener('touchstart', (e) => {
        const t = e.touches && e.touches[0];
        if (!t) return;

        dragging = true;
        startX = t.clientX;
        startY = t.clientY;

        startOffset = -(currentIndex * stepPx);
        lastOffset = startOffset;

        track.style.transition = 'none';
      }, { passive: true });

      viewport.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        const t = e.touches && e.touches[0];
        if (!t) return;

        const dx = t.clientX - startX;
        const dy = t.clientY - startY;

        // si c’est surtout vertical, on laisse faire (pas de drag)
        if (Math.abs(dy) > Math.abs(dx)) return;

        // sinon on prend la main (sinon iOS essaye de scroller/zoomer)
        if (e.cancelable) e.preventDefault();

        const x = applyResistance(startOffset + dx);
        lastOffset = x;
        setTrackX(x);
      }, { passive: false });

      viewport.addEventListener('touchend', () => {
        if (!dragging) return;
        dragging = false;

        // snap sur la carte la plus proche
        const rawIndex = Math.round((-lastOffset) / stepPx);
        goTo(rawIndex);
      }, { passive: true });

      viewport.addEventListener('touchcancel', () => {
        if (!dragging) return;
        dragging = false;
        goTo(currentIndex);
      }, { passive: true });
    }

    function recalcAll() {
      recalcScaleToFitHeight();
      recalcStepAndMax();
      goTo(currentIndex);
    }

    window.addEventListener('load', () => {
      wireUpButtons();
      setupDragSnap();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          recalcAll();
          goTo(0);
        });
      });
    });

    window.addEventListener('resize', () => {
      recalcAll();
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




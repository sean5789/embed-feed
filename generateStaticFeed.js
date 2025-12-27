require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';
const CAL_URL = "https://www.theushuaiaexperience.com/en/club/news";
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
              ? `<video src="${post.video}" autoplay muted loop playsinline preload="metadata"></video>
                 <button class="sound-btn" title="Ouvrir le calendrier"></button>`
              : `<img src="${post.image}" alt="post" loading="lazy" />`
          }
        </div>
        <div class="info">
          <div class="date"> In 2025 ! 🗓️ </div>
          <div class="tag">
            <a href="${CAL_URL}" target="_blank" rel="noopener noreferrer">✈️🌎🥇🥳🎉🥂</a>
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
      padding: 0px;
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
    .date { font-size:15px; color:#444; font-weight:bold; margin-top: 1px; }
    .tag { margin-top:6px; display:inline-block; }
    .tag a { text-decoration:none; display:inline-block;
      background:#F5F4F4; font-weight:bold; padding:3px; border-radius:6px;
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
    let stepPx = 179;
    let maxIndex = 0;

    let currentIndexLoaded = 0;
    let stageScale = 1;

    // ---------------------------
    // OUVERTURE LIEN
    // ---------------------------
    function openCalendar() {
      const w = window.open(CAL_URL, "_blank", "noopener,noreferrer");
      if (!w) {
        try { parent.postMessage({ type:"openExternal", url: CAL_URL }, "*"); } catch(_) {}
      }
    }

    // ---------------------------
    // BIND UI
    // ---------------------------
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

        // ✅ iOS: si Safari “pause” après retour réseau / switches, on retente play
        if (!v.dataset.guardEvents) {
          v.dataset.guardEvents = "1";
          v.addEventListener("stalled", () => kickVisibleVideos(), { passive: true });
          v.addEventListener("waiting", () => kickVisibleVideos(), { passive: true });
          v.addEventListener("pause", () => kickVisibleVideos(), { passive: true });
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

      // 🔥 important: (re)observe les nouvelles vidéos ajoutées
      setupVisibilityObserver();
    }

    function createCard(post) {
      const media = post.video
        ? \`
          <div class="video-wrapper">
            <video src="\${post.video}" autoplay muted loop playsinline preload="metadata"></video>
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
            <div class="date"> In 2025 ! 🗓️ </div>
            <div class="tag">
              <a href="\${CAL_URL}" target="_blank" rel="noopener noreferrer">✈️🌎🥇🥳🎉🥂</a>
            </div>
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

    // ---------------------------
    // SCALE / SWIPE
    // ---------------------------
    function recalcStepAndMax() {
      const track = document.getElementById('track');
      const firstCard = track.querySelector('.card');

      if (firstCard) {
        const rect = firstCard.getBoundingClientRect();
        const visualW = rect.width || 165;
        const baseW = visualW / (stageScale || 1);
        stepPx = baseW + 14;
      } else {
        stepPx = 179;
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

    function goTo(index) {
      const track = document.getElementById('track');
      currentIndex = Math.max(0, Math.min(maxIndex, index));
      const x = -(currentIndex * stepPx);
      track.style.transform = 'translate3d(' + x + 'px, 0, 0)';
      // après un swipe, iOS peut “oublier” de relancer certaines vidéos → on kick
      kickVisibleVideos();
    }

    function setupSwipe() {
      const viewport = document.getElementById('viewport');
      let startX = 0, startY = 0;

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

        if (dx <= -40) goTo(currentIndex + 1);
        else if (dx >= 40) goTo(currentIndex - 1);
      }, { passive: true });
    }

    function recalcAll() {
      recalcScaleToFitHeight();
      recalcStepAndMax();
      goTo(currentIndex);
    }

    // =========================================================
    // ✅ WATCHDOG : relance uniquement les vidéos visibles
    // =========================================================
    const visibleVideos = new Set();
    const lastTimes = new WeakMap();     // video -> last currentTime
    const stuckCounts = new WeakMap();   // video -> nb checks sans progression
    let observer = null;
    let watchdogTimer = null;

    function setupVisibilityObserver() {
      const root = document.getElementById('viewport');
      if (!root) return;

      if (!observer) {
        observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const v = entry.target;
            if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
              visibleVideos.add(v);
              // dès qu’une vidéo devient visible : on tente play direct
              safePlay(v);
            } else {
              visibleVideos.delete(v);
            }
          });
        }, { root, threshold: [0, 0.6, 1] });
      }

      // observe toutes les vidéos non observées
      document.querySelectorAll('video').forEach(v => {
        if (!v.dataset.observed) {
          v.dataset.observed = "1";
          observer.observe(v);
        }
      });
    }

    function safePlay(v) {
      if (!v) return;
      try {
        // iOS: si autoplay “bloque”, muted+playsinline aide, mais on retente
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (_) {}
    }

    function addCacheBuster(src) {
      try {
        const u = new URL(src, window.location.href);
        u.searchParams.set('t', Date.now().toString());
        return u.toString();
      } catch (e) {
        // fallback
        if (src.includes('?')) return src + '&t=' + Date.now();
        return src + '?t=' + Date.now();
      }
    }

    function hardReloadVideo(v) {
      if (!v || !v.currentSrc) return;
      const oldSrc = v.currentSrc || v.getAttribute('src') || '';
      const newSrc = addCacheBuster(oldSrc);

      // reset “propre”
      try {
        v.pause();
      } catch (_) {}

      v.setAttribute('src', newSrc);
      try { v.load(); } catch (_) {}
      safePlay(v);
    }

    function softRecoverVideo(v) {
      // 1) si juste “pause” → play
      safePlay(v);

      // 2) si ça ne repart pas → load + play
      try { v.load(); } catch (_) {}
      safePlay(v);
    }

    function isProbablyStuck(v) {
      // on veut éviter les faux positifs pendant un seek / load
      if (!v) return false;

      // si vidéo pas prête, ça peut être normal, mais si ça dure → on récupère
      const ready = v.readyState; // 0..4
      const paused = v.paused;
      const ended = v.ended;

      // progress check
      const t = v.currentTime || 0;
      const last = lastTimes.get(v);
      const progressed = (typeof last === 'number') ? (t > last + 0.02) : true;

      if (!progressed) {
        const c = (stuckCounts.get(v) || 0) + 1;
        stuckCounts.set(v, c);
      } else {
        stuckCounts.set(v, 0);
      }
      lastTimes.set(v, t);

      const c = stuckCounts.get(v) || 0;

      // règles:
      // - si paused/ended alors qu’elle est visible → stuck
      // - si pas de progression sur plusieurs checks (≈ 6s) → stuck
      // - si readyState trop bas et ça persiste → stuck
      if (ended) return true;
      if (paused) return true;
      if (c >= 3) return true;          // ~ 3 cycles
      if (ready <= 1 && c >= 2) return true;

      return false;
    }

    function kickVisibleVideos() {
      // appelé lors d’events iOS + après swipe
      visibleVideos.forEach(v => safePlay(v));
    }

    function startWatchdog() {
      if (watchdogTimer) return;
      watchdogTimer = setInterval(() => {
        // si onglet pas visible, ne rien faire
        if (document.hidden) return;

        visibleVideos.forEach(v => {
          if (!v) return;

          // si “stuck” → récup
          if (isProbablyStuck(v)) {
            // d’abord soft recover
            softRecoverVideo(v);

            // si encore stuck au prochain tick → hard reload
            const c = stuckCounts.get(v) || 0;
            if (c >= 4) {
              hardReloadVideo(v);
              stuckCounts.set(v, 0);
            }
          }
        });
      }, 2000);
    }

    // iOS Safari: quand on revient au premier plan, certaines vidéos restent figées
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // on retente play uniquement sur les visibles
        kickVisibleVideos();
      }
    }, { passive: true });

    // ---------------------------
    // INIT
    // ---------------------------
    window.addEventListener('load', () => {
      wireUpButtons();
      setupSwipe();
      setupVisibilityObserver();
      startWatchdog();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          recalcAll();
          goTo(0);
        });
      });
    });

    window.addEventListener('resize', () => {
      recalcAll();
      kickVisibleVideos();
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



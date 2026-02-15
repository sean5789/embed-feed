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

    // ✅ Flèche "→" supprimée + texte "2026 ! 🗓️" supprimé
    // ✅ On garde .info (padding/hauteur) pour conserver l'élargissement/scroll identique
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
        <div class="info"></div>
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

    .video-wrapper{
  position: relative;
  width: 100%;
  overflow: hidden;                 /* ✅ clippe la vidéo */
  border-radius: 16px;              /* ✅ coins arrondis */
  -webkit-transform: translateZ(0); /* ✅ patch Safari iOS */
  clip-path: inset(0 round 16px);   /* ✅ le plus fiable iOS */
}
     video, img{
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center bottom;
}


    .sound-btn {
      position:absolute; bottom:10px; right:6px;
      width:26px; height:26px;
      background:rgba(0,0,0,.6);
      border:none; border-radius:50%; cursor:pointer;
      background-image:url('data:image/svg+xml;charset=UTF-8,<svg fill="white" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 5V4L5 9H4zm14.5 12.1L3.9 4.5 2.5 5.9 18.1 21.5l.4.4 1.4-1.4-.4-.4z"/></svg>');
      background-repeat:no-repeat; background-position:center; background-size:60%;
    }

    /* ✅ On garde le padding pour préserver exactement la même hauteur/élargissement/scroll */
    .info { padding:6px 10px 2px; text-align:center; }

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

    // ✅ Flèche "→" supprimée + texte supprimé
    // ✅ On garde <div class="info"></div> pour préserver la même hauteur/step/scroll
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
        <div class="card">
          \${media}
          <div class="info"></div>
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
        recalcAll();
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
        stepPx = 179;
      }

      const cards = Array.from(track.querySelectorAll('.card')).filter(card => {
        if (card.id === 'show-more-btn') {
          return card.style.display !== 'none';
        }
        return true;
      });

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
    // WATCHDOG iPhone Safari
    // =========================================================
    const VISIBLE = new WeakMap();
    const STATE = new WeakMap();

    function isActuallyVisible(el) {
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.width <= 2 || rect.height <= 2) return false;
      const overlapX = Math.max(0, Math.min(rect.right, vw) - Math.max(rect.left, 0));
      const overlapY = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
      return overlapX * overlapY > 300;
    }

    function markVisible(video, v) {
      VISIBLE.set(video, !!v);
      if (!STATE.has(video)) {
        STATE.set(video, { lastTime: -1, lastTick: performance.now(), stuckCount: 0, lastReload: 0 });
      }
    }

    let io = null;
    function setupVisibilityObserver() {
      if (!('IntersectionObserver' in window)) return;

      io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const vid = entry.target;
          markVisible(vid, entry.isIntersecting && entry.intersectionRatio > 0.15);
        });
      }, { threshold: [0, 0.15, 0.3, 0.6] });

      document.querySelectorAll('video').forEach(v => {
        if (!v.dataset.observed) {
          v.dataset.observed = "1";
          io.observe(v);
        }
      });
    }

    function observeNewVideos() {
      if (!io) return;
      document.querySelectorAll('video').forEach(v => {
        if (!v.dataset.observed) {
          v.dataset.observed = "1";
          io.observe(v);
        }
      });
    }

    async function tryPlay(video) {
      try {
        const p = video.play();
        if (p && typeof p.then === "function") await p;
        return true;
      } catch (_) {
        return false;
      }
    }

    function reloadVideo(video) {
      const st = STATE.get(video) || { lastReload: 0 };
      const now = Date.now();
      if (now - (st.lastReload || 0) < 6000) return;

      st.lastReload = now;
      st.stuckCount = 0;
      st.lastTick = performance.now();
      st.lastTime = -1;
      STATE.set(video, st);

      const src = video.currentSrc || video.getAttribute('src') || "";
      if (!src) return;

      let newSrc = src;
      try {
        const u = new URL(src, window.location.href);
        u.searchParams.set('v', String(now));
        newSrc = u.toString();
      } catch (_) {
        const joiner = src.includes('?') ? '&' : '?';
        newSrc = src + joiner + 'v=' + now;
      }

      const wasLoop = video.loop;

      video.pause();
      video.setAttribute('src', newSrc);

      video.muted = true;
      video.loop = wasLoop !== false;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("disablepictureinpicture", "");

      video.addEventListener("canplay", () => { tryPlay(video); }, { once: true });
      video.load();
    }

    async function watchdogTick() {
      if (document.visibilityState !== 'visible') return;

      const videos = Array.from(document.querySelectorAll('video'));
      for (const v of videos) {
        const vis = VISIBLE.has(v) ? VISIBLE.get(v) : isActuallyVisible(v);
        if (!vis) continue;

        if ((v.readyState || 0) < 2) continue;

        if (!STATE.has(v)) STATE.set(v, { lastTime: -1, lastTick: performance.now(), stuckCount: 0, lastReload: 0 });
        const st = STATE.get(v);

        const nowTick = performance.now();
        const ct = Number.isFinite(v.currentTime) ? v.currentTime : 0;

        if (v.paused && !v.ended) {
          const ok = await tryPlay(v);
          if (!ok) continue;
        }

        if (st.lastTime >= 0) {
          const advanced = (ct - st.lastTime) > 0.06;
          const elapsed = nowTick - st.lastTick;

          if (!advanced && elapsed > 3500) {
            st.stuckCount += 1;
            st.lastTick = nowTick;
            STATE.set(v, st);

            if (st.stuckCount === 1) {
              await tryPlay(v);
            } else if (st.stuckCount >= 2) {
              reloadVideo(v);
            }
          } else if (advanced) {
            st.stuckCount = 0;
            st.lastTick = nowTick;
            st.lastTime = ct;
            STATE.set(v, st);
          }
        } else {
          st.lastTime = ct;
          st.lastTick = nowTick;
          STATE.set(v, st);
        }
      }
    }

    function startWatchdog() {
      setInterval(watchdogTick, 1200);

      document.addEventListener('pause', (e) => {
        const v = e.target;
        if (v && v.tagName === 'VIDEO') {
          const vis = VISIBLE.has(v) ? VISIBLE.get(v) : isActuallyVisible(v);
          if (vis && document.visibilityState === 'visible') {
            tryPlay(v);
          }
        }
      }, true);

      document.addEventListener('stalled', (e) => {
        const v = e.target;
        if (v && v.tagName === 'VIDEO') {
          const vis = VISIBLE.has(v) ? VISIBLE.get(v) : isActuallyVisible(v);
          if (vis && document.visibilityState === 'visible') {
            tryPlay(v);
          }
        }
      }, true);

      document.addEventListener('waiting', (e) => {
        const v = e.target;
        if (v && v.tagName === 'VIDEO') {
          const vis = VISIBLE.has(v) ? VISIBLE.get(v) : isActuallyVisible(v);
          if (vis && document.visibilityState === 'visible') {
            tryPlay(v);
          }
        }
      }, true);

      document.addEventListener('error', (e) => {
        const v = e.target;
        if (v && v.tagName === 'VIDEO') {
          const vis = VISIBLE.has(v) ? VISIBLE.get(v) : isActuallyVisible(v);
          if (vis && document.visibilityState === 'visible') {
            reloadVideo(v);
          }
        }
      }, true);
    }
    // =========================================================

    window.addEventListener('load', () => {
      wireUpButtons();
      setupSwipe();

      setupVisibilityObserver();
      observeNewVideos();
      startWatchdog();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          recalcAll();
          goTo(0);
          document.querySelectorAll('video').forEach(v => { tryPlay(v); });
        });
      });
    });

    window.addEventListener('resize', () => {
      recalcAll();
    });

    const _oldShowMore = showMore;
    showMore = function () {
      _oldShowMore();
      observeNewVideos();
      document.querySelectorAll('video').forEach(v => { tryPlay(v); });
    };
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



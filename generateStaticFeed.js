// generate-feed.js
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';

async function generateStaticFeed() {
  try {
    if (!API_KEY) throw new Error('La variable d’environnement EMBEDSOCIAL_API_KEY est manquante.');

    console.log('📱 Connexion à l’API EmbedSocial...');
    const url = `https://embedsocial.com/admin/v2/api/social-feed/hashtag-album/media?album_ref=${encodeURIComponent(ALBUM_REF)}`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' },
      timeout: 20000,
    });

    const posts = Array.isArray(res?.data?.data) ? res.data.data : [];
    console.log(`✅ ${posts.length} posts récupérés`);

    // On ne met QUE les champs nécessaires côté client
    const postsForClient = posts.map(p => ({
      video: p?.video?.source || null,
      image: p.image || p.thumbnail || '',
    }));

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Flux EmbedSocial</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body { margin:0; padding:0; background:#fff; font-family:sans-serif; }
    .grid { display:flex; overflow-x:auto; gap:14px; padding:10px; scroll-behavior:smooth; }
    .grid::-webkit-scrollbar { display:none; }
    .card { flex:0 0 auto; width:165px; background:#fff; border-radius:16px; overflow:hidden; }
    .video-wrapper { position:relative; width:100%; }
    video, img { width:100%; display:block; object-fit:cover; }
    video { opacity:0; transition:opacity .4s ease-in-out; }
    video.loaded { opacity:1; }
    .sound-btn {
      position:absolute; bottom:10px; right:6px; width:26px; height:26px;
      background:rgba(0,0,0,.6); border:none; border-radius:50%; cursor:pointer;
      background-image:url('data:image/svg+xml;charset=UTF-8,<svg fill="white" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 5V4L5 9H4zm14.5 12.1L3.9 4.5 2.5 5.9 18.1 21.5l.4.4 1.4-1.4-.4-.4z"/></svg>');
      background-repeat:no-repeat; background-position:center; background-size:60%;
      transition:opacity .3s ease;
    }
    .info { padding:6px 10px 2px; text-align:center; }
    .emoji { font-size:24px; }
    .date { font-size:15px; color:#444; font-weight:bold; }
    .tag { margin-top:6px; display:inline-block; }
    .tag a { color:inherit; text-decoration:none; display:inline-block; background:yellow; font-weight:bold; padding:6px; border-radius:6px; }
  </style>
</head>
<body>
  <div class="grid" id="feed"></div>

  <script>
    const posts = ${JSON.stringify(postsForClient)};
    const FEED = document.getElementById('feed');
    const BATCH_SIZE = 5;                 // 👈 5 éléments par chargement
    const CAL_URL = "https://www.theushuaiaexperience.com/en/club/calendar";
    let index = 0;
    let loading = false;

    function createCard(p) {
      const media = p.video
        ? \`
          <div class="video-wrapper">
            <!-- Lazy: pas de src, juste data-src + preload=none -->
            <video data-src="\${p.video}" muted loop playsinline preload="none"></video>
            <button class="sound-btn" title="Ouvrir le calendrier"></button>
          </div>\`
        : \`
          <div class="video-wrapper">
            <img src="\${p.image}" alt="post" loading="lazy">
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

    function openCalendar() {
      const w = window.open(CAL_URL, "_blank", "noopener,noreferrer");
      if (!w) { try { parent.postMessage({ type:"openExternal", url: CAL_URL }, "*"); } catch(_){} }
    }

    // Observer: définit le src réel uniquement quand la vidéo est visible
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const v = e.target;
        if (e.isIntersecting && !v.src && v.dataset.src) {
          v.src = v.dataset.src;
          v.load();
          v.play().catch(()=>{});
          v.addEventListener("loadeddata", () => v.classList.add("loaded"), { once:true });
          io.unobserve(v);
        }
      });
    }, { root: FEED, rootMargin: "200px", threshold: 0.01 });

    function wireUpNewCards() {
      // vidéos lazy
      FEED.querySelectorAll("video").forEach(v => {
        if (!v.dataset.observed) {
          v.dataset.observed = "1";
          io.observe(v);
          // clic sur la vidéo = ouvrir calendrier
          v.addEventListener("click", openCalendar);
        }
      });
      // boutons
      FEED.querySelectorAll(".sound-btn").forEach(btn => {
        if (!btn.dataset.wired) {
          btn.dataset.wired = "1";
          btn.addEventListener("click", (e) => { e.stopPropagation(); openCalendar(); });
        }
      });
    }

    function loadNextBatch() {
      const slice = posts.slice(index, index + BATCH_SIZE);
      slice.forEach(p => FEED.insertAdjacentHTML("beforeend", createCard(p)));
      index += slice.length;
      wireUpNewCards();
    }

    function maybeLoadMore() {
      if (loading || index >= posts.length) return;
      if (FEED.scrollLeft + FEED.clientWidth >= FEED.scrollWidth - 5) {
        loading = true;
        requestAnimationFrame(() => { loadNextBatch(); loading = false; });
      }
    }

    // 🔹 Charger uniquement les 5 premiers au départ
    loadNextBatch();

    // 🔹 Charger par batch de 5 quand on arrive au bout du scroll horizontal
    FEED.addEventListener("scroll", maybeLoadMore);

    // 🔄 Rejouer les vidéos quand on revient sur l’onglet
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        document.querySelectorAll("video").forEach(v => v.play().catch(()=>{}));
      }
    });
    window.addEventListener("pageshow", () => {
      document.querySelectorAll("video").forEach(v => v.play().catch(()=>{}));
    });
  </script>
</body>
</html>`;

    fs.writeFileSync('index.html', html, 'utf8');
    console.log('✅ index.html généré avec succès.');
  } catch (err) {
    console.error('❌ Erreur :', err?.response?.data || err.message);
  }
}

generateStaticFeed();


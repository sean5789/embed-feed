require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function generateStaticFeed() {
  try {
    if (!API_KEY) {
      throw new Error('La variable d’environnement EMBEDSOCIAL_API_KEY est manquante.');
    }

    console.log('📱 Connexion à l’API EmbedSocial...');

    const url = `https://embedsocial.com/admin/v2/api/social-feed/hashtag-album/media?album_ref=${encodeURIComponent(ALBUM_REF)}`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json',
      },
      timeout: 20000,
    });

    const posts = Array.isArray(res?.data?.data) ? res.data.data : [];
    console.log(`✅ ${posts.length} posts récupérés`);

    // On passe des données minimalistes au client
    const postsForClient = posts.map(p => ({
      video: p?.video?.source || null,
      image: p.image || p.thumbnail || null,
    }));

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Flux EmbedSocial</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="no-referrer">
  <style>
    html, body { margin: 0; padding: 0; background: #fff; font-family: -apple-system, system-ui, Segoe UI, Roboto, Arial, sans-serif; }
    .grid { display: flex; overflow-x: auto; gap: 14px; padding: 10px; scroll-behavior: smooth; box-sizing: border-box; }
    .grid::-webkit-scrollbar { display: none; }

    .card { flex: 0 0 auto; width: 165px; background: #fff; border-radius: 16px; overflow: hidden; }
    .media-box { width: 100%; aspect-ratio: 9 / 16; background: #f2f2f2; position: relative; }

    .video-wrapper { width: 100%; height: 100%; position: relative; }
    video, img { width: 100%; height: 100%; object-fit: cover; display: block; }
    video { opacity: 0; transition: opacity 0.4s ease; }
    video.ready { opacity: 1; }

    .sound-btn {
      position: absolute; bottom: 10px; right: 6px; width: 26px; height: 26px;
      background: rgba(0,0,0,0.6); border: none; border-radius: 50%; cursor: pointer;
      background-image: url('data:image/svg+xml;charset=UTF-8,<svg fill="white" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 5V4L5 9H4zm14.5 12.1L3.9 4.5 2.5 5.9 18.1 21.5l.4.4 1.4-1.4-.4-.4z"/></svg>');
      background-repeat: no-repeat; background-position: center; background-size: 60%;
      opacity: 0; transition: opacity 0.2s ease;
    }
    .video-wrapper.show-btn .sound-btn { opacity: 1; }

    .info { padding: 6px 10px 8px; text-align: center; }
    .emoji { font-size: 24px; }
    .date { font-size: 15px; color: #444; font-weight: bold; }
    .tag { margin-top: 6px; display: inline-block; }
    .tag a { color: inherit; text-decoration: none; display: inline-block; background: yellow; font-weight: bold; padding: 6px; border-radius: 6px; }

    /* Petit loader au bout (facultatif) */
    .sentinel { flex: 0 0 auto; width: 1px; height: 1px; }
  </style>
</head>
<body>
  <div class="grid" id="feed"></div>
  <div class="sentinel" id="sentinel"></div>

  <script>
    const posts = ${JSON.stringify(postsForClient)};
    const FEED = document.getElementById('feed');
    const SENTINEL = document.getElementById('sentinel');

    const BATCH_SIZE = 5;
    let index = 0;
    let loading = false;
    let userMoved = false;

    const CAL_URL = "https://www.theushuaiaexperience.com/en/club/calendar";

    function createCard(p) {
      const poster = p.image ? \` poster="\${p.image}" \` : '';
      const media = p.video
        ? \`
          <div class="media-box">
            <div class="video-wrapper">
              <video
                muted
                loop
                playsinline
                preload="none"
                \${poster}
                data-src="\${p.video}">
              </video>
              <button class="sound-btn" title="Ouvrir le calendrier"></button>
            </div>
          </div>\`
        : \`
          <div class="media-box">
            <img src="\${p.image || ''}" alt="post" loading="lazy">
          </div>\`;

      return \`
        <div class="card">
          \${media}
          <div class="info">
            <div class="emoji">🥳</div>
            <div class="date">In 2025 ! 🌍</div>
            <div class="tag">
              <a href="\${CAL_URL}" target="_blank" rel="noopener noreferrer">🥳➡️</a>
            </div>
          </div>
        </div>\`;
    }

    function wireUpNewCards(startFromIndex) {
      const cards = Array.from(FEED.children).slice(startFromIndex);
      cards.forEach(card => {
        // Bouton + clic vidéo -> ouvre le calendrier
        const btn = card.querySelector('.sound-btn');
        const vid = card.querySelector('video');
        if (vid) {
          vid.addEventListener('loadeddata', () => {
            vid.classList.add('ready');
            card.querySelector('.video-wrapper')?.classList.add('show-btn');
          }, { once: true });

          vid.addEventListener('click', openCalendar);
          btn && btn.addEventListener('click', (e) => { e.stopPropagation(); openCalendar(); });
        }
        const a = card.querySelector('.tag a');
        a?.addEventListener('click', (e) => {
          const w = window.open(a.href, '_blank', 'noopener,noreferrer');
          if (!w) {
            e.preventDefault();
            try { parent.postMessage({ type:'openExternal', url: a.href }, '*'); } catch(_){}
          }
        });
      });
    }

    function openCalendar() {
      const w = window.open(CAL_URL, "_blank", "noopener,noreferrer");
      if (!w) {
        try { parent.postMessage({ type: "openExternal", url: CAL_URL }, "*"); } catch (_){}
      }
    }

    function loadNextBatch() {
      if (loading) return;
      loading = true;

      const before = FEED.children.length;
      const slice = posts.slice(index, index + BATCH_SIZE);
      slice.forEach(p => FEED.insertAdjacentHTML('beforeend', createCard(p)));
      wireUpNewCards(before);
      index += slice.length;
      loading = false;

      // (ré)observe les nouvelles vidéos pour lazy-load
      observeNewVideos();
    }

    // ---- Lazy video via IntersectionObserver ----
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const v = entry.target;
        if (entry.isIntersecting) {
          if (!v.src && v.dataset.src) v.src = v.dataset.src;
          const play = () => v.play().catch(()=>{});
          // iOS a besoin d'un petit délai parfois
          if (v.readyState >= 2) play(); else v.addEventListener('loadeddata', play, { once:true });
        } else {
          // économie data/CPU : pause (et on pourrait décharger la source si besoin)
          v.pause();
        }
      });
    }, { root: FEED, threshold: 0.6 });

    function observeNewVideos() {
      FEED.querySelectorAll('video:not([data-observed])').forEach(v => {
        v.dataset.observed = '1';
        videoObserver.observe(v);
      });
    }

    // ---- Déclenchement du chargement par scroll (vrai mouvement requis) ----
    FEED.addEventListener('scroll', () => {
      if (FEED.scrollLeft > 0) userMoved = true; // l’utilisateur a vraiment scrollé
      const atEnd = FEED.scrollLeft + FEED.clientWidth >= FEED.scrollWidth - 12;
      if (userMoved && atEnd && index < posts.length) {
        loadNextBatch();
      }
    });

    // Charger les 5 premiers uniquement
    loadNextBatch();

    // Premier lot de vidéos à observer
    observeNewVideos();
  </script>
</body>
</html>`;

    fs.writeFileSync('index.html', html, 'utf8');
    console.log('✅ index.html généré avec succès.');
  } catch (error) {
    console.error('❌ Erreur :', error?.response?.data || error.message);
  }
}

generateStaticFeed();


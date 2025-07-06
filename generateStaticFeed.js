require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';

const locationFromUsername = (username) => {
  if (!username) return "Autre 📍";
  const u = username.toLowerCase();
  if (u.includes("paris")) return "Paris !! 🇫🇷🤣🔥➡️";
  if (u.includes("ibiza")) return "Ibiza !! 🇪🇸🤣🔥➡️";
  return "Autre 📍➡️";
};

async function generateStaticFeed() {
  try {
    console.log("📡 Connexion à l’API EmbedSocial...");
    const res = await axios.get(
      `https://embedsocial.com/admin/v2/api/social-feed/hashtag-album/media?album_ref=${ALBUM_REF}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: 'application/json'
        }
      }
    );

    const posts = res.data.data || [];
    if (!Array.isArray(posts)) {
      console.error("❌ Format inattendu");
      return;
    }

    console.log(`✅ ${posts.length} posts récupérés`);

    const cardsHtml = posts.map(p => {
      const date = new Date(p.created_on).toLocaleDateString('fr-FR');
      const location = locationFromUsername(p.username);

      const media = p.video?.source
        ? `
          <video 
            src="${p.video.source}" 
            autoplay 
            muted 
            loop 
            playsinline 
            preload="auto"
            onloadeddata="this.classList.add('loaded')"
          ></video>
          <button class="mute-toggle" onclick="
            const allVideos = document.querySelectorAll('video');
            const allBtns = document.querySelectorAll('.mute-toggle');
            allVideos.forEach(v => v.muted = true);
            allBtns.forEach(b => b.style.display = 'block');
            const v = this.previousElementSibling;
            v.muted = false;
            this.style.display = 'none';
          ">🔇</button>
        `
        : `<img src="${p.image || p.thumbnail || ''}" alt="post">`;

      return `
        <div class="card">
          ${media}
          <div class="info">
            <div class="emoji">🥳</div>
            <div class="date">${date} • NEW ! 🌍</div>
            <div class="tag">${location}</div>
          </div>
        </div>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Flux EmbedSocial</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="no-referrer">
  <link rel="preconnect" href="https://embedsocial.com">
  <link rel="dns-prefetch" href="https://embedsocial.com">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      background: #fff;
      font-family: sans-serif;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      padding: 1em;
      overflow: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .grid::-webkit-scrollbar {
      display: none;
    }

    .card {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      background: white;
      position: relative;
    }

    .card video {
      width: 100%;
      display: block;
      opacity: 0;
      transition: opacity 0.8s ease-in-out;
    }

    .card video.loaded {
      opacity: 1;
    }

    .card img {
      width: 100%;
      display: block;
    }

    .mute-toggle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: transparent;
      border: none;
      font-size: 26px;
      color: white;
      text-shadow: 0 0 5px black;
      cursor: pointer;
      z-index: 3;
    }

    .info {
      padding: 10px;
      text-align: center;
    }

    .emoji {
      font-size: 24px;
    }

    .date {
      font-size: 14px;
      color: #444;
    }

    .tag {
      margin-top: 6px;
      background: yellow;
      font-weight: bold;
      padding: 6px;
      border-radius: 6px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="grid">
    ${cardsHtml}
  </div>

  <script>
    // Fade-in vidéos
    document.addEventListener("DOMContentLoaded", function () {
      const videos = document.querySelectorAll("video");
      videos.forEach(video => {
        video.addEventListener("loadeddata", () => {
          video.classList.add("loaded");
        });
      });
    });

    // Ajustement hauteur iframe Bubble
    function sendHeight() {
      const height = document.body.scrollHeight;
      parent.postMessage({ type: "adjustHeight", height }, "*");
    }

    window.addEventListener("load", sendHeight);
    window.addEventListener("resize", sendHeight);
    new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true });
  </script>
</body>
</html>`;

    fs.writeFileSync('index.html', html);
    console.log("✅ index.html généré avec succès.");
  } catch (error) {
    console.error("❌ Erreur :", error.message);
  }
}

generateStaticFeed();

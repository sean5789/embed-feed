
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';

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
      const media = p.video?.source
        ? `<div class="video-wrapper">
             <video src="${p.video.source}" autoplay muted loop playsinline preload="auto"></video>
             <button class="sound-btn" title="Activer le son">🔊</button>
           </div>`
        : `<img src="${p.image || p.thumbnail || ''}" alt="post">`;

      return `
        <div class="card">
          ${media}
          <div class="info">
            <div class="emoji">🥳</div>
            <div class="date">${date} • NEW ! 🌍</div>
            <div class="tag">🥳➡️</div>
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
    }

    .video-wrapper {
      position: relative;
    }

    .video-wrapper video {
      width: 100%;
      display: block;
      opacity: 0;
      transition: opacity 0.8s ease-in-out;
    }

    .video-wrapper video.loaded {
      opacity: 1;
    }

    .sound-btn {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: rgba(0,0,0,0.5);
      border: none;
      border-radius: 50%;
      padding: 6px;
      font-size: 16px;
      color: white;
      cursor: pointer;
      transition: opacity 0.3s ease;
    }

    .sound-btn.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .card img {
      width: 100%;
      display: block;
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
    document.addEventListener("DOMContentLoaded", function () {
      const videos = document.querySelectorAll("video");
      const buttons = document.querySelectorAll(".sound-btn");

      videos.forEach((video, i) => {
        video.addEventListener("loadeddata", () => {
          video.classList.add("loaded");
        });

        video.addEventListener("click", () => toggleSound(video, buttons[i]));
        buttons[i].addEventListener("click", e => {
          e.stopPropagation();
          toggleSound(video, buttons[i]);
        });
      });

      function toggleSound(activeVideo, activeBtn) {
        videos.forEach((v, j) => {
          if (v !== activeVideo) {
            v.muted = true;
            buttons[j].classList.remove("hidden");
          }
        });

        activeVideo.muted = !activeVideo.muted;
        if (!activeVideo.muted) {
          activeBtn.classList.add("hidden");
        } else {
          activeBtn.classList.remove("hidden");
        }
      }
    });

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

require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';

async function generateStaticFeed() {
  try {
    console.log("📱 Connexion à l’API EmbedSocial...");
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
             <button class="sound-btn" title="Ouvrir le calendrier"></button>
           </div>`
        : `<img src="${p.image || p.thumbnail || ''}" alt="post">`;

      return `
        <div class="card">
          ${media}
          <div class="info">
            <div class="emoji">🥳</div>
            <div class="date">In 2025</strong> ! 🌍</div>
            <div class="tag">
              <a href="https://www.theushuaiaexperience.com/en/club/calendar"
                 target="_blank"
                 rel="noopener noreferrer">🥳➡️</a>
            </div>
          </div>
        </div>`;
    }).join('\n'); // ✅ corrigé ici

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
      background: #fff;
      font-family: sans-serif;
      overflow: hidden;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    body::-webkit-scrollbar {
      display: none;
    }

    .grid {
      display: flex;
      overflow-x: auto;
      gap: 15px;
      padding: 0 10px;
      scroll-behavior: smooth;
      box-sizing: border-box;
      margin-bottom: 0;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .grid::-webkit-scrollbar {
      display: none;
    }

    .card {
      flex: 0 0 auto;
      width: 165px;
      scroll-snap-align: start;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }

    .video-wrapper {
      position: relative;
    }

    video {
      width: 100%;
      display: block;
      opacity: 0;
      transition: opacity 0.8s ease-in-out;
    }

    video.loaded {
      opacity: 1;
    }

    .sound-btn {
      position: absolute;
      bottom: 10px;
      right: 6px;
      width: 26px;
      height: 26px;
      background: rgba(0, 0, 0, 0.6);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      background-image: url('data:image/svg+xml;charset=UTF-8,<svg fill="white" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 5V4L5 9H4zm14.5 12.1L3.9 4.5 2.5 5.9 18.1 21.5l.4.4 1.4-1.4-.4-.4z"/></svg>');
      background-repeat: no-repeat;
      background-position: center;
      background-size: 60%;
      transition: opacity 0.3s ease;
    }

    .info {
      padding: 6px 10px 2px;
      text-align: center;
      margin-bottom: 0;
    }

    .emoji {
      font-size: 24px;
    }

    .date {
      font-size: 15px;
      color: #444;
      font-weight: bold;
    }

    .tag {
      margin-top: 6px;
      display: inline-block;
    }

    .tag a {
      color: inherit;
      text-decoration: none;
      display: inline-block;
      background: yellow;
      font-weight: bold;
      padding: 6px;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="grid">
    ${cardsHtml}
  </div>

  <script>
    document.addEventListener("DOMContentLoaded", function () {
      const CAL_URL = "https://www.theushuaiaexperience.com/en/club/calendar";

      const videos = document.querySelectorAll("video");
      const buttons = document.querySelectorAll(".sound-btn");

      videos.forEach((video, i) => {
        video.addEventListener("loadeddata", () => {
          video.classList.add("loaded");
        });

        video.addEventListener("click", () => openCalendar());
        if (buttons[i]) {
          buttons[i].addEventListener("click", (e) => {
            e.stopPropagation();
            openCalendar();
          });
        }
      });

      function openCalendar() {
        const w = window.open(CAL_URL, "_blank");
        if (!w) {
          try { parent.postMessage({ type: "openExternal", url: CAL_URL }, "*"); } catch {}
        }
      }

      const extLinks = document.querySelectorAll('.tag a');
      extLinks.forEach(a => {
        a.addEventListener('click', (e) => {
          const w = window.open(a.href, '_blank');
          if (!w) {
            e.preventDefault();
            try { parent.postMessage({ type: 'openExternal', url: a.href }, '*'); } catch {}
          }
        });
      });

      function sendHeight() {
        const height = document.body.scrollHeight;
        parent.postMessage({ type: "adjustHeight", height }, "*");
      }

      window.addEventListener("load", sendHeight);
      window.addEventListener("resize", sendHeight);
      new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true });
    });
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

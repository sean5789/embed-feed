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
    console.log('📡 Connexion à l’API EmbedSocial (v2)...');

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
      console.error("❌ Format inattendu pour les posts");
      return;
    }

    console.log(`✅ ${posts.length} publications récupérées.`);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Flux EmbedSocial</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      box-sizing: border-box;
    }
    body {
      font-family: sans-serif;
      background: #fff;
      padding: 1em;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
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
      transition: opacity 0.6s ease-in-out;
    }
    .card video.loaded {
      opacity: 1;
    }
    .card img.fallback {
      width: 100%;
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 0;
    }
    .info {
      padding: 10px;
      text-align: center;
      background: white;
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
    ${posts.map(p => `
      <div class="card">
        <img src="${p.thumbnail || p.image || ''}" class="fallback" alt="fallback">
        <video 
          src="${p.video?.source || ''}" 
          autoplay 
          muted 
          loop 
          playsinline 
          onloadeddata="this.classList.add('loaded')"
          onerror="this.style.display='none';"
        ></video>
        <div class="info">
          <div class="emoji">🥳</div>
          <div class="date">${new Date(p.created_on).toLocaleDateString('fr-FR')} • NEW ! 🌍</div>
          <div class="tag">${locationFromUsername(p.username)}</div>
        </div>
      </div>
    `).join('\n')}
  </div>
</body>
</html>`;

    fs.writeFileSync('index.html', html);
    console.log('✅ index.html généré avec succès.');
  } catch (error) {
    console.error('❌ Erreur :', error.message);
  }
}

generateStaticFeed();


require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';

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

    console.log("🔍 Données brutes :", res.data);

    const posts = res.data.data || [];

    // Ajout ici du log demandé :
    console.log("🔍 Exemple d'un post :", posts[0]);

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
    body {
      font-family: sans-serif;
      background: #fff;
      padding: 1em;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, mi
    img {
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h2>🥳 Derniers posts</h2>
  <div class="grid">
    ${posts.map(p => `<img src="${p.image}" alt="post">`).join('\n')}
  </div>
</body>
</html>`;

    fs.writeFileSync('index.html', html);
    console.log('✅ index.html généré avec succès.');
  } catch (error) {
    console.error('❌ Erreur :', error.message);
  }
}

generateStaticFeed();/Users/invite/Creative\ Cloud\ Files\ Personal\ Account\ seanliccardi2001@gmail.com\ 92C81D525A665EF60A495D9A@AdobeIrequire('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';

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

    console.log("🔍 Données brutes :", res.data);
    // Ajout ici du log demandé :
    console.log("🔍 Exemple d'un post :", posts[0]);

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
    body {
      font-family: sans-serif;
      background: #fff;
      padding: 1em;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
    }
    img {
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h2>🥳 Derniers posts</h2>
  <div class="grid">
    ${posts.map(p => `<img src="${p.image}" alt="post">`).join('\n')}
  </div>
</body>
</html>`;

    fs.writeFileSync('index.html', html);
    console.log('✅ index.html généré avec succès.');
  } catch (error) {
    console.error('❌ Erreur :', error.message);
  }
}

generateStaticFeed();:
    

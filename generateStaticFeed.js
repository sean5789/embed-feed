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
    if (!API_KEY) {
      throw new Error("EMBEDSOCIAL_API_KEY est manquant.");
    }

    console.log("Connexion a l'API EmbedSocial...");

    const url =
      "https://embedsocial.com/admin/v2/api/social-feed/hashtag-album/media?album_ref=" +
      ALBUM_REF;

    const res = await axios.get(url, {
      headers: {
        Authorization: "Bearer " + API_KEY,
        Accept: "application/json",
      },
      timeout: 20000,
    });

    const posts = Array.isArray(res?.data?.data) ? res.data.data : [];
    console.log(posts.length + " posts recuperes");

    const postsForClient = posts.map((p) => ({
      video: p?.video?.source || null,
      image: p.image || p.thumbnail || "",
    }));

    const firstBatch = postsForClient
      .slice(0, BATCH_SIZE)
      .map(
        (post) => `
      <div class="card">
        <div class="video-wrapper">
          ${
            post.video
              ? `<video src="${post.video}" autoplay muted playsinline webkit-playsinline preload="auto"></video>
                 <button class="sound-btn" title="Ouvrir le calendrier"></button>`
              : `<img src="${post.image}" alt="post" loading="lazy" />`
          }
        </div>
        <div class="info">
          <div class="emoji">🥳</div>
          <div class="date">In 2025 !</div>
          <div class="tag">
            <a href="${CAL_URL}" target="_blank" rel="noopener noreferrer">OPEN</a>
          </div>
        </div>
      </div>
    `
      )
      .join("\n");

    const postsJSON = JSON.stringify(postsForClient.slice(BATCH_SIZE));

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Flux EmbedSocial</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      font-family: sans-serif;
      background: #fff;
    }
    #track {
      display: flex;
      gap: 14px;
    }
    .card {
      width: 165px;
      border-radius: 16px;
      overflow: hidden;
    }
    video, img {
      width: 100%;
      display: block;
      object-fit: cover;
    }
    .sound-btn {
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: none;
      background: rgba(0,0,0,0.6);
      cursor: pointer;
    }
    .info {
      padding: 6px;
      text-align: center;
    }
    .tag a {
      display: inline-block;
      background: yellow;
      padding: 6px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      color: #000;
    }
  </style>
</head>
<body>

<div id="track">
  ${firstBatch}
  <div class="card">
    <div onclick="showMore()" style="cursor:pointer;background:yellow;height:100%;display:flex;align-items:center;justify-content:center;">
      +
    </div>
  </div>
</div>

<script>
  const CAL_URL = "${CAL_URL}";
  const BATCH_SIZE = ${BATCH_SIZE};
  const remainingPosts = ${postsJSON};

  let currentIndexLoaded = 0;

  function openCalendar() {
    window.open(CAL_URL, "_blank", "noopener,noreferrer");
  }

  function createCard(post) {
    const media = post.video
      ? '<video src="' + post.video + '" autoplay muted playsinline preload="auto"></video>'
      : '<img src="' + post.image + '" loading="lazy" />';

    return (
      '<div class="card">' +
        '<div class="video-wrapper">' + media + '</div>' +
        '<div class="info">' +
          '<div class="emoji">🥳</div>' +
          '<div class="date">In 2025 !</div>' +
          '<div class="tag"><a href="' + CAL_URL + '" target="_blank">OPEN</a></div>' +
        '</div>' +
      '</div>'
    );
  }

  function showMore() {
    const slice = remainingPosts.slice(
      currentIndexLoaded,
      currentIndexLoaded + BATCH_SIZE
    );

    const track = document.getElementById("track");
    slice.forEach((post) => {
      track.insertAdjacentHTML("beforeend", createCard(post));
    });

    currentIndexLoaded += BATCH_SIZE;
  }
</script>

</body>
</html>`;

    fs.writeFileSync(OUTPUT_FILE, html, "utf8");
    console.log("OK " + OUTPUT_FILE + " genere avec succes.");
  } catch (err) {
    console.error("Erreur:", err?.response?.data || err.message);
  }
}

generateStaticFeed();



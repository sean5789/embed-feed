// generateStaticFeed.js
// Génère public/index.html (aucune balise HTML hors template)

const fs   = require("fs");
const path = require("path");

const OUT_DIR  = path.join(process.cwd(), "public");
const OUT_FILE = path.join(OUT_DIR, "index.html");

// HTML complet écrit dans /public/index.html
const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Flux vidéos</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="referrer" content="no-referrer" />
  <style>
    html,body{margin:0;padding:0;background:#fff;font-family:sans-serif}
    /* Carrousel horizontal (fallback CSS de base) */
    #grid{
      display:flex;overflow-x:auto;gap:14px;padding:10px;
      scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch
    }
    #grid::-webkit-scrollbar{display:none}
    .card{
      flex:0 0 auto;width:165px;background:#fff;border-radius:16px;
      overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.1);scroll-snap-align:start
    }
    .video-wrapper{position:relative;aspect-ratio:9/16;background:#000}
    video{width:100%;height:100%;object-fit:cover;display:block}
    .info{text-align:center;padding:8px}
    .emoji{font-size:20px}
    .date{font-weight:bold;color:#444}
    .tag a{background:yellow;padding:6px;border-radius:6px;text-decoration:none;color:inherit;font-weight:bold}
  </style>
</head>
<body>
  <div id="grid">
    <!-- Exemples de cartes (ajoute/dupliques-en autant que tu veux) -->
    <div class="card">
      <div class="video-wrapper">
        <video src="https://embedsocial.com/admin/mediacache/feed-media/17927/17927366448086139/video.mp4"
               autoplay muted loop playsinline preload="auto"></video>
      </div>
      <div class="info">
        <div class="emoji">🥳</div>
        <div class="date">In 2025 ! 🌍</div>
        <div class="tag"><a href="https://www.theushuaiaexperience.com/en/club/calendar" target="_blank" rel="noopener noreferrer">🥳➡️</a></div>
      </div>
    </div>

    <div class="card">
      <div class="video-wrapper">
        <video src="https://embedsocial.com/admin/mediacache/feed-media/17884/17884932837315561/video.mp4"
               autoplay muted loop playsinline preload="auto"></video>
      </div>
      <div class="info">
        <div class="emoji">🔥</div>
        <div class="date">In 2025 ! 🌍</div>
        <div class="tag"><a href="https://www.theushuaiaexperience.com/en/club/calendar" target="_blank" rel="noopener noreferrer">🔥➡️</a></div>
      </div>
    </div>

    <!-- … tes autres .card … -->
  </div>

  <!-- JS navigateur (carrousel horizontal + lazy + 5 par 5 + dates forcées) -->
  <script src="script.js" defer></script>
</body>
</html>`;

// Écriture du fichier dans /public
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, html, "utf-8");
console.log("✅ public/index.html écrit");


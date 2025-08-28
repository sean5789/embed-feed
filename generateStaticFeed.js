<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Flux EmbedSocial</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="no-referrer">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-family: sans-serif;
    }

    .grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 10px;
      box-sizing: border-box;
    }

    .card {
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
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
    }

    .info {
      padding: 6px 10px 10px;
      text-align: center;
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

    /* Lazy-load */
    .card.deferred { display:none }
    #feed-sentinel { height:1px }
  </style>
</head>
<body>
  <div class="grid">
    <!-- Exemple de cartes -->
    <div class="card">
      <div class="video-wrapper">
        <video src="https://embedsocial.com/admin/mediacache/feed-media/17927/17927366448086139/video.mp4"
               autoplay muted loop playsinline preload="auto"></video>
        <button class="sound-btn"></button>
      </div>
      <div class="info">
        <div class="emoji">🥳</div>
        <div class="date">In 2025 ! 🌍</div>
        <div class="tag">
          <a href="https://www.theushuaiaexperience.com/en/club/calendar"
             target="_blank" rel="noopener noreferrer">🥳➡️</a>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="video-wrapper">
        <video src="https://embedsocial.com/admin/mediacache/feed-media/17884/17884932837315561/video.mp4"
               autoplay muted loop playsinline preload="auto"></video>
        <button class="sound-btn"></button>
      </div>
      <div class="info">
        <div class="emoji">🔥</div>
        <div class="date">Summer 2025</div>
        <div class="tag">
          <a href="https://www.theushuaiaexperience.com/en/club/calendar"
             target="_blank" rel="noopener noreferrer">🔥➡️</a>
        </div>
      </div>
    </div>

    <!-- ajoute ici toutes les autres cartes générées -->
  </div>

  <!-- Sentinel qui déclenche le chargement des lots suivants -->
  <div id="feed-sentinel"></div>

  <script>
  document.addEventListener("DOMContentLoaded", function () {
    const CAL_URL = "https://www.theushuaiaexperience.com/en/club/calendar";
    const BATCH = 5; // nombre de vidéos par lot
    const cards = Array.from(document.querySelectorAll(".card"));
    const videos = Array.from(document.querySelectorAll("video"));

    // mettre les vidéos en lazy (src -> data-src)
    videos.forEach(v => {
      if (v.src) { v.dataset.src = v.src; v.removeAttribute("src"); }
      v.preload = "none"; v.muted = true; v.playsInline = true; v.load();
    });

    // masquer toutes les cartes sauf les 5 premières
    cards.forEach((c,i)=>{ if(i>=BATCH) c.classList.add("deferred"); });

    // activer une vidéo
    function activateVideo(v){
      if (!v || v.src) return;
      if (v.dataset.src) v.src = v.dataset.src;
      v.addEventListener("loadeddata", ()=> v.classList.add("loaded"), {once:true});
      v.load();
    }

    // observer play/pause
    const playObserver = new IntersectionObserver((entries)=>{
      entries.forEach(({target,isIntersecting})=>{
        if (isIntersecting) { activateVideo(target); target.play().catch(()=>{}); }
        else target.pause();
      });
    },{ threshold:0.25 });

    // charger un lot
    let nextIndex = BATCH;
    function loadNextBatch(){
      const start = nextIndex;
      const end = Math.min(start+BATCH, cards.length);
      for (let i=start; i<end; i++){
        const card = cards[i];
        const vid = card.querySelector("video");
        card.classList.remove("deferred");
        activateVideo(vid);
        playObserver.observe(vid);
      }
      nextIndex = end;
      if (nextIndex>=cards.length) io.disconnect();
    }

    // observer sentinel
    const sentinel = document.getElementById("feed-sentinel");
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting) loadNextBatch(); });
    },{ root:null, rootMargin:"400px 0px" });
    io.observe(sentinel);

    // activer les 5 premières
    videos.slice(0,BATCH).forEach(v=>{ activateVideo(v); playObserver.observe(v); });

    // handlers calendrier
    function openCalendar() {
      const w = window.open(CAL_URL,"_blank");
      if (!w) { try { parent.postMessage({type:"openExternal",url:CAL_URL},"*"); } catch{} }
    }
    const buttons = document.querySelectorAll(".sound-btn");
    videos.forEach((video,i)=>{
      video.addEventListener("click", openCalendar);
      if (buttons[i]) {
        buttons[i].addEventListener("click", (e)=>{ e.stopPropagation(); openCalendar(); });
      }
    });

    // liens externes
    document.querySelectorAll('.tag a').forEach(a=>{
      a.addEventListener('click',(e)=>{
        const w = window.open(a.href,'_blank');
        if (!w) { e.preventDefault(); try { parent.postMessage({type:'openExternal',url:a.href},'*'); } catch{} }
      });
    });
  });
  </script>
</body>
</html>


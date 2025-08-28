// generateStaticFeed.js
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.EMBEDSOCIAL_API_KEY;
const ALBUM_REF = '2b7c1281f1c03b9704c1857b382fc1d5ce7a749c';
const CAL_URL = 'https://www.theushuaiaexperience.com/en/club/calendar';
const BATCH = 5; // nb de cartes chargées par lot

async function generateStaticFeed() {
  try {
    console.log('📱 Connexion à l’API EmbedSocial...');
    const res = await axios.get(
      `https://embedsocial.com/admin/v2/api/social-feed/hashtag-album/media?album_ref=${ALBUM_REF}`,
      { headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' } }
    );

    const posts = Array.isArray(res.data?.data) ? res.data.data : [];
    console.log(`✅ ${posts.length} posts récupérés`);

    const cardsHtml = posts.map((p, i) => {
      const isDeferred = i >= BATCH;
      const cls = isDeferred ? 'card deferred' : 'card';
      const videoSrc = p?.video?.source || '';
      const imageSrc = p?.image || p?.thumbnail || '';

      const media = videoSrc
        ? (isDeferred
            ? `
          <div class="video-wrapper">
            <video data-src="${videoSrc}" autoplay muted loop playsinline preload="none"></video>
            <button class="sound-btn" title="Calendrier"></button>
          </div>`
            : `
          <div class="video-wrapper">
            <video src="${videoSrc}" autoplay muted loop playsinline preload="auto"></video>
            <button class="sound-btn" title="Calendrier"></button>
          </div>`)
        : `<img src="${imageSrc}" alt="post" style="width:100%;display:block">`;

      return `
        <div class="${cls}">
          ${media}
          <div class="info">
            <div class="emoji">🥳</div>
            <div class="date">In 2025 ! 🌍</div>
            <div class="tag">
              <a href="${CAL_URL}" target="_blank" rel="noopener noreferrer">🥳➡️</a>
            </div>
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
  <style>
    html, body { margin:0; padding:0; background:#fff; font-family:sans-serif; }

    /* Carrousel horizontal (rendu 2ᵉ photo) */
    .grid {
      display:flex !important;
      flex-wrap:nowrap !important;
      overflow-x:auto !important;
      overflow-y:hidden !important;
      gap:14px !important;
      padding:10px !important;
      scroll-snap-type:x mandatory !important;
      -webkit-overflow-scrolling:touch !important;
    }
    .grid::-webkit-scrollbar { display:none !important; }
    .grid { scrollbar-width:none !important; }

    /* Cartes compactes */
    .card {
      flex:0 0 165px !important;
      width:165px !important;
      max-width:165px !important;
      border-radius:16px !important;
      overflow:hidden !important;
      background:#fff !important;
      box-shadow:0 2px 6px rgba(0,0,0,.1) !important;
      scroll-snap-align:start !important;
    }

    .video-wrapper { position:relative !important; aspect-ratio:9/16 !important; background:#000 !important; }
    .video-wrapper > video {
      width:100% !important;
      height:100% !important;
      object-fit:cover !important;
      display:block !important;
      opacity:0;
      transition:opacity .8s ease-in-out;
    }
    .video-wrapper > video.loaded { opacity:1; }

    .sound-btn {
      position:absolute; bottom:10px; right:6px;
      width:26px; height:26px; border:none; border-radius:50%;
      background:rgba(0,0,0,.6);
      cursor:pointer;
      background-image:url('data:image/svg+xml;charset=UTF-8,<svg fill="white" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 5V4L5 9H4zm14.5 12.1L3.9 4.5 2.5 5.9 18.1 21.5l.4.4 1.4-1.4-.4-.4z"/></svg>');
      background-repeat:no-repeat; background-position:center; background-size:60%;
    }

    .info { text-align:center !important; padding:8px !important; }
    .emoji { font-size:20px !important; }
    .date { font-weight:700 !important; color:#444 !important; }
    .tag { margin-top:6px !important; display:inline-block !important; }
    .tag a { color:inherit; text-decoration:none; background:yellow; padding:6px; border-radius:6px; font-weight:bold; }

    /* Lazy-load */
    .card.deferred { display:none }
    #feed-sentinel { height:1px }
  </style>
</head>
<body>
  <div class="grid">
    ${cardsHtml}
  </div>
  <div id="feed-sentinel"></div>

  <script>
    document.addEventListener('DOMContentLoaded', function(){
      const CAL_URL='${CAL_URL}';
      const BATCH=${BATCH};
      const grid=document.querySelector('.grid');

      /* Correctif au cas où l'hôte écrase les styles */
      if(grid){
        Object.assign(grid.style,{
          display:'flex',flexWrap:'nowrap',overflowX:'auto',overflowY:'hidden',
          gap:'14px',padding:'10px',scrollSnapType:'x mandatory',WebkitOverflowScrolling:'touch'
        });
        grid.querySelectorAll('.card').forEach(c=>{
          Object.assign(c.style,{
            flex:'0 0 165px',width:'165px',maxWidth:'165px',
            borderRadius:'16px',overflow:'hidden',background:'#fff',
            boxShadow:'0 2px 6px rgba(0,0,0,.1)',scrollSnapAlign:'start'
          });
          const w=c.querySelector('.video-wrapper');
          if(w) Object.assign(w.style,{position:'relative',aspectRatio:'9/16',background:'#000'});
          const v=c.querySelector('video');
          if(v) Object.assign(v.style,{width:'100%',height:'100%',objectFit:'cover',display:'block'});
        });
      }

      const cards=[...document.querySelectorAll('.card')];
      const videos=[...document.querySelectorAll('video')];

      function activateVideo(v){
        if(!v) return;
        if(!v.src && v.dataset.src) v.src=v.dataset.src;
        v.addEventListener('loadeddata',()=>v.classList.add('loaded'),{once:true});
        v.load();
      }

      const playObserver=new IntersectionObserver(entries=>{
        entries.forEach(({target,isIntersecting})=>{
          if(isIntersecting){ activateVideo(target); target.play().catch(()=>{}); }
          else target.pause();
        });
      },{threshold:0.25});

      videos.slice(0,BATCH).forEach(v=>{ activateVideo(v); playObserver.observe(v); });

      let nextIndex=BATCH;
      function loadNextBatch(){
        const start=nextIndex, end=Math.min(start+BATCH,cards.length);
        for(let i=start;i<end;i++){
          const card=cards[i]; const vid=card.querySelector('video');
          card.classList.remove('deferred'); activateVideo(vid); playObserver.observe(vid);
        }
        nextIndex=end; if(nextIndex>=cards.length) io.disconnect();
      }

      const sentinel=document.getElementById('feed-sentinel');
      const io=new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting) loadNextBatch(); }); },{root:null,rootMargin:'400px 0px'});
      io.observe(sentinel);

      function openCalendar(){
        const w=window.open(CAL_URL,'_blank');
        if(!w){ try{ parent.postMessage({type:'openExternal',url:CAL_URL},'*'); }catch(e){} }
      }
      document.querySelectorAll('.sound-btn').forEach(btn=>{
        btn.addEventListener('click',e=>{ e.stopPropagation(); openCalendar(); });
      });
      videos.forEach(v=>v.addEventListener('click',openCalendar));
    });
  </script>
</body>
</html>`;

    fs.writeFileSync('index.html', html);
    console.log('✅ index.html généré avec succès.');
  } catch (err) {
    console.error('❌ Erreur :', err?.message || err);
  }
}

generateStaticFeed();
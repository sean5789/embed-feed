<!DOCTYPE html>
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
      overflow-x: hidden;
      padding-bottom: 0 !important;
    }

    .grid {
      display: flex;
      overflow-x: auto;
      gap: 15px;
      padding: 0 10px;
      scroll-snap-type: x mandatory;
      -ms-overflow-style: none;     /* IE/Edge */
      scrollbar-width: none;        /* Firefox */
    }

    .grid::-webkit-scrollbar {
      display: none;                /* Chrome/Safari */
    }

    .card {
      flex: 0 0 auto;
      width: 240px;
      scroll-snap-align: start;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 0;
    }

    .video-wrapper {
      position: relative;
    }

    video {
      width: 100%;
      display: block;
      opacity: 0;
      transition: opacity 0.8s ease-in-out;
      border-radius: 0;
    }

    video.loaded {
      opacity: 1;
    }

    .sound-btn {
      position: absolute;
      bottom: 12px;
      right: 12px;
      width: 28px;
      height: 28px;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      background-image: url('data:image/svg+xml;charset=UTF-8,<svg fill="white" height="20" width="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 12c0-.8-.3-1.5-.8-2l1.5-1.5c.8.8 1.3 1.9 1.3 3.1s-.5 2.3-1.3 3.1l-1.5-1.5c.5-.5.8-1.2.8-2zm2.5 0c0 1.5-.6 2.8-1.6 3.8l1.5 1.5C20.1 15.9 21 14 21 12s-.9-3.9-2.4-5.3l-1.5 1.5c1 .9 1.6 2.2 1.6 3.8zM4 9v6h4l5 5V4L5 9H4zm16.5 12.1L3.9 4.5 2.5 5.9 7.6 11H4v2h4l5 5v-4.6l5.1 5.1 1.4-1.4z"/></svg>');
      background-repeat: no-repeat;
      background-position: center;
      background-size: 60%;
      transition: opacity 0.3s ease;
    }

    .sound-btn.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .info {
      padding: 6px 10px 4px;
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
    <!-- Les vidéos seront injectées ici automatiquement par Node.js -->
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
        activeBtn.classList.toggle("hidden", !activeVideo.muted);
      }

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
</html>

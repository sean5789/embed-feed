<script>
(() => {
  // === Réglages ===
  const TARGET_ID = "vercel"; // l'ID Bubble de ton élément (ID attribute)
  const RATIO = 1.02;         // height = width * 1.02

  // ✅ Pour éviter "trop petit" si Bubble donne une largeur plus faible que prévu
  const MIN_H = 400;          // ne jamais descendre sous 400px
  const MAX_H = 0;            // 0 = pas de max (mets ex: 650 si tu veux)

  function clamp(n, min, max) {
    if (min && n < min) return min;
    if (max && n > max) return max;
    return n;
  }

  function setHeight() {
    const el = document.getElementById(TARGET_ID);
    if (!el) return;

    const w = el.getBoundingClientRect().width;
    if (!w) return;

    const h = clamp(Math.round(w * RATIO), MIN_H, MAX_H);
    el.style.height = h + "px";

    // Optionnel: si tu as un iframe à l'intérieur et qu'il doit suivre
    const iframe = el.querySelector("iframe");
    if (iframe) iframe.style.height = "100%";
  }

  function initWhenReady() {
    const el = document.getElementById(TARGET_ID);
    if (!el) return false;

    // 1) immédiat
    setHeight();

    // 2) après 2 frames (Bubble/layout + fonts)
    requestAnimationFrame(() => {
      requestAnimationFrame(setHeight);
    });

    // 3) sécurité après délais (iframe / images / Bubble async)
    setTimeout(setHeight, 250);
    setTimeout(setHeight, 800);

    // rotation
    window.addEventListener("orientationchange", () => setTimeout(setHeight, 200));

    return true;
  }

  // Bubble peut rendre après le script -> retry
  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    if (initWhenReady() || tries > 30) clearInterval(timer);
  }, 100);
})();
</script>



(() => {
  const DURATION_MS = 5500;
  const RAIN_COUNT = 28;
  const BURST_COUNT = 18;
  const PLAY_SOUND = true;
  const IMAGE_CANDIDATES = [
    'images/chayanne.gif',
    'images/chayanne.png',
    'images/chayanne.jpg',
    'images/chayanne.webp',
  ];
  // Only the final confirmation buttons, so opening the merge box does not trigger it twice.
  const MERGE_LABEL = /confirm\b.*\bmerge|merge when ready|add to merge queue|confirm auto-merge/i;

  let running = false;
  let imagesPromise;

  function loadImages() {
    imagesPromise ??= Promise.all(
      IMAGE_CANDIDATES.map(
        (path) =>
          new Promise((resolve) => {
            const url = chrome.runtime.getURL(path);
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => resolve(null);
            img.src = url;
          })
      )
    ).then((urls) => urls.filter(Boolean));
    return imagesPromise;
  }

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  function visual(images, className, width) {
    if (images.length) {
      const img = document.createElement('img');
      img.src = pick(images);
      img.className = className;
      return img;
    }
    const stamp = document.createElement('div');
    stamp.className = `${className} stamp`;
    stamp.innerHTML = 'Aprobado<small>por</small>Chayanne';
    if (width) stamp.style.setProperty('--fs', `${width / 6}px`);
    return stamp;
  }

  function buildRain(container, images) {
    for (let i = 0; i < RAIN_COUNT; i++) {
      const w = rand(70, 170);
      const el = visual(images, 'drop', w);
      el.style.cssText += `--x:${rand(-5, 95)}vw;--w:${w}px;--rot:${rand(-540, 540)}deg;--dur:${rand(1.8, 3.6)}s;--delay:${rand(0, 2.2)}s`;
      container.appendChild(el);
    }
    for (let i = 0; i < BURST_COUNT; i++) {
      const w = rand(60, 140);
      const angle = (i / BURST_COUNT) * Math.PI * 2;
      const dist = rand(35, 60);
      const el = visual(images, 'pop', w);
      el.style.cssText += `--w:${w}px;--dx:${Math.cos(angle) * dist}vw;--dy:${Math.sin(angle) * dist}vh;--rot:${rand(-360, 360)}deg;--dur:${rand(1.2, 2)}s;--delay:${rand(0.1, 0.5)}s`;
      container.appendChild(el);
    }
  }

  function runConfetti(canvas, isDone) {
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
    };
    resize();
    const colors = ['#ffd700', '#ff3d7f', '#00e5ff', '#7cff4f', '#ffffff', '#ff8a00'];
    const pieces = [];
    const cannon = (x, dir) => {
      for (let i = 0; i < 110; i++) {
        pieces.push({
          x,
          y: canvas.height,
          vx: dir * rand(4, 15),
          vy: -rand(14, 26),
          size: rand(6, 13),
          rot: rand(0, Math.PI),
          vr: rand(-0.3, 0.3),
          color: pick(colors),
        });
      }
    };
    cannon(0, 1);
    cannon(canvas.width, -1);
    setTimeout(() => !isDone() && (cannon(0, 1), cannon(canvas.width, -1)), 1400);

    const frame = () => {
      if (isDone()) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.vy += 0.35;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function playFanfare() {
    if (!PLAY_SOUND) return;
    try {
      const audio = new AudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
      const times = [0, 0.12, 0.24, 0.36, 0.6, 0.72];
      const lengths = [0.12, 0.12, 0.12, 0.24, 0.12, 0.9];
      notes.forEach((freq, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        const start = audio.currentTime + times[i];
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + lengths[i]);
        osc.connect(gain).connect(audio.destination);
        osc.start(start);
        osc.stop(start + lengths[i] + 0.05);
      });
      setTimeout(() => audio.close(), 2500);
    } catch {
      // Audio is a bonus; the visual effect plays regardless.
    }
  }

  function shakePage() {
    const shake = [0, -14, 12, -10, 8, -5, 3, 0].map((x, i) => ({
      transform: `translate(${x}px, ${i % 2 ? 6 : -6}px)`,
    }));
    document.body.animate(shake, { duration: 550, delay: 250, easing: 'ease-out' });
  }

  async function celebrate() {
    if (running) return;
    running = true;
    let done = false;

    const images = await loadImages();
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>${CSS}</style>
      <div class="stage">
        <div class="dim"></div>
        <div class="rays"></div>
        <canvas></canvas>
        <div class="rain"></div>
        <div class="hero"></div>
        <div class="flash"></div>
      </div>`;

    const hero = root.querySelector('.hero');
    hero.appendChild(visual(images, 'hero-visual'));
    if (images.length) {
      const banner = document.createElement('div');
      banner.className = 'banner';
      banner.textContent = '¡Aprobado por Chayanne!';
      hero.appendChild(banner);
    }
    buildRain(root.querySelector('.rain'), images);
    document.documentElement.appendChild(host);

    runConfetti(root.querySelector('canvas'), () => done);
    playFanfare();
    shakePage();

    setTimeout(() => root.querySelector('.stage').classList.add('out'), DURATION_MS - 700);
    setTimeout(() => {
      done = true;
      host.remove();
      running = false;
    }, DURATION_MS);
  }

  document.addEventListener(
    'click',
    (event) => {
      const button = event.target.closest?.('button, input[type="submit"], [role="button"]');
      if (!button) return;
      const label = (button.innerText || button.value || button.getAttribute('aria-label') || '').trim();
      if (MERGE_LABEL.test(label)) celebrate();
    },
    true
  );

  chrome.runtime.onMessage.addListener((message) => {
    if (message === 'chayanne') celebrate();
  });

  const CSS = `
    .stage { position: fixed; inset: 0; overflow: hidden; transition: opacity .7s ease; }
    .stage.out { opacity: 0; }
    .dim { position: absolute; inset: 0; background: radial-gradient(circle, rgba(60,20,0,.35), rgba(0,0,0,.8)); animation: fade-in .3s ease-out both; }
    .flash { position: absolute; inset: 0; background: #fff; animation: flash .45s ease-out forwards; }
    .rays {
      position: absolute; left: 50%; top: 50%; width: 260vmax; height: 260vmax; margin: -130vmax 0 0 -130vmax;
      background: repeating-conic-gradient(rgba(255,215,0,.32) 0 9deg, transparent 9deg 18deg);
      -webkit-mask: radial-gradient(circle, #000 0, transparent 45%); mask: radial-gradient(circle, #000 0, transparent 45%);
      animation: spin 9s linear infinite, fade-in .5s ease-out both;
    }
    canvas { position: absolute; inset: 0; }
    .hero {
      position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
      display: flex; flex-direction: column; align-items: center; gap: 18px;
    }
    .hero-visual { animation: slam .75s cubic-bezier(.2,1.6,.4,1) both, pulse .8s ease-in-out .75s infinite alternate; }
    img.hero-visual {
      max-width: 60vw; max-height: 55vh; border: 8px solid #fff; border-radius: 14px;
      box-shadow: 0 0 0 6px #ffd700, 0 0 80px 20px rgba(255,215,0,.75);
    }
    .stamp.hero-visual { --fs: clamp(44px, 9vw, 130px); }
    .banner {
      font: 900 clamp(30px, 6.5vw, 92px)/1 Impact, "Arial Black", sans-serif; text-transform: uppercase; white-space: nowrap;
      background: linear-gradient(180deg, #fff6a8, #ffd700 45%, #ff9d00); -webkit-background-clip: text; background-clip: text; color: transparent;
      -webkit-text-stroke: 2px #6b2f00; filter: drop-shadow(0 6px 0 #6b2f00) drop-shadow(0 0 25px rgba(255,200,0,.8));
      animation: slam .7s cubic-bezier(.2,1.6,.4,1) .3s both, wobble 1.2s ease-in-out 1s infinite;
    }
    .stamp {
      display: flex; flex-direction: column; align-items: center; font: 900 var(--fs, 20px)/.95 Impact, "Arial Black", sans-serif;
      text-transform: uppercase; color: #e0245e; background: rgba(255,255,255,.92); border: calc(var(--fs, 20px) / 9) solid #e0245e;
      border-radius: calc(var(--fs, 20px) / 4); padding: .25em .45em; box-shadow: 0 0 40px rgba(224,36,94,.6); rotate: -10deg;
    }
    .stamp small { font-size: .45em; padding: .15em 0; }
    .drop, .pop { position: absolute; width: var(--w); }
    .stamp.drop, .stamp.pop { width: auto; }
    img.drop, img.pop { border-radius: 10px; border: 3px solid #fff; box-shadow: 0 6px 20px rgba(0,0,0,.5); }
    .drop { top: -30vh; left: var(--x); animation: fall var(--dur) linear var(--delay) both; }
    .pop { left: 50%; top: 50%; opacity: 0; animation: pop var(--dur) cubic-bezier(.1,.8,.3,1) var(--delay) forwards; }
    @keyframes fade-in { from { opacity: 0; } }
    @keyframes flash { from { opacity: .95; } to { opacity: 0; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slam { 0% { transform: scale(5) rotate(-25deg); opacity: 0; } 60% { opacity: 1; } 100% { transform: scale(1) rotate(-6deg); } }
    @keyframes pulse { to { transform: scale(1.07) rotate(4deg); } }
    @keyframes wobble { 0%, 100% { transform: rotate(-6deg) scale(1); } 50% { transform: rotate(4deg) scale(1.08); } }
    @keyframes fall { to { transform: translateY(150vh) rotate(var(--rot)); } }
    @keyframes pop {
      0% { transform: translate(-50%, -50%) scale(.2); opacity: 1; }
      75% { opacity: 1; }
      100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.1) rotate(var(--rot)); opacity: 0; }
    }
  `;
})();

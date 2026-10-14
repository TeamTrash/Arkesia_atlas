// Procedural cloud curtain: no image compression, external assets or video playback.
function createCloudTransition(viewport) {
  const canvas = document.createElement('canvas');
  canvas.className = 'cloud-transition';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  viewport.append(canvas);
  const context = canvas.getContext('2d');
  let textures;
  const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  function noise(x, y, seed) {
    const hash = (a, b) => { const n = Math.sin(a * 127.1 + b * 311.7 + seed * 74.7) * 43758.5453; return n - Math.floor(n); };
    const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy);
    const a = hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx;
    const b = hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx;
    return a * (1 - fy) + b * fy;
  }
  function texture(seed) {
    const sprite = document.createElement('canvas');
    sprite.width = 480; sprite.height = 360;
    const ctx = sprite.getContext('2d');
    const pixels = ctx.createImageData(sprite.width, sprite.height);
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const nx = x / sprite.width, ny = y / sprite.height;
        let cloud = 0, amplitude = .55, frequency = 4;
        for (let octave = 0; octave < 5; octave++) {
          cloud += noise(nx * frequency, ny * frequency, seed) * amplitude;
          frequency *= 2; amplitude *= .5;
        }
        const radius = Math.hypot((nx - .5) * 2, (ny - .5) * 2);
        // Broad billows shape the silhouette; fine noise only adds soft detail.
        const billow = noise(nx * 7, ny * 7, seed + 3);
        const density = smooth((1 - radius + (billow - .5) * .85) * 6) * smooth((1 - radius) * 9);
        // White sunlit tops, with pale blue-gray shadows rather than dark smoke.
        const light = Math.min(253, 202 + cloud * 61 + (1 - ny) * 7);
        const i = (y * sprite.width + x) * 4;
        pixels.data[i] = light;
        pixels.data[i + 1] = light + 2;
        pixels.data[i + 2] = light + 3;
        pixels.data[i + 3] = density * 255;
      }
    }
    ctx.putImageData(pixels, 0, 0);
    return sprite;
  }
  const clouds = Array.from({ length: 35 }, (_, index) => ({
    x: (index % 7 - .5) / 5 + Math.sin(index * 7.1) * .045,
    y: (Math.floor(index / 7) - .5) / 3 + Math.cos(index * 4.3) * .055,
    seed: index % 4,
    size: .48 + (Math.sin(index * 8.2) + 1) * .05,
    drift: Math.sin(index * 3.7)
  }));
  function draw(progress, entering) {
    const width = viewport.clientWidth, height = viewport.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    const cover = entering ? smooth(progress) : 1 - smooth(progress);
    // A dense center hides the image swap; textured banks remain in front of it.
    context.globalAlpha = smooth((cover - .45) / .45);
    context.fillStyle = '#e4ebee';
    context.fillRect(0, 0, width, height);
    for (const cloud of clouds) {
      const spread = (1 - cover) * 1.65;
      const cx = (cloud.x + (cloud.x - .5) * spread) * width;
      const cy = (cloud.y + (cloud.y - .5) * spread + cloud.drift * (1 - cover) * .08) * height;
      const w = width * cloud.size * (1 + (1 - cover) * .35);
      const h = height * .72;
      context.globalAlpha = smooth(cover * 2.4);
      context.drawImage(textures[cloud.seed], cx - w / 2, cy - h / 2, w, h);
    }
    context.globalAlpha = 1;
  }
  function animate(duration, entering) {
    return new Promise(resolve => {
      const start = performance.now();
      function frame(now) {
        const progress = Math.min(1, (now - start) / duration);
        draw(progress, entering);
        if (progress < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }
  return {
    async play(changeMap) {
      if (!context || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { await changeMap(); return; }
      textures ||= [1, 8, 17, 29].map(texture);
      canvas.hidden = false;
      try {
        await animate(260, true);
        await changeMap();
        await animate(650, false);
      } finally {
        canvas.hidden = true;
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };
}

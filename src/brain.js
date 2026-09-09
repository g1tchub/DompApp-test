// Decorative learning metaphor, generated deterministically rather than anatomical data.
export function mountBrain(canvas, progress = 0) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  let seed = 43;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const points = [],
    neurons = [],
    edges = [],
    meridians = [];
  for (const side of [-1, 1]) {
    for (let col = 0; col < 40; col++) {
      const line = [];
      for (let row = 1; row < 30; row++) {
        const t = (row / 30) * Math.PI,
          p = (col / 40) * Math.PI * 2;
        const folds =
          1 +
          0.048 * Math.sin(p * 7 + t * 5) +
          0.023 * Math.cos(t * 17 - p * 3);
        const point = {
          x: side * (0.1 + Math.abs(Math.sin(t) * Math.cos(p)) * 1.03) * folds,
          y: Math.cos(t) * 0.91 * folds,
          z: Math.sin(t) * Math.sin(p) * 0.77 * folds,
          shine: rand(),
        };
        points.push(point);
        line.push(point);
      }
      if (col % 2 === 0) meridians.push(line);
    }
    for (let i = 0; i < 90; i++) {
      const t = 0.35 + rand() * 2.3,
        p = rand() * Math.PI * 2;
      neurons.push({
        x: side * (0.11 + Math.abs(Math.sin(t) * Math.cos(p)) * 1.02),
        y: Math.cos(t) * 0.9,
        z: Math.sin(t) * Math.sin(p) * 0.82,
        weight: rand(),
      });
    }
  }
  neurons.sort((a, b) => a.weight - b.weight);
  neurons.forEach((a, i) =>
    neurons
      .map((b, j) => ({
        j,
        d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2,
      }))
      .filter((n) => n.j > i && n.d < 0.6)
      .sort((a, b) => a.d - b.d)
      .slice(0, 4)
      .forEach((n) => edges.push([i, n.j])),
  );
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let frame,
    width = 0,
    height = 0,
    level = progress;
  const started = performance.now();
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const mix = (a, b, t) =>
    a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",");
  function project(p) {
    const turn = -0.32,
      tilt = -0.13;
    const x = p.x * Math.cos(turn) + p.z * Math.sin(turn),
      z = -p.x * Math.sin(turn) + p.z * Math.cos(turn);
    const y = p.y * Math.cos(tilt) - z * Math.sin(tilt),
      depth = p.y * Math.sin(tilt) + z * Math.cos(tilt);
    const scale = Math.min(
      width * (0.34 - clamp((level - 75) / 25) * 0.11),
      height * 0.33,
    );
    return { x: width / 2 + x * scale, y: height / 2 - y * scale, z: depth };
  }
  function dot(x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function draw(now) {
    const stage = level / 100,
      gold = clamp((level - 70) / 22),
      dark = clamp((level - 32) / 25);
    const color = mix([123, 99, 220], [255, 207, 105], gold),
      time = reduced.matches ? 0 : (now - started) / 1000;
    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.6,
    );
    bg.addColorStop(0, `rgb(${mix([233, 229, 252], [34, 24, 66], dark)})`);
    bg.addColorStop(1, `rgb(${mix([250, 250, 255], [9, 13, 27], dark)})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    if (level > 55) {
      ctx.globalAlpha = clamp((level - 55) / 15) * 0.24;
      ctx.font = "11px monospace";
      for (let col = 0; col < Math.ceil(width / 24); col++)
        for (let row = 0; row < 9; row++) {
          const y =
            ((row * 43 + col * 67 + time * (16 + (col % 5))) % (height + 40)) -
            20;
          ctx.fillStyle = row % 3 ? "#51cfbb" : `rgb(${color})`;
          ctx.fillText("01學∞10記憶"[(col * 3 + row) % 8], col * 24, y);
        }
    }
    ctx.globalAlpha = clamp((level - 32) / 20);
    if (level > 32)
      for (let ring = 0; ring < 3; ring++) {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-0.35 + ring * 0.4);
        const rx = Math.min(width * 0.39, height * 0.6),
          ry = height * (0.17 + ring * 0.035);
        ctx.strokeStyle = `rgba(${ring === 1 ? "73,220,202" : color},.22)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        for (let n = 0; n < 5; n++) {
          const angle = time * 0.25 + (n * Math.PI * 2) / 5 + ring;
          dot(
            Math.cos(angle) * rx,
            Math.sin(angle) * ry,
            2,
            `rgba(${color},.8)`,
          );
        }
        ctx.restore();
      }
    const wings = clamp((level - 88) / 12);
    if (wings > 0) {
      ctx.globalAlpha = wings;
      const scale = Math.min(width * 0.46, height * 0.95);
      for (const side of [-1, 1])
        for (let feather = 0; feather < 15; feather++) {
          const f = feather / 14,
            bx = width / 2 + side * scale * 0.32,
            by = height * 0.6;
          const tx = width / 2 + side * scale * (0.54 + (1 - f) * 0.43) * wings,
            ty = height * (0.14 + f * 0.55);
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(tx, ty + 60, tx, ty);
          ctx.quadraticCurveTo(tx - side * 24, ty + 18, bx, by);
          ctx.fillStyle = `rgba(255,222,157,${0.07 + f * 0.008})`;
          ctx.strokeStyle = "rgba(255,221,153,.6)";
          ctx.fill();
          ctx.stroke();
        }
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#ffce78";
      ctx.strokeStyle = "#ffe2a3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(
        width / 2,
        height * 0.12,
        Math.min(width * 0.09, 50),
        9,
        -0.08,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    ctx.restore();
    meridians.forEach((line) => {
      ctx.beginPath();
      line
        .map(project)
        .forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.strokeStyle = `rgba(${color},${0.06 + stage * 0.1})`;
      ctx.lineWidth = 0.65;
      ctx.stroke();
    });
    points
      .filter((p) => p.shine < 0.18 + stage * 0.82)
      .map((p) => ({ ...p, ...project(p) }))
      .sort((a, b) => a.z - b.z)
      .forEach((p) => {
        const depth = (p.z + 1) / 2;
        dot(
          p.x,
          p.y,
          0.55 + depth * 0.65,
          `rgba(${color},${0.12 + depth * (0.25 + stage * 0.35)})`,
        );
      });
    const projected = neurons.map(project),
      activeCount = Math.round(stage * neurons.length);
    edges.forEach(([a, b], i) => {
      if (a >= activeCount || b >= activeCount) return;
      const p = projected[a],
        q = projected[b];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = `rgba(${color},${0.3 + stage * 0.35})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      const t = (time * 0.6 + i * 0.137) % 1;
      dot(
        p.x + (q.x - p.x) * t,
        p.y + (q.y - p.y) * t,
        1.5,
        `rgba(${color},.9)`,
      );
    });
    const nodeScale = Math.min(1, Math.max(0.5, width / 650));
    projected.slice(0, activeCount).forEach((p) => {
      const radius = 14 * nodeScale;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      glow.addColorStop(0, `rgba(${color},.45)`);
      glow.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
      dot(p.x, p.y, 2.6 * nodeScale, `rgb(${color})`);
      dot(p.x - 0.5, p.y - 0.6, 0.8 * nodeScale, "#fff");
    });
    if (!reduced.matches && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  const refresh = () => {
    cancelAnimationFrame(frame);
    draw(performance.now());
  };
  const resize = () => {
    const box = canvas.getBoundingClientRect();
    width = box.width;
    height = box.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    refresh();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  reduced.addEventListener("change", refresh);
  document.addEventListener("visibilitychange", refresh);
  const dispose = () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    reduced.removeEventListener("change", refresh);
    document.removeEventListener("visibilitychange", refresh);
  };
  dispose.setProgress = (value) => {
    level = Math.max(0, Math.min(100, value));
    refresh();
  };
  return dispose;
}

/* Hero demo: perspective rectification from four corner points.
   The car is a flat drawing placed in the "camera view" with a homography.
   The four handles define a quadrilateral Q; the output shows the camera
   view warped by the homography that maps Q onto the plate rectangle.
   When Q matches the true plate corners, the output is the flat plate. */
(() => {
  "use strict";
  const root = document.getElementById("rectifier");
  if (!root) return;

  const W = 340, H = 230;          // design coordinates of the camera view
  const OUT_W = 285, OUT_H = 60;   // rectified plate (EU plate ratio 4.75:1)
  const PLATE = [[113, 128], [227, 128], [227, 152], [113, 152]]; // in the flat car drawing
  const CAMERA = [[30, 22], [326, -4], [318, 212], [44, 238]];    // where the drawing's frame lands

  const stage = document.getElementById("rectStage");
  const canvas = document.getElementById("rectCanvas");
  const car = document.getElementById("rectCar");
  const poly = document.getElementById("rectPoly");
  const outStage = document.getElementById("rectOutStage");
  const out = document.getElementById("rectOut");
  const iouEl = document.getElementById("rectIou");
  const handles = [...root.querySelectorAll(".rect-handle")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Linear algebra ---- */
  // Homography mapping four source points to four destination points (3x3, row-major).
  function homography(src, dst) {
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    const h = solve(A, b);
    return h ? [...h, 1] : null;
  }
  // Gaussian elimination with partial pivoting.
  function solve(A, b) {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-10) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < n; r++) {
        const f = M[r][c] / M[c][c];
        for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    const x = new Array(n);
    for (let r = n - 1; r >= 0; r--) {
      let s = M[r][n];
      for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
      x[r] = s / M[r][r];
    }
    return x;
  }
  const mul = (a, b) => {
    const m = new Array(9);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
      m[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
    return m;
  };
  const apply = (h, [x, y]) => {
    const w = h[6] * x + h[7] * y + h[8];
    return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
  };
  const css = (h) => `matrix3d(${h[0]},${h[3]},0,${h[6]},${h[1]},${h[4]},0,${h[7]},0,0,1,0,${h[2]},${h[5]},0,${h[8]})`;

  /* ---- Polygon IoU (Sutherland-Hodgman clipping against the convex true plate) ---- */
  const area = (p) => {
    let s = 0;
    for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; s += x1 * y2 - x2 * y1; }
    return s / 2;
  };
  function clip(subject, clipper) {
    let output = subject;
    const sign = Math.sign(area(clipper)) || 1;
    for (let i = 0; i < clipper.length && output.length; i++) {
      const a = clipper[i], b = clipper[(i + 1) % clipper.length];
      const inside = (p) => sign * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
      const cross = (p, q) => {
        const d1 = [q[0] - p[0], q[1] - p[1]], d2 = [b[0] - a[0], b[1] - a[1]];
        const t = ((a[0] - p[0]) * d2[1] - (a[1] - p[1]) * d2[0]) / (d1[0] * d2[1] - d1[1] * d2[0]);
        return [p[0] + t * d1[0], p[1] + t * d1[1]];
      };
      const input = output; output = [];
      for (let j = 0; j < input.length; j++) {
        const cur = input[j], prev = input[(j + input.length - 1) % input.length];
        if (inside(cur)) { if (!inside(prev)) output.push(cross(prev, cur)); output.push(cur); }
        else if (inside(prev)) output.push(cross(prev, cur));
      }
    }
    return output;
  }
  function iou(q, truth) {
    const inter = Math.abs(area(clip(q, truth)));
    const union = Math.abs(area(q)) + Math.abs(area(truth)) - inter;
    return union > 0 ? Math.max(0, Math.min(1, inter / union)) : 0;
  }

  /* ---- Scene setup ---- */
  const FRAME = [[0, 0], [W, 0], [W, H], [0, H]];
  const OUT_RECT = [[0, 0], [OUT_W, 0], [OUT_W, OUT_H], [0, OUT_H]];
  const hCar = homography(FRAME, CAMERA);
  const TRUTH = PLATE.map((p) => apply(hCar, p));
  car.style.transform = css(hCar);

  // The output shows a second copy of the car, warped by (Q -> rectangle) * (drawing -> camera).
  const outCar = car.cloneNode(true);
  outCar.removeAttribute("id");
  outCar.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  out.appendChild(outCar);

  // Start from a loose axis-aligned box, like a plain detector would give.
  const xs = TRUTH.map((p) => p[0]), ys = TRUTH.map((p) => p[1]);
  const pad = 9;
  const BOX = [
    [Math.min(...xs) - pad, Math.min(...ys) - pad], [Math.max(...xs) + pad, Math.min(...ys) - pad],
    [Math.max(...xs) + pad, Math.max(...ys) + pad], [Math.min(...xs) - pad, Math.max(...ys) + pad],
  ];
  let quad = (reduceMotion ? TRUTH : BOX).map((p) => [...p]);

  function render() {
    poly.setAttribute("points", quad.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" "));
    handles.forEach((h, i) => { h.style.transform = `translate(${quad[i][0]}px, ${quad[i][1]}px)`; });
    const hOut = homography(quad, OUT_RECT);
    if (hOut) outCar.style.transform = css(mul(hOut, hCar));
    iouEl.textContent = iou(quad, TRUTH).toFixed(2);
  }

  function fit() {
    canvas.style.transform = `scale(${stage.clientWidth / W})`;
    out.style.transform = `scale(${outStage.clientWidth / OUT_W})`;
  }
  fit();
  if ("ResizeObserver" in window) new ResizeObserver(fit).observe(stage);
  else window.addEventListener("resize", fit);

  /* ---- Animation between two quads ---- */
  let raf = 0;
  function animateTo(target, duration = 900) {
    cancelAnimationFrame(raf);
    if (reduceMotion) { quad = target.map((p) => [...p]); render(); return; }
    const from = quad.map((p) => [...p]);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      quad = from.map((p, i) => [p[0] + (target[i][0] - p[0]) * e, p[1] + (target[i][1] - p[1]) * e]);
      render();
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  /* ---- Interaction ---- */
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const toLocal = (e) => {
    const r = stage.getBoundingClientRect();
    const s = r.width / W;
    return [clamp((e.clientX - r.left) / s, 4, W - 4), clamp((e.clientY - r.top) / s, 4, H - 4)];
  };
  handles.forEach((handle, i) => {
    handle.addEventListener("pointerdown", (e) => {
      cancelAnimationFrame(raf);
      handle.setPointerCapture(e.pointerId);
      handle.classList.add("is-dragging");
      e.preventDefault();
    });
    handle.addEventListener("pointermove", (e) => {
      if (!handle.hasPointerCapture(e.pointerId)) return;
      quad[i] = toLocal(e);
      render();
    });
    const release = (e) => {
      handle.classList.remove("is-dragging");
      if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    };
    handle.addEventListener("pointerup", release);
    handle.addEventListener("pointercancel", release);
    handle.addEventListener("keydown", (e) => {
      const stepSize = e.shiftKey ? 6 : 2;
      const moves = { ArrowLeft: [-stepSize, 0], ArrowRight: [stepSize, 0], ArrowUp: [0, -stepSize], ArrowDown: [0, stepSize] };
      const m = moves[e.key];
      if (!m) return;
      e.preventDefault();
      cancelAnimationFrame(raf);
      quad[i] = [clamp(quad[i][0] + m[0], 4, W - 4), clamp(quad[i][1] + m[1], 4, H - 4)];
      render();
    });
  });
  document.getElementById("rectReset").addEventListener("click", () => animateTo(TRUTH, 500));

  render();
  // Opening move: the loose box tightens onto the plate corners.
  if (!reduceMotion) setTimeout(() => animateTo(TRUTH), 1100);
})();

/* ── Interactive Simulations (Plotly.js) ──────── */
(function () {
  'use strict';

  const DARK = {
    paper_bgcolor: '#1a1f2e',
    plot_bgcolor:  '#111827',
    font: { color: '#c8d0e0', family: 'system-ui, sans-serif' },
    xaxis: { gridcolor: '#232d3f', zerolinecolor: '#374151' },
    yaxis: { gridcolor: '#232d3f', zerolinecolor: '#374151' },
    margin: { t: 40, r: 20, b: 50, l: 55 },
  };

  function cfg() { return { responsive: true, displayModeBar: false }; }
  function layout(extra) { return Object.assign({}, DARK, extra); }
  function get(simId, ctrlId) { return window.ctrlVal(simId, ctrlId); }
  function el(simId) { return document.getElementById('sim-' + simId); }

  // ── 1. Forward Euler Demo ──────────────────────
  function eulerDemo() {
    const id = 'euler-demo';
    const k = get(id, 'k') || 0.5;
    const h = get(id, 'h') || 0.5;
    const T = 10;
    const tExact = [], yExact = [];
    for (let t = 0; t <= T; t += 0.05) { tExact.push(t); yExact.push(Math.exp(-k * t)); }
    const tEuler = [0], yEuler = [1.0];
    let t = 0, y = 1.0;
    while (t < T - 1e-9) {
      y = y + h * (-k * y);
      t = t + h;
      tEuler.push(parseFloat(t.toFixed(6)));
      yEuler.push(y);
    }
    const err = Math.abs(yEuler[yEuler.length - 1] - Math.exp(-k * T)).toFixed(5);
    Plotly.newPlot(el(id), [
      { x: tExact, y: yExact, name: 'Exact: e^(−kt)', line: { color: '#00a651', width: 2 } },
      { x: tEuler, y: yEuler, name: `Forward Euler (h=${h})`, mode: 'lines+markers',
        marker: { size: 5, color: '#f87171' }, line: { color: '#f87171', width: 1.5 } },
    ], layout({ title: `Exponential Decay — Error at t=10: ${err}`, xaxis: { title: 'Time t' }, yaxis: { title: 'y(t)' } }), cfg());
  }

  // ── 2. ODE Method Comparison ───────────────────
  function rk4Comparison() {
    const id = 'rk4-comparison';
    const h = get(id, 'h') || 0.4;
    const k = 1.0, T = 8;
    const f = (t, y) => -k * y;
    // Exact
    const tEx = [], yEx = [];
    for (let t = 0; t <= T; t += 0.05) { tEx.push(t); yEx.push(Math.exp(-k * t)); }
    // Euler
    function euler(h) {
      const ts = [0], ys = [1.0];
      let t = 0, y = 1.0;
      while (t < T - 1e-9) { y += h * f(t, y); t += h; ts.push(t); ys.push(y); }
      return [ts, ys];
    }
    // RK2 (Heun)
    function rk2(h) {
      const ts = [0], ys = [1.0];
      let t = 0, y = 1.0;
      while (t < T - 1e-9) {
        const k1 = h * f(t, y);
        const k2 = h * f(t + h, y + k1);
        y += (k1 + k2) / 2; t += h;
        ts.push(t); ys.push(y);
      }
      return [ts, ys];
    }
    // RK4
    function rk4(h) {
      const ts = [0], ys = [1.0];
      let t = 0, y = 1.0;
      while (t < T - 1e-9) {
        const k1 = h * f(t, y);
        const k2 = h * f(t + h/2, y + k1/2);
        const k3 = h * f(t + h/2, y + k2/2);
        const k4 = h * f(t + h, y + k3);
        y += (k1 + 2*k2 + 2*k3 + k4) / 6; t += h;
        ts.push(t); ys.push(y);
      }
      return [ts, ys];
    }
    const [te, ye] = euler(h);
    const [tr2, yr2] = rk2(h);
    const [tr4, yr4] = rk4(h);
    Plotly.newPlot(el(id), [
      { x: tEx, y: yEx, name: 'Exact', line: { color: '#6ee7b7', width: 2 } },
      { x: te, y: ye, name: 'Euler O(h)', mode: 'lines+markers', marker: { size: 5 }, line: { color: '#f87171' } },
      { x: tr2, y: yr2, name: 'RK2 O(h²)', mode: 'lines+markers', marker: { size: 5 }, line: { color: '#fbbf24' } },
      { x: tr4, y: yr4, name: 'RK4 O(h⁴)', mode: 'lines+markers', marker: { size: 5 }, line: { color: '#60a5fa' } },
    ], layout({ title: `Solver Comparison (h = ${h})`, xaxis: { title: 't' }, yaxis: { title: 'y(t)' } }), cfg());
  }

  // ── 3. 1D Heat Equation (FTCS) ─────────────────
  function heatPDE() {
    const id = 'heat-pde';
    const alpha = get(id, 'alpha') || 0.1;
    const Nx = 60, dx = 1 / (Nx - 1), dt = 0.4 * dx * dx / alpha;
    let u = new Array(Nx).fill(0);
    const x = Array.from({ length: Nx }, (_, i) => i * dx);
    // IC: sin(πx)
    for (let i = 0; i < Nx; i++) u[i] = Math.sin(Math.PI * x[i]);
    const r = alpha * dt / (dx * dx);
    const times = [0, 0.05, 0.15, 0.30, 0.60];
    const snapshots = [];
    let t = 0;
    snapshots.push({ t: 0, y: [...u] });
    let nextSnap = 1;
    const maxSteps = 20000;
    for (let step = 0; step < maxSteps && nextSnap < times.length; step++) {
      const un = [...u];
      for (let i = 1; i < Nx - 1; i++) u[i] = un[i] + r * (un[i+1] - 2*un[i] + un[i-1]);
      u[0] = 0; u[Nx-1] = 0; t += dt;
      while (nextSnap < times.length && t >= times[nextSnap] - 1e-12) {
        snapshots.push({ t: times[nextSnap], y: [...u] });
        nextSnap++;
      }
    }
    const colors = ['#00a651','#34d399','#fbbf24','#f87171','#c084fc'];
    const traces = snapshots.map((s, i) => ({
      x, y: s.y, name: `t = ${s.t.toFixed(2)}`,
      line: { color: colors[i % colors.length], width: 2 }
    }));
    Plotly.newPlot(el(id), traces,
      layout({ title: `Heat Equation — α = ${alpha}`, xaxis: { title: 'x', range: [0,1] }, yaxis: { title: 'u(x,t)', range: [-0.05, 1.05] } }), cfg());
  }

  // ── 4. Gradient Descent ────────────────────────
  function gradientDescent() {
    const id = 'gradient-descent';
    const lr = get(id, 'lr') || 0.15;
    const steps = Math.round(get(id, 'steps') || 30);
    // f(x,y) = (x-2)^2 + 3*(y-1)^2
    const f = (x, y) => (x-2)**2 + 3*(y-1)**2;
    const gx = (x) => 2*(x-2);
    const gy = (y) => 6*(y-1);
    // Contour data
    const xs = [], ys = [];
    for (let v = -1; v <= 4.5; v += 0.06) xs.push(v);
    for (let v = -1; v <= 3.5; v += 0.06) ys.push(v);
    const z = ys.map(y => xs.map(x => f(x, y)));
    // GD trajectory
    let cx = -0.5, cy = -0.5;
    const px = [cx], py = [cy], pz = [f(cx, cy)];
    for (let i = 0; i < steps; i++) {
      cx -= lr * gx(cx);
      cy -= lr * gy(cy);
      px.push(cx); py.push(cy); pz.push(f(cx, cy));
    }
    Plotly.newPlot(el(id), [
      { type: 'contour', x: xs, y: ys, z,
        colorscale: 'Blues', reversescale: true, showscale: false,
        contours: { coloring: 'heatmap', showlabels: true, labelfont: { size: 9, color: '#fff' } },
        name: 'Loss f(x,y)' },
      { type: 'scatter', x: px, y: py, mode: 'lines+markers',
        marker: { size: 6, color: '#f87171', symbol: 'circle' },
        line: { color: '#f87171', width: 2 }, name: 'GD path' },
      { type: 'scatter', x: [2], y: [1], mode: 'markers',
        marker: { size: 12, color: '#00a651', symbol: 'star' }, name: 'Minimum' },
    ], layout({
      title: `Gradient Descent — lr=${lr}, steps=${steps}`,
      xaxis: { title: 'x' }, yaxis: { title: 'y' },
      showlegend: true,
    }), cfg());
  }

  // ── 5. Newton's Method (root finding) ─────────
  function newtonMethod() {
    const id = 'newton-method';
    const x0 = get(id, 'x0') || 3.0;
    const f  = x => x**3 - 2*x - 5;
    const df = x => 3*x**2 - 2;
    const xs = [], ys = [];
    for (let x = -3; x <= 4; x += 0.05) { xs.push(x); ys.push(f(x)); }
    const iterX = [x0], iterY = [f(x0)];
    let xn = x0;
    for (let i = 0; i < 8; i++) {
      const xn1 = xn - f(xn) / df(xn);
      iterX.push(xn, xn1, xn1);
      iterY.push(f(xn), 0, f(xn1));
      if (Math.abs(f(xn1)) < 1e-10) break;
      xn = xn1;
    }
    Plotly.newPlot(el(id), [
      { x: xs, y: ys, name: 'f(x) = x³ − 2x − 5', line: { color: '#60a5fa', width: 2 } },
      { x: [-3,4], y: [0,0], mode: 'lines', line: { color: '#555', width: 1, dash: 'dot' }, showlegend: false },
      { x: iterX, y: iterY, mode: 'lines+markers', name: "Newton's iterations",
        line: { color: '#f87171', width: 1.5 }, marker: { size: 7, color: '#fbbf24' } },
    ], layout({ title: `Newton's Method — start x₀=${x0}`, xaxis: { title: 'x' }, yaxis: { title: 'f(x)', range: [-15,15] } }), cfg());
  }

  // ── 6. Logistic Regression ─────────────────────
  function logisticReg() {
    const id = 'logistic-regression';
    const w1 = get(id, 'w1') || 2.0;
    const w2 = get(id, 'w2') || 2.0;
    const b  = get(id, 'b')  || 0.0;
    const sig = z => 1 / (1 + Math.exp(-z));
    // Synthetic data
    const rng = (n, cx, cy, s) => Array.from({length:n}, () => [cx + s*(Math.random()-.5)*2, cy + s*(Math.random()-.5)*2]);
    const seed = 42; // deterministic-ish via fixed dataset
    const cls0 = [[-1.2,0.5],[-1,1.2],[-.8,.3],[-1.5,-.2],[-.9,.8],[-1.1,1.5],[-.5,.9],[-1.8,.4]];
    const cls1 = [[1.1,-.3],[.8,-.9],[1.4,.2],[.9,.5],[1.5,-.5],[1.2,.8],[.6,-.2],[1.7,.1]];
    // Decision boundary: w1*x + w2*y + b = 0  → y = -(w1*x + b)/w2
    const xBnd = [-3, 3], yBnd = xBnd.map(x => -(w1*x + b)/w2);
    Plotly.newPlot(el(id), [
      { x: cls0.map(p=>p[0]), y: cls0.map(p=>p[1]), mode: 'markers',
        marker: { size: 9, color: '#60a5fa', symbol: 'circle' }, name: 'Class 0' },
      { x: cls1.map(p=>p[0]), y: cls1.map(p=>p[1]), mode: 'markers',
        marker: { size: 9, color: '#f87171', symbol: 'square' }, name: 'Class 1' },
      { x: xBnd, y: yBnd, mode: 'lines', name: 'Decision boundary',
        line: { color: '#00a651', width: 2.5, dash: 'dash' } },
    ], layout({ title: `Logistic Regression — w=[${w1},${w2}], b=${b}`, xaxis:{title:'x₁',range:[-3,3]}, yaxis:{title:'x₂',range:[-2.5,2.5]} }), cfg());
  }

  // ── 7. Monte Carlo Pi ──────────────────────────
  function monteCarloPi() {
    const id = 'monte-carlo-pi';
    const N = Math.round(get(id, 'n') || 500);
    const xs = [], ys = [], cols = [];
    let inside = 0;
    const piEst = [], ns = [];
    for (let i = 0; i < N; i++) {
      const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1;
      xs.push(x); ys.push(y);
      if (x*x + y*y <= 1) { inside++; cols.push('#60a5fa'); } else { cols.push('#f87171'); }
      if ((i+1) % Math.max(1, Math.floor(N/100)) === 0) { piEst.push(4*inside/(i+1)); ns.push(i+1); }
    }
    const pi_est = (4*inside/N).toFixed(5);
    const theta = Array.from({length:101}, (_,i) => i*2*Math.PI/100);
    const cx = theta.map(Math.cos), cy = theta.map(Math.sin);
    Plotly.newPlot(el(id), [
      { x: xs, y: ys, mode: 'markers', marker: { size: 4, color: cols, opacity: 0.7 }, name: 'Points', showlegend: false },
      { x: cx, y: cy, mode: 'lines', line: { color: '#00a651', width: 2 }, name: 'Unit circle' },
    ], layout({ title: `Monte Carlo π ≈ ${pi_est}  (N=${N}, true π=${Math.PI.toFixed(5)})`, xaxis:{title:'x',range:[-1.05,1.05],scaleanchor:'y'}, yaxis:{title:'y',range:[-1.05,1.05]} }), cfg());
  }

  // ── 8. Regularization Coefficients ────────────
  function regularization() {
    const id = 'regularization';
    const logLam = get(id, 'loglam') || 0;
    const lam = Math.pow(10, logLam);
    // Synthetic: 5 features, true weights = [3,-2,0,0,1]
    const wTrue = [3,-2,0,0,1];
    // Ridge: w = wTrue / (1 + lam)  (simplified analytic form for demonstration)
    const wRidge = wTrue.map(w => w / (1 + lam));
    // Lasso: soft-thresholding
    const wLasso = wTrue.map(w => Math.sign(w) * Math.max(0, Math.abs(w) - lam/3));
    const features = ['x₁','x₂','x₃','x₄','x₅'];
    Plotly.newPlot(el(id), [
      { x: features, y: wTrue,  type:'bar', name:'True weights', marker:{color:'#6ee7b7'} },
      { x: features, y: wRidge, type:'bar', name:'Ridge (L2)',   marker:{color:'#60a5fa'} },
      { x: features, y: wLasso, type:'bar', name:'Lasso (L1)',   marker:{color:'#f87171'} },
    ], layout({ title:`Regularization — λ=${lam.toFixed(4)}  (log₁₀λ=${logLam})`, barmode:'group', yaxis:{title:'Coefficient value'} }), cfg());
  }

  // ── 9. Parameter Estimation (curve fit) ───────
  function paramEstimation() {
    const id = 'param-est';
    const noise = get(id, 'noise') || 0.2;
    const A_true = 2.5, k_true = 0.4;
    const t = Array.from({length:20}, (_,i) => i*0.5);
    // Noisy data
    const data = t.map(ti => A_true * Math.exp(-k_true * ti) + noise * (Math.random() - 0.5) * 2);
    // Simple least-squares fit in log space: log(y) = log(A) - k*t
    const logY = data.map((y, i) => y > 0 ? Math.log(y) : -5);
    const n = t.length, sumT = t.reduce((a,b)=>a+b,0), sumLogY = logY.reduce((a,b)=>a+b,0);
    const sumT2 = t.reduce((a,ti)=>a+ti*ti,0), sumTLogY = t.reduce((a,ti,i)=>a+ti*logY[i],0);
    const denom = n*sumT2 - sumT*sumT;
    const k_fit = -(n*sumTLogY - sumT*sumLogY) / denom;
    const logA_fit = (sumLogY - (-k_fit)*sumT) / n;
    const A_fit = Math.exp(logA_fit);
    const tFit = Array.from({length:100}, (_,i) => i*0.1);
    const yFit = tFit.map(ti => A_fit * Math.exp(-k_fit * ti));
    Plotly.newPlot(el(id), [
      { x: t, y: data, mode: 'markers', name: 'Noisy data', marker: { size: 8, color: '#fbbf24' } },
      { x: tFit, y: yFit, mode: 'lines', name: `Fit: A=${A_fit.toFixed(2)}, k=${k_fit.toFixed(3)}`, line: { color: '#00a651', width: 2 } },
      { x: tFit, y: tFit.map(ti => A_true*Math.exp(-k_true*ti)), mode:'lines', name:'True curve', line:{color:'#60a5fa',dash:'dash',width:1.5} },
    ], layout({ title: `Parameter Estimation — noise σ=${noise}`, xaxis:{title:'t'}, yaxis:{title:'y(t)'} }), cfg());
  }

  // ── 10. SGD Loss Curve ─────────────────────────
  function sgdLoss() {
    const id = 'sgd-loss';
    const lr = get(id, 'lr') || 0.05;
    const bs = Math.round(get(id, 'bs') || 16);
    const epochs = 60;
    // Synthetic: minimize MSE of y = 2x with noisy data
    let w = 0.0; const loss = [];
    for (let e = 0; e < epochs; e++) {
      let batchLoss = 0;
      for (let b = 0; b < bs; b++) {
        const x = (Math.random() - 0.5) * 4;
        const y = 2 * x + 0.3 * (Math.random() - 0.5);
        const pred = w * x;
        const err = pred - y;
        w -= lr * 2 * err * x / bs;
        batchLoss += err * err;
      }
      loss.push(batchLoss / bs);
    }
    const ep = Array.from({length:epochs}, (_,i) => i+1);
    Plotly.newPlot(el(id), [
      { x: ep, y: loss, mode: 'lines', line: { color: '#00a651', width: 2 }, name: 'SGD Loss' },
    ], layout({ title: `SGD Training — lr=${lr}, batch=${bs}, final w≈${w.toFixed(3)}`, xaxis:{title:'Epoch'}, yaxis:{title:'MSE Loss'} }), cfg());
  }


  // ══════════════════════════════════════════════════════════════
  //  MAST 218 — Parametric curves
  // ══════════════════════════════════════════════════════════════
  // Control values may legitimately be 0, so don't use `||` fallbacks here.
  function val(simId, ctrlId, dflt) {
    const v = get(simId, ctrlId);
    return (v === null || Number.isNaN(v)) ? dflt : v;
  }
  function ax(o) { return Object.assign({ gridcolor: '#232d3f', zerolinecolor: '#6b7280', zerolinewidth: 1.5 }, o); }
  // Arrow annotation from (x0,y0) to (x1,y1) in data coordinates
  function arrow(x0, y0, x1, y1, color) {
    return { x: x1, y: y1, ax: x0, ay: y0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
             showarrow: true, arrowhead: 3, arrowsize: 1.4, arrowwidth: 2, arrowcolor: color || '#facc15', text: '' };
  }
  function samplePath(fx, fy, t0, t1, n) {
    const xs = [], ys = [];
    n = n || 300;
    for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; xs.push(fx(t)); ys.push(fy(t)); }
    return [xs, ys];
  }
  const fmt = v => (v < 0 ? `(${v})` : `${v}`);
  const C_PATH = '#00a651', C_GHOST = '#475569', C_PT = '#f87171', C_TAN = '#60a5fa', C_ARROW = '#facc15';

  // ── P1. Particle on x = t², y = √t ────────────────────────────
  function paramParticle() {
    const id = 'param-particle';
    const tc = val(id, 'tmax', 1.5);
    const fx = t => t * t, fy = t => Math.sqrt(t);
    const [gx, gy] = samplePath(fx, fy, 0, 4);
    const [px, py] = samplePath(fx, fy, 0, Math.max(tc, 1e-6));
    const ann = [];
    if (tc > 0.15) ann.push(arrow(fx(tc * 0.85), fy(tc * 0.85), fx(tc), fy(tc), C_ARROW));
    Plotly.newPlot(el(id), [
      { x: gx, y: gy, mode: 'lines', name: 'whole curve (t ≥ 0)', line: { color: C_GHOST, width: 1.5, dash: 'dot' } },
      { x: px, y: py, mode: 'lines', name: 'traced so far', line: { color: C_PATH, width: 3 } },
      { x: [0], y: [0], mode: 'markers', name: 'initial point (0,0)', marker: { color: '#a3e635', size: 10 } },
      { x: [fx(tc)], y: [fy(tc)], mode: 'markers+text', name: `particle at t=${tc.toFixed(2)}`,
        text: [`(${fx(tc).toFixed(2)}, ${fy(tc).toFixed(2)})`], textposition: 'bottom right', textfont: { color: '#fca5a5' },
        marker: { color: C_PT, size: 12, line: { color: '#fff', width: 1.5 } } },
    ], layout({ title: `x = t², y = √t — particle at t = ${tc.toFixed(2)}`,
                xaxis: ax({ title: 'x = t²', range: [-0.5, 16.5] }), yaxis: ax({ title: 'y = √t', range: [-0.15, 2.2] }),
                annotations: ann, legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── P2. The lecture line x = t − 2, y = −2t + 3 ───────────────
  function paramLine() {
    const id = 'param-line';
    const t1 = val(id, 'tmin', 0), t2 = val(id, 'tmax', 5);
    const fx = t => t - 2, fy = t => -2 * t + 3;
    const [gx, gy] = samplePath(fx, fy, -4, 7, 2);
    const [px, py] = samplePath(fx, fy, t1, t2, 2);        // traced from t₁ to t₂, in that order
    const dir = t2 >= t1 ? 1 : -1;                          // direction of motion follows increasing t
    const tm = (t1 + t2) / 2, d = Math.max(Math.abs(t2 - t1) * 0.15, 0.05) * dir;
    const same = Math.abs(t2 - t1) < 1e-9;
    const dirText = same ? 'a single point (t₁ = t₂)' : (dir > 0 ? 'upper-left → lower-right (t increasing)' : 'lower-right → upper-left (t decreasing: t₁ > t₂)');
    Plotly.newPlot(el(id), [
      { x: gx, y: gy, mode: 'lines', name: 'y = −2x − 1 (all t ∈ ℝ)', line: { color: C_GHOST, width: 1.5, dash: 'dot' } },
      { x: px, y: py, mode: 'lines', name: `traced for t from ${t1.toFixed(1)} to ${t2.toFixed(1)}`, line: { color: C_PATH, width: 4 } },
      { x: [fx(t1)], y: [fy(t1)], mode: 'markers+text', name: 'initial point (t = t₁)', text: [`A (${fx(t1).toFixed(1)}, ${fy(t1).toFixed(1)})  t₁=${t1.toFixed(1)}`],
        textposition: dir > 0 ? 'top right' : 'bottom left', textfont: { color: '#a3e635' }, marker: { color: '#a3e635', size: 11 } },
      { x: [fx(t2)], y: [fy(t2)], mode: 'markers+text', name: 'terminal point (t = t₂)', text: [`B (${fx(t2).toFixed(1)}, ${fy(t2).toFixed(1)})  t₂=${t2.toFixed(1)}`],
        textposition: dir > 0 ? 'bottom left' : 'top right', textfont: { color: '#fca5a5' }, marker: { color: C_PT, size: 11 } },
    ], layout({ title: `x = t − 2, y = −2t + 3 — direction of motion: ${dirText}`,
                xaxis: ax({ title: 'x', range: [-7, 6] }), yaxis: ax({ title: 'y', range: [-12, 12] }),
                annotations: same ? [] : [arrow(fx(tm - d), fy(tm - d), fx(tm + d), fy(tm + d), C_ARROW)],
                legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── P3. Line through two points, t = 0 → A, t = 1 → B ─────────
  function paramTwoPoints() {
    const id = 'param-two-points';
    const x1 = val(id, 'x1', -2), y1 = val(id, 'y1', 3), x2 = val(id, 'x2', 3), y2 = val(id, 'y2', -1), t = val(id, 't', 0.5);
    const fx = s => x1 + s * (x2 - x1), fy = s => y1 + s * (y2 - y1);
    const [gx, gy] = samplePath(fx, fy, -3, 4, 2);
    const [sx, sy] = samplePath(fx, fy, 0, 1, 2);
    const degenerate = x1 === x2 && y1 === y2;
    Plotly.newPlot(el(id), [
      { x: gx, y: gy, mode: 'lines', name: 'line (t ∈ ℝ)', line: { color: C_GHOST, width: 1.5, dash: 'dot' } },
      { x: sx, y: sy, mode: 'lines', name: 'segment AB (0 ≤ t ≤ 1)', line: { color: C_PATH, width: 4 } },
      { x: [x1, x2], y: [y1, y2], mode: 'markers+text', name: 'A (t=0), B (t=1)', text: ['A  t=0', 'B  t=1'], textposition: 'top center',
        textfont: { color: '#e2e8f0' }, marker: { color: ['#a3e635', '#fb923c'], size: 12 } },
      { x: [fx(t)], y: [fy(t)], mode: 'markers+text', name: `point at t=${t.toFixed(2)}`,
        text: [`t=${t.toFixed(2)} → (${fx(t).toFixed(2)}, ${fy(t).toFixed(2)})`], textposition: 'bottom right', textfont: { color: '#fca5a5' },
        marker: { color: C_PT, size: 13, line: { color: '#fff', width: 1.5 } } },
    ], layout({ title: degenerate ? `A = B = (${x1}, ${y1}): the two points coincide — no line is determined (x = ${x1}, y = ${y1} for every t)` : `x = ${x1} + ${fmt(x2 - x1)}t,  y = ${y1} + ${fmt(y2 - y1)}t`,
                xaxis: ax({ title: 'x', range: [-8, 8] }), yaxis: ax({ title: 'y', range: [-8, 8], scaleanchor: 'x', scaleratio: 1 }),
                annotations: degenerate ? [] : [arrow(fx(0.4), fy(0.4), fx(0.6), fy(0.6), C_ARROW)],
                legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── P4. Circle explorer: x = a + r cos(nt), y = b + dir·r sin(nt)
  function paramCircle() {
    const id = 'param-circle';
    const a = val(id, 'a', 0), b = val(id, 'b', 0), r = val(id, 'r', 2), n = val(id, 'n', 1);
    const dir = val(id, 'dir', 1) < 0 ? -1 : 1;
    const tc = val(id, 'tmax', 1.25) * Math.PI;
    const fx = t => a + r * Math.cos(n * t), fy = t => b + dir * r * Math.sin(n * t);
    const [gx, gy] = samplePath(t => a + r * Math.cos(t), t => b + r * Math.sin(t), 0, 2 * Math.PI, 200);
    const [px, py] = samplePath(fx, fy, 0, Math.max(tc, 1e-6), 600);
    const laps = (n * tc) / (2 * Math.PI);
    const ann = [];
    if (tc > 0.1) ann.push(arrow(fx(tc - 0.08 / n), fy(tc - 0.08 / n), fx(tc), fy(tc), C_ARROW));
    ann.push({ x: 0.02, y: 0.98, xref: 'paper', yref: 'paper', showarrow: false, align: 'left', xanchor: 'left', yanchor: 'top',
               font: { color: '#e2e8f0', size: 12 }, bgcolor: 'rgba(0,0,0,.35)',
               text: `(x − ${a})² + (y − ${b})² = ${(r * r).toFixed(2)}<br>n·t = ${(n * tc).toFixed(2)} rad = ${laps.toFixed(2)} turns ${dir > 0 ? 'CCW' : 'CW'}` });
    const R = Math.max(r, 1) + 1;
    Plotly.newPlot(el(id), [
      { x: gx, y: gy, mode: 'lines', name: 'the circle', line: { color: C_GHOST, width: 1.5, dash: 'dot' } },
      { x: px, y: py, mode: 'lines', name: 'traced from t = 0', line: { color: C_PATH, width: 3.5 } },
      { x: [a + r], y: [b], mode: 'markers', name: `initial point (${a + r}, ${b})`, marker: { color: '#a3e635', size: 10 } },
      { x: [a], y: [b], mode: 'markers', name: `centre (${a}, ${b})`, marker: { color: '#e2e8f0', size: 7, symbol: 'x' } },
      { x: [fx(tc)], y: [fy(tc)], mode: 'markers', name: `particle at t = ${(tc / Math.PI).toFixed(2)}π`, marker: { color: C_PT, size: 12, line: { color: '#fff', width: 1.5 } } },
    ], layout({ title: `x = ${a ? a + ' + ' : ''}${r}cos(${n === 1 ? '' : n}t),  y = ${b ? b + ' ' + (dir > 0 ? '+' : '−') + ' ' : (dir > 0 ? '' : '−')}${r}sin(${n === 1 ? '' : n}t)`,
                xaxis: ax({ title: 'x', range: [a - R, a + R] }), yaxis: ax({ title: 'y', range: [b - R, b + R], scaleanchor: 'x', scaleratio: 1 }),
                annotations: ann, legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── P5. Smiley face from the notes ────────────────────────────
  function paramSmiley() {
    const id = 'param-smiley';
    const prog = val(id, 'prog', 1);
    const T = prog * 2 * Math.PI;
    const piece = (a, b, r, t0, t1, name, color) => {
      const end = Math.min(t1, T);
      const [xs, ys] = end > t0 ? samplePath(t => a + r * Math.cos(t), t => b + r * Math.sin(t), t0, end, 200) : [[], []];
      return { x: xs, y: ys, mode: 'lines', name, line: { color, width: 3 } };
    };
    Plotly.newPlot(el(id), [
      piece(3, 3, 3,   0,       2 * Math.PI, 'face: (3,3), r=3',            C_PATH),
      piece(2, 4, 0.1, 0,       2 * Math.PI, 'left eye: (2,4), r=0.1',      '#facc15'),
      piece(4, 4, 0.1, 0,       2 * Math.PI, 'right eye: (4,4), r=0.1',     '#facc15'),
      piece(3, 3, 1,   Math.PI, 2 * Math.PI, 'mouth: (3,3), r=1, π≤t≤2π',   C_PT),
      { x: [2, 4], y: [4, 4], mode: 'markers', name: 'eye centres', marker: { color: '#facc15', size: 6 }, showlegend: false },
    ], layout({ title: `Smiley face — t = ${(T / Math.PI).toFixed(2)}π`,
                xaxis: ax({ title: 'x', range: [-1, 7] }), yaxis: ax({ title: 'y', range: [-1, 7], scaleanchor: 'x', scaleratio: 1 }),
                legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── P6. Tangent to x = 1 + ∛t, y = e^{t³} ─────────────────────
  function paramTangent() {
    const id = 'param-tangent';
    const t0 = val(id, 't0', 1);
    const fx = t => 1 + Math.cbrt(t), fy = t => Math.exp(t * t * t);
    const dx = t => (1 / 3) * Math.pow(Math.abs(t), -2 / 3);          // x'(t) = ⅓ t^{-2/3}  (even in t)
    const dy = t => Math.exp(t * t * t) * 3 * t * t;                   // y'(t) = e^{t³}·3t²
    const [gx, gy] = samplePath(fx, fy, -1.3, 1.3, 600);
    const x0 = fx(t0), y0 = fy(t0);
    const traces = [
      { x: gx, y: gy, mode: 'lines', name: 'C: x = 1 + ∛t, y = e^{t³}', line: { color: C_PATH, width: 3 } },
    ];
    let title;
    if (Math.abs(t0) < 1e-9) {
      // y′(0) = 0 while x′(t) = ⅓t^(−2/3) → ∞, so dy/dx = y′/x′ = 9 t^(8/3) e^(t³) → 0: a horizontal tangent y = 1
      traces.push({ x: [x0 - 1.5, x0 + 1.5], y: [y0, y0], mode: 'lines', name: 'tangent: y = 1 (slope 0)', line: { color: C_TAN, width: 2, dash: 'dash' } });
      title = `t₀ = 0 → (1, 1):  y′(0) = 0 and x′(t) → ∞, so dy/dx = y′/x′ = 9t^(8/3)e^(t³) → 0  ⇒ horizontal tangent`;
    } else {
      const m = dy(t0) / dx(t0);
      const xs = [x0 - 1.5, x0 + 1.5];
      traces.push({ x: xs, y: xs.map(x => y0 + m * (x - x0)), mode: 'lines', name: `tangent: y − ${y0.toFixed(2)} = ${m.toFixed(2)}(x − ${x0.toFixed(2)})`, line: { color: C_TAN, width: 2, dash: 'dash' } });
      title = `t₀ = ${t0.toFixed(2)} → (${x0.toFixed(2)}, ${y0.toFixed(2)}),  slope y′/x′ = ${dy(t0).toFixed(3)} / ${dx(t0).toFixed(3)} = ${m.toFixed(3)}`;
    }
    traces.push({ x: [x0], y: [y0], mode: 'markers', name: 'point of tangency', marker: { color: C_PT, size: 12, line: { color: '#fff', width: 1.5 } } });
    traces.push({ x: [2], y: [Math.E], mode: 'markers+text', name: '(2, e) from the example', text: ['(2, e)'], textposition: 'top left', textfont: { color: '#facc15' }, marker: { color: '#facc15', size: 8, symbol: 'diamond' } });
    Plotly.newPlot(el(id), traces, layout({ title,
                xaxis: ax({ title: 'x', range: [-0.3, 2.4] }), yaxis: ax({ title: 'y', range: [-0.5, 9.5] }),
                legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── P7. Area under the quarter circle ─────────────────────────
  function paramArea() {
    const id = 'param-area';
    const tc = val(id, 'tcur', 1) * Math.PI / 2;
    const fx = t => 2 * Math.cos(t), fy = t => 2 * Math.sin(t);
    const [gx, gy] = samplePath(fx, fy, 0, 2 * Math.PI, 200);
    // region under the arc from t = 0 to t = tc, down to the x-axis:
    // polygon = arc points, then (x(tc), 0), then (2, 0)
    const [axs, ays] = samplePath(fx, fy, 0, tc, 200);
    const polyX = axs.concat([fx(tc), 2]), polyY = ays.concat([0, 0]);
    // A = ∫_{x(tc)}^{2} y dx = ∫_{tc}^{0} y(t) x'(t) dt  (Simpson)
    const N = 400; let A = 0;
    for (let i = 0; i <= N; i++) {
      const t = tc * i / N, w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
      A += w * fy(t) * (-2 * Math.sin(t));
    }
    A = -(A * (tc / N) / 3);
    Plotly.newPlot(el(id), [
      { x: polyX, y: polyY, fill: 'toself', mode: 'lines', name: 'region', line: { color: 'rgba(0,0,0,0)' }, fillcolor: 'rgba(0,166,81,.35)' },
      { x: gx, y: gy, mode: 'lines', name: 'x = 2cos t, y = 2sin t', line: { color: C_GHOST, width: 1.5, dash: 'dot' } },
      { x: axs, y: ays, mode: 'lines', name: 'arc 0 ≤ t ≤ t₁', line: { color: C_PATH, width: 3.5 } },
      { x: [fx(tc)], y: [fy(tc)], mode: 'markers', name: `t₁ = ${(tc / Math.PI).toFixed(2)}π`, marker: { color: C_PT, size: 11 } },
    ], layout({ title: `∫ y(t) x′(t) dt over the arc = ${A.toFixed(4)}   (π ≈ 3.1416 at t₁ = π/2)`,
                xaxis: ax({ title: 'x', range: [-2.6, 2.6] }), yaxis: ax({ title: 'y', range: [-2.6, 2.6], scaleanchor: 'x', scaleratio: 1 }),
                legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // Simpson's rule on [a, b]
  function simpson(f, a, b, N) {
    N = N || 400; let acc = 0;
    for (let i = 0; i <= N; i++) { const t = a + (b - a) * i / N, w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2); acc += w * f(t); }
    return acc * (b - a) / N / 3;
  }

  // ── P8. Second derivative and concavity: x = 2t + 3, y = t³ − t ──
  function paramConcavity() {
    const id = 'param-concavity';
    const t0 = val(id, 't0', 0.8);
    const fx = t => 2 * t + 3, fy = t => t * t * t - t;
    const dydx = t => (3 * t * t - 1) / 2, d2 = t => 3 * t / 2;         // y' = (3t²−1)/2,  y'' = (3t/2)
    const [dnx, dny] = samplePath(fx, fy, -1.6, 0, 300);                // concave down (t < 0)
    const [upx, upy] = samplePath(fx, fy, 0, 1.6, 300);                 // concave up (t > 0)
    const x0 = fx(t0), y0 = fy(t0), m = dydx(t0);
    const xs = [x0 - 1.2, x0 + 1.2];
    Plotly.newPlot(el(id), [
      { x: dnx, y: dny, mode: 'lines', name: 't < 0: y″ = 3t/2 < 0, concave down', line: { color: '#f87171', width: 3.5 } },
      { x: upx, y: upy, mode: 'lines', name: 't > 0: y″ = 3t/2 > 0, concave up', line: { color: C_PATH, width: 3.5 } },
      { x: xs, y: xs.map(x => y0 + m * (x - x0)), mode: 'lines', name: `tangent, slope y′/x′ = ${m.toFixed(3)}`, line: { color: C_TAN, width: 2, dash: 'dash' } },
      { x: [3], y: [0], mode: 'markers+text', name: 't = 0: inflection (3, 0)', text: ['t = 0'], textposition: 'bottom right', textfont: { color: C_ARROW }, marker: { color: C_ARROW, size: 9, symbol: 'diamond' } },
      { x: [x0], y: [y0], mode: 'markers', name: `t₀ = ${t0.toFixed(2)}`, marker: { color: C_PT, size: 12, line: { color: '#fff', width: 1.5 } } },
    ], layout({ title: `t₀ = ${t0.toFixed(2)}:  dy/dx = (3t²−1)/2 = ${m.toFixed(3)},   d²y/dx² = 3t/2 = ${d2(t0).toFixed(3)} → ${d2(t0) > 0 ? 'concave up' : d2(t0) < 0 ? 'concave down' : 'inflection'}`,
                xaxis: ax({ title: 'x = 2t + 3', range: [-0.5, 6.5] }), yaxis: ax({ title: 'y = t³ − t', range: [-3, 3] }),
                legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── P9. Length of the circle vs distance travelled ────────────
  function paramLengthDistance() {
    const id = 'param-length-distance';
    const T = val(id, 'T', 1) * 2 * Math.PI;                             // upper limit, in turns
    const fx = t => 3 * Math.cos(t), fy = t => 3 * Math.sin(t);
    const [cx, cy] = samplePath(fx, fy, 0, 2 * Math.PI, 200);
    const [px, py] = samplePath(fx, fy, 0, T, 600);
    const dist = simpson(t => Math.sqrt(9 * Math.sin(t) ** 2 + 9 * Math.cos(t) ** 2), 0, T);   // ∫√(x′²+y′²) dt = 3T
    const laps = T / (2 * Math.PI);
    Plotly.newPlot(el(id), [
      { x: cx, y: cy, mode: 'lines', name: 'C: x = 3cos t, y = 3sin t (length 6π)', line: { color: C_GHOST, width: 1.5, dash: 'dot' } },
      { x: px, y: py, mode: 'lines', name: `path 0 ≤ t ≤ ${(laps * 2).toFixed(2)}π`, line: { color: C_PATH, width: 4 } },
      { x: [fx(T)], y: [fy(T)], mode: 'markers', name: 'particle at t = T', marker: { color: C_PT, size: 12, line: { color: '#fff', width: 1.5 } } },
      { x: [3], y: [0], mode: 'markers', name: 'start (3, 0)', marker: { color: C_ARROW, size: 8, symbol: 'diamond' } },
    ], layout({ title: `∫₀ᵀ √(x′² + y′²) dt = ∫₀ᵀ 3 dt = ${dist.toFixed(3)} = ${(dist / Math.PI).toFixed(2)}π  →  ${laps <= 1 ? 'the length of the arc traced so far' : `distance travelled (${laps.toFixed(2)} laps); the curve's length is still 6π ≈ ${(6 * Math.PI).toFixed(3)}`}`,
                xaxis: ax({ title: 'x', range: [-3.8, 3.8] }), yaxis: ax({ title: 'y', range: [-3.8, 3.8], scaleanchor: 'x', scaleratio: 1 }),
                legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── P10. Surface of revolution of the upper semicircle ────────
  function paramSurfaceRevolution() {
    const id = 'param-surface-revolution';
    const frac = val(id, 'tmax', 1);                                     // fraction of [0, π] rotated
    const tmax = frac * Math.PI;
    const r = 3;
    const nt = 40, nph = 40;
    const X = [], Y = [], Z = [];
    for (let i = 0; i <= nt; i++) {
      const t = tmax * i / nt, x = r * Math.cos(t), y = r * Math.sin(t);
      const rx = [], ry = [], rz = [];
      for (let j = 0; j <= nph; j++) { const ph = 2 * Math.PI * j / nph; rx.push(x); ry.push(y * Math.cos(ph)); rz.push(y * Math.sin(ph)); }
      X.push(rx); Y.push(ry); Z.push(rz);
    }
    const [gx, gy] = samplePath(t => r * Math.cos(t), t => r * Math.sin(t), 0, tmax, 100);
    const S = simpson(t => 2 * Math.PI * r * Math.sin(t) * r, 0, tmax);   // 2π ∫ y(t) √(x′²+y′²) dt, √(...) = 3
    Plotly.newPlot(el(id), [
      { type: 'surface', x: X, y: Y, z: Z, colorscale: [[0, '#065f46'], [1, '#34d399']], showscale: false, opacity: 0.85, name: 'surface' },
      { type: 'scatter3d', x: gx, y: gy, z: gy.map(() => 0), mode: 'lines', name: 'C: x = 3cos t, y = 3sin t', line: { color: C_PT, width: 6 } },
      { type: 'scatter3d', x: [-3.5, 3.5], y: [0, 0], z: [0, 0], mode: 'lines', name: 'x-axis', line: { color: C_ARROW, width: 3 } },
    ], layout({ title: `S = 2π ∫₀^${frac === 1 ? 'π' : (frac).toFixed(2) + 'π'} 3 sin t · 3 dt = ${S.toFixed(3)} = ${(S / Math.PI).toFixed(2)}π   (sphere: 4πr² = 36π ≈ 113.097)`,
                scene: { xaxis: { title: 'x', range: [-3.5, 3.5] }, yaxis: { title: 'y', range: [-3.5, 3.5] }, zaxis: { title: 'z', range: [-3.5, 3.5] }, aspectmode: 'cube',
                         camera: { eye: { x: 1.5, y: 1.2, z: 0.9 } } },
                margin: { t: 40, r: 0, b: 0, l: 0 }, legend: { orientation: 'h', y: -0.05 } }), cfg());
  }

  // ── P11. The loop x = 3t − t³, y = 3 − t² ─────────────────────
  function paramLoop() {
    const id = 'param-loop';
    const T = val(id, 'T', 2.3);                                         // current parameter, traced from −2.3
    const fx = t => 3 * t - t * t * t, fy = t => 3 - t * t;
    const s3 = Math.sqrt(3);
    const [gx, gy] = samplePath(fx, fy, -2.3, 2.3, 400);
    const [lx, ly] = samplePath(fx, fy, -s3, s3, 300);
    const [px, py] = samplePath(fx, fy, -2.3, T, 400);
    const len = simpson(t => Math.sqrt((3 - 3 * t * t) ** 2 + (2 * t) ** 2), -s3, s3);
    const area = Math.abs(simpson(t => fy(t) * (3 - 3 * t * t), -s3, s3));                     // |∫ y x′ dt| = 24√3/5
    const dirX = 3 * (1 - T * T), dirY = -2 * T, nrm = Math.hypot(dirX, dirY) || 1;
    const traces = [
      { x: lx.concat([lx[0]]), y: ly.concat([ly[0]]), fill: 'toself', mode: 'lines', name: `loop: area |∫ y x′ dt| = 24√3/5 ≈ ${area.toFixed(3)}`, line: { color: 'rgba(0,0,0,0)' }, fillcolor: 'rgba(0,166,81,.25)' },
      { x: gx, y: gy, mode: 'lines', name: 'C: x = 3t − t³, y = 3 − t²', line: { color: C_GHOST, width: 1.5, dash: 'dot' } },
      { x: px, y: py, mode: 'lines', name: `traced from t = −2.3 to ${T.toFixed(2)}`, line: { color: C_PATH, width: 3.5 } },
      { x: [0], y: [0], mode: 'markers+text', name: 'self-intersection t = ±√3', text: ['t = ±√3'], textposition: 'bottom right', textfont: { color: C_ARROW }, marker: { color: C_ARROW, size: 10, symbol: 'diamond' } },
      { x: [-2, 2], y: [2, 2], mode: 'markers+text', name: 'vertical tangents t = ∓1', text: ['t = −1', 't = 1'], textposition: ['middle left', 'middle right'], textfont: { color: C_TAN }, marker: { color: C_TAN, size: 9 } },
      { x: [0], y: [3], mode: 'markers+text', name: 'horizontal tangent t = 0', text: ['t = 0'], textposition: 'top center', textfont: { color: C_TAN }, marker: { color: C_TAN, size: 9, symbol: 'square' } },
      { x: [fx(T)], y: [fy(T)], mode: 'markers', name: `particle, x′ = ${dirX.toFixed(2)} (${dirX > 0 ? '→' : '←'}), y′ = ${dirY.toFixed(2)} (${dirY > 0 ? '↑' : '↓'})`, marker: { color: C_PT, size: 12, line: { color: '#fff', width: 1.5 } } },
    ];
    Plotly.newPlot(el(id), traces, layout({ title: `loop length ∫₋√₃^√₃ √((3−3t²)² + (−2t)²) dt ≈ ${len.toFixed(3)};  loop area ≈ ${area.toFixed(3)}`,
                xaxis: ax({ title: 'x', range: [-6, 6] }), yaxis: ax({ title: 'y', range: [-3.5, 4], scaleanchor: 'x', scaleratio: 1 }),
                annotations: [{ x: fx(T) + 0.9 * dirX / nrm, y: fy(T) + 0.9 * dirY / nrm, ax: fx(T), ay: fy(T), xref: 'x', yref: 'y', axref: 'x', ayref: 'y', showarrow: true, arrowhead: 3, arrowwidth: 2.5, arrowcolor: C_ARROW, text: '' }],
                legend: { orientation: 'h', y: -0.2 } }), cfg());
  }


  // ══ MAST 218 — Polar coordinates (lectures 4–5) ══════════════
  const PI = Math.PI;
  // an angle given in units of π: a whole number of twelfths prints as such, anything else with 3 decimals
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const fracPi = v => {
    const k = Math.round(v * 12);
    if (Math.abs(v * 12 - k) > 1e-5) return `${v.toFixed(3)}π`;
    if (k === 0) return '0';
    const g = gcd(k, 12), num = k / g, den = 12 / g;
    const top = num === 1 ? 'π' : num === -1 ? '−π' : `${num < 0 ? '−' : ''}${Math.abs(num)}π`;
    return den === 1 ? top : `${top}/${den}`;
  };
  const n3 = v => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3);   // no "−0.000"
  function polarPath(f, a, b, n) { return samplePath(t => f(t) * Math.cos(t), t => f(t) * Math.sin(t), a, b, n || 400); }
  // faint polar grid: circles r = 1..R and rays every 30°
  function polarGrid(R) {
    const tr = [];
    for (let k = 1; k <= R; k++) {
      const [x, y] = polarPath(() => k, 0, 2 * PI, 120);
      tr.push({ x, y, mode: 'lines', line: { color: '#232d3f', width: 1 }, hoverinfo: 'skip', showlegend: false });
    }
    for (let k = 0; k < 12; k++) {
      const t = k * PI / 6;
      tr.push({ x: [0, R * Math.cos(t)], y: [0, R * Math.sin(t)], mode: 'lines', line: { color: '#1b2433', width: 1 }, hoverinfo: 'skip', showlegend: false });
    }
    return tr;
  }
  const square = (R, extra) => ({ xaxis: ax({ title: 'x', range: [-R, R] }), yaxis: ax({ title: 'y', range: [-R, R], scaleanchor: 'x', scaleratio: 1 }), legend: { orientation: 'h', y: -0.2 }, ...extra });

  // ── P12. A point (r, θ): negative r, equivalent pairs ─────────
  function polarPoint() {
    const id = 'polar-point';
    const r = val(id, 'r', 2), k = val(id, 'th', 0.25), th = k * PI;
    const x = r * Math.cos(th), y = r * Math.sin(th);
    const ray = 4.6;
    const traces = polarGrid(4).concat([
      { x: [0, ray * Math.cos(th)], y: [0, ray * Math.sin(th)], mode: 'lines', name: `ray at θ = ${fracPi(k)}`, line: { color: C_TAN, width: 2, dash: 'dash' } },
      { x: [0, x], y: [0, y], mode: 'lines', name: r < 0 ? '|r| measured backwards through the pole' : 'distance r from the pole', line: { color: C_PATH, width: 4 } },
      { x: [x], y: [y], mode: 'markers', name: `P: (x, y) = (${n3(x)}, ${n3(y)})`, marker: { color: C_PT, size: 13, line: { color: '#fff', width: 1.5 } } },
      { x: [0], y: [0], mode: 'markers', name: 'pole O', marker: { color: C_ARROW, size: 8, symbol: 'diamond' } },
    ]);
    const other = r === 0 ? 'the pole, for every θ' : `also (${(-r).toFixed(2)}, ${fracPi(k + 1)}) and (${r.toFixed(2)}, ${fracPi(k + 2)})`;
    Plotly.newPlot(el(id), traces, layout(square(4.8, { title: `(r, θ) = (${r.toFixed(2)}, ${fracPi(k)}) → x = r cos θ = ${n3(x)}, y = r sin θ = ${n3(y)}<br>${other}` })), cfg());
  }

  // ── P13. Polar curve explorer, traced as θ grows ──────────────
  const POLAR_FAMILIES = [
    { name: (a) => `circle r = ${a} cos θ`, f: (a) => t => a * Math.cos(t), range: [0, 2], note: (a) => `x² + y² = ${a}x: centre (${a / 2}, 0), radius ${Math.abs(a) / 2}; traced once for 0 ≤ θ ≤ π, then again` },
    { name: (a) => `cardioid r = ${a}(1 − sin θ)`, f: (a) => t => a * (1 - Math.sin(t)), range: [0, 2], note: () => 'θ → π − θ leaves r unchanged: symmetric about the vertical axis' },
    { name: (a, b) => `limaçon r = ${a} + ${b} cos θ`, f: (a, b) => t => a + b * Math.cos(t), range: [0, 2], note: (a, b) => (a <= 0 || b <= 0 ? 'a limaçon needs a, b > 0 (move a and b above 0)' : (a < b ? 'a < b: inner loop (r < 0 where cos θ < −a/b)' : a > b ? 'a > b: no inner loop' : 'a = b: a cardioid') + '; θ → −θ: symmetric about the polar axis') },
    { name: (a, b, n) => `rose r = ${a} cos ${n}θ`, f: (a, b, n) => t => a * Math.cos(n * t), range: [0, 2], note: (a, b, n) => `n = ${n} ${n % 2 ? 'odd → ' + n : 'even → ' + 2 * n} petals` },
    { name: (a) => `spiral r = ${(1 + Math.abs(a)).toFixed(1)}^θ`, f: (a) => t => Math.pow(1 + Math.abs(a), t), range: [-4, 0.3], note: (a) => (a === 0 ? 'a = 0: r = 1 for every θ, the unit circle' : `each turn multiplies r by ${(1 + Math.abs(a)).toFixed(1)}^(2π) ≈ ${Math.pow(1 + Math.abs(a), 2 * Math.PI).toPrecision(3)}; r → 0 as θ → −∞`) },
  ];
  function polarCurve() {
    const id = 'polar-curve';
    const fam = Math.round(val(id, 'fam', 1)), a = val(id, 'a', 1), b = val(id, 'b', 2), n = Math.round(val(id, 'n', 2)), T = val(id, 'T', 1);
    const F = POLAR_FAMILIES[Math.max(0, Math.min(POLAR_FAMILIES.length - 1, fam))];
    const f = F.f(a, b, n), [t0, t1] = F.range.map(v => v * PI), tEnd = t0 + (t1 - t0) * Math.max(0, Math.min(1, T));
    const [gx, gy] = polarPath(f, t0, t1, 800), [px, py] = polarPath(f, t0, tEnd, 800);
    const len = simpson(t => Math.hypot(f(t), (f(t + 1e-5) - f(t - 1e-5)) / 2e-5), t0, tEnd);
    const R = Math.max(1.5, ...gx.map(Math.abs), ...gy.map(Math.abs)) * 1.08;
    const traces = polarGrid(Math.ceil(R)).concat([
      { x: gx, y: gy, mode: 'lines', name: F.name(a, b, n), line: { color: C_GHOST, width: 1.5, dash: 'dot' } },
      { x: px, y: py, mode: 'lines', name: `traced ${fracPi(t0 / PI)} ≤ θ ≤ ${fracPi(tEnd / PI)}`, line: { color: C_PATH, width: 3.5 } },
      { x: [px[px.length - 1]], y: [py[py.length - 1]], mode: 'markers', name: `r(θ) = ${f(tEnd).toFixed(3)}${f(tEnd) < 0 ? ' < 0: plotted through the pole' : ''}`, marker: { color: C_PT, size: 11, line: { color: '#fff', width: 1.5 } } },
    ]);
    Plotly.newPlot(el(id), traces, layout(square(R, { title: `${F.note(a, b, n)}<br>length traced so far ∫ √(r² + r′²) dθ = ${len.toFixed(3)}` })), cfg());
  }

  // ── P14. Tangent to the cardioid r = 1 − sin θ ────────────────
  function polarTangent() {
    const id = 'polar-tangent';
    const k = val(id, 'th', 1 / 6), th = k * PI;
    const f = t => 1 - Math.sin(t), fp = t => -Math.cos(t);
    const X = t => f(t) * Math.cos(t), Y = t => f(t) * Math.sin(t);
    const dx = fp(th) * Math.cos(th) - f(th) * Math.sin(th), dy = fp(th) * Math.sin(th) + f(th) * Math.cos(th);
    const [gx, gy] = polarPath(f, 0, 2 * PI, 600);
    const x0 = X(th), y0 = Y(th), nrm = Math.hypot(dx, dy);
    const tl = nrm < 1e-9 ? [[x0, x0], [y0, y0]] : [[x0 - 1.4 * dx / nrm, x0 + 1.4 * dx / nrm], [y0 - 1.4 * dy / nrm, y0 + 1.4 * dy / nrm]];
    const ht = [PI / 6, 5 * PI / 6, 3 * PI / 2], vt = [7 * PI / 6, 11 * PI / 6];
    const slope = Math.abs(dx) < 1e-9 ? (Math.abs(dy) < 1e-9 ? 'not defined (0/0: the cusp at the pole)' : '±∞ (vertical tangent)') : n3(dy / dx);
    const traces = polarGrid(2).concat([
      { x: gx, y: gy, mode: 'lines', name: 'r = 1 − sin θ', line: { color: C_PATH, width: 3 } },
      { x: tl[0], y: tl[1], mode: 'lines', name: 'tangent line', line: { color: C_TAN, width: 2.5 } },
      { x: ht.map(X), y: ht.map(Y), mode: 'markers', name: 'horizontal tangents θ = π/6, 5π/6, 3π/2', marker: { color: C_ARROW, size: 9, symbol: 'square' } },
      { x: vt.map(X), y: vt.map(Y), mode: 'markers', name: 'vertical tangents θ = 7π/6, 11π/6', marker: { color: '#c084fc', size: 9, symbol: 'diamond' } },
      { x: [x0], y: [y0], mode: 'markers', name: `P at θ = ${fracPi(k)}`, marker: { color: C_PT, size: 12, line: { color: '#fff', width: 1.5 } } },
    ]);
    Plotly.newPlot(el(id), traces, layout(square(2.3, { title: `dy/dx = (f′ sin θ + f cos θ)/(f′ cos θ − f sin θ) = ${n3(dy)} / ${n3(dx)} → slope ${slope}` })), cfg());
  }

  // ── P15. Areas in polar coordinates: the lecture examples ─────
  const POLAR_AREAS = [
    { name: 'cardioid r = 1 − sin θ', outer: t => 1 - Math.sin(t), inner: null, a: 0, b: 2 * PI, exact: '3π/2', others: [] },
    { name: 'inside both r = 4 cos θ and r = 4 sin θ', outer: t => (t <= PI / 4 ? 4 * Math.sin(t) : 4 * Math.cos(t)), inner: null, a: 0, b: PI / 2, exact: '2π − 4', others: [[t => 4 * Math.cos(t), -PI / 2, PI / 2], [t => 4 * Math.sin(t), 0, PI]] },
    { name: 'inside r = 3 cos θ, outside r = 1 + cos θ', outer: t => 3 * Math.cos(t), inner: t => 1 + Math.cos(t), a: -PI / 3, b: PI / 3, exact: 'π', others: [[t => 3 * Math.cos(t), -PI / 2, PI / 2], [t => 1 + Math.cos(t), 0, 2 * PI]] },
    { name: 'inner loop of r = 1 + 2 cos θ', outer: t => 1 + 2 * Math.cos(t), inner: null, a: 2 * PI / 3, b: 4 * PI / 3, exact: 'π − 3√3/2', others: [[t => 1 + 2 * Math.cos(t), 0, 2 * PI]] },
    { name: 'rose r = sin 2θ (four petals)', outer: t => Math.sin(2 * t), inner: null, a: 0, b: 2 * PI, exact: 'π/2', others: [] },
  ];
  function polarArea() {
    const id = 'polar-area';
    const ex = Math.round(val(id, 'ex', 1)), s = Math.max(0, Math.min(1, val(id, 'sweep', 1)));
    const E = POLAR_AREAS[Math.max(0, Math.min(POLAR_AREAS.length - 1, ex))];
    const tEnd = E.a + (E.b - E.a) * s;
    const g = E.inner || (() => 0);
    const area = tEnd > E.a ? simpson(t => 0.5 * (E.outer(t) ** 2 - g(t) ** 2), E.a, tEnd, 800) : 0;
    const [ox, oy] = polarPath(E.outer, E.a, tEnd, 500);
    const [ix, iy] = E.inner ? polarPath(E.inner, E.a, tEnd, 500) : [[0], [0]];
    const traces = polarGrid(4);
    E.others.forEach(([f, a, b]) => { const [x, y] = polarPath(f, a, b, 500); traces.push({ x, y, mode: 'lines', line: { color: C_GHOST, width: 1.5, dash: 'dot' }, hoverinfo: 'skip', showlegend: false }); });
    if (tEnd > E.a) traces.push({ x: ox.concat(ix.slice().reverse()), y: oy.concat(iy.slice().reverse()), fill: 'toself', mode: 'lines', name: `swept so far: ${area.toFixed(4)}`, line: { color: 'rgba(0,0,0,0)' }, fillcolor: 'rgba(0,166,81,.35)' });
    const [fx, fy] = polarPath(E.outer, E.a, E.b, 600);
    traces.push({ x: fx, y: fy, mode: 'lines', name: E.inner ? 'outer curve' : 'boundary', line: { color: C_PATH, width: 3 } });
    if (E.inner) { const [gx, gy] = polarPath(E.inner, E.a, E.b, 600); traces.push({ x: gx, y: gy, mode: 'lines', name: 'inner curve', line: { color: C_TAN, width: 3 } }); }
    traces.push({ x: [0, 4.3 * Math.cos(tEnd)], y: [0, 4.3 * Math.sin(tEnd)], mode: 'lines', name: `θ = ${fracPi(tEnd / PI)}`, line: { color: C_ARROW, width: 1.5, dash: 'dash' } });
    Plotly.newPlot(el(id), traces, layout(square(4.4, { title: `${E.name}: A = ${E.exact}<br>½∫ (r_out² − r_in²) dθ from ${fracPi(E.a / PI)} to ${fracPi(tEnd / PI)} = ${area.toFixed(4)}` })), cfg());
  }

  // ══════════════════════════════════════════════════════════════
  //  MAST 221 — Probability
  // ══════════════════════════════════════════════════════════════

  // ── Q1. Two-dice sample space grid, event "sum = k" ───────────
  function diceSumGrid() {
    const id = 'dice-sum-grid';
    const k = Math.round(val(id, 'sum', 7));
    const faces = [1, 2, 3, 4, 5, 6];
    const z = [], text = []; let nE = 0;
    faces.forEach(i => {
      const zr = [], tr = [];
      faces.forEach(j => { const hit = (i + j === k) ? 1 : 0; nE += hit; zr.push(hit); tr.push(`(${i},${j})`); });
      z.push(zr); text.push(tr);
    });
    const p = nE / 36;
    Plotly.newPlot(el(id), [{
      type: 'heatmap', x: faces, y: faces, z, text, texttemplate: '%{text}', textfont: { size: 13 },
      colorscale: [[0, '#1f2937'], [1, '#00a651']], showscale: false, xgap: 3, ygap: 3, hoverinfo: 'text',
    }], layout({ title: `E = {sum = ${k}}:  n(E) = ${nE},  n(S) = 36,  P(E) = ${nE}/36 = ${p.toFixed(3)}`,
                xaxis: ax({ title: 'second die (j)', dtick: 1, side: 'top' }), yaxis: ax({ title: 'first die (i)', dtick: 1, autorange: 'reversed' }),
                margin: { t: 80, r: 20, b: 30, l: 60 } }), cfg());
  }

  // ── Q2. Empirical vs theoretical distribution of the sum ──────
  function empiricalDice() {
    const id = 'empirical-dice';
    const n = Math.max(1, Math.round(val(id, 'n', 100)));
    const counts = new Array(13).fill(0);
    for (let r = 0; r < n; r++) {
      const s = (1 + Math.floor(Math.random() * 6)) + (1 + Math.floor(Math.random() * 6));
      counts[s]++;
    }
    const sums = [], emp = [], theo = [];
    for (let s = 2; s <= 12; s++) { sums.push(s); emp.push(counts[s]); theo.push(n * (6 - Math.abs(s - 7)) / 36); }
    const p7 = counts[7] / n, p11 = counts[11] / n;
    Plotly.newPlot(el(id), [
      { type: 'bar', x: sums, y: emp, name: `simulated counts (n = ${n})`, marker: { color: '#00a651' } },
      { x: sums, y: theo, mode: 'lines+markers', name: 'theoretical n·P(sum)', line: { color: '#facc15', width: 2 }, marker: { size: 7 } },
    ], layout({ title: `E₁ (sum 7): ${counts[7]}/${n} = ${p7.toFixed(3)}  vs  6/36 = 0.167   |   E₂ (sum 11): ${counts[11]}/${n} = ${p11.toFixed(3)}  vs  2/36 = 0.056`,
                xaxis: ax({ title: 'sum of the two dice', dtick: 1 }), yaxis: ax({ title: 'frequency' }),
                legend: { orientation: 'h', y: -0.2 }, bargap: 0.15 }), cfg());
  }

  // ── Venn helper: two circles with four region labels ──────────
  function drawVenn(id, title, labels, fmt) {
    const ann = [
      { x: -0.9, y: 0,    text: `A ∩ B′<br><b>${fmt(labels.aOnly)}</b>` },
      { x:  0,   y: 0,    text: `A ∩ B<br><b>${fmt(labels.both)}</b>` },
      { x:  0.9, y: 0,    text: `A′ ∩ B<br><b>${fmt(labels.bOnly)}</b>` },
      { x:  0,   y: -1.55, text: `A′ ∩ B′ (neither)<br><b>${fmt(labels.neither)}</b>` },
      { x: -0.55, y: 1.15, text: '<b>A</b>', font: { size: 16, color: '#60a5fa' } },
      { x:  0.55, y: 1.15, text: '<b>B</b>', font: { size: 16, color: '#f87171' } },
      { x: -2.05, y: 1.6, text: '<b>S</b>', font: { size: 15, color: '#e2e8f0' } },
    ].map(a => Object.assign({ showarrow: false, font: { color: '#e2e8f0', size: 13 }, align: 'center' }, a));
    Plotly.newPlot(el(id), [{ x: [0], y: [0], mode: 'markers', marker: { opacity: 0 }, hoverinfo: 'skip', showlegend: false }],
      layout({ title,
        margin: { t: title.indexOf('<br>') >= 0 ? 80 : 50, r: 10, b: 10, l: 10 },
        shapes: [
          { type: 'rect', x0: -2.2, y0: -1.85, x1: 2.2, y1: 1.85, line: { color: '#94a3b8', width: 1.5 } },
          { type: 'circle', x0: -1.55, y0: -1.0, x1: 0.45, y1: 1.0, fillcolor: 'rgba(96,165,250,.28)', line: { color: '#60a5fa', width: 2 } },
          { type: 'circle', x0: -0.45, y0: -1.0, x1: 1.55, y1: 1.0, fillcolor: 'rgba(248,113,113,.28)', line: { color: '#f87171', width: 2 } },
        ],
        annotations: ann,
        xaxis: ax({ range: [-2.4, 2.4], visible: false }), yaxis: ax({ range: [-2.0, 2.0], visible: false, scaleanchor: 'x', scaleratio: 1 }) }), cfg());
  }

  // ── Q3. Counting with Venn regions ────────────────────────────
  function vennCounts() {
    const id = 'venn-counts';
    const nS = Math.round(val(id, 'nS', 100));
    const inA = Math.round(val(id, 'nA', 40)), inB = Math.round(val(id, 'nB', 50)), inAB = Math.round(val(id, 'nAB', 15));
    const adj = [];
    let nA = inA, nB = inB, nAB = inAB;
    if (nA > nS) { nA = nS; adj.push(`n(A) → ${nA} (A ⊆ S)`); }
    if (nB > nS) { nB = nS; adj.push(`n(B) → ${nB} (B ⊆ S)`); }
    if (nAB > Math.min(nA, nB)) { nAB = Math.min(nA, nB); adj.push(`n(A∩B) → ${nAB} (A∩B ⊆ A, B)`); }
    if (nA + nB - nAB > nS) { nAB = nA + nB - nS; adj.push(`n(A∩B) → ${nAB} (so that n(A∪B) ≤ n(S))`); }
    const union = nA + nB - nAB;
    drawVenn(id,
      `n(A ∪ B) = ${nA} + ${nB} − ${nAB} = ${union}    |    n(A′ ∩ B′) = ${nS} − ${union} = ${nS - union}${nAB === 0 ? '    (mutually exclusive)' : ''}` + (adj.length ? `<br><span style="color:#facc15">⚠ impossible combination adjusted: ${adj.join('; ')}</span>` : ''),
      { aOnly: nA - nAB, both: nAB, bOnly: nB - nAB, neither: nS - union }, v => String(v));
  }

  // ── Q4. Addition rule with probabilities ──────────────────────
  function probUnion() {
    const id = 'prob-union';
    const pA = val(id, 'pA', 0.4), pB = val(id, 'pB', 0.5), inAB = val(id, 'pAB', 0.15);
    const adj = [];
    let pAB = inAB;
    if (pAB > Math.min(pA, pB) + 1e-12) { pAB = Math.min(pA, pB); adj.push(`P(A∩B) → ${pAB.toFixed(2)} (A∩B ⊆ A, B so P(A∩B) ≤ min)`); }
    if (pA + pB - pAB > 1 + 1e-12) { pAB = pA + pB - 1; adj.push(`P(A∩B) → ${pAB.toFixed(2)} (so that P(A∪B) ≤ 1)`); }
    const union = pA + pB - pAB;
    drawVenn(id,
      `P(A ∪ B) = ${pA.toFixed(2)} + ${pB.toFixed(2)} − ${pAB.toFixed(2)} = ${union.toFixed(2)}    (naïve P(A)+P(B) = ${(pA + pB).toFixed(2)})` + (adj.length ? `<br><span style="color:#facc15">⚠ impossible combination adjusted: ${adj.join('; ')}</span>` : ''),
      { aOnly: pA - pAB, both: pAB, bOnly: pB - pAB, neither: 1 - union }, v => v.toFixed(2));
  }


  // ── Q5. Tree diagram of a sample space ────────────────────────
  function sampleSpaceTree() {
    const id = 'sample-space-tree';
    const faces = Math.round(val(id, 'faces', 2)), trials = Math.round(val(id, 'trials', 2));
    const labels = faces === 2 ? ['H', 'T'] : Array.from({ length: faces }, (_, i) => String(i + 1));
    const N = Math.pow(faces, trials);
    // leaf k (0..N-1) has digits in base `faces`; node at level l is prefix of length l
    const ys = {};          // key: prefix string, value: y
    const lx = [], ly = [];  // line segments (null-separated)
    const lblX = [], lblY = [], lblT = [];
    for (let l = trials; l >= 1; l--) {
      const cnt = Math.pow(faces, l);
      for (let k = 0; k < cnt; k++) {
        // prefix as array of digits
        let d = [], r = k;
        for (let i = 0; i < l; i++) { d.unshift(r % faces); r = Math.floor(r / faces); }
        const key = d.join(',');
        if (l === trials) ys[key] = 1 - (k + 0.5) / cnt;
        else {
          let sum = 0;
          for (let c = 0; c < faces; c++) sum += ys[key + ',' + c];
          ys[key] = sum / faces;
        }
      }
    }
    ys[''] = 0.5;
    Object.keys(ys).forEach(key => {
      if (key === '') return;
      const d = key.split(',');
      const parentKey = d.slice(0, -1).join(',');
      lx.push(d.length - 1, d.length, null); ly.push(ys[parentKey], ys[key], null);
      if (N <= 64 || d.length < trials) { lblX.push(d.length); lblY.push(ys[key]); lblT.push(labels[+d[d.length - 1]]); }
    });
    const leafX = [], leafY = [], leafT = [];
    if (N <= 64) Object.keys(ys).forEach(key => {
      const d = key === '' ? [] : key.split(',');
      if (d.length === trials) { leafX.push(trials + 0.35); leafY.push(ys[key]); leafT.push(d.map(x => labels[+x]).join(faces === 2 ? '' : ',')); }
    });
    Plotly.newPlot(el(id), [
      { x: lx, y: ly, mode: 'lines', line: { color: '#a16207', width: N > 216 ? 0.7 : 1.5 }, hoverinfo: 'skip', showlegend: false },
      { x: [0], y: [0.5], mode: 'markers', marker: { color: '#e2e8f0', size: 9 }, name: 'trunk', showlegend: false },
      { x: lblX, y: lblY, mode: 'text', text: lblT, textfont: { color: '#facc15', size: N > 64 ? 9 : 12 }, textposition: 'middle right', hoverinfo: 'skip', showlegend: false },
      { x: leafX, y: leafY, mode: 'text', text: leafT, textfont: { color: '#00a651', size: 12 }, textposition: 'middle right', hoverinfo: 'skip', showlegend: false },
    ], layout({ title: `Tree diagram: ${trials} trial${trials > 1 ? 's' : ''} × ${faces} outcomes each  ⇒  n(S) = ${faces}^${trials} = ${N} sample points${N > 64 ? ' (leaf labels hidden)' : ''}`,
                xaxis: ax({ range: [-0.3, trials + 1.2], visible: false }), yaxis: ax({ range: [-0.02, 1.02], visible: false }),
                margin: { t: 50, r: 10, b: 10, l: 10 } }), cfg());
  }

  // ── Q6. k coins, event "at least m heads" ─────────────────────
  function coinEventGrid() {
    const id = 'coin-event-grid';
    const k = Math.round(val(id, 'k', 2));
    const m = Math.round(val(id, 'm', 1));
    const N = 1 << k, cols = Math.min(N, 8), rows = Math.ceil(N / cols);
    const z = [], text = []; let nE = 0;
    for (let r = 0; r < rows; r++) {
      const zr = [], tr = [];
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx >= N) { zr.push(null); tr.push(''); continue; }
        let str = '', heads = 0;
        for (let b = k - 1; b >= 0; b--) { const h = (idx >> b) & 1; str += h ? 'H' : 'T'; heads += h; }
        const hit = heads >= m ? 1 : 0; nE += hit; zr.push(hit); tr.push(str);
      }
      z.push(zr); text.push(tr);
    }
    Plotly.newPlot(el(id), [{
      type: 'heatmap', z, text, texttemplate: '%{text}', textfont: { size: 13 },
      colorscale: [[0, '#1f2937'], [1, '#00a651']], zmin: 0, zmax: 1, showscale: false, xgap: 3, ygap: 3, hoverinfo: 'text',
    }], layout({ title: `${k} coin${k > 1 ? 's' : ''}, E = {at least ${m} head${m === 1 ? '' : 's'}}:  n(E) = ${nE},  n(S) = 2^${k} = ${N},  P(E) = ${nE}/${N} = ${(nE / N).toFixed(3)}${m > k ? '   (impossible event: E = ∅)' : m === 0 ? '   (certain event: E = S)' : ''}`,
                xaxis: ax({ visible: false }), yaxis: ax({ visible: false, autorange: 'reversed' }),
                margin: { t: 50, r: 10, b: 10, l: 10 } }), cfg());
  }

  // ── Q7. Complement rule: P(A) + P(A') = 1 ─────────────────────
  function complementRule() {
    const id = 'complement-rule';
    const k = Math.round(val(id, 'k', 2));
    const pNone = Math.pow(0.5, k), pAtLeast = 1 - pNone;
    Plotly.newPlot(el(id), [
      { type: 'bar', orientation: 'h', y: ['probability'], x: [pAtLeast], name: `A = at least one head:  P(A) = 1 − (½)^${k} = ${pAtLeast.toFixed(4)}`, marker: { color: '#00a651' },
        text: [`P(A) = ${pAtLeast.toFixed(3)}`], textposition: 'inside', textfont: { color: '#fff', size: 14 } },
      { type: 'bar', orientation: 'h', y: ['probability'], x: [pNone], name: `A′ = no heads:  P(A′) = (½)^${k} = ${pNone.toFixed(4)}`, marker: { color: '#f87171' },
        text: [`P(A′) = ${pNone.toFixed(3)}`], textposition: pNone > 0.12 ? 'inside' : 'outside', textfont: { color: '#fff', size: 14 } },
    ], layout({ title: `${k} coin${k > 1 ? 's' : ''}:  P(A) + P(A′) = ${pAtLeast.toFixed(4)} + ${pNone.toFixed(4)} = 1`,
                barmode: 'stack', xaxis: ax({ range: [0, 1], title: 'the whole sample space S has probability 1', dtick: 0.25 }), yaxis: ax({ visible: false }),
                legend: { orientation: 'h', y: -0.35 }, margin: { t: 50, r: 20, b: 90, l: 20 }, height: 260 }), cfg());
  }

  // ── Q8. Inclusion–exclusion for three events (region counts) ──
  function inclExcl3() {
    const id = 'incl-excl-3';
    const step = Math.round(val(id, 'step', 1));
    // multiplicity after each stage for regions in exactly 1 / exactly 2 / all 3 sets
    const mult = { 1: [1, 2, 3], 2: [1, 1, 0], 3: [1, 1, 1] }[step];
    const formula = ['P(A) + P(B) + P(C)', ' − P(A∩B) − P(A∩C) − P(B∩C)', ' + P(A∩B∩C)'].slice(0, step).join('');
    const regions = [
      { x: -1.15, y: 0.75,  t: 'A only',   m: mult[0] }, { x: 1.15, y: 0.75, t: 'B only', m: mult[0] }, { x: 0, y: -1.35, t: 'C only', m: mult[0] },
      { x: 0,     y: 0.85,  t: 'A∩B only', m: mult[1] }, { x: -0.75, y: -0.35, t: 'A∩C only', m: mult[1] }, { x: 0.75, y: -0.35, t: 'B∩C only', m: mult[1] },
      { x: 0,     y: 0.05,  t: 'A∩B∩C',    m: mult[2] },
    ];
    const col = m => m === 1 ? '#4ade80' : (m === 0 ? '#f87171' : '#facc15');
    const ann = regions.map(r => ({ x: r.x, y: r.y, text: `${r.t}<br><b style="font-size:18px">×${r.m}</b>`, showarrow: false, align: 'center', font: { color: col(r.m), size: 12 } }));
    ann.push({ x: -1.45, y: 1.55, text: '<b>A</b>', showarrow: false, font: { color: '#60a5fa', size: 16 } });
    ann.push({ x: 1.45, y: 1.55, text: '<b>B</b>', showarrow: false, font: { color: '#f87171', size: 16 } });
    ann.push({ x: 0, y: -2.05, text: '<b>C</b>', showarrow: false, font: { color: '#facc15', size: 16 } });
    const circ = (cx, cy, color) => ({ type: 'circle', x0: cx - 1.05, y0: cy - 1.05, x1: cx + 1.05, y1: cy + 1.05, fillcolor: color.replace(')', ',.18)').replace('rgb', 'rgba'), line: { color, width: 2 } });
    Plotly.newPlot(el(id), [{ x: [0], y: [0], mode: 'markers', marker: { opacity: 0 }, hoverinfo: 'skip', showlegend: false }],
      layout({ title: `${formula}   →   ${step === 3 ? 'every region counted exactly once ✓' : 'some regions are over- or under-counted'}`,
        shapes: [circ(-0.6, 0.4, 'rgb(96,165,250)'), circ(0.6, 0.4, 'rgb(248,113,113)'), circ(0, -0.65, 'rgb(250,204,21)')],
        annotations: ann,
        xaxis: ax({ range: [-2.2, 2.2], visible: false }), yaxis: ax({ range: [-2.3, 1.9], visible: false, scaleanchor: 'x', scaleratio: 1 }),
        margin: { t: 50, r: 10, b: 10, l: 10 } }), cfg());
  }


  // ── Q9. Two-way table (students × tutorials): conditioning = restricting to one row ──
  function condTable() {
    const id = 'cond-table';
    const a = Math.round(val(id, 'tg', 30)), b = Math.round(val(id, 'tp', 10)), c = Math.round(val(id, 'ug', 15)), d = Math.round(val(id, 'up', 25));
    const cond = Math.round(val(id, 'cond', 1));   // 0: whole table, 1: row T, 2: row T′
    const nS = a + b + c + d;
    const rows = ['T (attended tutorials)', 'T′ (did not attend)'], cols = ['M (passed)', 'M′ (failed)'];
    const counts = [[a, b], [c, d]];
    const z = counts.map((r, i) => r.map(() => cond === 0 ? 1 : (cond === 1 && i === 0) || (cond === 2 && i === 1) ? 1 : 0.25));
    const text = counts.map(r => r.map(String));
    let title;
    if (!nS) title = 'the table is empty';
    else if (cond === 0) title = `whole sample space:  P(M) = n(M)/n(S) = ${a + c}/${nS} = ${((a + c) / nS).toFixed(3)}`;
    else if (cond === 1) title = a + b ? `reduced sample space T (top row):  P(M | T) = n(T∩M)/n(T) = ${a}/${a + b} = ${(a / (a + b)).toFixed(3)}<br>= P(T∩M)/P(T) = (${a}/${nS}) / (${a + b}/${nS})` : 'P(T) = 0: P(M | T) is undefined';
    else title = c + d ? `reduced sample space T′ (bottom row):  P(M | T′) = n(T′∩M)/n(T′) = ${c}/${c + d} = ${(c / (c + d)).toFixed(3)}<br>= P(T′∩M)/P(T′) = (${c}/${nS}) / (${c + d}/${nS})` : 'P(T′) = 0: P(M | T′) is undefined';
    Plotly.newPlot(el(id), [{
      type: 'heatmap', x: cols, y: rows, z, text, texttemplate: '%{text}', textfont: { size: 20 },
      colorscale: [[0, '#1f2937'], [0.25, '#1f2937'], [1, '#00a651']], zmin: 0, zmax: 1, showscale: false, xgap: 4, ygap: 4, hoverinfo: 'text',
    }], layout({ title, xaxis: ax({ side: 'top' }), yaxis: ax({ autorange: 'reversed' }), margin: { t: 110, r: 20, b: 20, l: 170 } }), cfg());
  }

  // ── Q10. Venn diagram conditioned on B: only B is left ────────
  function condVenn() {
    const id = 'cond-venn';
    const pA = val(id, 'pA', 0.4), pB = val(id, 'pB', 0.5), inAB = val(id, 'pAB', 0.15);
    const given = Math.round(val(id, 'given', 1));   // 0: none, 1: given B, 2: given A
    const adj = [];
    let pAB = inAB;
    if (pAB > Math.min(pA, pB) + 1e-12) { pAB = Math.min(pA, pB); adj.push(`P(A∩B) → ${pAB.toFixed(2)} (A∩B ⊆ A, B)`); }
    if (pA + pB - pAB > 1 + 1e-12) { pAB = pA + pB - 1; adj.push(`P(A∩B) → ${pAB.toFixed(2)} (so that P(A∪B) ≤ 1)`); }
    const f = v => v.toFixed(2);
    let title;
    if (given === 0) title = `no conditioning:  P(A) = ${f(pA)},  P(B) = ${f(pB)},  P(A∩B) = ${f(pAB)}`;
    else if (given === 1) title = pB > 0 ? `given B, the sample space shrinks to B:  P(A | B) = P(A∩B)/P(B) = ${f(pAB)}/${f(pB)} = ${f(pAB / pB)}` : 'P(B) = 0: P(A | B) is undefined';
    else title = pA > 0 ? `given A, the sample space shrinks to A:  P(B | A) = P(A∩B)/P(A) = ${f(pAB)}/${f(pA)} = ${f(pAB / pA)}` : 'P(A) = 0: P(B | A) is undefined';
    if (adj.length) title += `<br><span style="color:#facc15">⚠ impossible combination adjusted: ${adj.join('; ')}</span>`;
    const dimA = given === 1, dimB = given === 2;
    const ann = [
      { x: -0.9, y: 0, text: `A ∩ B′<br><b>${f(pA - pAB)}</b>`, font: { color: dimA ? '#64748b' : '#e2e8f0' } },
      { x: 0, y: 0, text: `A ∩ B<br><b>${f(pAB)}</b>` },
      { x: 0.9, y: 0, text: `A′ ∩ B<br><b>${f(pB - pAB)}</b>`, font: { color: dimB ? '#64748b' : '#e2e8f0' } },
      { x: 0, y: -1.55, text: `A′ ∩ B′<br><b>${f(1 - pA - pB + pAB)}</b>`, font: { color: given ? '#64748b' : '#e2e8f0' } },
      { x: -0.55, y: 1.15, text: '<b>A</b>', font: { size: 16, color: dimA ? '#475569' : '#60a5fa' } },
      { x: 0.55, y: 1.15, text: '<b>B</b>', font: { size: 16, color: dimB ? '#475569' : '#f87171' } },
      { x: -2.05, y: 1.6, text: given ? '<b>S</b> (no longer the sample space)' : '<b>S</b>', font: { size: 13, color: given ? '#64748b' : '#e2e8f0' } },
    ].map(a => Object.assign({ showarrow: false, align: 'center' }, { font: { color: '#e2e8f0', size: 13 } }, a));
    const shapes = [
      { type: 'rect', x0: -2.2, y0: -1.85, x1: 2.2, y1: 1.85, line: { color: given ? '#475569' : '#94a3b8', width: 1.5, dash: given ? 'dot' : 'solid' } },
      { type: 'circle', x0: -1.55, y0: -1.0, x1: 0.45, y1: 1.0, fillcolor: dimA ? 'rgba(96,165,250,.08)' : 'rgba(96,165,250,.28)', line: { color: dimA ? '#475569' : '#60a5fa', width: 2 } },
      { type: 'circle', x0: -0.45, y0: -1.0, x1: 1.55, y1: 1.0, fillcolor: dimB ? 'rgba(248,113,113,.08)' : 'rgba(248,113,113,.28)', line: { color: dimB ? '#475569' : '#f87171', width: 2 } },
    ];
    if (given === 1) shapes.push({ type: 'circle', x0: -0.45, y0: -1.0, x1: 1.55, y1: 1.0, fillcolor: 'rgba(0,0,0,0)', line: { color: '#facc15', width: 4 } });
    if (given === 2) shapes.push({ type: 'circle', x0: -1.55, y0: -1.0, x1: 0.45, y1: 1.0, fillcolor: 'rgba(0,0,0,0)', line: { color: '#facc15', width: 4 } });
    Plotly.newPlot(el(id), [{ x: [0], y: [0], mode: 'markers', marker: { opacity: 0 }, hoverinfo: 'skip', showlegend: false }],
      layout({ title, margin: { t: title.indexOf('<br>') >= 0 ? 80 : 50, r: 10, b: 10, l: 10 }, shapes, annotations: ann,
        xaxis: ax({ range: [-2.4, 2.4], visible: false }), yaxis: ax({ range: [-2.0, 2.0], visible: false, scaleanchor: 'x', scaleratio: 1 }) }), cfg());
  }

  // ── Q11. Independence check: P(A∩B) against P(A)·P(B) ─────────
  function independenceCheck() {
    const id = 'independence-check';
    const pA = val(id, 'pA', 0.5), pB = val(id, 'pB', 0.2), inAB = val(id, 'pAB', 0.1);
    let pAB = inAB; const adj = [];
    if (pAB > Math.min(pA, pB) + 1e-12) { pAB = Math.min(pA, pB); adj.push(`P(A∩B) → ${pAB.toFixed(3)} (A∩B ⊆ A, B)`); }
    if (pA + pB - pAB > 1 + 1e-12) { pAB = pA + pB - 1; adj.push(`P(A∩B) → ${pAB.toFixed(3)} (so that P(A∪B) ≤ 1)`); }
    const prod = pA * pB, indep = Math.abs(pAB - prod) < 1e-9;
    const f = v => v.toFixed(3);
    const pAgB = pB > 0 ? pAB / pB : null, pBgA = pA > 0 ? pAB / pA : null;   // null: Plotly leaves the bar out
    const verdict = indep ? 'independent ✓  (P(A∩B) = P(A)·P(B), so P(A|B) = P(A) and P(B|A) = P(B))' : `dependent  (P(A∩B) = ${f(pAB)} ≠ P(A)·P(B) = ${f(prod)})`;
    const groups = ['P(A∩B) vs P(A)·P(B)', 'P(A|B) vs P(A)', 'P(B|A) vs P(B)'];
    Plotly.newPlot(el(id), [
      { type: 'bar', x: groups, y: [pAB, pAgB, pBgA], name: 'actual: P(A∩B), P(A|B), P(B|A)', marker: { color: '#00a651' }, text: [f(pAB), pAgB === null ? 'undef.' : f(pAgB), pBgA === null ? 'undef.' : f(pBgA)], textposition: 'outside', textfont: { color: '#e2e8f0' } },
      { type: 'bar', x: groups, y: [prod, pA, pB], name: 'if independent: P(A)·P(B), P(A), P(B)', marker: { color: '#60a5fa' }, text: [f(prod), f(pA), f(pB)], textposition: 'outside', textfont: { color: '#e2e8f0' } },
    ], layout({ title: `A and B are ${verdict}` + (adj.length ? `<br><span style="color:#facc15">⚠ adjusted: ${adj.join('; ')}</span>` : ''),
                barmode: 'group', yaxis: ax({ range: [0, 1.15], title: 'probability' }), xaxis: ax({}), legend: { orientation: 'h', y: -0.2 }, margin: { t: 70, r: 20, b: 80, l: 55 } }), cfg());
  }

  // ── Q12. Sampling with vs without replacement ─────────────────
  function drawReplacement() {
    const id = 'draw-replacement';
    const N = Math.round(val(id, 'N', 10)), d0 = Math.round(val(id, 'd', 3)), n = Math.round(val(id, 'n', 2));
    const d = Math.min(d0, N);
    const steps = [], without = [], withR = [];
    let pw = 1, pr = 1;
    for (let i = 0; i < n; i++) {
      const cw = (d - i) > 0 && (N - i) > 0 ? (d - i) / (N - i) : 0, cr = d / N;
      pw *= cw; pr *= cr;
      steps.push(`draw ${i + 1}`); without.push(cw); withR.push(cr);
    }
    const f = v => v.toFixed(4);
    const frac = (i) => `${Math.max(d - i, 0)}/${N - i}`;
    const prodW = Array.from({ length: n }, (_, i) => frac(i)).join(' · '), prodR = Array.from({ length: n }, () => `${d}/${N}`).join(' · ');
    Plotly.newPlot(el(id), [
      { type: 'bar', x: steps, y: without, name: `without replacement: P(all ${n} special) = ${prodW} = ${f(pw)}`, marker: { color: '#00a651' }, text: without.map((v, i) => `${frac(i)} = ${v.toFixed(3)}`), textposition: 'outside', textfont: { color: '#e2e8f0' } },
      { type: 'bar', x: steps, y: withR, name: `with replacement: P(all ${n} special) = ${prodR} = ${f(pr)}`, marker: { color: '#60a5fa' }, text: withR.map(v => `${d}/${N} = ${v.toFixed(3)}`), textposition: 'outside', textfont: { color: '#e2e8f0' } },
    ], layout({ title: `${N} items, ${d} special, ${n} drawn in succession: P(special on this draw | all earlier draws special)`,
                barmode: 'group', yaxis: ax({ range: [0, Math.max(...without, ...withR, 0.05) * 1.35], title: 'conditional probability' }), xaxis: ax({}),
                legend: { orientation: 'h', y: -0.2 }, margin: { t: 60, r: 20, b: 90, l: 55 } }), cfg());
  }

  // ── Partition helper: three causes B1, B2, B3 from two sliders ──
  function partition3(id) {
    let p1 = val(id, 'p1', 0.5), p2 = val(id, 'p2', 0.3);
    const adj = [];
    if (p1 + p2 > 1 + 1e-12) { p2 = 1 - p1; adj.push(`P(B₂) → ${p2.toFixed(2)} (the partition must sum to 1)`); }
    const p3 = 1 - p1 - p2;
    const q = [val(id, 'q1', 0.02), val(id, 'q2', 0.05), val(id, 'q3', 0.10)];
    const prior = [p1, p2, p3], joint = prior.map((p, i) => p * q[i]);
    const pA = joint.reduce((s, v) => s + v, 0);
    return { prior, q, joint, pA, adj };
  }

  // ── Q13. Law of total probability as a tree ───────────────────
  function totalProbTree() {
    const id = 'total-prob-tree';
    const { prior, q, joint, pA, adj } = partition3(id);
    const f = v => v.toFixed(3), f2 = v => v.toFixed(2);
    const ys = [0.85, 0.5, 0.15];
    const lx = [], ly = [], ann = [];
    prior.forEach((p, i) => {
      lx.push(0, 1, null); ly.push(0.5, ys[i], null);                      // trunk → Bi
      lx.push(1, 2, null); ly.push(ys[i], ys[i] + 0.09, null);              // Bi → A
      lx.push(1, 2, null); ly.push(ys[i], ys[i] - 0.09, null);              // Bi → A′
      ann.push({ x: 0.5, y: (0.5 + ys[i]) / 2 + 0.035, text: `P(B${i + 1}) = ${f2(p)}`, font: { color: '#facc15' } });
      ann.push({ x: 1.05, y: ys[i], text: `<b>B${i + 1}</b>`, font: { color: '#e2e8f0', size: 14 }, xanchor: 'right' });
      ann.push({ x: 1.5, y: ys[i] + 0.075, text: `P(A|B${i + 1}) = ${f2(q[i])}`, font: { color: '#60a5fa', size: 11 } });
      ann.push({ x: 1.5, y: ys[i] - 0.075, text: `P(A′|B${i + 1}) = ${f2(1 - q[i])}`, font: { color: '#64748b', size: 11 } });
      ann.push({ x: 2.05, y: ys[i] + 0.09, text: `A: P(B${i + 1})·P(A|B${i + 1}) = ${f2(p)} × ${f2(q[i])} = <b>${f(joint[i])}</b>`, font: { color: '#4ade80', size: 12 }, xanchor: 'left' });
      ann.push({ x: 2.05, y: ys[i] - 0.09, text: `A′: ${f(p * (1 - q[i]))}`, font: { color: '#64748b', size: 11 }, xanchor: 'left' });
    });
    Plotly.newPlot(el(id), [
      { x: lx, y: ly, mode: 'lines', line: { color: '#a16207', width: 1.5 }, hoverinfo: 'skip', showlegend: false },
      { x: [0], y: [0.5], mode: 'markers', marker: { color: '#e2e8f0', size: 9 }, hoverinfo: 'skip', showlegend: false },
      { x: [1, 1, 1], y: ys, mode: 'markers', marker: { color: '#facc15', size: 8 }, hoverinfo: 'skip', showlegend: false },
      { x: [2, 2, 2], y: ys.map(y => y + 0.09), mode: 'markers', marker: { color: '#4ade80', size: 8 }, hoverinfo: 'skip', showlegend: false },
      { x: [2, 2, 2], y: ys.map(y => y - 0.09), mode: 'markers', marker: { color: '#64748b', size: 6 }, hoverinfo: 'skip', showlegend: false },
    ], layout({ title: `P(A) = Σ P(Bᵢ)·P(A|Bᵢ) = ${joint.map(f).join(' + ')} = <b>${f(pA)}</b>  (add the A-leaves)` + (adj.length ? `<br><span style="color:#facc15">⚠ ${adj.join('; ')}</span>` : ''),
                annotations: ann.map(a => Object.assign({ showarrow: false }, a)),
                xaxis: ax({ range: [-0.2, 3.6], visible: false }), yaxis: ax({ range: [0, 1], visible: false }), margin: { t: 60, r: 10, b: 10, l: 10 } }), cfg());
  }

  // ── Q14. Bayes' theorem: prior → posterior ────────────────────
  function bayesPosterior() {
    const id = 'bayes-posterior';
    const { prior, q, joint, pA, adj } = partition3(id);
    const post = joint.map(j => pA > 0 ? j / pA : NaN);
    const f = v => v.toFixed(3), f2 = v => v.toFixed(2);
    const names = ['B₁', 'B₂', 'B₃'];
    const r = Math.round(val(id, 'r', 3));   // which cause to spell out
    const k = Math.min(3, Math.max(1, r)) - 1;
    const title = pA > 0
      ? `P(${names[k]} | A) = P(${names[k]})·P(A|${names[k]}) / P(A) = ${f2(prior[k])} × ${f2(q[k])} / ${f(pA)} = <b>${f(post[k])}</b>   (prior ${f2(prior[k])})`
      : 'P(A) = 0: nothing to condition on';
    Plotly.newPlot(el(id), [
      { type: 'bar', x: names, y: prior, name: 'prior P(Bᵢ) — before knowing A happened', marker: { color: '#facc15' }, text: prior.map(f2), textposition: 'outside', textfont: { color: '#e2e8f0' } },
      { type: 'bar', x: names, y: post, name: 'posterior P(Bᵢ | A) — after', marker: { color: names.map((_, i) => i === k ? '#00a651' : '#4ade80') }, text: post.map(v => isNaN(v) ? '' : f(v)), textposition: 'outside', textfont: { color: '#e2e8f0' } },
    ], layout({ title: title + (adj.length ? `<br><span style="color:#facc15">⚠ ${adj.join('; ')}</span>` : ''),
                barmode: 'group', yaxis: ax({ range: [0, 1.15], title: 'probability' }), xaxis: ax({ title: 'the partition (causes)' }), legend: { orientation: 'h', y: -0.25 }, margin: { t: 70, r: 20, b: 90, l: 55 } }), cfg());
  }

  // ── Q15. Screening test: P(condition | positive) against the base rate ──
  function rareDisease() {
    const id = 'rare-disease';
    const prev = val(id, 'prev', 0.002), sens = val(id, 'sens', 0.95), spec = val(id, 'spec', 0.98);
    const pop = 1e6;
    const D = prev * pop, H = pop - D;
    const tp = D * sens, fn = D - tp, fp = H * (1 - spec), tn = H - fp;
    const pPos = tp + fp;
    const ppv = pPos > 0 ? tp / pPos : NaN;
    const f = v => v.toFixed(3);
    const cnt = v => Math.round(v).toLocaleString('en-US');
    const title = pPos > 0
      ? `P(D | +) = ${prev}×${sens} / (${prev}×${sens} + ${(1 - prev).toFixed(4)}×${(1 - spec).toFixed(3)}) = <b>${f(ppv)}</b>,  P(D′ | +) = <b>${f(1 - ppv)}</b><br>of ${cnt(pPos)} positives per million people, ${cnt(tp)} are sick and ${cnt(fp)} are false alarms`
      : 'no positive tests at all';
    Plotly.newPlot(el(id), [
      { type: 'bar', x: ['test positive', 'test negative'], y: [tp, fn], name: `has the condition D (${cnt(D)} of ${cnt(pop)})`, marker: { color: '#f87171' }, text: [`true +: ${cnt(tp)}`, `missed: ${cnt(fn)}`], textposition: 'outside', textfont: { color: '#e2e8f0' } },
      { type: 'bar', x: ['test positive', 'test negative'], y: [fp, tn], name: `healthy D′ (${cnt(H)})`, marker: { color: '#60a5fa' }, text: [`false +: ${cnt(fp)}`, `true −: ${cnt(tn)}`], textposition: 'outside', textfont: { color: '#e2e8f0' } },
    ], layout({ title, barmode: 'group', yaxis: ax({ type: 'log', title: 'people out of 1,000,000 (log scale)', range: [0, 6.5] }), xaxis: ax({}),
                legend: { orientation: 'h', y: -0.2 }, margin: { t: 80, r: 20, b: 80, l: 70 } }), cfg());
  }

  // ── Distribution helpers (MAST 221, units 4–11) ───────────────
  // Binomial pmf in log space, so (1 − p)^n cannot underflow for large n.
  function binomPmf(n, p) {
    const out = new Array(n + 1).fill(0);
    if (p <= 0) { out[0] = 1; return out; }
    if (p >= 1) { out[n] = 1; return out; }
    for (let k = 0; k <= n; k++) out[k] = Math.exp(lchoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
    return out;
  }
  // Poisson pmf on 0..K by P(k+1) = P(k)·λ/(k+1).
  function poisPmf(lam, K) {
    const out = [Math.exp(-lam)];
    for (let k = 0; k < K; k++) out.push(out[k] * lam / (k + 1));
    return out;
  }
  function choose(n, k) {
    if (k < 0 || k > n) return 0;
    let c = 1;
    for (let i = 1; i <= Math.min(k, n - k); i++) c = c * (n - Math.min(k, n - k) + i) / i;
    return Math.round(c);
  }
  // log Γ(x) for x > 0 (Lanczos, g = 7), accurate to ~1e-13.
  function lgamma(x) {
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
                      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
    x -= 1;
    let a = c[0];
    const t = x + g + 0.5;
    for (let i = 1; i < 9; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  function lchoose(n, k) { return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1); }
  // Standard normal distribution function Φ(z), via erf (Abramowitz–Stegun 7.1.26, error < 1.5e-7).
  function Phi(z) {
    const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
    const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
  }
  const phi = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  function frac(num, den) { if (num === 0) return '0'; const g = gcd(num, den); return den / g === 1 ? `${num / g}` : `${num / g}/${den / g}`; }
  const C_BAR = '#00a651', C_DIM = '#475569';
  // Step graph of a distribution function with jumps at xs (sorted) of sizes ps, drawn on [lo, hi].
  function cdfSteps(xs, ps, lo, hi, color, xa, ya) {
    const sx = [], sy = [], ox = [], oy = [], cx = [], cy = [];
    let F = 0, left = lo;
    xs.forEach((x, i) => {
      sx.push(left, x, null); sy.push(F, F, null);
      ox.push(x); oy.push(F);
      F += ps[i];
      cx.push(x); cy.push(F);
      left = x;
    });
    sx.push(left, hi); sy.push(F, F);
    const extra = xa ? { xaxis: xa, yaxis: ya } : {};
    return [
      Object.assign({ x: sx, y: sy, mode: 'lines', line: { color, width: 2.5 }, hoverinfo: 'skip', showlegend: false }, extra),
      Object.assign({ x: ox, y: oy, mode: 'markers', marker: { color: '#111827', size: 7, line: { color, width: 2 } }, hoverinfo: 'skip', showlegend: false }, extra),
      Object.assign({ x: cx, y: cy, mode: 'markers', marker: { color, size: 7 }, hoverinfo: 'skip', showlegend: false }, extra),
    ];
  }

  // ── Q16. A discrete random variable: its pmf and its distribution function ──
  function rvPmfCdf() {
    const id = 'rv-pmf-cdf';
    const ex = Math.round(val(id, 'ex', 0)), n = Math.max(1, Math.round(val(id, 'n', 3))), x = val(id, 'x', 1.5);
    let xs = [], cnt = [], den, name;
    if (ex === 0) { den = 1 << n; for (let k = 0; k <= n; k++) { xs.push(k); cnt.push(choose(n, k)); } name = `X = number of heads in ${n} toss${n > 1 ? 'es' : ''}`; }
    else if (ex === 1) { den = 36; for (let s = 2; s <= 12; s++) { xs.push(s); cnt.push(6 - Math.abs(s - 7)); } name = 'X = sum of two dice'; }
    else { den = 1 << 12; for (let k = 1; k <= 12; k++) { xs.push(k); cnt.push(1 << (12 - k)); } name = 'X = tosses until the first head (k ≤ 12 shown)'; }
    const ps = cnt.map(c => c / den);
    let num = 0; xs.forEach((v, i) => { if (v <= x) num += cnt[i]; });
    const F = num / den;
    const lo = Math.min(-1, xs[0] - 1), hi = xs[xs.length - 1] + 1;
    const title = `${name}<br>F(${x}) = P(X ≤ ${x}) = ${frac(num, den)} = ${F.toFixed(4)}`;
    Plotly.newPlot(el(id), [
      { type: 'bar', x: xs, y: ps, marker: { color: xs.map(v => v <= x ? C_BAR : C_DIM) }, name: 'p(x) = P(X = x)', width: 0.6,
        text: cnt.map(c => frac(c, den)), textposition: 'outside', textfont: { size: 10, color: '#c8d0e0' }, hoverinfo: 'x+y' },
      ...cdfSteps(xs, ps, lo, hi, '#60a5fa', 'x2', 'y2'),
      { x: [x, x], y: [0, 1.05], xaxis: 'x2', yaxis: 'y2', mode: 'lines', line: { color: C_ARROW, dash: 'dash', width: 1.5 }, name: `x = ${x}`, hoverinfo: 'skip' },
      { x: [x], y: [F], xaxis: 'x2', yaxis: 'y2', mode: 'markers', marker: { color: C_ARROW, size: 11, symbol: 'diamond' }, name: 'F(x)', hoverinfo: 'skip' },
    ], twoRows({ title, margin: { t: 70, r: 20, b: 40, l: 55 },
      xaxis: { range: [lo, hi], dtick: 1, title: 'x' }, yaxis: { title: 'p(x)', range: [0, Math.max(...ps) * 1.25] },
      xaxis2: { range: [lo, hi], dtick: 1, title: 'x' }, yaxis2: { title: 'F(x)', range: [-0.05, 1.08] }, showlegend: false }), cfg());
  }

  // ── Q17. A density: probability is area, and F(b) − F(a) ──────
  function densityArea() {
    const id = 'density-area';
    const d = Math.round(val(id, 'dens', 1)), n = Math.max(1, Math.round(val(id, 'n', 2)));
    let a = val(id, 'a', 1), b = val(id, 'b', 2);
    if (a > b) [a, b] = [b, a];
    const c = (n + 1) * (2 * n + 1) / n;
    const D = [
      { name: 'pointer: f(x) = 1 on (0, 1]', f: x => (x > 0 && x <= 1 ? 1 : 0), F: x => Math.min(1, Math.max(0, x)) },
      { name: 'f(x) = e^(−x) for x > 0', f: x => (x > 0 ? Math.exp(-x) : 0), F: x => (x > 0 ? 1 - Math.exp(-x) : 0) },
      { name: 'triangle: f(x) = 1 − |x| on (−1, 1]', f: x => (Math.abs(x) < 1 ? 1 - Math.abs(x) : 0),
        F: x => (x <= -1 ? 0 : x <= 0 ? (x + 1) * (x + 1) / 2 : x <= 1 ? 1 - (1 - x) * (1 - x) / 2 : 1) },
      { name: `f(x) = c·xⁿ(1 − xⁿ) on [0, 1], n = ${n}, c = ${c.toFixed(3)}`, f: x => (x >= 0 && x <= 1 ? c * Math.pow(x, n) * (1 - Math.pow(x, n)) : 0),
        F: x => { const u = Math.min(1, Math.max(0, x)); return c * (Math.pow(u, n + 1) / (n + 1) - Math.pow(u, 2 * n + 1) / (2 * n + 1)); } },
    ][d];
    const lo = -1.5, hi = 4, Fa = D.F(a), Fb = D.F(b), P = Fb - Fa;
    const ys = lin(lo, hi, 800).map(D.f), top = Math.max(1.05, ...ys) * 1.1;
    Plotly.newPlot(el(id), [
      band(D.f, () => 0, a, b, C_POS, `area = ${P.toFixed(4)}`, 400),
      curve(D.f, lo, hi, 800, { name: 'density f(x)', line: { color: C_FN, width: 2 }, hoverinfo: 'skip' }),
      curve(D.F, lo, hi, 400, { name: 'F(x)', line: { color: '#60a5fa', width: 2.5 }, xaxis: 'x2', yaxis: 'y2', hoverinfo: 'skip' }),
      { x: [a, b], y: [Fa, Fb], xaxis: 'x2', yaxis: 'y2', mode: 'markers+text', text: [`F(a) = ${Fa.toFixed(3)}`, `F(b) = ${Fb.toFixed(3)}`],
        textposition: ['bottom right', 'top left'], textfont: { color: '#e2e8f0', size: 11 }, marker: { color: C_ARROW, size: 9 }, showlegend: false, hoverinfo: 'skip' },
      { x: [b, b], y: [Fa, Fb], xaxis: 'x2', yaxis: 'y2', mode: 'lines', line: { color: C_ARROW, width: 4 }, name: 'F(b) − F(a)', hoverinfo: 'skip' },
    ], twoRows({ title: `${D.name}<br>P(${a} < X ≤ ${b}) = F(${b}) − F(${a}) = ${Fb.toFixed(4)} − ${Fa.toFixed(4)} = ${P.toFixed(4)}`,
      margin: { t: 70, r: 20, b: 40, l: 55 }, xaxis: { range: [lo, hi], title: 'x' }, yaxis: { range: [0, top], title: 'f(x)' },
      xaxis2: { range: [lo, hi], title: 'x' }, yaxis2: { range: [-0.05, 1.1], title: 'F(x)' } }), cfg());
  }

  // ── Q18. A joint pmf: marginals, a conditional pmf, independence ──
  function jointPmf() {
    const id = 'joint-pmf';
    const ex = Math.round(val(id, 'ex', 0)), y0 = Math.round(val(id, 'y', 1));
    let outcomes, fx, fy, den, lx, ly;
    if (ex === 0) {
      outcomes = ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'];
      fx = s => s.split('H').length - 1; fy = s => s.indexOf('H') + 1; den = 8;
      lx = 'X = number of heads'; ly = 'Y = toss of the first head (0 if none)';
    } else if (ex === 1) {
      outcomes = []; for (let i = 1; i <= 4; i++) for (let j = 1; j <= 4; j++) outcomes.push([i, j]);
      fx = o => o[0]; fy = o => o[0] + o[1]; den = 16;
      lx = 'X = first roll'; ly = 'Y = sum of the two rolls (four-sided die)';
    } else {
      outcomes = ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'];
      fx = s => (s[0] === 'H' ? 1 : 0); fy = s => s.slice(1).split('H').length - 1; den = 8;
      lx = 'X = heads on toss 1'; ly = 'Y = heads on tosses 2–3';
    }
    const cnt = {}, xsSet = new Set(), ysSet = new Set();
    outcomes.forEach(o => { const x = fx(o), y = fy(o); xsSet.add(x); ysSet.add(y); cnt[x + ',' + y] = (cnt[x + ',' + y] || 0) + 1; });
    const xs = [...xsSet].sort((p, q) => p - q), ys = [...ysSet].sort((p, q) => p - q);
    const c = (x, y) => cnt[x + ',' + y] || 0;
    const cx = xs.map(x => ys.reduce((s, y) => s + c(x, y), 0)), cy = ys.map(y => xs.reduce((s, x) => s + c(x, y), 0));
    let indep = true;
    xs.forEach((x, i) => ys.forEach((y, j) => { if (c(x, y) * den !== cx[i] * cy[j]) indep = false; }));
    const z = xs.map(x => ys.map(y => c(x, y) / den));
    const text = xs.map(x => ys.map(y => frac(c(x, y), den)));
    const jy = ys.indexOf(y0);
    const traces = [
      { type: 'heatmap', x: ys.map(String), y: xs.map(String), z, text, texttemplate: '%{text}', textfont: { size: 13 },
        colorscale: [[0, '#1f2937'], [1, '#00a651']], showscale: false, xgap: 3, ygap: 3, hoverinfo: 'text', xaxis: 'x', yaxis: 'y' },
      { type: 'bar', orientation: 'h', y: xs.map(String), x: cx.map(v => v / den), name: 'marginal p_X(x)', marker: { color: C_DIM },
        text: cx.map(v => frac(v, den)), textposition: 'outside', textfont: { color: '#c8d0e0', size: 11 }, xaxis: 'x2', yaxis: 'y2' },
    ];
    let title;
    if (jy >= 0) {
      traces.push({ type: 'bar', orientation: 'h', y: xs.map(String), x: xs.map(x => c(x, y0) / cy[jy]), name: `conditional p(x | Y = ${y0})`,
        marker: { color: C_BAR }, text: xs.map(x => frac(c(x, y0), cy[jy])), textposition: 'outside', textfont: { color: '#c8d0e0', size: 11 }, xaxis: 'x2', yaxis: 'y2' });
      title = `p_Y(${y0}) = ${frac(cy[jy], den)};  p(x | ${y0}) = p(x, ${y0}) / p_Y(${y0}) is column y = ${y0} rescaled to sum 1`;
    } else title = `P(Y = ${y0}) = 0: p(x | ${y0}) is undefined — pick a value in the table's columns`;
    title += `<br>${indep ? 'independent: every cell equals p_X(x)·p_Y(y)' : 'dependent: some cell differs from p_X(x)·p_Y(y)'}`;
    const shapes = jy >= 0 ? [{ type: 'rect', xref: 'x', yref: 'y', x0: jy - 0.5, x1: jy + 0.5, y0: -0.5, y1: xs.length - 0.5, line: { color: C_ARROW, width: 3 } }] : [];
    Plotly.newPlot(el(id), traces, layout({ title, shapes, barmode: 'group',
      xaxis: ax({ domain: [0, 0.55], title: ly, type: 'category', side: 'bottom' }), yaxis: ax({ title: lx, type: 'category', autorange: 'reversed' }),
      xaxis2: ax({ domain: [0.65, 1], range: [0, 1.15], title: 'probability' }), yaxis2: ax({ anchor: 'x2', type: 'category', autorange: 'reversed' }),
      legend: { orientation: 'h', y: -0.25 }, margin: { t: 70, r: 20, b: 90, l: 60 } }), cfg());
  }

  // ── Q19. Chebyshev's bound against the true tail ──────────────
  function chebyshevBound() {
    const id = 'chebyshev-bound';
    const d = Math.round(val(id, 'dist', 3)), k = val(id, 'k', 2);
    const sd = Math.sqrt(35 / 12);
    const D = [
      { name: 'fair die (μ = 3.5, σ = 1.708)', tail: k => [1, 2, 3, 4, 5, 6].filter(x => Math.abs(x - 3.5) >= k * sd - 1e-12).length / 6 },
      { name: 'uniform on (0, 1) (μ = 1/2, σ = 1/√12)', tail: k => Math.max(0, 1 - k / Math.sqrt(3)) },
      { name: 'exponential, f(x) = e^(−x) (μ = σ = 1)', tail: k => Math.exp(-(1 + k)) + (k < 1 ? 1 - Math.exp(-(1 - k)) : 0) },
      { name: 'standard normal (μ = 0, σ = 1)', tail: k => 2 * (1 - Phi(k)) },
      { name: 'P(X = ±2) = 1/8, P(X = 0) = 3/4 (μ = 0, σ = 1)', tail: k => (k <= 2 + 1e-12 ? 0.25 : 0) },
    ][d];
    const ks = lin(1, 5, 800);
    const exact = D.tail(k), bound = 1 / (k * k);
    Plotly.newPlot(el(id), [
      { x: ks, y: ks.map(t => 1 / (t * t)), mode: 'lines', name: 'Chebyshev bound 1/k²', line: { color: C_ARROW, width: 2, dash: 'dash' } },
      { x: ks, y: ks.map(D.tail), mode: 'lines', name: 'true P(|X − μ| ≥ kσ)', line: { color: C_BAR, width: 2.5, shape: 'hv' } },
      { x: [k, k], y: [exact, bound], mode: 'markers', marker: { color: [C_BAR, C_ARROW], size: 11 }, showlegend: false, hoverinfo: 'skip' },
      { x: [k, k], y: [0, 1.02], mode: 'lines', line: { color: C_DIM, width: 1 }, showlegend: false, hoverinfo: 'skip' },
    ], layout({ title: `${D.name}<br>k = ${k.toFixed(2)}:  P(|X − μ| ≥ kσ) = ${exact.toFixed(4)}  ≤  1/k² = ${bound.toFixed(4)}`,
      xaxis: ax({ title: 'k (distance from the mean in standard deviations)', range: [1, 5] }), yaxis: ax({ title: 'probability', range: [0, 1.02] }),
      legend: { orientation: 'h', y: -0.22 }, margin: { t: 70, r: 20, b: 80, l: 55 } }), cfg());
  }

  // ── Q20. Moment-generating function and its Maclaurin polynomials ──
  function mgfTaylor() {
    const id = 'mgf-taylor';
    const d = Math.round(val(id, 'dist', 0)), lam = val(id, 'lam', 2), r = Math.round(val(id, 'r', 2));
    const fact = m => { let f = 1; for (let i = 2; i <= m; i++) f *= i; return f; };
    let M, mom, name, tmax = 1.5;
    if (d === 0) {
      name = 'f(x) = C(3, x)/8, x = 0, 1, 2, 3'; M = t => Math.pow((1 + Math.exp(t)) / 2, 3);
      mom = j => [0, 1, 2, 3].reduce((s, x) => s + Math.pow(x, j) * choose(3, x) / 8, 0);
    } else if (d === 1) {
      name = `Poisson, λ = ${lam}`; M = t => Math.exp(lam * (Math.exp(t) - 1));
      const p = poisPmf(lam, 200); mom = j => p.reduce((s, q, x) => s + Math.pow(x, j) * q, 0);
    } else if (d === 2) {
      name = 'exponential, f(x) = e^(−x): M(t) = 1/(1 − t), t < 1'; M = t => (t < 1 ? 1 / (1 - t) : NaN); mom = j => fact(j); tmax = 0.95;
    } else {
      name = 'standard normal: M(t) = e^(t²/2)'; M = t => Math.exp(t * t / 2);
      mom = j => (j % 2 ? 0 : fact(j) / (Math.pow(2, j / 2) * fact(j / 2)));
    }
    const mu = [1]; for (let j = 1; j <= 6; j++) mu.push(mom(j));
    const T = t => { let s = 0; for (let j = 0; j <= r; j++) s += mu[j] * Math.pow(t, j) / fact(j); return s; };
    const ts = lin(-1.5, tmax, 400);
    const f = v => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(3));
    const coef = mu.slice(0, r + 1).map((m, j) => j === 0 ? '1' : `${f(m)}·t${j > 1 ? '^' + j : ''}/${j}!`).join(' + ');
    Plotly.newPlot(el(id), [
      { x: ts, y: ts.map(M), mode: 'lines', name: 'M(t) = E[e^(tX)]', line: { color: C_FN, width: 3 } },
      { x: ts, y: ts.map(T), mode: 'lines', name: `Maclaurin polynomial of degree ${r}`, line: { color: C_BAR, width: 2, dash: 'dash' } },
      { x: [0], y: [1], mode: 'markers', marker: { color: C_ARROW, size: 9 }, name: 'M(0) = 1' },
    ], layout({ title: `${name}<br>μ′₁ = M′(0) = ${f(mu[1])},  μ′₂ = M″(0) = ${f(mu[2])},  σ² = μ′₂ − μ′₁² = ${f(mu[2] - mu[1] * mu[1])}`,
      xaxis: ax({ title: 't', range: [-1.5, 1.5] }), yaxis: ax({ title: 'M(t)', range: [0, 5] }),
      annotations: [{ x: 0.02, y: 0.97, xref: 'paper', yref: 'paper', xanchor: 'left', showarrow: false, align: 'left', font: { size: 11, color: '#c8d0e0' },
        text: `degree ${r}: ${coef}` }],
      legend: { orientation: 'h', y: -0.22 }, margin: { t: 70, r: 20, b: 80, l: 55 } }), cfg());
  }

  // ── Q21. Covariance: the sign of (x − x̄)(y − ȳ) in each quadrant ──
  function covarianceScatter() {
    const id = 'covariance-scatter';
    const rho = val(id, 'rho', 0.6), sx = val(id, 'sx', 1), sy = val(id, 'sy', 1), n = Math.max(5, Math.round(val(id, 'n', 300)));
    const gauss = () => { let u = 0; while (u === 0) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
    const X = [], Y = [];
    for (let i = 0; i < n; i++) { const z1 = gauss(), z2 = gauss(); X.push(sx * z1); Y.push(sy * (rho * z1 + Math.sqrt(Math.max(0, 1 - rho * rho)) * z2)); }
    const mx = X.reduce((s, v) => s + v, 0) / n, my = Y.reduce((s, v) => s + v, 0) / n;
    const prod = X.map((x, i) => (x - mx) * (Y[i] - my));
    const cov = prod.reduce((s, v) => s + v, 0) / (n - 1);
    const vx = X.reduce((s, v) => s + (v - mx) ** 2, 0) / (n - 1), vy = Y.reduce((s, v) => s + (v - my) ** 2, 0) / (n - 1);
    const r = cov / Math.sqrt(vx * vy), R = 3.5 * Math.max(sx, sy);
    const covT = rho * sx * sy, varSum = sx * sx + sy * sy + 2 * covT;
    Plotly.newPlot(el(id), [
      { x: X, y: Y, mode: 'markers', marker: { size: 5, color: prod.map(p => (p >= 0 ? C_BAR : '#f87171')), opacity: 0.75 }, name: 'green: (x − x̄)(y − ȳ) > 0, red: < 0', hoverinfo: 'skip' },
      { x: [-R, R], y: [my, my], mode: 'lines', line: { color: C_DIM, dash: 'dot' }, showlegend: false, hoverinfo: 'skip' },
      { x: [mx, mx], y: [-R, R], mode: 'lines', line: { color: C_DIM, dash: 'dot' }, showlegend: false, hoverinfo: 'skip' },
    ], layout({ title: `sample cov = ${cov.toFixed(3)} (model ρσ_Xσ_Y = ${covT.toFixed(3)}),  sample r = ${r.toFixed(3)} (model ρ = ${rho.toFixed(2)})<br>Var(X + Y) = σ_X² + σ_Y² + 2 cov(X, Y) = ${varSum.toFixed(3)}`,
      xaxis: ax({ title: 'x', range: [-R, R] }), yaxis: ax({ title: 'y', range: [-R, R], scaleanchor: 'x', scaleratio: 1 }),
      legend: { orientation: 'h', y: -0.2 }, margin: { t: 70, r: 20, b: 70, l: 55 } }), cfg());
  }

  // ── Q22. Binomial(n, p) against Poisson(λ = np) ───────────────
  function binomialPoisson() {
    const id = 'binomial-poisson';
    const n = Math.max(1, Math.round(val(id, 'n', 12))), p = val(id, 'p', 0.5), lam = n * p;
    const K = Math.min(n, Math.ceil(lam + 5 * Math.sqrt(lam + 1) + 5));
    const b = binomPmf(n, p).slice(0, K + 1), q = poisPmf(lam, K);
    const ks = b.map((_, k) => k);
    const diff = Math.max(...ks.map(k => Math.abs(b[k] - q[k])));
    Plotly.newPlot(el(id), [
      { type: 'bar', x: ks, y: b, name: `binomial(n = ${n}, p = ${p.toFixed(2)})`, marker: { color: C_BAR } },
      { x: ks, y: q, mode: 'markers+lines', name: `Poisson(λ = np = ${lam.toFixed(2)})`, line: { color: '#f87171', width: 1 }, marker: { color: '#f87171', size: 7 } },
    ], layout({ title: `binomial: mean np = ${lam.toFixed(2)}, variance np(1 − p) = ${(lam * (1 - p)).toFixed(3)}  |  Poisson: mean = variance = ${lam.toFixed(2)}<br>largest gap between the two pmfs: ${diff.toFixed(4)}`,
      xaxis: ax({ title: 'k', range: [-0.6, K + 0.6] }), yaxis: ax({ title: 'P(X = k)' }), bargap: 0.2,
      legend: { orientation: 'h', y: -0.2 }, margin: { t: 70, r: 20, b: 70, l: 55 } }), cfg());
  }

  // ── Q23. Hypergeometric (without replacement) against binomial (with) ──
  function hypergeomBinomial() {
    const id = 'hypergeom-binomial';
    const N = Math.max(2, Math.round(val(id, 'N', 20))), M = Math.min(N, Math.max(0, Math.round(val(id, 'frac', 0.3) * N))), n = Math.min(N, Math.max(1, Math.round(val(id, 'n', 5))));
    const th = M / N, ks = [], h = [];
    for (let x = 0; x <= n; x++) { ks.push(x); h.push(x > M || n - x > N - M ? 0 : Math.exp(lchoose(M, x) + lchoose(N - M, n - x) - lchoose(N, n))); }
    const b = binomPmf(n, th);
    const vh = n * th * (1 - th) * (N - n) / (N - 1), vb = n * th * (1 - th);
    Plotly.newPlot(el(id), [
      { type: 'bar', x: ks, y: h, name: `hypergeometric: ${n} drawn without replacement from N = ${N} with M = ${M} successes`, marker: { color: C_BAR } },
      { x: ks, y: b, mode: 'markers+lines', name: `binomial(n = ${n}, θ = M/N = ${th.toFixed(3)})`, line: { color: '#f87171', width: 1 }, marker: { color: '#f87171', size: 7 } },
    ], layout({ title: `both means = nM/N = ${(n * th).toFixed(3)}<br>variance: hypergeometric ${vh.toFixed(3)} = binomial ${vb.toFixed(3)} × (N − n)/(N − 1) = × ${((N - n) / (N - 1)).toFixed(3)}`,
      xaxis: ax({ title: 'x = successes in the sample', dtick: 1, range: [-0.6, n + 0.6] }), yaxis: ax({ title: 'probability' }), bargap: 0.2,
      legend: { orientation: 'h', y: -0.22 }, margin: { t: 70, r: 20, b: 90, l: 55 } }), cfg());
  }

  // ── Q24. Standardizing a normal variable ──────────────────────
  function normalStandardize() {
    const id = 'normal-standardize';
    const mu = val(id, 'mu', 1.5), s = val(id, 'sigma', 2.5);
    let a = val(id, 'a', 0), b = val(id, 'b', 4);
    if (a > b) [a, b] = [b, a];
    const za = (a - mu) / s, zb = (b - mu) / s, P = Phi(zb) - Phi(za);
    const f = x => phi((x - mu) / s) / s;
    const clip = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const X0 = -10, X1 = 10, Z0 = -4, Z1 = 4;
    Plotly.newPlot(el(id), [
      band(f, () => 0, clip(a, X0, X1), clip(b, X0, X1), C_POS, '', 300),
      curve(f, X0, X1, 600, { name: `X ~ n(μ = ${mu}, σ = ${s})`, line: { color: C_FN, width: 2 }, hoverinfo: 'skip' }),
      Object.assign(band(phi, () => 0, clip(za, Z0, Z1), clip(zb, Z0, Z1), C_BLUE, '', 300), { xaxis: 'x2', yaxis: 'y2' }),
      curve(phi, Z0, Z1, 400, { name: 'Z = (X − μ)/σ ~ n(0, 1)', line: { color: '#60a5fa', width: 2 }, xaxis: 'x2', yaxis: 'y2', hoverinfo: 'skip' }),
    ], twoRows({ title: `P(${a} < X ≤ ${b}) = Φ(${zb.toFixed(2)}) − Φ(${za.toFixed(2)}) = ${Phi(zb).toFixed(4)} − ${Phi(za).toFixed(4)} = ${P.toFixed(4)}<br>z = (x − μ)/σ:  ${a} → ${za.toFixed(2)},  ${b} → ${zb.toFixed(2)}`,
      margin: { t: 70, r: 20, b: 40, l: 55 }, xaxis: { range: [X0, X1], title: 'x' }, yaxis: { title: 'density of X', rangemode: 'tozero' },
      xaxis2: { range: [Z0, Z1], title: 'z' }, yaxis2: { title: 'density of Z', range: [0, 0.45] } }), cfg());
  }

  // ── Q25. Normal approximation to the binomial, with and without the continuity correction ──
  function normalApproxBinomial() {
    const id = 'normal-approx-binomial';
    const n = Math.max(1, Math.round(val(id, 'n', 20))), p = val(id, 'p', 0.3), k = Math.min(n, Math.max(0, Math.round(val(id, 'k', 5))));
    const b = binomPmf(n, p), mu = n * p, s = Math.sqrt(n * p * (1 - p));
    const ks = b.map((_, x) => x);
    const exact = b.slice(0, k + 1).reduce((t, v) => t + v, 0);
    const cc = Phi((k + 0.5 - mu) / s), raw = Phi((k - mu) / s);
    const lo = Math.max(-0.5, Math.floor(mu - 5 * s)), hi = Math.min(n + 0.5, Math.ceil(mu + 5 * s));
    Plotly.newPlot(el(id), [
      { type: 'bar', x: ks, y: b, width: 1, marker: { color: ks.map(x => (x <= k ? C_BAR : C_DIM)), line: { color: '#111827', width: 1 } }, name: `binomial(${n}, ${p.toFixed(2)}); green bars sum to P(X ≤ ${k})` },
      curve(x => phi((x - mu) / s) / s, lo, hi, 400, { name: `normal, μ = np = ${mu.toFixed(2)}, σ = √(np(1 − p)) = ${s.toFixed(3)}`, line: { color: C_FN, width: 2 }, hoverinfo: 'skip' }),
      { x: [k + 0.5, k + 0.5], y: [0, Math.max(...b) * 1.1], mode: 'lines', line: { color: C_ARROW, dash: 'dash' }, name: `x = k + ½ = ${k + 0.5}`, hoverinfo: 'skip' },
    ], layout({ title: `exact P(X ≤ ${k}) = ${exact.toFixed(4)}   |   Φ((k + ½ − np)/σ) = ${cc.toFixed(4)}   |   no correction Φ((k − np)/σ) = ${raw.toFixed(4)}<br>np = ${mu.toFixed(1)}, n(1 − p) = ${(n * (1 - p)).toFixed(1)}${Math.min(mu, n * (1 - p)) < 5 ? ' — below 5: expect a poor fit' : ''}`,
      xaxis: ax({ title: 'x', range: [lo, hi] }), yaxis: ax({ title: 'probability' }), bargap: 0,
      legend: { orientation: 'h', y: -0.22 }, margin: { t: 70, r: 20, b: 90, l: 55 } }), cfg());
  }

  // ── Q26. Gamma and beta densities as their parameters move ────
  function gammaBetaShapes() {
    const id = 'gamma-beta-shapes';
    const fam = Math.round(val(id, 'fam', 0)), al = val(id, 'alpha', 2), be = val(id, 'beta', 1);
    let f, lo, hi, title;
    if (fam === 0) {
      const lc = -lgamma(al) - al * Math.log(be);
      f = x => (x > 0 ? Math.exp(lc + (al - 1) * Math.log(x) - x / be) : 0);
      lo = 0; hi = Math.max(8, al * be + 5 * Math.sqrt(al) * be);
      const special = al === 1 ? `α = 1: exponential with θ = β = ${be}` : Math.abs(be - 2) < 1e-9 ? `β = 2: chi-square with ν = 2α = ${2 * al} degrees of freedom` : '';
      title = `gamma(α = ${al}, β = ${be}): mean αβ = ${(al * be).toFixed(3)}, variance αβ² = ${(al * be * be).toFixed(3)}${special ? '<br>' + special : ''}`;
    } else {
      const lc = lgamma(al + be) - lgamma(al) - lgamma(be);
      f = x => (x > 0 && x < 1 ? Math.exp(lc + (al - 1) * Math.log(x) + (be - 1) * Math.log(1 - x)) : 0);
      lo = 0; hi = 1;
      const m = al / (al + be), v = al * be / ((al + be) ** 2 * (al + be + 1));
      title = `beta(α = ${al}, β = ${be}): mean α/(α + β) = ${m.toFixed(3)}, variance = ${v.toFixed(4)}${al === 1 && be === 1 ? '<br>α = β = 1: the uniform density on (0, 1)' : ''}`;
    }
    const xs = lin(lo, hi, 600).slice(1, -1), ys = xs.map(f);
    const top = Math.min(6, Math.max(...ys.filter(Number.isFinite)) * 1.15 || 1);
    Plotly.newPlot(el(id), [
      { x: xs, y: ys, mode: 'lines', fill: 'tozeroy', fillcolor: C_POS, line: { color: C_FN, width: 2 }, name: 'density', hoverinfo: 'skip' },
    ], layout({ title, xaxis: ax({ title: 'x', range: [lo, hi] }), yaxis: ax({ title: 'f(x)', range: [0, top] }), showlegend: false,
      margin: { t: 70, r: 20, b: 50, l: 55 } }), cfg());
  }

  // ══════════════════════════════════════════════════════════════
  //  STAT 280 — R programming concepts
  // ══════════════════════════════════════════════════════════════
  const C_R = '#3b82f6';

  // ── S1. Operator precedence: a:b*c + d vs a:(b*c + d) ──────────
  function rPrecedence() {
    const id = 'r-precedence';
    const a = Math.round(val(id, 'a', 5)), b = Math.round(val(id, 'b', 2)), c = Math.round(val(id, 'c', 3)), d = Math.round(val(id, 'd', 10));
    const seq = (p, q) => { const r = []; if (p <= q) for (let k = p; k <= q; k++) r.push(k); else for (let k = p; k >= q; k--) r.push(k); return r; };
    const v1 = seq(a, b).map(k => k * c + d);      // (a:b)*c + d
    const v2 = seq(a, b * c + d);                   // a:(b*c + d)
    const idx = arr => arr.map((_, i) => i + 1);
    Plotly.newPlot(el(id), [
      { type: 'bar', x: idx(v1), y: v1, name: `${a}:${b}*${c} + ${d}  =  (${a}:${b})*${c} + ${d}  →  ${v1.join(' ')}`, marker: { color: '#f87171' }, text: v1.map(String), textposition: 'outside' },
      { type: 'bar', x: idx(v2), y: v2, name: `${a}:(${b}*${c} + ${d})  =  ${a}:${b * c + d}  →  ${v2.length} values`, marker: { color: C_R }, opacity: 0.85 },
    ], layout({ title: `Without parentheses R reads  ${a}:${b}*${c} + ${d}  as  (${a}:${b})*${c} + ${d}  (length ${v1.length}), not ${a}:${b * c + d} (length ${v2.length})`,
                xaxis: ax({ title: 'element index [k]', dtick: 1 }), yaxis: ax({ title: 'value' }), barmode: 'group',
                legend: { orientation: 'h', y: -0.25 } }), cfg());
  }

  // ── S2. Loan instalment (Example 2.1) ─────────────────────────
  function rLoan() {
    const id = 'r-loan';
    const P = val(id, 'P', 1500), i = val(id, 'i', 0.01), n = Math.round(val(id, 'n', 10));
    const R = (P, i, n) => P * i / (1 - Math.pow(1 + i, -n));
    const ns = [], Rs = [];
    for (let k = 1; k <= 60; k++) { ns.push(k); Rs.push(R(P, i, k)); }
    Plotly.newPlot(el(id), [
      { x: ns, y: Rs, mode: 'lines', name: `R(n) for P = ${P}, i = ${i.toFixed(3)}`, line: { color: C_R, width: 2.5 } },
      { x: [n], y: [R(P, i, n)], mode: 'markers+text', name: 'chosen n', text: [`R = ${R(P, i, n).toFixed(2)}`], textposition: 'top right', textfont: { color: '#facc15' },
        marker: { color: '#facc15', size: 12, line: { color: '#fff', width: 1.5 } } },
    ], layout({ title: `R <- P * i / (1 - (1 + i)^(-n))   →   ${R(P, i, n).toFixed(4)}   (total repaid ${(n * R(P, i, n)).toFixed(2)})`,
                xaxis: ax({ title: 'number of monthly instalments n' }), yaxis: ax({ title: 'instalment R' }), legend: { orientation: 'h', y: -0.25 } }), cfg());
  }

  // ── S3. Exercise 1 function plotted on a vector ───────────────
  function rFunctionPlot() {
    const id = 'r-function-plot';
    const xmax = val(id, 'xmax', 10);
    const xs = [], ys = [];
    for (let k = 0; k <= 400; k++) { const x = 1 + (xmax - 1) * k / 400; xs.push(x); ys.push(Math.cos(x) - Math.sqrt(Math.log2(x))); }
    Plotly.newPlot(el(id), [
      { x: xs, y: ys, mode: 'lines', name: 'f(x) = cos(x) − sqrt(log2(x))', line: { color: C_R, width: 2.5 } },
      { x: [1, 4], y: [Math.cos(1), Math.cos(4) - Math.SQRT2], mode: 'markers+text', text: ['f(1) = 0.540', 'f(4) = −2.068'], textposition: 'top right', textfont: { color: '#facc15' },
        marker: { color: '#facc15', size: 10 }, name: 'values checked in the R example' },
    ], layout({ title: `f <- function(x) cos(x) - sqrt(log2(x));   plot(x, f(x)) for x in [1, ${xmax}]`,
                xaxis: ax({ title: 'x' }), yaxis: ax({ title: 'f(x)' }), legend: { orientation: 'h', y: -0.25 } }), cfg());
  }

  // ── S4. Recycling rule ────────────────────────────────────────
  function rRecycling() {
    const id = 'r-recycling';
    const nx = Math.round(val(id, 'nx', 10)), nz = Math.round(val(id, 'nz', 2));
    const L = Math.max(nx, nz), S = Math.min(nx, nz);
    const xUsed = Array.from({ length: L }, (_, k) => (k % nx) + 1);   // x = 1:nx, recycled if shorter
    const zUsed = Array.from({ length: L }, (_, k) => (k % nz) + 1);   // z = 1:nz, recycled if shorter
    const sum = xUsed.map((v, k) => v + zUsed[k]);
    const warn = L % S !== 0;
    const idx = xUsed.map((_, k) => k + 1);
    const shorter = nx <= nz ? 'x' : 'z';
    Plotly.newPlot(el(id), [
      { type: 'bar', x: idx, y: xUsed, name: `x = 1:${nx}${nx < nz ? ' (recycled)' : ''}`, marker: { color: C_R }, text: xUsed.map(v => 'x=' + v), textposition: 'inside', textfont: { color: '#fff' } },
      { type: 'bar', x: idx, y: zUsed, name: `z = 1:${nz}${nz < nx ? ' (recycled)' : ''}`, marker: { color: '#facc15' }, text: zUsed.map(v => 'z=' + v), textposition: 'inside', textfont: { color: '#1f2937' } },
      { x: idx, y: sum, mode: 'lines+markers+text', name: 'x + z', text: sum.map(String), textposition: 'top center', textfont: { color: '#4ade80' }, line: { color: '#4ade80', width: 2 }, marker: { size: 7 } },
    ], layout({ title: warn ? `x + z  (lengths ${nx} and ${nz}) has length ${L}:  ⚠ Warning — longer object length is not a multiple of shorter object length`
                             : (nx === nz ? `x + z  (both length ${L}): plain component-wise sum` : `x + z  (lengths ${nx} and ${nz}) has length ${L}:  ${shorter} is recycled ${L / S} time${L / S > 1 ? 's' : ''}, no warning`),
                xaxis: ax({ title: 'element index [k]', dtick: 1 }), yaxis: ax({ title: 'value' }), barmode: 'stack', legend: { orientation: 'h', y: -0.25 } }), cfg());
  }

  // ── S5. Logical subsetting of die tosses ──────────────────────
  function rLogicalFilter() {
    const id = 'r-logical-filter';
    const n = Math.round(val(id, 'n', 8));
    const lo = Math.round(val(id, 'lo', 2)), hi = Math.round(val(id, 'hi', 4));
    const tosses = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));
    const cond = tosses.map(v => v >= lo && v <= hi);
    const which = cond.map((c, k) => c ? k + 1 : null).filter(v => v !== null);
    const kept = tosses.filter((_, k) => cond[k]);
    const idx = tosses.map((_, k) => k + 1);
    Plotly.newPlot(el(id), [
      { type: 'bar', x: idx, y: tosses, marker: { color: cond.map(c => c ? '#00a651' : '#374151') }, text: cond.map(c => c ? 'TRUE' : 'FALSE'), textposition: 'outside', textfont: { size: 10 }, name: 'dice.tossings', showlegend: false },
    ], layout({ title: `cond <- tossings >= ${lo} & tossings <= ${hi}${hi < lo ? '   (no value can satisfy both: ' + lo + ' > ' + hi + ', so cond is all FALSE)' : ''}<br>tossings[cond] = ${kept.join(' ') || 'numeric(0)'}      which(cond) = ${which.join(' ') || 'integer(0)'}`,
                xaxis: ax({ title: 'index', dtick: 1 }), yaxis: ax({ title: 'toss', range: [0, 7.5], dtick: 1 }), margin: { t: 70, r: 20, b: 50, l: 55 } }), cfg());
  }

  // ── S6. Column-major single index A[k] ────────────────────────
  function rMatrixIndex() {
    const id = 'r-matrix-index';
    const nr = Math.round(val(id, 'nrow', 2)), nc = Math.round(val(id, 'ncol', 4));
    const N = nr * nc; const k = Math.round(val(id, 'k', 3));
    const inside = k >= 1 && k <= N;
    const row = ((k - 1) % nr) + 1, col = Math.floor((k - 1) / nr) + 1;
    const z = [], text = [];
    for (let i = 1; i <= nr; i++) { const zr = [], tr = []; for (let j = 1; j <= nc; j++) { const v = (j - 1) * nr + i; zr.push(v === k ? 1 : 0); tr.push(String(v)); } z.push(zr); text.push(tr); }
    Plotly.newPlot(el(id), [{
      type: 'heatmap', z, text, texttemplate: '%{text}', textfont: { size: 16 }, colorscale: [[0, '#1f2937'], [1, '#00a651']], zmin: 0, zmax: 1, showscale: false, xgap: 4, ygap: 4, hoverinfo: 'text',
      x: Array.from({ length: nc }, (_, j) => `[,${j + 1}]`), y: Array.from({ length: nr }, (_, i) => `[${i + 1},]`),
    }], layout({ title: inside ? `A <- matrix(1:${N}, nrow = ${nr}, ncol = ${nc});   A[${k}] = ${k} = A[${row}, ${col}]   (filled column by column)` : `A <- matrix(1:${N}, nrow = ${nr}, ncol = ${nc});   A[${k}] = NA   (only ${N} entries — index out of range)`,
                xaxis: ax({ side: 'top' }), yaxis: ax({ autorange: 'reversed' }), margin: { t: 80, r: 20, b: 20, l: 60 } }), cfg());
  }

  // ── S7. One-pass vs two-pass variance under a shift ───────────
  function rRoundoff() {
    const id = 'r-roundoff';
    const logA = val(id, 'logA', 10);
    // fixed "runif(10, 0, 10)" sample
    const base = [2.655087, 3.721239, 5.728534, 9.082078, 2.016819, 8.983897, 9.446753, 6.607978, 6.291140, 0.617863];
    const n = base.length;
    const twoPass = x => { const m = x.reduce((a, b) => a + b, 0) / n; return x.reduce((a, v) => a + (v - m) * (v - m), 0) / (n - 1); };
    const onePass = x => { const m = x.reduce((a, b) => a + b, 0) / n; return (x.reduce((a, v) => a + v * v, 0) - n * m * m) / (n - 1); };
    const truth = twoPass(base);
    const ks = [], e1 = [], e2 = [];
    for (let kk = 0; kk <= 16; kk += 0.5) { const A = Math.pow(10, kk); const x = base.map(v => v + A); ks.push(kk); e1.push(Math.abs(twoPass(x) - truth)); e2.push(Math.abs(onePass(x) - truth)); }
    const xs = base.map(v => v + Math.pow(10, logA));
    const v2 = twoPass(xs), v1 = onePass(xs);
    const safe = e => e.map(v => Math.max(v, 1e-17));
    Plotly.newPlot(el(id), [
      { x: ks, y: safe(e1), mode: 'lines+markers', name: 'two-pass  sum((x-mean(x))^2)/(n-1)', line: { color: '#00a651', width: 2.5 } },
      { x: ks, y: safe(e2), mode: 'lines+markers', name: 'one-pass  (sum(x^2) - n*mean(x)^2)/(n-1)', line: { color: '#f87171', width: 2.5 } },
      { x: [logA, logA], y: [1e-17, 1e6], mode: 'lines', name: 'chosen shift', line: { color: '#facc15', dash: 'dot' } },
    ], layout({ title: `x + 10^${logA.toFixed(1)}:   true s² = ${truth.toFixed(5)}   two-pass = ${v2.toFixed(5)}   one-pass = ${Number.isFinite(v1) ? v1.toFixed(3) : v1}`,
                xaxis: ax({ title: 'k  (shift A = 10^k)' }), yaxis: ax({ title: '|computed s² − true s²|  (log scale)', type: 'log', range: [-17, 6] }),
                legend: { orientation: 'h', y: -0.25 } }), cfg());
  }

  // ══ STAT 280 — units 5–12: graphics, flow control, simulation, linear algebra ══
  const C_OK = '#00a651', C_BAD = '#f87171', C_HI = '#facc15', C_GREY = '#6b7280';
  const gauss = () => { let u = 0; while (u === 0) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
  const range = (n, f) => Array.from({ length: n }, (_, k) => f(k));
  const sum = a => a.reduce((s, v) => s + v, 0);
  const mean = a => sum(a) / a.length;
  const sdev = a => { const m = mean(a); return Math.sqrt(sum(a.map(v => (v - m) ** 2)) / (a.length - 1)); };
  const dnormJ = (x, m = 0, s = 1) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
  // standard normal quantile (Acklam's rational approximation, relative error < 1.2e-9)
  function qnormJ(p) {
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    const pl = 0.02425;
    if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) return -qnormJ(1 - p);
    const q = p - 0.5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  // upper normal tail P(Z > x) for x >= 0 (continued fraction, accurate far into the tail)
  function pnormUpper(x) {
    if (x < 0) return 1 - pnormUpper(-x);
    if (x < 3) { // series for the lower part: Phi(x) = 1/2 + phi(x) * sum x^(2k+1) / (1*3*...*(2k+1))
      let term = x, s = x;
      for (let k = 1; k < 200; k++) { term *= x * x / (2 * k + 1); s += term; if (term < 1e-17 * s) break; }
      return 0.5 - dnormJ(x) * s;
    }
    let f = 0; for (let k = 60; k >= 1; k--) f = k / (x + f);
    return dnormJ(x) / (x + f);
  }
  // quantile of a sorted array, R's default (type 7)
  const quant = (s, p) => { const h = (s.length - 1) * p, lo = Math.floor(h); return s[lo] + (h - lo) * ((s[Math.min(lo + 1, s.length - 1)]) - s[lo]); };
  // cyclic Jacobi eigen-decomposition of a symmetric matrix: { values, vectors (columns) }, sorted decreasing
  function jacobiEigen(Ain) {
    const n = Ain.length, A = Ain.map(r => r.slice()), V = range(n, i => range(n, j => (i === j ? 1 : 0)));
    for (let sweep = 0; sweep < 100; sweep++) {
      let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
      if (off < 1e-30) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
        for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    const order = range(n, i => i).sort((i, j) => A[j][j] - A[i][i]);
    return { values: order.map(i => A[i][i]), vectors: V.map(row => order.map(i => row[i])) };
  }
  const matmul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
  const hilbert = n => range(n, i => range(n, j => 1 / (i + j + 1)));
  // Gaussian elimination with partial pivoting (what solve() does)
  function gaussSolve(Ain, b) {
    const n = Ain.length, A = Ain.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]];
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let k = i + 1; k < n; k++) s -= A[i][k] * x[k]; x[i] = s / A[i][i]; }
    return x;
  }
  const invert = A => { const n = A.length, cols = range(n, j => gaussSolve(A, range(n, i => (i === j ? 1 : 0)))); return range(n, i => range(n, j => cols[j][i])); };

  // ── S8. Histogram bin rules ────────────────────────────────────
  function rHistBins() {
    const id = 'r-hist-bins';
    const n = Math.round(Math.pow(10, val(id, 'logn', 2.3))), rule = Math.round(val(id, 'rule', 1));
    const x = range(n, gauss), s = x.slice().sort((a, b) => a - b);
    const lo = s[0], hi = s[n - 1], sd = sdev(x), iqr = quant(s, 0.75) - quant(s, 0.25);
    const kSt = Math.ceil(Math.log2(n) + 1);
    const kSc = Math.max(1, Math.ceil((hi - lo) / (3.49 * sd * Math.pow(n, -1 / 3))));
    const kFD = Math.max(1, Math.ceil((hi - lo) / (2 * iqr * Math.pow(n, -1 / 3))));
    const k = [kSt, kSc, kFD][rule - 1], names = ['Sturges', 'Scott', 'Freedman–Diaconis'];
    const w = (hi - lo) / k, counts = new Array(k).fill(0);
    x.forEach(v => { counts[Math.min(k - 1, Math.floor((v - lo) / w))]++; });
    const mids = range(k, i => lo + (i + 0.5) * w), dens = counts.map(c => c / (n * w));
    const cx = range(201, i => -4 + 8 * i / 200);
    Plotly.newPlot(el(id), [
      { type: 'bar', x: mids, y: dens, width: w * 0.98, marker: { color: C_R }, name: `${k} bins of width ${w.toFixed(3)}` },
      { x: cx, y: cx.map(v => dnormJ(v)), mode: 'lines', line: { color: C_HI, width: 2 }, name: 'N(0, 1) density' },
    ], layout({ title: `n = ${n}, ${names[rule - 1]}: ${k} bins<br>(for this sample: Sturges ${kSt} · Scott ${kSc} · FD ${kFD})`,
                xaxis: ax({ title: 'x', range: [-4.2, 4.2] }), yaxis: ax({ title: 'density' }), bargap: 0, legend: { orientation: 'h', y: -0.22 },
                margin: { t: 70, r: 20, b: 50, l: 55 } }), cfg());
  }

  // ── S9. Box plot: hinges, fences and outliers ──────────────────
  function rBoxplotFences() {
    const id = 'r-boxplot-fences';
    const last = val(id, 'last', 24);
    const y = [2, 4, 4, 5, 6, 7, 8, 9, 10, last], s = y.slice().sort((a, b) => a - b), n = s.length;
    const n4 = Math.floor((n + 3) / 2) / 2, at = d => 0.5 * (s[Math.floor(d) - 1] + s[Math.ceil(d) - 1]);
    const [mn, h1, med, h3, mx] = [1, n4, (n + 1) / 2, n + 1 - n4, n].map(at);
    const H = h3 - h1, loF = h1 - 1.5 * H, hiF = h3 + 1.5 * H;
    const inside = s.filter(v => v >= loF && v <= hiF), out = s.filter(v => v < loF || v > hiF);
    const wLo = Math.min(...inside), wHi = Math.max(...inside);
    const jit = s.map((_, i) => -0.35 + 0.08 * (i % 3));
    const X = Math.max(32, mx + 2);
    Plotly.newPlot(el(id), [
      { x: [h1, h3, h3, h1, h1], y: [0.25, 0.25, -0.25, -0.25, 0.25], mode: 'lines', fill: 'toself', fillcolor: 'rgba(59,130,246,.25)', line: { color: C_R, width: 2 }, name: `box: hinges ${h1} and ${h3} (IQR ${H})` },
      { x: [med, med], y: [-0.25, 0.25], mode: 'lines', line: { color: C_HI, width: 3 }, name: `median ${med}` },
      { x: [wLo, h1, null, h3, wHi], y: [0, 0, null, 0, 0], mode: 'lines', line: { color: '#e5e7eb', width: 2 }, name: `whiskers to ${wLo} and ${wHi}` },
      { x: [loF, loF, null, hiF, hiF], y: [-0.5, 0.5, null, -0.5, 0.5], mode: 'lines', line: { color: C_BAD, dash: 'dot' }, name: `fences at hinge ∓ 1.5·IQR: ${loF}, ${hiF}` },
      { x: s, y: jit.map(j => j - 0.25), mode: 'markers', marker: { color: s.map(v => (v < loF || v > hiF) ? C_BAD : '#9ca3af'), size: 9 }, name: 'the ten values', hoverinfo: 'x' },
    ], layout({ title: out.length ? `${out.join(', ')} lies beyond the fence ${hiF}: drawn as an outlier` : `every value is within [${loF}, ${hiF}]: no outliers, the whisker reaches ${wHi}`,
                xaxis: ax({ title: 'value', range: [-8, X] }), yaxis: ax({ visible: false, range: [-0.9, 0.7] }), legend: { orientation: 'h', y: -0.3 } }), cfg());
  }

  // ── S10. QQ plots of four shapes ───────────────────────────────
  function rQqShapes() {
    const id = 'r-qq-shapes';
    const kind = Math.round(val(id, 'kind', 1)), n = Math.round(val(id, 'n', 200));
    const draw = [
      () => gauss(),
      () => -Math.log(1 - Math.random()),
      () => { const z = gauss(), c = gauss() ** 2 + gauss() ** 2 + gauss() ** 2; return z / Math.sqrt(c / 3); },
      () => Math.random(),
    ][kind - 1];
    const names = ['normal', 'exponential (right-skewed)', 't with 3 df (heavy tails)', 'uniform (light tails)'];
    const s = range(n, draw).sort((a, b) => a - b), th = range(n, i => qnormJ((i + 0.5) / n));
    const q1 = quant(s, 0.25), q3 = quant(s, 0.75), t1 = qnormJ(0.25), t3 = qnormJ(0.75), slope = (q3 - q1) / (t3 - t1), icpt = q1 - slope * t1;
    const lx = [th[0], th[n - 1]];
    Plotly.newPlot(el(id), [
      { x: th, y: s, mode: 'markers', marker: { color: C_R, size: 5 }, name: 'sorted sample' },
      { x: lx, y: lx.map(v => icpt + slope * v), mode: 'lines', line: { color: C_HI, width: 2 }, name: 'qqline (through the quartiles)' },
    ], layout({ title: `qqnorm of ${n} ${names[kind - 1]} values`, xaxis: ax({ title: 'theoretical N(0, 1) quantiles' }), yaxis: ax({ title: 'sample quantiles' }),
                legend: { orientation: 'h', y: -0.22 } }), cfg());
  }

  // ── S11. Fixed-point iteration: cobweb for x = a cos(x) ────────
  function rFixedPoint() {
    const id = 'r-fixed-point';
    const a = val(id, 'a', 1), x0 = val(id, 'x0', 0.2), steps = Math.round(val(id, 'steps', 15));
    const g = x => a * Math.cos(x);
    let lo = -Math.abs(a) - 1, hi = Math.abs(a) + 1;   // the fixed point solves g(x) - x = 0 in [-|a|, |a|]
    for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if ((g(lo) - lo) * (g(m) - m) <= 0) hi = m; else lo = m; }
    const xs = (lo + hi) / 2, slope = Math.abs(a * Math.sin(xs));
    const px = [x0], py = [0]; let x = x0;
    for (let k = 0; k < steps; k++) { const y = g(x); px.push(x, y); py.push(y, y); x = y; }
    const R = Math.max(2, Math.abs(a) + 0.8), cx = range(301, i => -R + 2 * R * i / 300);
    Plotly.newPlot(el(id), [
      { x: cx, y: cx.map(g), mode: 'lines', line: { color: C_R, width: 2.5 }, name: `g(x) = ${a.toFixed(2)} cos x` },
      { x: [-R, R], y: [-R, R], mode: 'lines', line: { color: C_GREY, dash: 'dash' }, name: 'y = x' },
      { x: px, y: py, mode: 'lines+markers', line: { color: C_HI, width: 1.5 }, marker: { size: 4 }, name: 'x ← g(x), step by step' },
      { x: [xs], y: [xs], mode: 'markers', marker: { color: C_OK, size: 11 }, name: `fixed point x* = ${xs.toFixed(5)}` },
    ], layout({ title: `|g′(x*)| = ${slope.toFixed(3)} ${slope < 1 ? '< 1: the iteration converges' : '> 1: the iteration moves away from x*'}  ·  after ${steps} steps x = ${x.toFixed(5)}`,
                xaxis: ax({ title: 'x', range: [-R, R], constrain: 'domain' }), yaxis: ax({ title: 'y', range: [-R, R], scaleanchor: 'x' }), legend: { orientation: 'h', y: -0.22 } }), cfg());
  }

  // ── S12. Newton versus bisection: error per step ───────────────
  function rRootConvergence() {
    const id = 'r-root-convergence';
    const x0 = val(id, 'x0', 2);
    const f = x => x ** 3 - 2 * x - 5, fp = x => 3 * x * x - 2, root = 2.0945514815423265;
    const floor = 1e-16, en = [], eb = [];
    let x = x0;
    for (let k = 0; k <= 45; k++) { en.push(Math.max(Math.abs(x - root), floor)); if (Math.abs(x - root) < 1e-15 || !Number.isFinite(x)) break; x = x - f(x) / fp(x); }
    let lo = 2, hi = 3;
    for (let k = 0; k <= 45; k++) { const m = (lo + hi) / 2; eb.push(Math.max(Math.abs(m - root), floor)); if (f(lo) * f(m) <= 0) hi = m; else lo = m; }
    const first = e => { const k = e.findIndex(v => v < 1e-10); return k < 0 ? 'not within 45' : k; };
    Plotly.newPlot(el(id), [
      { x: range(en.length, i => i), y: en, mode: 'lines+markers', line: { color: C_OK, width: 2.5 }, name: `Newton from x₀ = ${x0}` },
      { x: range(eb.length, i => i), y: eb, mode: 'lines+markers', line: { color: C_R, width: 2 }, name: 'bisection on [2, 3]' },
      { x: [0, 45], y: [1e-10, 1e-10], mode: 'lines', line: { color: C_GREY, dash: 'dot' }, name: 'tolerance 1e-10' },
    ], layout({ title: `f(x) = x³ − 2x − 5: steps to an error below 1e-10 — Newton ${first(en)}, bisection ${first(eb)}`,
                xaxis: ax({ title: 'step' }), yaxis: ax({ title: '|x − root|  (log scale)', type: 'log', range: [-16.5, 2] }), legend: { orientation: 'h', y: -0.22 } }), cfg());
  }

  // ── S13. Binary search: the interval halves each step ──────────
  function rBinarySearch() {
    const id = 'r-binary-search';
    const n = Math.round(val(id, 'n', 1000)), target = Math.min(n, Math.max(1, Math.round(val(id, 'pct', 73) / 100 * n)));
    const rows = []; let lo = 1, hi = n;
    while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); rows.push({ lo, hi, mid }); if (mid === target) break; if (mid < target) lo = mid + 1; else hi = mid - 1; }
    const k = rows.length;
    Plotly.newPlot(el(id), [
      { type: 'bar', orientation: 'h', base: rows.map(r => r.lo - 0.5), x: rows.map(r => r.hi - r.lo + 1), y: rows.map((_, i) => i + 1), marker: { color: 'rgba(59,130,246,.55)' }, name: 'positions still possible', hovertemplate: 'step %{y}: %{base} …<extra></extra>' },
      { x: rows.map(r => r.mid), y: rows.map((_, i) => i + 1), mode: 'markers', marker: { color: C_HI, size: 9, symbol: 'line-ns-open', line: { width: 3, color: C_HI } }, name: 'middle position compared' },
      { x: [target, target], y: [0.4, k + 0.6], mode: 'lines', line: { color: C_OK, dash: 'dot' }, name: `target at position ${target}` },
    ], layout({ title: `sorted list of ${n}: binary search needs ${k} comparison${k === 1 ? '' : 's'} (at most ⌈log₂ ${n}⌉ = ${Math.ceil(Math.log2(n))}), a scan from the start needs ${target}`,
                xaxis: ax({ title: 'position in the sorted list', range: [0, n + 1] }), yaxis: ax({ title: 'comparison', autorange: 'reversed', dtick: 1 }), legend: { orientation: 'h', y: -0.22 } }), cfg());
  }

  // ── S14. Monte Carlo: the running estimate and its error bar ───
  function rMcConvergence() {
    const id = 'r-mc-convergence';
    const m = Math.round(Math.pow(10, val(id, 'logm', 4))), runs = Math.round(val(id, 'runs', 5));
    const grid = []; for (let k = 10; k <= m; k = Math.ceil(k * 1.08)) grid.push(k); if (grid[grid.length - 1] !== m) grid.push(m);
    const traces = [];
    let lastRun = null;
    for (let r = 0; r < runs; r++) {
      let s = 0, s2 = 0, gi = 0; const est = [], lo = [], hi = [];
      for (let k = 1; k <= m; k++) {
        const x = Math.max(Math.random(), Math.random(), Math.random()); s += x; s2 += x * x;
        if (k === grid[gi]) { const mu = s / k, sd = Math.sqrt(Math.max(0, (s2 - k * mu * mu) / (k - 1))); est.push(mu); lo.push(mu - 1.96 * sd / Math.sqrt(k)); hi.push(mu + 1.96 * sd / Math.sqrt(k)); gi++; }
      }
      traces.push({ x: grid, y: est, mode: 'lines', line: { color: r === 0 ? C_R : 'rgba(156,163,175,.6)', width: r === 0 ? 2.5 : 1.2 }, name: r === 0 ? 'running mean (run 1)' : `run ${r + 1}`, showlegend: r < 2 });
      if (r === 0) lastRun = { est, lo, hi };
    }
    traces.unshift({ x: grid.concat(grid.slice().reverse()), y: lastRun.hi.concat(lastRun.lo.slice().reverse()), fill: 'toself', fillcolor: 'rgba(59,130,246,.18)', line: { width: 0 }, name: 'run 1 ± 1.96 s/√m', hoverinfo: 'skip' });
    traces.push({ x: [grid[0], m], y: [0.75, 0.75], mode: 'lines', line: { color: C_OK, dash: 'dash' }, name: 'E(X) = 3/4' });
    const fin = lastRun.est[lastRun.est.length - 1], half = (lastRun.hi[lastRun.hi.length - 1] - fin);
    Plotly.newPlot(el(id), traces, layout({ title: `X = max(U₁, U₂, U₃): after ${m} draws, run 1 gives ${fin.toFixed(4)} ± ${half.toFixed(4)}  (the band halves when m is 4× larger)`,
      xaxis: ax({ title: 'number of draws m  (log scale)', type: 'log' }), yaxis: ax({ title: 'estimate of E(X)', range: [0.55, 0.95] }), legend: { orientation: 'h', y: -0.22 } }), cfg());
  }

  // ── S15. Congruential generator: period and lattice ────────────
  function rLcgLattice() {
    const id = 'r-lcg-lattice';
    const b = Math.round(val(id, 'b', 7)), m = Math.round(val(id, 'm', 509)), seed = Math.round(val(id, 'seed', 1));
    const xs = []; let x = seed % m, seen = new Map();
    for (let k = 0; k < 5000; k++) { x = (b * x) % m; if (seen.has(x)) break; seen.set(x, k); xs.push(x); }
    const period = xs.length, u = xs.map(v => v / m);
    const zero = xs.includes(0);
    Plotly.newPlot(el(id), [
      { x: u.slice(0, -1), y: u.slice(1), mode: 'markers', marker: { color: C_R, size: 5 }, name: 'pairs (uₙ, uₙ₊₁)' },
    ], layout({ title: zero ? `b = ${b}, m = ${m}: the sequence reaches 0 and stays there (m shares factors with b)` :
                  `xₙ = ${b}·xₙ₋₁ mod ${m}, seed ${seed}: period ${period}${period === m - 1 ? ' (the maximum, m − 1)' : ` of a possible ${m - 1}`}<br>every pair lies on a few parallel lines — the lattice every such generator has`,
                xaxis: ax({ title: 'uₙ', range: [0, 1], constrain: 'domain' }), yaxis: ax({ title: 'uₙ₊₁', range: [0, 1], scaleanchor: 'x' }), margin: { t: 70, r: 20, b: 50, l: 55 } }), cfg());
  }

  // ── S16. Inversion: exponential draws from uniforms ────────────
  function rInverseTransform() {
    const id = 'r-inverse-transform';
    const lam = val(id, 'rate', 0.5), n = Math.round(val(id, 'n', 2000));
    const U = range(n, () => Math.random()), T = U.map(u => -Math.log(1 - u) / lam);
    const tMax = 6 / lam, ct = range(201, i => tMax * i / 200);
    const shown = U.slice(0, 6), arrows = { x: [], y: [] };
    shown.forEach(u => { const t = -Math.log(1 - u) / lam; arrows.x.push(0, Math.min(t, tMax), Math.min(t, tMax), null); arrows.y.push(u, u, 0, null); });
    const w = tMax / 30, counts = new Array(30).fill(0); T.forEach(t => { if (t < tMax) counts[Math.floor(t / w)]++; });
    Plotly.newPlot(el(id), [
      { x: ct, y: ct.map(t => 1 - Math.exp(-lam * t)), mode: 'lines', line: { color: C_R, width: 2.5 }, name: 'F(t) = 1 − e^(−λt)' },
      { x: arrows.x, y: arrows.y, mode: 'lines', line: { color: C_HI, width: 1.2 }, name: 'U on the vertical axis → T = F⁻¹(U)' },
      { type: 'bar', x: range(30, i => (i + 0.5) * w), y: counts.map(c => c / (n * w)), width: w * 0.95, marker: { color: 'rgba(0,166,81,.6)' }, xaxis: 'x2', yaxis: 'y2', name: `histogram of ${n} values of T` },
      { x: ct, y: ct.map(t => lam * Math.exp(-lam * t)), mode: 'lines', line: { color: C_HI, width: 2 }, xaxis: 'x2', yaxis: 'y2', name: 'density λe^(−λt)' },
    ], layout({ title: `T = −log(1 − U)/λ with λ = ${lam}: sample mean ${mean(T).toFixed(3)} vs 1/λ = ${(1 / lam).toFixed(3)}`,
                xaxis: ax({ title: 't', domain: [0, 0.45], range: [0, tMax] }), yaxis: ax({ title: 'F(t)', range: [0, 1.02] }),
                xaxis2: ax({ title: 't', domain: [0.55, 1], range: [0, tMax], anchor: 'y2' }), yaxis2: ax({ title: 'density', anchor: 'x2' }),
                legend: { orientation: 'h', y: -0.25 } }), cfg());
  }

  // ── S17. Markov chain: the distribution of X_t over time ───────
  function rMarkovWeather() {
    const id = 'r-markov-weather';
    const start = Math.round(val(id, 'start', 3)), n = Math.round(val(id, 'n', 5));
    const P = [[0.6, 0.3, 0.1], [0.3, 0.4, 0.3], [0.2, 0.4, 0.4]], names = ['sunny', 'cloudy', 'rainy'], cols = [C_HI, '#9ca3af', C_R];
    const stat = [24 / 61, 22 / 61, 15 / 61];
    let d = [0, 0, 0]; d[start - 1] = 1; const hist = [d];
    for (let t = 1; t <= 20; t++) { d = [0, 1, 2].map(j => d.reduce((s, v, i) => s + v * P[i][j], 0)); hist.push(d); }
    const traces = [];
    names.forEach((nm, j) => {
      traces.push({ x: range(21, t => t), y: hist.map(h => h[j]), mode: 'lines+markers', line: { color: cols[j], width: 2 }, marker: { size: 5 }, name: `P(Xₜ = ${nm})` });
      traces.push({ x: [0, 20], y: [stat[j], stat[j]], mode: 'lines', line: { color: cols[j], dash: 'dot', width: 1 }, showlegend: false, hoverinfo: 'skip' });
    });
    traces.push({ x: [n, n], y: [0, 1], mode: 'lines', line: { color: '#e5e7eb', dash: 'dash' }, name: `t = ${n}` });
    const h = hist[n];
    Plotly.newPlot(el(id), traces, layout({ title: `start ${names[start - 1]}: after ${n} day${n === 1 ? '' : 's'} (${h.map(v => v.toFixed(3)).join(', ')})<br>stationary π = (24, 22, 15)/61 = (0.393, 0.361, 0.246), the dotted lines`,
      xaxis: ax({ title: 'day t' }), yaxis: ax({ title: 'probability (row of Pᵗ)', range: [0, 1] }), legend: { orientation: 'h', y: -0.22 }, margin: { t: 70, r: 20, b: 50, l: 55 } }), cfg());
  }

  // ── S18. Monte Carlo integration: running estimate ─────────────
  function rMcIntegral() {
    const id = 'r-mc-integral';
    const which = Math.round(val(id, 'g', 2)), n = Math.round(Math.pow(10, val(id, 'logn', 4)));
    const cases = [
      { g: x => x ** 3, a: 0, b: 1, exact: 0.25, label: '∫₀¹ x³ dx' },
      { g: Math.sqrt, a: 1, b: 4, exact: 14 / 3, label: '∫₁⁴ √x dx' },
      { g: Math.sin, a: 0, b: Math.PI, exact: 2, label: '∫₀^π sin x dx' },
      { g: x => Math.pow(x, -0.8), a: 0, b: 1, exact: 5, label: '∫₀¹ x^(−0.8) dx  (infinite variance)' },
    ], C = cases[which - 1];
    const grid = []; for (let k = 10; k <= n; k = Math.ceil(k * 1.08)) grid.push(k); if (grid[grid.length - 1] !== n) grid.push(n);
    let s = 0, s2 = 0, gi = 0; const est = [], lo = [], hi = [];
    for (let k = 1; k <= n; k++) {
      const v = (C.b - C.a) * C.g(C.a + (C.b - C.a) * (1 - Math.random())); s += v; s2 += v * v;
      if (k === grid[gi]) { const mu = s / k, se = Math.sqrt(Math.max(0, (s2 - k * mu * mu) / (k - 1)) / k); est.push(mu); lo.push(mu - 1.96 * se); hi.push(mu + 1.96 * se); gi++; }
    }
    const fin = est[est.length - 1], se = (hi[hi.length - 1] - fin) / 1.96;
    Plotly.newPlot(el(id), [
      { x: grid.concat(grid.slice().reverse()), y: hi.concat(lo.slice().reverse()), fill: 'toself', fillcolor: 'rgba(59,130,246,.18)', line: { width: 0 }, name: 'estimate ± 1.96 SE', hoverinfo: 'skip' },
      { x: grid, y: est, mode: 'lines', line: { color: C_R, width: 2.5 }, name: '(b − a) · mean of g(Uᵢ)' },
      { x: [grid[0], n], y: [C.exact, C.exact], mode: 'lines', line: { color: C_OK, dash: 'dash' }, name: `exact ${+C.exact.toFixed(4)}` },
    ], layout({ title: `${C.label}: ${fin.toFixed(4)} ± ${(1.96 * se).toFixed(4)} from ${n} points`,
                xaxis: ax({ title: 'number of points n  (log scale)', type: 'log' }), yaxis: ax({ title: 'estimate', range: [C.exact * 0.6, C.exact * 1.4] }), legend: { orientation: 'h', y: -0.22 } }), cfg());
  }

  // ── S19. Rejection sampling under an envelope ──────────────────
  function rRejection() {
    const id = 'r-rejection';
    const n = Math.round(val(id, 'n', 1500)), c = val(id, 'c', 1);
    const kh = x => dnormJ(x) * (1 + Math.sin(3 * x) ** 2) / (2 * c);
    const ax_ = [], ay = [], rx = [], ry = [];
    for (let i = 0; i < n; i++) { const y = gauss(), h = Math.random() * dnormJ(y); if (h < kh(y)) { ax_.push(y); ay.push(h); } else { rx.push(y); ry.push(h); } }
    const acc = ax_.length / n, cx = range(301, i => -4 + 8 * i / 300);
    const w = 0.25, bins = range(32, i => -4 + (i + 0.5) * w), counts = new Array(32).fill(0);
    ax_.forEach(v => { const k = Math.floor((v + 4) / w); if (k >= 0 && k < 32) counts[k]++; });
    const target = x => dnormJ(x) * (1 + Math.sin(3 * x) ** 2) / (2 * 0.75);   // normalised: the integral of phi (1 + sin^2 3x) is 1.5
    Plotly.newPlot(el(id), [
      { x: rx, y: ry, mode: 'markers', marker: { color: 'rgba(248,113,113,.55)', size: 3 }, name: `rejected (${rx.length})` },
      { x: ax_, y: ay, mode: 'markers', marker: { color: 'rgba(0,166,81,.7)', size: 3 }, name: `accepted (${ax_.length})` },
      { x: cx, y: cx.map(v => dnormJ(v)), mode: 'lines', line: { color: '#e5e7eb', width: 2 }, name: 'envelope f = dnorm' },
      { x: cx, y: cx.map(kh), mode: 'lines', line: { color: C_HI, width: 2 }, name: 'k·h(x)' },
      { type: 'bar', x: bins, y: counts.map(v => v / (Math.max(1, ax_.length) * w)), width: w * 0.95, marker: { color: 'rgba(0,166,81,.6)' }, xaxis: 'x2', yaxis: 'y2', name: 'accepted values' },
      { x: cx, y: cx.map(target), mode: 'lines', line: { color: C_HI, width: 2 }, xaxis: 'x2', yaxis: 'y2', name: 'target density' },
    ], layout({ title: `accepted ${(100 * acc).toFixed(1)} % of ${n} proposals (theory ${(75 / c).toFixed(1)} %): a looser envelope wastes more`,
                xaxis: ax({ title: 'proposal Y', domain: [0, 0.48], range: [-4, 4] }), yaxis: ax({ title: 'U · f(Y)', range: [0, 0.42] }),
                xaxis2: ax({ title: 'x', domain: [0.56, 1], range: [-4, 4], anchor: 'y2' }), yaxis2: ax({ title: 'density', anchor: 'x2' }),
                legend: { orientation: 'h', y: -0.25 } }), cfg());
  }

  // ── S20. Rare events: plain Monte Carlo vs importance sampling ─
  function rImportanceTail() {
    const id = 'r-importance-tail';
    const cc = val(id, 'c', 4), n = Math.round(Math.pow(10, val(id, 'logn', 4))), runs = 12;
    const exact = pnormUpper(cc), plain = [], imp = [];
    for (let r = 0; r < runs; r++) {
      let hits = 0, ws = 0;
      for (let i = 0; i < n; i++) { if (gauss() > cc) hits++; const y = cc - Math.log(1 - Math.random()); ws += dnormJ(y) / Math.exp(-(y - cc)); }
      plain.push(hits / n / exact); imp.push(ws / n / exact);
    }
    const zeros = plain.filter(v => v === 0).length;
    Plotly.newPlot(el(id), [
      { x: range(runs, i => i + 1), y: plain, mode: 'markers', marker: { color: C_BAD, size: 9 }, name: 'plain Monte Carlo: mean(z > c)' },
      { x: range(runs, i => i + 1), y: imp, mode: 'markers', marker: { color: C_OK, size: 9, symbol: 'diamond' }, name: 'importance sampling: Y = c + Exp(1)' },
      { x: [0.5, runs + 0.5], y: [1, 1], mode: 'lines', line: { color: '#e5e7eb', dash: 'dash' }, name: 'exact' },
    ], layout({ title: `P(Z > ${cc.toFixed(1)}) = ${exact.toExponential(3)}: ${runs} runs of ${n} draws each${zeros ? ` — plain MC saw no event at all in ${zeros} runs` : ''}`,
                xaxis: ax({ title: 'run', dtick: 1 }), yaxis: ax({ title: 'estimate ÷ exact value', range: [-0.1, 3] }), legend: { orientation: 'h', y: -0.22 } }), cfg());
  }

  // ── S21. LU decomposition and the two triangular solves ────────
  function rLuSteps() {
    const id = 'r-lu-steps';
    const step = Math.round(val(id, 'step', 1));
    const A = [[2, 1, 1], [4, 3, 3], [8, 7, 9]], b = [4, 10, 24], n = 3;
    const L = range(n, i => range(n, j => (i === j ? 1 : null))), U = range(n, () => range(n, () => null)), y = [null, null, null], x = [null, null, null];
    const script = [];
    for (let j = 0; j < n; j++) {
      for (let i = 0; i <= j; i++) script.push({ M: 'U', i, j });
      for (let i = j + 1; i < n; i++) script.push({ M: 'L', i, j });
    }
    for (let i = 0; i < n; i++) script.push({ M: 'y', i });
    for (let i = n - 1; i >= 0; i--) script.push({ M: 'x', i });
    let desc = 'A = L U with L unit lower triangular: start with the 1s on its diagonal', cur = null;
    const fmt = v => (Number.isInteger(v) ? String(v) : v.toFixed(3));
    for (let s = 0; s < Math.min(step, script.length); s++) {
      const t = script[s]; cur = t;
      if (t.M === 'U') { const terms = range(t.i, k => `${fmt(L[t.i][k])}·${fmt(U[k][t.j])}`); const v = A[t.i][t.j] - range(t.i, k => L[t.i][k] * U[k][t.j]).reduce((p, q) => p + q, 0); U[t.i][t.j] = v;
        desc = terms.length ? `u${t.i + 1}${t.j + 1} = a${t.i + 1}${t.j + 1} − ${terms.join(' − ')} = ${A[t.i][t.j]} − ${range(t.i, k => fmt(L[t.i][k] * U[k][t.j])).join(' − ')} = ${fmt(v)}` : `u${t.i + 1}${t.j + 1} = a${t.i + 1}${t.j + 1} = ${fmt(v)}`; }
      if (t.M === 'L') { const terms = range(t.j, k => `${fmt(L[t.i][k])}·${fmt(U[k][t.j])}`); const v = (A[t.i][t.j] - range(t.j, k => L[t.i][k] * U[k][t.j]).reduce((p, q) => p + q, 0)) / U[t.j][t.j]; L[t.i][t.j] = v;
        desc = `l${t.i + 1}${t.j + 1} = (a${t.i + 1}${t.j + 1}${terms.length ? ' − ' + terms.join(' − ') : ''}) / u${t.j + 1}${t.j + 1} = (${A[t.i][t.j]}${range(t.j, k => ' − ' + fmt(L[t.i][k] * U[k][t.j])).join('')}) / ${fmt(U[t.j][t.j])} = ${fmt(v)}`; }
      if (t.M === 'y') { const v = b[t.i] - range(t.i, k => L[t.i][k] * y[k]).reduce((p, q) => p + q, 0); y[t.i] = v;
        desc = `forward: y${t.i + 1} = b${t.i + 1}${range(t.i, k => ` − l${t.i + 1}${k + 1}·y${k + 1}`).join('')} = ${b[t.i]}${range(t.i, k => ` − ${fmt(L[t.i][k])}·${fmt(y[k])}`).join('')} = ${fmt(v)}`; }
      if (t.M === 'x') { const later = range(n - 1 - t.i, k => t.i + 1 + k); const v = (y[t.i] - later.map(k => U[t.i][k] * x[k]).reduce((p, q) => p + q, 0)) / U[t.i][t.i]; x[t.i] = v;
        desc = `back: x${t.i + 1} = (y${t.i + 1}${later.map(k => ` − u${t.i + 1}${k + 1}·x${k + 1}`).join('')}) / u${t.i + 1}${t.i + 1} = (${fmt(y[t.i])}${later.map(k => ` − ${fmt(U[t.i][k])}·${fmt(x[k])}`).join('')}) / ${fmt(U[t.i][t.i])} = ${fmt(v)}`; }
    }
    const panel = (M, xa, ya, name, hlM) => {
      const cols = M[0].length;
      const z = M.map((r, i) => r.map((v, j) => (cur && cur.M === hlM && cur.i === i && (cur.j === undefined || cur.j === j) ? 2 : v === null ? 0 : 1)));
      const text = M.map(r => r.map(v => (v === null ? '?' : fmt(v))));
      return { type: 'heatmap', z, text, texttemplate: '%{text}', textfont: { size: 17 }, colorscale: [[0, '#1f2937'], [0.5, '#1e3a5f'], [1, '#00a651']], zmin: 0, zmax: 2, showscale: false, xgap: 3, ygap: 3,
               hoverinfo: 'skip', xaxis: xa, yaxis: ya, x: range(cols, j => `${name}${cols > 1 ? '[,' + (j + 1) + ']' : ''}`), y: range(n, i => `[${i + 1}]`) };
    };
    const col = v => v.map(e => [e]);
    const axis = d => ax({ domain: d, side: 'top', showgrid: false, zeroline: false });
    Plotly.newPlot(el(id), [
      panel(L, 'x', 'y', 'L', 'L'), panel(U, 'x2', 'y', 'U', 'U'), panel(col(b), 'x3', 'y', 'b', '-'), panel(col(y), 'x4', 'y', 'y', 'y'), panel(col(x), 'x5', 'y', 'x', 'x'),
    ], layout({ title: `step ${Math.min(step, script.length)} of ${script.length}:  ${desc}`,
                xaxis: axis([0, 0.3]), xaxis2: axis([0.34, 0.64]), xaxis3: axis([0.7, 0.78]), xaxis4: axis([0.81, 0.89]), xaxis5: axis([0.92, 1]),
                yaxis: ax({ autorange: 'reversed', showgrid: false, zeroline: false }), margin: { t: 90, r: 10, b: 20, l: 40 }, height: 330 }), cfg());
  }

  // ── S22. Eigenvectors of a symmetric 2 × 2 matrix ──────────────
  function rEigenEllipse() {
    const id = 'r-eigen-ellipse';
    const a = val(id, 'a', 2), bb = val(id, 'b', 1), d = val(id, 'd', 1), th = val(id, 'theta', 70) * Math.PI / 180;
    const tr = a + d, det = a * d - bb * bb, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
    const vec = l => (Math.abs(bb) > 1e-12 ? [bb, l - a] : (Math.abs(l - a) < 1e-12 ? [1, 0] : [0, 1]));
    const unit = v => { const r = Math.hypot(v[0], v[1]); return [v[0] / r, v[1] / r]; };
    const v1 = unit(vec(l1)), v2 = unit([-v1[1], v1[0]]);
    const circ = range(181, i => 2 * Math.PI * i / 180);
    const v = [Math.cos(th), Math.sin(th)], Av = [a * v[0] + bb * v[1], bb * v[0] + d * v[1]];
    const ang = Math.abs(Math.atan2(v[0] * Av[1] - v[1] * Av[0], v[0] * Av[0] + v[1] * Av[1]) * 180 / Math.PI);
    const R = Math.max(1.5, Math.abs(l1), Math.abs(l2)) * 1.15;
    const seg = (p, q, color, name, width, dash) => ({ x: [p[0], q[0]], y: [p[1], q[1]], mode: 'lines+markers', marker: { size: [0, 8], color }, line: { color, width: width || 3, dash }, name });
    Plotly.newPlot(el(id), [
      { x: circ.map(Math.cos), y: circ.map(Math.sin), mode: 'lines', line: { color: C_GREY, dash: 'dot' }, name: 'unit circle' },
      { x: circ.map(t => a * Math.cos(t) + bb * Math.sin(t)), y: circ.map(t => bb * Math.cos(t) + d * Math.sin(t)), mode: 'lines', line: { color: C_R, width: 2 }, name: 'its image under A' },
      seg([0, 0], [l1 * v1[0], l1 * v1[1]], C_OK, `λ₁v₁, λ₁ = ${l1.toFixed(3)}`),
      seg([0, 0], [l2 * v2[0], l2 * v2[1]], '#34d399', `λ₂v₂, λ₂ = ${l2.toFixed(3)}`),
      seg([0, 0], v, '#e5e7eb', 'v (angle θ)', 2),
      seg([0, 0], Av, C_HI, 'Av', 2.5, 'dash'),
    ], layout({ title: `A = [${a} ${bb}; ${bb} ${d}]: trace ${tr.toFixed(2)} = λ₁ + λ₂, det ${det.toFixed(2)} = λ₁λ₂<br>angle between v and Av: ${ang.toFixed(1)}°${ang < 0.5 || ang > 179.5 ? ' — v is an eigenvector' : ''}`,
                xaxis: ax({ range: [-R, R], title: 'x₁', constrain: 'domain' }), yaxis: ax({ range: [-R, R], scaleanchor: 'x', title: 'x₂' }), legend: { orientation: 'h', y: -0.22 }, margin: { t: 70, r: 20, b: 50, l: 55 } }), cfg());
  }

  // ── S23. Low-rank approximation with the SVD ───────────────────
  let svdCache = null;
  function rSvdLowrank() {
    const id = 'r-svd-lowrank';
    const k = Math.round(val(id, 'k', 2)), N = 24;
    if (!svdCache) {
      // a small "image": a smooth background, a bright bar, and a ring, with a little noise
      const A = range(N, i => range(N, j => {
        const r = Math.hypot(i - 14, j - 9);
        return 0.3 + 0.25 * Math.sin(i / 5) * Math.cos(j / 7) + (i >= 3 && i <= 6 ? 0.5 : 0) + (Math.abs(r - 6) < 1.3 ? 0.6 : 0) + 0.04 * Math.sin(37 * i * j);
      }));
      const At = range(N, i => range(N, j => A[j][i]));
      const e = jacobiEigen(matmul(At, A));
      svdCache = { A, V: e.vectors, d: e.values.map(v => Math.sqrt(Math.max(0, v))) };
    }
    const { A, V, d } = svdCache;
    const Vk = V.map(r => r.slice(0, k)), VkT = range(k, i => range(N, j => Vk[j][i]));
    const Ak = matmul(matmul(A, Vk), VkT);     // A V_k V_kᵀ = the sum of the first k terms σᵢ uᵢ vᵢᵀ
    const energy = sum(d.slice(0, k).map(v => v * v)) / sum(d.map(v => v * v));
    const err = Math.max(...A.map((r, i) => Math.max(...r.map((v, j) => Math.abs(v - Ak[i][j])))));
    const hm = (Z, xa, ya) => ({ type: 'heatmap', z: Z, colorscale: 'Viridis', zmin: 0, zmax: 1.7, showscale: false, xaxis: xa, yaxis: ya, hoverinfo: 'skip' });
    Plotly.newPlot(el(id), [
      hm(A, 'x', 'y'), hm(Ak, 'x2', 'y2'),
      { type: 'bar', x: range(12, i => i + 1), y: d.slice(0, 12), marker: { color: range(12, i => (i < k ? C_OK : C_GREY)) }, xaxis: 'x3', yaxis: 'y3', name: 'singular values', hovertemplate: 'd%{x} = %{y:.3f}<extra></extra>' },
    ], layout({ title: `rank ${k} keeps ${(100 * energy).toFixed(1)} % of the sum of squares (Σ dᵢ²); largest error ${err.toFixed(3)}`,
                xaxis: ax({ domain: [0, 0.3], visible: false }), yaxis: ax({ domain: [0, 1], autorange: 'reversed', visible: false, scaleanchor: 'x' }),
                xaxis2: ax({ domain: [0.35, 0.65], visible: false }), yaxis2: ax({ domain: [0, 1], autorange: 'reversed', visible: false, anchor: 'x2', scaleanchor: 'x2' }),
                xaxis3: ax({ domain: [0.72, 1], title: 'i', anchor: 'y3', dtick: 1 }), yaxis3: ax({ domain: [0.1, 1], anchor: 'x3', title: 'dᵢ' }),
                annotations: [{ text: 'original (24 × 24)', x: 0.15, y: -0.06, xref: 'paper', yref: 'paper', showarrow: false, font: { color: '#c8d0e0' } },
                              { text: `rank-${k} approximation`, x: 0.5, y: -0.06, xref: 'paper', yref: 'paper', showarrow: false, font: { color: '#c8d0e0' } }],
                showlegend: false, margin: { t: 50, r: 20, b: 40, l: 40 } }), cfg());
  }

  // ── S24. Conditioning of Hilbert matrices ──────────────────────
  let condCache = null;
  function rConditioning() {
    const id = 'r-conditioning';
    const nSel = Math.round(val(id, 'n', 8));
    if (!condCache) {
      condCache = range(11, t => {
        const n = t + 2, H = hilbert(n), ones = new Array(n).fill(1), b = H.map(r => sum(r));
        const e = jacobiEigen(H), kappa = e.values[0] / e.values[n - 1];
        const x1 = gaussSolve(H, b), Hi = invert(H), x2 = Hi.map(r => r.reduce((s, v, j) => s + v * b[j], 0));
        const err = x => Math.max(1e-17, Math.max(...x.map((v, i) => Math.abs(v - ones[i]))));
        return { n, kappa, direct: err(x1), inv: err(x2) };
      });
    }
    const C = condCache, sel = C[nSel - 2], ns = C.map(c => c.n);
    Plotly.newPlot(el(id), [
      { x: ns, y: C.map(c => c.kappa), mode: 'lines+markers', line: { color: C_HI, width: 2 }, name: 'condition number κ' },
      { x: ns, y: C.map(c => c.kappa * 2.2e-16), mode: 'lines', line: { color: C_HI, dash: 'dot', width: 1 }, name: 'κ × machine epsilon  (the expected error)' },
      { x: ns, y: C.map(c => c.direct), mode: 'lines+markers', line: { color: C_OK, width: 2 }, name: 'error of solve(H, b)' },
      { x: ns, y: C.map(c => c.inv), mode: 'lines+markers', line: { color: C_BAD, width: 2 }, name: 'error of solve(H) %*% b' },
      { x: [nSel, nSel], y: [1e-17, 1e17], mode: 'lines', line: { color: '#e5e7eb', dash: 'dash' }, name: `n = ${nSel}` },
    ], layout({ title: `Hilbert n = ${nSel}: κ = ${sel.kappa.toExponential(2)} (about ${Math.max(0, Math.log10(sel.kappa)).toFixed(0)} digits lost); errors ${sel.direct.toExponential(1)} direct, ${sel.inv.toExponential(1)} via the inverse`,
                xaxis: ax({ title: 'n', dtick: 1 }), yaxis: ax({ title: 'log scale', type: 'log', range: [-17, 17], exponentformat: 'power' }), legend: { orientation: 'h', y: -0.22 } }), cfg());
  }


  // ── Dispatcher ─────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  //  MATH 205 — Integrals, sequences and series
  // ══════════════════════════════════════════════════════════════
  const C_FN = '#e5e7eb', C_POS = 'rgba(0,166,81,.45)', C_NEG = 'rgba(248,113,113,.45)',
        C_BLUE = 'rgba(96,165,250,.45)', C_GOLD = 'rgba(250,204,21,.5)';
  function lin(a, b, n) { if (!(n > 0)) return [a]; const xs = []; for (let i = 0; i <= n; i++) xs.push(a + (b - a) * i / n); return xs; }
  function curve(f, a, b, n, opts) { const xs = lin(a, b, n || 300); return Object.assign({ x: xs, y: xs.map(f), mode: 'lines' }, opts); }
  // Filled region between g (bottom) and f (top) on [a, b], as one closed polygon.
  function band(f, g, a, b, color, name, n) {
    const xs = lin(a, b, n || 200), back = xs.slice().reverse();
    return { x: xs.concat(back), y: xs.map(f).concat(back.map(g)), fill: 'toself', mode: 'lines', line: { color: 'rgba(0,0,0,0)' },
             fillcolor: color, name: name || '', hoverinfo: 'skip', showlegend: !!name };
  }
  // Rectangles [x0, x1] × [0, h] as one trace of null-separated closed polygons.
  function rects(list, color, name) {
    const x = [], y = [];
    for (const [x0, x1, h] of list) { x.push(x0, x0, x1, x1, x0, null); y.push(0, h, h, 0, 0, null); }
    return { x, y, fill: 'toself', mode: 'lines', line: { color: '#93c5fd', width: 1 }, fillcolor: color, name: name, hoverinfo: 'skip', connectgaps: false };
  }
  // Two stacked panels: traces on the lower one use xaxis: 'x2', yaxis: 'y2'.
  function twoRows(extra) {
    const base = { height: 560, xaxis: { anchor: 'y' }, yaxis: { domain: [0.57, 1] }, xaxis2: { anchor: 'y2' }, yaxis2: { domain: [0, 0.43] },
                   legend: { orientation: 'h', y: -0.12 } };
    const out = Object.assign({}, base, extra);
    for (const k of ['xaxis', 'yaxis', 'xaxis2', 'yaxis2']) out[k] = ax(Object.assign({}, base[k], (extra && extra[k]) || {}));
    return layout(out);
  }

  // ── C1. Riemann sums under y = x² on [0, 2] ───────────────────
  function calcRiemannSums() {
    const id = 'calc-riemann-sums';
    const n = Math.max(1, Math.round(val(id, 'n', 6))), rule = Math.round(val(id, 'rule', 0));
    const f = x => x * x, a = 0, b = 2, dx = (b - a) / n, exact = 8 / 3;
    const list = []; let sum = 0;
    for (let i = 0; i < n; i++) {
      const x0 = a + i * dx, xs = rule === 0 ? x0 : rule === 1 ? x0 + dx : x0 + dx / 2, h = f(xs);
      sum += h * dx; list.push([x0, x0 + dx, h]);
    }
    const names = ['left endpoints', 'right endpoints', 'midpoints'];
    Plotly.newPlot(el(id), [
      rects(list, C_BLUE, `${n} rectangles, ${names[rule]}`),
      curve(f, a, b, 200, { name: 'y = x²', line: { color: C_FN, width: 2.5 } }),
    ], layout({ title: `${names[rule]}, n = ${n}:  sum = ${sum.toFixed(4)}    exact 8/3 ≈ ${exact.toFixed(4)}    error ${(sum - exact >= 0 ? '+' : '')}${(sum - exact).toFixed(4)}`,
                xaxis: ax({ title: 'x', range: [-0.1, 2.1] }), yaxis: ax({ title: 'y', range: [0, 4.3] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C2. Signed area: ∫₀ᵇ sin x dx ─────────────────────────────
  function calcSignedArea() {
    const id = 'calc-signed-area';
    const b = val(id, 'b', 4.5), f = Math.sin, zero = () => 0, pos = Math.min(b, Math.PI);
    const traces = [curve(f, 0, 2 * Math.PI, 300, { name: 'y = sin x', line: { color: C_FN, width: 2.5 } })];
    if (pos > 0) traces.push(band(f, zero, 0, pos, C_POS, 'above the axis: counts +'));
    if (b > Math.PI) traces.push(band(f, zero, Math.PI, b, C_NEG, 'below the axis: counts −'));
    const I = 1 - Math.cos(b), area = (1 - Math.cos(pos)) + (b > Math.PI ? Math.cos(b) + 1 : 0);
    Plotly.newPlot(el(id), traces, layout({
      title: `∫₀ᵇ sin x dx = 1 − cos b = ${I.toFixed(4)}    (unsigned area ${area.toFixed(4)})`,
      xaxis: ax({ title: 'x', range: [0, 2 * Math.PI] }), yaxis: ax({ title: 'y', range: [-1.2, 1.2] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C3. The family F(x) = sin x + C ───────────────────────────
  function calcAntiderivativeFamily() {
    const id = 'calc-antiderivative-family';
    const C = val(id, 'C', 0), x0 = val(id, 'x0', 1), f = Math.cos, F = x => Math.sin(x) + C, slope = f(x0);
    const traces = [curve(f, -3.5, 3.5, 300, { name: 'f(x) = cos x', line: { color: C_FN, width: 2.5 } }),
                    { x: [x0], y: [f(x0)], mode: 'markers', name: `f(x₀) = ${slope.toFixed(3)}`, marker: { color: C_PT, size: 10 } }];
    for (let c = -2; c <= 2; c++) if (c !== C) traces.push(curve(x => Math.sin(x) + c, -3.5, 3.5, 200, { xaxis: 'x2', yaxis: 'y2', showlegend: false, line: { color: C_GHOST, width: 1, dash: 'dot' }, hoverinfo: 'skip' }));
    traces.push(curve(F, -3.5, 3.5, 300, { xaxis: 'x2', yaxis: 'y2', name: `F(x) = sin x + ${C}`, line: { color: C_PATH, width: 3 } }));
    traces.push({ x: [x0 - 0.8, x0 + 0.8], y: [F(x0) - 0.8 * slope, F(x0) + 0.8 * slope], mode: 'lines', xaxis: 'x2', yaxis: 'y2', name: `tangent, slope ${slope.toFixed(3)}`, line: { color: C_TAN, width: 2.5 } });
    traces.push({ x: [x0], y: [F(x0)], mode: 'markers', xaxis: 'x2', yaxis: 'y2', showlegend: false, marker: { color: C_PT, size: 10 } });
    Plotly.newPlot(el(id), traces, twoRows({
      title: `Every member of the family has slope F′(x₀) = f(x₀) = cos(${x0.toFixed(1)}) = ${slope.toFixed(3)}`,
      xaxis: { title: 'x', range: [-3.5, 3.5] }, yaxis: { title: 'f', range: [-1.3, 1.3] }, xaxis2: { title: 'x', range: [-3.5, 3.5] }, yaxis2: { title: 'F', range: [-4.2, 4.2] } }), cfg());
  }

  // ── C4. FTC I: the accumulation function g(x) = ∫₀ˣ f ──────────
  function calcFtcAccumulation() {
    const id = 'calc-ftc-accumulation';
    const x = val(id, 'x', 2), f = t => 1.2 + Math.sin(t), g = x => 1.2 * x + 1 - Math.cos(x), X = 2 * Math.PI;
    const traces = [curve(f, 0, X, 300, { name: 'f(t) = 1.2 + sin t', line: { color: C_FN, width: 2.5 } })];
    if (x > 0) traces.push(band(f, () => 0, 0, x, C_POS, `∫₀ˣ f(t) dt = ${g(x).toFixed(3)}`));
    traces.push({ x: [x], y: [f(x)], mode: 'markers', name: `f(x) = ${f(x).toFixed(3)}`, marker: { color: C_PT, size: 10 } });
    traces.push(curve(g, 0, X, 300, { xaxis: 'x2', yaxis: 'y2', name: 'g(x) = ∫₀ˣ f(t) dt', line: { color: C_PATH, width: 3 } }));
    traces.push({ x: [x - 0.7, x + 0.7], y: [g(x) - 0.7 * f(x), g(x) + 0.7 * f(x)], mode: 'lines', xaxis: 'x2', yaxis: 'y2', name: `tangent, slope g′(x) = f(x)`, line: { color: C_TAN, width: 2.5 } });
    traces.push({ x: [x], y: [g(x)], mode: 'markers', xaxis: 'x2', yaxis: 'y2', showlegend: false, marker: { color: C_PT, size: 10 } });
    Plotly.newPlot(el(id), traces, twoRows({
      title: `g(${x.toFixed(2)}) = ${g(x).toFixed(3)} (shaded area),   g′(${x.toFixed(2)}) = f(${x.toFixed(2)}) = ${f(x).toFixed(3)}`,
      xaxis: { title: 't', range: [0, X] }, yaxis: { title: 'f', range: [0, 2.4] }, xaxis2: { title: 'x', range: [0, X] }, yaxis2: { title: 'g', range: [-0.5, 9.5] } }), cfg());
  }

  // ── C5. Net change: displacement versus distance ──────────────
  function calcNetChange() {
    const id = 'calc-net-change';
    const T = val(id, 'T', 4), v = t => 3 * Math.sin(t), s = t => 3 * (1 - Math.cos(t)), X = 2 * Math.PI;
    const traces = [curve(v, 0, X, 300, { name: 'v(t) = 3 sin t', line: { color: C_FN, width: 2.5 } })];
    const p = Math.min(T, Math.PI);
    if (p > 0) traces.push(band(v, () => 0, 0, p, C_POS, 'moving forward'));
    if (T > Math.PI) traces.push(band(v, () => 0, Math.PI, T, C_NEG, 'moving backward'));
    traces.push(curve(s, 0, X, 300, { xaxis: 'x2', yaxis: 'y2', name: 's(t) = ∫₀ᵗ v = 3(1 − cos t)', line: { color: C_PATH, width: 3 } }));
    traces.push({ x: [T], y: [s(T)], mode: 'markers', xaxis: 'x2', yaxis: 'y2', name: `s(T) = ${s(T).toFixed(3)}`, marker: { color: C_PT, size: 10 } });
    const disp = s(T), dist = simpson(t => Math.abs(v(t)), 0, T, 600);
    Plotly.newPlot(el(id), traces, twoRows({
      title: `displacement ∫₀ᵀ v dt = ${disp.toFixed(3)} = s(T) − s(0)      distance ∫₀ᵀ |v| dt = ${dist.toFixed(3)}`,
      xaxis: { title: 't', range: [0, X] }, yaxis: { title: 'v', range: [-3.3, 3.3] }, xaxis2: { title: 't', range: [0, X] }, yaxis2: { title: 's', range: [0, 6.5] } }), cfg());
  }

  // ── C6. Substitution: ∫₀ᵇ 2x cos(x²) dx = ∫₀^{b²} cos u du ──────
  function calcSubstitution() {
    const id = 'calc-substitution';
    const b = val(id, 'b', 1.2), fx = x => 2 * x * Math.cos(x * x), fu = Math.cos, zero = () => 0;
    const xc = Math.sqrt(Math.PI / 2), uc = Math.PI / 2, b2 = b * b, I = Math.sin(b2);
    const t = [curve(fx, 0, 1.75, 300, { name: '2x cos(x²)', line: { color: C_FN, width: 2.5 } })];
    t.push(band(fx, zero, 0, Math.min(b, xc), C_POS, 'x-picture'));
    if (b > xc) t.push(band(fx, zero, xc, b, C_NEG, ''));
    t.push(curve(fu, 0, 3.1, 300, { xaxis: 'x2', yaxis: 'y2', name: 'cos u', line: { color: C_FN, width: 2.5 } }));
    t.push(band(fu, zero, 0, Math.min(b2, uc), C_POS, 'u-picture', 200));
    if (b2 > uc) t.push(band(fu, zero, uc, b2, C_NEG, ''));
    for (const tr of t.slice(3)) { tr.xaxis = 'x2'; tr.yaxis = 'y2'; }
    Plotly.newPlot(el(id), t, layout({
      title: `∫₀^${b.toFixed(2)} 2x cos(x²) dx  =  ∫₀^${b2.toFixed(2)} cos u du  =  sin(b²) = ${I.toFixed(4)}`,
      xaxis: ax({ title: 'x', domain: [0, 0.45], range: [0, 1.75], anchor: 'y' }), yaxis: ax({ title: '2x cos(x²)', range: [-3.6, 1.6] }),
      xaxis2: ax({ title: 'u = x²', domain: [0.55, 1], range: [0, 3.1], anchor: 'y2' }), yaxis2: ax({ title: 'cos u', range: [-1.2, 1.2], anchor: 'x2' }),
      legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C7. Parts as areas: ∫v du + ∫u dv = u₂v₂ − u₁v₁ ─────────
  function calcPartsArea() {
    const id = 'calc-parts-area';
    const u1 = 0.5, u2 = val(id, 'u2', 1.5), f = u => u * u, v1 = f(u1), v2 = f(u2);
    const xs = lin(u1, u2, 120), ys = xs.map(f);
    const A = (u2 ** 3 - u1 ** 3) / 3, B = 2 * (u2 ** 3 - u1 ** 3) / 3;
    Plotly.newPlot(el(id), [
      { x: xs.concat([u2, u1]), y: ys.concat([0, 0]), fill: 'toself', mode: 'lines', line: { color: 'rgba(0,0,0,0)' }, fillcolor: C_POS, name: `∫ v du = ${A.toFixed(3)}`, hoverinfo: 'skip' },
      { x: xs.concat([0, 0]), y: ys.concat([v2, v1]), fill: 'toself', mode: 'lines', line: { color: 'rgba(0,0,0,0)' }, fillcolor: C_BLUE, name: `∫ u dv = ${B.toFixed(3)}`, hoverinfo: 'skip' },
      curve(f, 0, 2.1, 200, { name: 'v = u²', line: { color: C_FN, width: 2.5 } }),
      { x: [0, u2, u2, 0, 0], y: [0, 0, v2, v2, 0], mode: 'lines', name: `u₂v₂ = ${(u2 * v2).toFixed(3)}`, line: { color: C_ARROW, width: 1.5, dash: 'dash' } },
      { x: [0, u1, u1, 0, 0], y: [0, 0, v1, v1, 0], mode: 'lines', name: `u₁v₁ = ${(u1 * v1).toFixed(3)}`, line: { color: C_PT, width: 1.5, dash: 'dash' } },
      { x: [u1, u2], y: [v1, v2], mode: 'markers', showlegend: false, marker: { color: C_PT, size: 9 } },
    ], layout({ title: `∫v du + ∫u dv = ${A.toFixed(3)} + ${B.toFixed(3)} = ${(A + B).toFixed(3)} = u₂v₂ − u₁v₁ = ${(u2 * v2 - u1 * v1).toFixed(3)}`,
                xaxis: ax({ title: 'u', range: [0, 2.1] }), yaxis: ax({ title: 'v', range: [0, 4.4] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C8a. Area between sin x and cos x on [0, b] ────────────────
  function calcAreaBetween() {
    const id = 'calc-area-between';
    const b = val(id, 'b', 2.2), c = Math.PI / 4, p1 = Math.min(b, c);
    const A1 = Math.sin(p1) + Math.cos(p1) - 1, A2 = b > c ? (-Math.cos(b) - Math.sin(b)) + Math.SQRT2 : 0;
    const t = [curve(Math.cos, 0, Math.PI, 300, { name: 'y = cos x', line: { color: C_FN, width: 2.5 } }),
               curve(Math.sin, 0, Math.PI, 300, { name: 'y = sin x', line: { color: C_TAN, width: 2.5 } })];
    if (p1 > 0) t.push(band(Math.cos, Math.sin, 0, p1, C_POS, `cos on top: ${A1.toFixed(4)}`));
    if (b > c) t.push(band(Math.sin, Math.cos, c, b, C_GOLD, `sin on top: ${A2.toFixed(4)}`));
    Plotly.newPlot(el(id), t, layout({ title: `A = ∫₀ᵇ |cos x − sin x| dx = ${A1.toFixed(4)} + ${A2.toFixed(4)} = ${(A1 + A2).toFixed(4)}`,
                xaxis: ax({ title: 'x', range: [0, Math.PI] }), yaxis: ax({ title: 'y', range: [-1.2, 1.2] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C8b. Average value of x² on [0, b] ─────────────────────────
  function calcAverageValue() {
    const id = 'calc-average-value';
    const b = val(id, 'b', 3), f = x => x * x, fav = b * b / 3, c = b / Math.sqrt(3);
    Plotly.newPlot(el(id), [
      band(f, () => 0, 0, b, C_POS, `∫₀ᵇ x² dx = ${(b ** 3 / 3).toFixed(3)}`),
      curve(f, 0, 4.2, 200, { name: 'y = x²', line: { color: C_FN, width: 2.5 } }),
      { x: [0, b, b, 0, 0], y: [0, 0, fav, fav, 0], mode: 'lines', name: `rectangle of height f_av = ${fav.toFixed(3)}, same area`, line: { color: C_ARROW, width: 2, dash: 'dash' } },
      { x: [c], y: [fav], mode: 'markers', name: `c = b/√3 = ${c.toFixed(3)}: f(c) = f_av`, marker: { color: C_PT, size: 11 } },
    ], layout({ title: `f_av = (1/b) ∫₀ᵇ x² dx = b²/3 = ${fav.toFixed(3)},   attained at c = ${c.toFixed(3)}`,
                xaxis: ax({ title: 'x', range: [0, 4.2] }), yaxis: ax({ title: 'y', range: [0, 17] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C9. ∫ sinᵐx cosⁿx dx on [0, π] ─────────────────────────────
  function calcTrigPowers() {
    const id = 'calc-trig-powers';
    const m = Math.round(val(id, 'm', 3)), n = Math.round(val(id, 'n', 2));
    const f = x => Math.sin(x) ** m * Math.cos(x) ** n, I = simpson(f, 0, Math.PI, 600);
    const which = n % 2 ? 'n odd → keep one cos x, u = sin x' : m % 2 ? 'm odd → keep one sin x, u = cos x' : 'both even → half-angle formulas';
    Plotly.newPlot(el(id), [
      curve(f, 0, Math.PI, 400, { name: `sin^${m}x · cos^${n}x`, fill: 'tozeroy', fillcolor: C_BLUE, line: { color: C_FN, width: 2.5 } }),
    ], layout({ title: `∫₀^π sin^${m}x cos^${n}x dx = ${Math.abs(I) < 1e-9 ? '0' : I.toFixed(4)}      ${which}`,
                xaxis: ax({ title: 'x', range: [0, Math.PI] }), yaxis: ax({ title: 'y', range: [-1.05, 1.05] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C10. Trig substitution: ∫₀^{x₁} √(4 − x²) dx as sector + triangle ──
  function calcTrigSub() {
    const id = 'calc-trig-sub';
    const a = 2, x1 = Math.min(val(id, 'x1', 1.2), a), th = Math.asin(x1 / a), y1 = a * Math.cos(th);
    const phi = lin(Math.PI / 2 - th, Math.PI / 2, 80);
    const sector = { x: [0].concat(phi.map(p => a * Math.cos(p)), [0]), y: [0].concat(phi.map(p => a * Math.sin(p)), [0]), fill: 'toself', mode: 'lines',
                     line: { color: 'rgba(0,0,0,0)' }, fillcolor: C_GOLD, name: `sector, angle θ: 2θ = ${(2 * th).toFixed(4)}`, hoverinfo: 'skip' };
    const tri = { x: [0, x1, x1, 0], y: [0, 0, y1, 0], fill: 'toself', mode: 'lines', line: { color: 'rgba(0,0,0,0)' }, fillcolor: C_BLUE,
                  name: `triangle: x₁y₁/2 = ${(x1 * y1 / 2).toFixed(4)}`, hoverinfo: 'skip' };
    Plotly.newPlot(el(id), [sector, tri,
      curve(x => Math.sqrt(Math.max(0, a * a - x * x)), 0, a, 200, { name: 'y = √(4 − x²)', line: { color: C_FN, width: 2.5 } }),
      { x: [0, x1], y: [0, y1], mode: 'lines', name: 'radius to (x₁, y₁)', line: { color: C_PT, width: 2 } },
      { x: [x1, x1], y: [0, y1], mode: 'lines', showlegend: false, line: { color: C_GHOST, width: 1, dash: 'dot' } },
    ], layout({ title: `x₁ = 2 sin θ, θ = ${th.toFixed(4)}:   ∫₀^x₁ √(4 − x²) dx = 2θ + 2 sin θ cos θ = ${(2 * th + x1 * y1 / 2).toFixed(4)}`,
                xaxis: ax({ title: 'x', range: [-0.1, 2.3] }), yaxis: ax({ title: 'y', range: [-0.1, 2.3], scaleanchor: 'x', scaleratio: 1 }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C11. Partial fractions: 1/((x − a)(x − b)) ─────────────────
  function calcPartialFractions() {
    const id = 'calc-partial-fractions';
    const a = val(id, 'a', 1), b = val(id, 'b', -2), same = Math.abs(a - b) < 1e-9;
    const f = x => 1 / ((x - a) * (x - b));
    const clip = y => (Math.abs(y) > 8 ? null : y);
    const xs = lin(-5, 5, 1000).map(x => x + 0.0037);   // avoid landing exactly on a pole
    const t = [{ x: xs, y: xs.map(x => clip(f(x))), mode: 'lines', name: '1/((x − a)(x − b))', line: { color: C_FN, width: 3 }, connectgaps: false }];
    let title;
    if (same) {
      title = `a = b = ${a}: repeated root — Case II, 1/(x − a)² already is a partial fraction`;
    } else {
      const A = 1 / (a - b), B = -A, lin1 = r => (r < 0 ? `(x + ${-r})` : `(x − ${r})`);
      t.push({ x: xs, y: xs.map(x => clip(A / (x - a))), mode: 'lines', name: `A/${lin1(a)}, A = ${A.toFixed(3)}`, line: { color: C_PATH, width: 2, dash: 'dash' }, connectgaps: false });
      t.push({ x: xs, y: xs.map(x => clip(B / (x - b))), mode: 'lines', name: `B/${lin1(b)}, B = ${B.toFixed(3)}`, line: { color: C_TAN, width: 2, dash: 'dash' }, connectgaps: false });
      title = `1/(${lin1(a)}${lin1(b)}) = ${A.toFixed(3)}/${lin1(a)} ${B < 0 ? '−' : '+'} ${Math.abs(B).toFixed(3)}/${lin1(b)}     (A = 1/(a − b), B = 1/(b − a))`;
    }
    Plotly.newPlot(el(id), t, layout({ title, xaxis: ax({ title: 'x', range: [-5, 5] }), yaxis: ax({ title: 'y', range: [-6, 6] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C12. Solid of revolution of y = √x as a stack of discs ─────
  function calcSolidRevolution() {
    const id = 'calc-solid-revolution';
    const b = val(id, 'b', 3), n = Math.max(2, Math.round(val(id, 'n', 8))), f = Math.sqrt, dx = b / n;
    const th = lin(0, 2 * Math.PI, 48), X = [], Y = [], Z = []; let sum = 0;
    for (let i = 0; i < n; i++) {
      const x0 = i * dx, x1 = x0 + dx, r = f(x0);          // left endpoints: the disc sum visibly approaches the volume from below
      sum += Math.PI * r * r * dx;
      for (const x of [x0, x1]) { X.push(th.map(() => x)); Y.push(th.map(t => r * Math.cos(t))); Z.push(th.map(t => r * Math.sin(t))); }
    }
    const xs = lin(0, b, 100);
    Plotly.newPlot(el(id), [
      { type: 'surface', x: X, y: Y, z: Z, showscale: false, opacity: 0.85, colorscale: [[0, '#0f5132'], [1, '#34d399']], name: 'discs' },
      { type: 'scatter3d', mode: 'lines', x: xs, y: xs.map(f), z: xs.map(() => 0), name: 'y = √x', line: { color: C_PT, width: 5 } },
      { type: 'scatter3d', mode: 'lines', x: xs, y: xs.map(x => -f(x)), z: xs.map(() => 0), showlegend: false, line: { color: C_PT, width: 5 } },
    ], layout({ title: `disc sum Σ π f(xᵢ)² Δx = ${sum.toFixed(4)}   (n = ${n}, left endpoints)      exact π b²/2 = ${(Math.PI * b * b / 2).toFixed(4)}`,
                height: 480, legend: { orientation: 'h', y: -0.05 },
                scene: { aspectmode: 'data', bgcolor: '#111827',
                         xaxis: { title: 'x', gridcolor: '#232d3f', color: '#c8d0e0', backgroundcolor: '#111827' },
                         yaxis: { title: 'y', gridcolor: '#232d3f', color: '#c8d0e0', backgroundcolor: '#111827' },
                         zaxis: { title: 'z', gridcolor: '#232d3f', color: '#c8d0e0', backgroundcolor: '#111827' },
                         camera: { eye: { x: 1.6, y: 1.3, z: 0.9 } } } }), cfg());
  }

  // ── C13. Improper p-integral ∫₁ᵗ x⁻ᵖ dx ────────────────────────
  function calcImproperP() {
    const id = 'calc-improper-p';
    const p = val(id, 'p', 2), t = Math.max(1, val(id, 't', 10)), f = x => Math.pow(x, -p);
    const I = Math.abs(p - 1) < 1e-9 ? Math.log(t) : (Math.pow(t, 1 - p) - 1) / (1 - p);
    const lim = p > 1 ? `converges to 1/(p − 1) = ${(1 / (p - 1)).toFixed(4)}` : 'diverges: the area grows without bound';
    Plotly.newPlot(el(id), [
      band(f, () => 0, 1, t, C_POS, `∫₁ᵗ x⁻ᵖ dx = ${I.toFixed(4)}`, 400),
      curve(f, 1, 60, 400, { name: `y = 1/x^${p.toFixed(1)}`, line: { color: C_FN, width: 2.5 } }),
    ], layout({ title: `p = ${p.toFixed(1)}, t = ${t}:  ∫₁ᵗ x⁻ᵖ dx = ${I.toFixed(4)}      as t → ∞: ${lim}`,
                xaxis: ax({ title: 'x', range: [1, 60] }), yaxis: ax({ title: 'y', range: [0, 1.1] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C14. Sequence limit with an ε-band ─────────────────────────
  function calcSequenceLimit() {
    const id = 'calc-sequence-limit';
    const eps = val(id, 'eps', 0.2), L = 1, a = n => 1 + 2 * (n % 2 ? -1 : 1) / n, K = 110;   // K ≥ N at the smallest ε (0.02 → N = 101)
    const N = Math.floor(2 / eps) + 1;
    const ns = lin(1, K, K - 1);
    Plotly.newPlot(el(id), [
      { x: [1, K], y: [L + eps, L + eps], mode: 'lines', name: `L ± ε, ε = ${eps.toFixed(2)}`, line: { color: C_ARROW, width: 1.5, dash: 'dash' } },
      { x: [1, K], y: [L - eps, L - eps], mode: 'lines', showlegend: false, line: { color: C_ARROW, width: 1.5, dash: 'dash' } },
      { x: [1, K], y: [L, L], mode: 'lines', name: 'L = 1', line: { color: C_GHOST, width: 1 } },
      { x: ns.filter(n => n < N), y: ns.filter(n => n < N).map(a), mode: 'markers', name: 'before N', marker: { color: C_PT, size: 7 } },
      { x: ns.filter(n => n >= N), y: ns.filter(n => n >= N).map(a), mode: 'markers', name: 'n ≥ N: inside the band', marker: { color: C_PATH, size: 7 } },
    ], layout({ title: `aₙ = 1 + 2(−1)ⁿ/n:  |aₙ − 1| = 2/n < ε for every n ≥ N = ${N}`,
                shapes: [{ type: 'line', x0: N - 0.5, x1: N - 0.5, y0: -0.2, y1: 2.2, line: { color: C_TAN, width: 2 } }],
                xaxis: ax({ title: 'n', range: [0, K + 1] }), yaxis: ax({ title: 'aₙ', range: [-0.2, 2.2] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C15. Geometric series: terms and partial sums ──────────────
  function calcGeometricSeries() {
    const id = 'calc-geometric-series';
    const a = val(id, 'a', 1), r = val(id, 'r', 0.5), n = Math.max(1, Math.round(val(id, 'n', 12)));
    const ns = lin(1, n, n - 1), terms = ns.map(k => a * Math.pow(r, k - 1)), S = []; let s = 0;
    for (const t of terms) { s += t; S.push(s); }
    const t = [{ x: ns, y: terms, type: 'bar', name: 'terms a rⁿ⁻¹', marker: { color: C_BLUE } },
               { x: ns, y: S, mode: 'lines+markers', name: 'partial sums Sₙ', line: { color: C_PATH, width: 2.5 }, marker: { color: C_PATH, size: 6 } }];
    let title;
    if (Math.abs(r) < 1) { const sum = a / (1 - r); t.push({ x: [1, n], y: [sum, sum], mode: 'lines', name: `a/(1 − r) = ${sum.toFixed(4)}`, line: { color: C_ARROW, width: 1.5, dash: 'dash' } });
      title = `|r| = ${Math.abs(r).toFixed(2)} < 1: Sₙ → a/(1 − r) = ${sum.toFixed(4)}   (S_${n} = ${S[n - 1].toFixed(4)})`; }
    else title = `|r| = ${Math.abs(r).toFixed(2)} ≥ 1: the series diverges   (S_${n} = ${S[n - 1].toFixed(3)})`;
    Plotly.newPlot(el(id), t, layout({ title, xaxis: ax({ title: 'n', range: [0, n + 1] }), yaxis: ax({ title: '' }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C16. Integral test on the p-series ──────────────────────────
  function calcIntegralTest() {
    const id = 'calc-integral-test';
    const p = val(id, 'p', 1), n = Math.max(2, Math.round(val(id, 'n', 10))), f = x => Math.pow(x, -p);
    const list = []; let S = 1, tail = 0;
    for (let k = 2; k <= n; k++) { const h = f(k); S += h; tail += h; list.push([k - 1, k, h]); }
    const I = Math.abs(p - 1) < 1e-9 ? Math.log(n) : (Math.pow(n, 1 - p) - 1) / (1 - p);
    Plotly.newPlot(el(id), [
      rects(list, C_BLUE, `a₂ + … + aₙ = ${tail.toFixed(4)}`),
      band(f, () => 0, 1, n, 'rgba(0,166,81,.25)', `∫₁ⁿ x⁻ᵖ dx = ${I.toFixed(4)}`, 300),
      curve(f, 1, n + 0.5, 300, { name: `y = 1/x^${p.toFixed(1)}`, line: { color: C_FN, width: 2.5 } }),
    ], layout({ title: `p = ${p.toFixed(1)}:  Sₙ = ${S.toFixed(4)},   a₂+…+aₙ = ${tail.toFixed(4)} ≤ ∫₁ⁿ = ${I.toFixed(4)}   → ${p > 1 ? 'both bounded: converges' : 'both unbounded: diverges'}`,
                xaxis: ax({ title: 'x', range: [0.5, n + 0.5] }), yaxis: ax({ title: 'y', range: [0, 1.1] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C17. Limit comparison: 1/(nᵠ + n) against 1/nᵠ ──────────────
  function calcComparison() {
    const id = 'calc-comparison';
    const q = val(id, 'q', 2), K = 40, ns = lin(1, K, K - 1);
    const an = n => 1 / (Math.pow(n, q) + n), bn = n => Math.pow(n, -q);
    const ratio = ns.map(n => an(n) / bn(n)), SA = [], SB = []; let sa = 0, sb = 0;
    for (const n of ns) { sa += an(n); sb += bn(n); SA.push(sa); SB.push(sb); }
    const c = q > 1 + 1e-9 ? 1 : 0.5;
    Plotly.newPlot(el(id), [
      { x: ns, y: ratio, mode: 'lines+markers', name: 'aₙ / bₙ', line: { color: C_PATH }, marker: { size: 5 } },
      { x: [1, K], y: [c, c], mode: 'lines', name: `limit c = ${c}`, line: { color: C_ARROW, width: 1.5, dash: 'dash' } },
      { x: ns, y: SA, mode: 'lines+markers', xaxis: 'x2', yaxis: 'y2', name: 'Σ aₙ', line: { color: C_PATH }, marker: { size: 5 } },
      { x: ns, y: SB, mode: 'lines+markers', xaxis: 'x2', yaxis: 'y2', name: 'Σ bₙ (p-series)', line: { color: C_TAN }, marker: { size: 5 } },
    ], twoRows({ title: `q = ${q.toFixed(1)}:  aₙ/bₙ → ${c}${q > 1 + 1e-9 && q < 1.5 ? ' (slowly: like 1/(1 + n^(1−q)))' : ''},  so Σ 1/(nᵠ + n) and Σ 1/nᵠ ${q > 1 + 1e-9 ? 'both converge (p = q > 1)' : 'both diverge (harmonic)'}`,
                 xaxis: { title: 'n', range: [0, K + 1] }, yaxis: { title: 'ratio', range: [0, 1.1] }, xaxis2: { title: 'n', range: [0, K + 1] }, yaxis2: { title: 'partial sums' } }), cfg());
  }

  // ── C18. Alternating series Σ(−1)ⁿ⁻¹/nᵖ with the error bound ───
  function alternatingSum(p) {
    // partial sums S_K … S_{K+m}, then repeated averaging (Euler's trick) — accurate to many digits for smooth terms
    const K = 2000, m = 14; let s = 0; const tail = [];
    for (let n = 1; n <= K + m; n++) { s += (n % 2 ? 1 : -1) * Math.pow(n, -p); if (n >= K) tail.push(s); }
    let v = tail;
    for (let i = 0; i < m; i++) { const w = []; for (let j = 0; j + 1 < v.length; j++) w.push((v[j] + v[j + 1]) / 2); v = w; }
    return v[0];
  }
  function calcAlternating() {
    const id = 'calc-alternating';
    const p = val(id, 'p', 1), n = Math.max(2, Math.round(val(id, 'n', 10)));
    const S = alternatingSum(p), ns = lin(1, n, n - 1), Sn = []; let s = 0;
    for (const k of ns) { s += (k % 2 ? 1 : -1) * Math.pow(k, -p); Sn.push(s); }
    const bound = Math.pow(n + 1, -p), err = Math.abs(S - Sn[n - 1]);
    Plotly.newPlot(el(id), [
      { x: [0.5, n + 0.5, n + 0.5, 0.5], y: [S - bound, S - bound, S + bound, S + bound], fill: 'toself', mode: 'lines', line: { color: 'rgba(0,0,0,0)' }, fillcolor: 'rgba(250,204,21,.18)', name: `S ± aₙ₊₁ (aₙ₊₁ = ${bound.toFixed(4)})`, hoverinfo: 'skip' },
      { x: ns, y: Sn, mode: 'lines+markers', name: 'partial sums Sₙ', line: { color: C_PATH, width: 2 }, marker: { color: C_PATH, size: 7 } },
      { x: [0.5, n + 0.5], y: [S, S], mode: 'lines', name: `S ≈ ${S.toFixed(5)}`, line: { color: C_ARROW, width: 1.5, dash: 'dash' } },
    ], layout({ title: `p = ${p.toFixed(1)}:  |S − S_${n}| = ${err.toFixed(5)}  ≤  a_${n + 1} = ${bound.toFixed(5)}`,
                xaxis: ax({ title: 'n', range: [0.5, n + 0.5] }), yaxis: ax({ title: 'Sₙ' }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C19a. Ratio test on nᵏ/rⁿ ────────────────────────────────────
  function calcRatioTest() {
    const id = 'calc-ratio-test';
    const k = Math.round(val(id, 'k', 2)), r = val(id, 'r', 2), K = 30, ns = lin(1, K, K - 1);
    const a = n => Math.pow(n, k) / Math.pow(r, n), ratios = ns.map(n => a(n + 1) / a(n)), S = []; let s = 0;
    for (const n of ns) { s += a(n); S.push(s); }
    const L = 1 / r, verdict = r > 1 + 1e-9 ? `L = 1/r = ${L.toFixed(3)} < 1: converges absolutely` : 'L = 1: inconclusive (and Σ nᵏ visibly diverges)';
    Plotly.newPlot(el(id), [
      { x: ns, y: ratios, mode: 'lines+markers', name: 'aₙ₊₁ / aₙ', line: { color: C_PATH }, marker: { size: 5 } },
      { x: [1, K], y: [L, L], mode: 'lines', name: `L = 1/r = ${L.toFixed(3)}`, line: { color: C_ARROW, width: 1.5, dash: 'dash' } },
      { x: [1, K], y: [1, 1], mode: 'lines', name: 'the line 1', line: { color: C_PT, width: 1, dash: 'dot' } },
      { x: ns, y: S, mode: 'lines+markers', xaxis: 'x2', yaxis: 'y2', name: 'partial sums of Σ nᵏ/rⁿ', line: { color: C_TAN }, marker: { size: 5 } },
    ], twoRows({ title: `aₙ = n^${k}/${r.toFixed(1)}ⁿ:   ${verdict}`,
                 xaxis: { title: 'n', range: [0, K + 1] }, yaxis: { title: 'ratio', range: [0, Math.max(1.6, Math.min(4, ratios[0] * 1.1))] }, xaxis2: { title: 'n', range: [0, K + 1] }, yaxis2: { title: 'Sₙ' } }), cfg());
  }

  // ── C19b. Rearranging the alternating harmonic series to a target ──
  function calcRearrangement() {
    const id = 'calc-rearrangement';
    const L = val(id, 'L', 1.5), N = 400;
    let pos = 1, neg = 2, s = 0; const S = [], nat = []; let sn = 0;
    for (let i = 1; i <= N; i++) {
      if (s <= L) { s += 1 / pos; pos += 2; } else { s -= 1 / neg; neg += 2; }
      S.push(s);
      sn += (i % 2 ? 1 : -1) / i; nat.push(sn);
    }
    const ns = lin(1, N, N - 1);
    Plotly.newPlot(el(id), [
      { x: ns, y: nat, mode: 'lines', name: 'natural order → ln 2', line: { color: C_GHOST, width: 1.5 } },
      { x: ns, y: S, mode: 'lines', name: 'rearranged (greedy toward L)', line: { color: C_PATH, width: 2.5 } },
      { x: [1, N], y: [Math.LN2, Math.LN2], mode: 'lines', name: `ln 2 = ${Math.LN2.toFixed(4)}`, line: { color: C_GHOST, width: 1, dash: 'dash' } },
      { x: [1, N], y: [L, L], mode: 'lines', name: `target L = ${L.toFixed(2)}`, line: { color: C_ARROW, width: 1.5, dash: 'dash' } },
    ], layout({ title: `same terms, different order: after ${N} terms the rearranged sum is ${S[N - 1].toFixed(4)} (→ ${L.toFixed(2)}), the natural one ${nat[N - 1].toFixed(4)} (→ ln 2)`,
                xaxis: ax({ title: 'number of terms used' }), yaxis: ax({ title: 'partial sum', range: [Math.min(-1.3, L - 0.5), Math.max(3.3, L + 0.5)] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C20. Power series Σ xⁿ/n and its interval of convergence ────
  function calcPowerSeriesInterval() {
    const id = 'calc-power-series-interval';
    const N = Math.max(1, Math.round(val(id, 'N', 8))), xs = lin(-1.4, 1.4, 560);
    const SN = x => { let s = 0, p = 1; for (let n = 1; n <= N; n++) { p *= x; s += p / n; } return s; };
    const clip = y => (Math.abs(y) > 8 ? null : y);
    Plotly.newPlot(el(id), [
      { x: xs, y: xs.map(x => (x < 1 ? clip(-Math.log(1 - x)) : null)), mode: 'lines', name: '−ln(1 − x)', line: { color: C_FN, width: 2.5 }, connectgaps: false },
      { x: xs, y: xs.map(x => clip(SN(x))), mode: 'lines', name: `S_${N}(x) = Σₙ₌₁^${N} xⁿ/n`, line: { color: C_PATH, width: 2.5 }, connectgaps: false },
      { x: [-1], y: [-Math.LN2], mode: 'markers', name: 'x = −1: converges to −ln 2', marker: { color: C_PATH, size: 10 } },
      { x: [1], y: [Math.min(8, SN(1))], mode: 'markers', name: 'x = 1: harmonic series, diverges', marker: { color: C_PT, size: 10, symbol: 'x' } },
    ], layout({ title: `N = ${N}: inside (−1, 1) the partial sums settle on −ln(1 − x); outside they blow up.  Interval of convergence [−1, 1).`,
                shapes: [{ type: 'rect', x0: -1, x1: 1, y0: -3, y1: 5, fillcolor: 'rgba(96,165,250,.08)', line: { width: 0 } },
                         { type: 'line', x0: -1, x1: -1, y0: -3, y1: 5, line: { color: C_TAN, width: 1, dash: 'dot' } },
                         { type: 'line', x0: 1, x1: 1, y0: -3, y1: 5, line: { color: C_TAN, width: 1, dash: 'dot' } }],
                xaxis: ax({ title: 'x', range: [-1.4, 1.4] }), yaxis: ax({ title: 'y', range: [-3, 5] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C21. arctan x from the integrated geometric series ──────────
  function calcArctanSeries() {
    const id = 'calc-arctan-series';
    const N = Math.max(0, Math.round(val(id, 'N', 3))), xs = lin(-1.3, 1.3, 520);
    const SN = x => { let s = 0; for (let n = 0; n <= N; n++) s += (n % 2 ? -1 : 1) * Math.pow(x, 2 * n + 1) / (2 * n + 1); return s; };
    const clip = y => (Math.abs(y) > 4 ? null : y);
    Plotly.newPlot(el(id), [
      curve(Math.atan, -1.3, 1.3, 300, { name: 'arctan x', line: { color: C_FN, width: 2.5 } }),
      { x: xs, y: xs.map(x => clip(SN(x))), mode: 'lines', name: `Σₙ₌₀^${N} (−1)ⁿ x²ⁿ⁺¹/(2n+1)`, line: { color: C_PATH, width: 2.5 }, connectgaps: false },
      { x: [1], y: [SN(1)], mode: 'markers', name: `at x = 1: ${SN(1).toFixed(4)} → π/4 = ${(Math.PI / 4).toFixed(4)}`, marker: { color: C_PT, size: 10 } },
    ], layout({ title: `${N + 1} terms:  the partial sum at x = 1 is ${SN(1).toFixed(4)}, π/4 ≈ ${(Math.PI / 4).toFixed(4)}   (radius of convergence 1)`,
                shapes: [{ type: 'rect', x0: -1, x1: 1, y0: -2.5, y1: 2.5, fillcolor: 'rgba(96,165,250,.08)', line: { width: 0 } }],
                xaxis: ax({ title: 'x', range: [-1.3, 1.3] }), yaxis: ax({ title: 'y', range: [-2.5, 2.5] }), legend: { orientation: 'h', y: -0.2 } }), cfg());
  }

  // ── C22. Taylor polynomials of sin x about a ────────────────────
  function calcTaylorPolynomials() {
    const id = 'calc-taylor-polynomials';
    const n = Math.max(0, Math.round(val(id, 'n', 3))), a = val(id, 'a', 0);
    const d = [Math.sin(a), Math.cos(a), -Math.sin(a), -Math.cos(a)];   // sin⁽ⁱ⁾(a) cycles with period 4
    const T = x => { let s = 0, p = 1, fact = 1; for (let i = 0; i <= n; i++) { if (i) { p *= (x - a); fact *= i; } s += d[i % 4] * p / fact; } return s; };
    const xs = lin(-7, 7, 700), clip = y => (Math.abs(y) > 3 ? null : y);
    Plotly.newPlot(el(id), [
      curve(Math.sin, -7, 7, 400, { name: 'sin x', line: { color: C_FN, width: 2.5 } }),
      { x: xs, y: xs.map(x => clip(T(x))), mode: 'lines', name: `T_${n}(x) about a = ${a.toFixed(2)}`, line: { color: C_PATH, width: 2.5 }, connectgaps: false },
      { x: [a], y: [Math.sin(a)], mode: 'markers', name: '(a, sin a)', marker: { color: C_PT, size: 10 } },
      { x: xs, y: xs.map(x => Math.max(1e-12, Math.abs(Math.sin(x) - T(x)))), mode: 'lines', xaxis: 'x2', yaxis: 'y2', name: `|Rₙ(x)| = |sin x − T_${n}(x)|`, line: { color: C_TAN, width: 2 } },
    ], twoRows({ title: `T_${n}(x) = Σᵢ₌₀^${n} sin⁽ⁱ⁾(a)/i! · (x − a)ⁱ,  a = ${a.toFixed(2)}`,
                 xaxis: { title: 'x', range: [-7, 7] }, yaxis: { title: 'y', range: [-3, 3] }, xaxis2: { title: 'x', range: [-7, 7] }, yaxis2: { title: '|Rₙ| (log)', type: 'log', range: [-8, 1] } }), cfg());
  }

  // ══════════════════════════════════════════════════════════════
  //  COMP 352 — Analysis of algorithms (growth rates, big-O, amortisation, hashing, sorting bounds)
  // ══════════════════════════════════════════════════════════════
  const DS_COLORS = ['#94a3b8', '#60a5fa', '#34d399', '#facc15', '#fb923c', '#f87171', '#c084fc'];

  // ── D1. The seven functions on a log-log plot ──────────────────
  function dsGrowthRates() {
    const id = 'ds-growth-rates';
    const nmax = Math.max(4, Math.round(val(id, 'nmax', 64))), c = val(id, 'c', 1);
    const fns = [['1', () => 1], ['log n', n => Math.log2(n)], ['n', n => n], ['n log n', n => n * Math.log2(n)], ['n²', n => n * n], ['n³', n => n * n * n], ['2ⁿ', n => Math.pow(2, n)]];
    const xs = lin(1, nmax, Math.min(200, nmax - 1)).map(x => Math.max(1, Math.round(x))).filter((x, i, a) => a.indexOf(x) === i);
    const traces = fns.map(([name, f], i) => ({ x: xs, y: xs.map(n => { const y = (i === 2 ? c : 1) * f(n); return Number.isFinite(y) && y < 1e300 ? y : null; }), connectgaps: false, mode: 'lines', name: i === 2 && c !== 1 ? `${c}·n` : name, line: { color: DS_COLORS[i], width: i === 2 ? 3 : 2 } }));
    Plotly.newPlot(el(id), traces, layout({
      title: `growth rates up to n = ${nmax}, both axes logarithmic — a straight line is a polynomial; 2ⁿ bends upward whatever the scale`,
      xaxis: ax({ title: 'n', type: 'log' }), yaxis: ax({ title: 'f(n)', type: 'log' }), legend: { orientation: 'h', y: -0.18 } }), cfg());
  }

  // ── D2. Big-O witness: f(n) ≤ c·g(n) for n ≥ n₀ ──────────────
  function dsBigOWitness() {
    const id = 'ds-big-o-witness';
    const c = val(id, 'c', 4), n0 = Math.max(1, Math.round(val(id, 'n0', 5)));
    const f = n => 3 * n * n + 10 * n + 20, g = n => n * n;
    const xs = lin(1, 40, 39).map(Math.round);
    const ok = xs.filter(n => n >= n0).every(n => f(n) <= c * g(n));
    const firstBad = xs.find(n => n >= n0 && f(n) > c * g(n));
    Plotly.newPlot(el(id), [
      { x: xs, y: xs.map(f), mode: 'lines+markers', name: 'f(n) = 3n² + 10n + 20', line: { color: '#f87171', width: 2.5 }, marker: { size: 5 } },
      { x: xs, y: xs.map(n => c * g(n)), mode: 'lines', name: `c·g(n) = ${c}·n²`, line: { color: '#60a5fa', width: 2.5 } },
      { x: [n0, n0], y: [0, c * g(40)], mode: 'lines', name: `n₀ = ${n0}`, line: { color: '#facc15', width: 2, dash: 'dash' } },
    ], layout({ title: ok ? `f(n) ≤ ${c}·n² for every n ≥ ${n0}: the pair (c = ${c}, n₀ = ${n0}) witnesses f(n) is O(n²)` : `not yet: at n = ${firstBad}, f(n) = ${f(firstBad)} > ${c}·n² = ${c * g(firstBad)} — raise c or n₀`,
                xaxis: ax({ title: 'n', range: [0, 41] }), yaxis: ax({ title: 'value', range: [0, Math.max(f(40), c * g(40)) * 1.05] }), legend: { orientation: 'h', y: -0.18 } }), cfg());
  }

  // ── D3. Growable array: doubling versus incremental growth ────
  function dsGrowableArray() {
    const id = 'ds-growable-array';
    const n = Math.max(8, Math.round(val(id, 'n', 200))), c = Math.max(1, Math.round(val(id, 'c', 8)));
    const sim = grow => { let cap = 1, total = 0; const cost = [], cum = []; for (let k = 1; k <= n; k++) { let t = 1; if (k > cap) { t += cap; cap = grow(cap); } total += t; cost.push(t); cum.push(total); } return { cost, cum }; };
    const D = sim(x => 2 * x), I = sim(x => x + c);
    const xs = lin(1, n, n - 1).map(Math.round);
    Plotly.newPlot(el(id), [
      { x: xs, y: D.cost, mode: 'lines', name: 'cost of push k (doubling)', line: { color: '#60a5fa', width: 1.5 } },
      { x: xs, y: I.cost, mode: 'lines', name: `cost of push k (grow by ${c})`, line: { color: '#f87171', width: 1.5 } },
      { x: xs, y: D.cum.map((v, i) => v / (i + 1)), mode: 'lines', xaxis: 'x2', yaxis: 'y2', name: 'average cost per push (doubling)', line: { color: '#60a5fa', width: 2.5 } },
      { x: xs, y: I.cum.map((v, i) => v / (i + 1)), mode: 'lines', xaxis: 'x2', yaxis: 'y2', name: `average cost per push (grow by ${c})`, line: { color: '#f87171', width: 2.5 } },
    ], twoRows({ title: `${n} pushes: total ${D.cum[n - 1]} steps with doubling (≈ 3 per push, amortised O(1)), ${I.cum[n - 1]} growing by ${c} (≈ n/${2 * c} per push, O(n))`,
                 xaxis: { title: 'push number k' }, yaxis: { title: 'steps for this push', type: 'log' }, xaxis2: { title: 'push number k' }, yaxis2: { title: 'average steps per push' } }), cfg());
  }

  // ── D4. Hash table: expected probes against the load factor ───
  function dsLoadFactor() {
    const id = 'ds-load-factor';
    const N = Math.max(4, Math.round(val(id, 'N', 16)));
    const alphas = lin(0.02, 0.98, 96);
    const chainHit = a => 1 + a / 2, chainMiss = a => a, linHit = a => 0.5 * (1 + 1 / (1 - a)), linMiss = a => 0.5 * (1 + 1 / ((1 - a) * (1 - a)));
    Plotly.newPlot(el(id), [
      { x: alphas, y: alphas.map(chainHit), mode: 'lines', name: 'separate chaining, successful search ≈ 1 + α/2', line: { color: '#34d399', width: 2.5 } },
      { x: alphas, y: alphas.map(chainMiss), mode: 'lines', name: 'separate chaining, unsuccessful ≈ α', line: { color: '#34d399', width: 2, dash: 'dash' } },
      { x: alphas, y: alphas.map(linHit), mode: 'lines', name: 'linear probing, successful ≈ ½(1 + 1/(1−α))', line: { color: '#f87171', width: 2.5 } },
      { x: alphas, y: alphas.map(linMiss), mode: 'lines', name: 'linear probing, unsuccessful ≈ ½(1 + 1/(1−α)²)', line: { color: '#f87171', width: 2, dash: 'dash' } },
      { x: [0.5, 0.5], y: [0, 6], mode: 'lines', name: 'α = ½ (rehash threshold for open addressing)', line: { color: '#facc15', width: 1.5, dash: 'dot' } },
    ], layout({ title: `expected probes per search versus load factor α = n/N (here N = ${N}: α = ½ means ${N / 2} keys); chaining degrades gently, probing explodes past ½`,
                xaxis: ax({ title: 'load factor α', range: [0, 1] }), yaxis: ax({ title: 'expected probes', range: [0, 6] }), legend: { orientation: 'h', y: -0.18 } }), cfg());
  }

  // ── D5. Comparison-sort lower bound: log₂ n! against n log n ──
  function dsSortLowerBound() {
    const id = 'ds-sort-lower-bound';
    const nmax = Math.max(4, Math.round(val(id, 'nmax', 32)));
    const xs = lin(2, nmax, nmax - 2).map(Math.round);
    const logFact = n => { let s = 0; for (let k = 2; k <= n; k++) s += Math.log2(k); return s; };
    Plotly.newPlot(el(id), [
      { x: xs, y: xs.map(logFact), mode: 'lines+markers', name: 'log₂ n!  (height of the decision tree must be at least this)', line: { color: '#f87171', width: 2.5 }, marker: { size: 5 } },
      { x: xs, y: xs.map(n => n * Math.log2(n)), mode: 'lines', name: 'n log₂ n  (merge sort, worst case, is within a constant of this)', line: { color: '#60a5fa', width: 2.5 } },
      { x: xs, y: xs.map(n => (n / 2) * Math.log2(n / 2)), mode: 'lines', name: '(n/2) log₂ (n/2)  (the easy lower bound on log₂ n!)', line: { color: '#facc15', width: 2, dash: 'dash' } },
      { x: xs, y: xs.map(n => n * (n - 1) / 2), mode: 'lines', name: 'n(n−1)/2  (insertion sort, worst case)', line: { color: '#94a3b8', width: 1.5, dash: 'dot' } },
    ], layout({ title: `a decision tree for n keys has n! leaves, so some root-to-leaf path has ≥ log₂ n! comparisons — Ω(n log n) for every comparison sort`,
                xaxis: ax({ title: 'n' }), yaxis: ax({ title: 'comparisons', range: [0, Math.max(nmax * Math.log2(nmax), 1) * 1.3] }), legend: { orientation: 'h', y: -0.22 } }), cfg());
  }

  const SIMS = {
    'euler-demo':          eulerDemo,
    'rk4-comparison':      rk4Comparison,
    'heat-pde':            heatPDE,
    'gradient-descent':    gradientDescent,
    'newton-method':       newtonMethod,
    'logistic-regression': logisticReg,
    'monte-carlo-pi':      monteCarloPi,
    'regularization':      regularization,
    'param-est':           paramEstimation,
    'sgd-loss':            sgdLoss,
    // MAST 218
    'param-particle':      paramParticle,
    'param-line':          paramLine,
    'param-two-points':    paramTwoPoints,
    'param-circle':        paramCircle,
    'param-smiley':        paramSmiley,
    'param-tangent':       paramTangent,
    'param-area':          paramArea,
    'param-concavity':     paramConcavity,
    'param-length-distance': paramLengthDistance,
    'param-surface-revolution': paramSurfaceRevolution,
    'param-loop':          paramLoop,
    'polar-point':         polarPoint,
    'polar-curve':         polarCurve,
    'polar-tangent':       polarTangent,
    'polar-area':          polarArea,
    // MAST 221
    'dice-sum-grid':       diceSumGrid,
    'empirical-dice':      empiricalDice,
    'venn-counts':         vennCounts,
    'prob-union':          probUnion,
    'sample-space-tree':   sampleSpaceTree,
    'coin-event-grid':     coinEventGrid,
    'complement-rule':     complementRule,
    'incl-excl-3':         inclExcl3,
    'cond-table':          condTable,
    'cond-venn':           condVenn,
    'independence-check':  independenceCheck,
    'draw-replacement':    drawReplacement,
    'total-prob-tree':     totalProbTree,
    'bayes-posterior':     bayesPosterior,
    'rare-disease':        rareDisease,
    'rv-pmf-cdf':          rvPmfCdf,
    'density-area':        densityArea,
    'joint-pmf':           jointPmf,
    'chebyshev-bound':     chebyshevBound,
    'mgf-taylor':          mgfTaylor,
    'covariance-scatter':  covarianceScatter,
    'binomial-poisson':    binomialPoisson,
    'hypergeom-binomial':  hypergeomBinomial,
    'normal-standardize':  normalStandardize,
    'normal-approx-binomial': normalApproxBinomial,
    'gamma-beta-shapes':   gammaBetaShapes,
    // STAT 280
    'r-precedence':        rPrecedence,
    'r-loan':              rLoan,
    'r-function-plot':     rFunctionPlot,
    'r-recycling':         rRecycling,
    'r-logical-filter':    rLogicalFilter,
    'r-matrix-index':      rMatrixIndex,
    'r-roundoff':          rRoundoff,
    'r-hist-bins':         rHistBins,
    'r-boxplot-fences':    rBoxplotFences,
    'r-qq-shapes':         rQqShapes,
    'r-fixed-point':       rFixedPoint,
    'r-root-convergence':  rRootConvergence,
    'r-binary-search':     rBinarySearch,
    'r-mc-convergence':    rMcConvergence,
    'r-lcg-lattice':       rLcgLattice,
    'r-inverse-transform': rInverseTransform,
    'r-markov-weather':    rMarkovWeather,
    'r-mc-integral':       rMcIntegral,
    'r-rejection':         rRejection,
    'r-importance-tail':   rImportanceTail,
    'r-lu-steps':          rLuSteps,
    'r-eigen-ellipse':     rEigenEllipse,
    'r-svd-lowrank':       rSvdLowrank,
    'r-conditioning':      rConditioning,
    // MATH 205
    'calc-riemann-sums':   calcRiemannSums,
    'calc-signed-area':    calcSignedArea,
    'calc-antiderivative-family': calcAntiderivativeFamily,
    'calc-ftc-accumulation': calcFtcAccumulation,
    'calc-net-change':     calcNetChange,
    'calc-substitution':   calcSubstitution,
    'calc-parts-area':     calcPartsArea,
    'calc-area-between':   calcAreaBetween,
    'calc-average-value':  calcAverageValue,
    'calc-trig-powers':    calcTrigPowers,
    'calc-trig-sub':       calcTrigSub,
    'calc-partial-fractions': calcPartialFractions,
    'calc-solid-revolution': calcSolidRevolution,
    'calc-improper-p':     calcImproperP,
    'calc-sequence-limit': calcSequenceLimit,
    'calc-geometric-series': calcGeometricSeries,
    'calc-integral-test':  calcIntegralTest,
    'calc-comparison':     calcComparison,
    'calc-alternating':    calcAlternating,
    'calc-ratio-test':     calcRatioTest,
    'calc-rearrangement':  calcRearrangement,
    'calc-power-series-interval': calcPowerSeriesInterval,
    'calc-arctan-series':  calcArctanSeries,
    'calc-taylor-polynomials': calcTaylorPolynomials,
    // COMP 352
    'ds-growth-rates':     dsGrowthRates,
    'ds-big-o-witness':    dsBigOWitness,
    'ds-growable-array':   dsGrowableArray,
    'ds-load-factor':      dsLoadFactor,
    'ds-sort-lower-bound': dsSortLowerBound,
  };

  window.runSim = function (id, cfg) {
    if (SIMS[id]) {
      try { SIMS[id](); } catch (e) { console.warn('Sim error:', id, e); }
    } else if (cfg && cfg.custom) {
      // custom simulators mount themselves into #sim-<id>: automata / grammars (default), the Java stepper, the data-structure visualiser, the database engine
      const engine = cfg.engine === 'java' ? window.JAVA : cfg.engine === 'ds' ? window.DS : cfg.engine === 'db' ? window.DB : window.FA;
      if (engine) try { engine.mount(id, cfg); } catch (e) { console.warn('Sim error:', id, e); }
    }
  };
})();

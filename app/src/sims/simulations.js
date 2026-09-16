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

  // ── Dispatcher ─────────────────────────────────
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
    // MAST 221
    'dice-sum-grid':       diceSumGrid,
    'empirical-dice':      empiricalDice,
    'venn-counts':         vennCounts,
    'prob-union':          probUnion,
    'sample-space-tree':   sampleSpaceTree,
    'coin-event-grid':     coinEventGrid,
    'complement-rule':     complementRule,
    'incl-excl-3':         inclExcl3,
    // STAT 280
    'r-precedence':        rPrecedence,
    'r-loan':              rLoan,
    'r-function-plot':     rFunctionPlot,
    'r-recycling':         rRecycling,
    'r-logical-filter':    rLogicalFilter,
    'r-matrix-index':      rMatrixIndex,
    'r-roundoff':          rRoundoff,
  };

  window.runSim = function (id, cfg) {
    if (SIMS[id]) {
      try { SIMS[id](); } catch (e) { console.warn('Sim error:', id, e); }
    } else if (cfg && cfg.custom) {
      // custom simulators mount themselves into #sim-<id>: automata / grammars (default) or the Java stepper
      const engine = cfg.engine === 'java' ? window.JAVA : window.FA;
      if (engine) try { engine.mount(id, cfg); } catch (e) { console.warn('Sim error:', id, e); }
    }
  };
})();

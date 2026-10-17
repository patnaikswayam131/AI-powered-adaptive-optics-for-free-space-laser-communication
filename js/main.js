// ═══════════════════════════════════════════════════════════════
// Main Application Controller
// Handles UI controls, tabs, presets, simulation triggers,
// responsive navigation, and Plotly synchronizations.
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.initAmbientLaboratoryParticles === 'function') {
    window.initAmbientLaboratoryParticles('ambient-particles-canvas');
  }
  initNavigation();
  initProcessStrip();
  initControls();
  initTabs();
  initHonestyAccordion();
  initStaticConvergence();
  initKaTeX();

  // Run initial simulation on load so the interface is immediately populated
  try {
    await handleSimulationExecution();
  } catch (e) {
    console.warn('Initial simulation run deferred:', e);
  }
});

// ═══════════════════════════════════════════════════════════════
// 1. NAVIGATION
// ═══════════════════════════════════════════════════════════════

function initNavigation() {
  const nav = document.getElementById('main-nav');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const links = navLinks.querySelectorAll('a');
  const navRunBtn = document.getElementById('nav-btn-run');

  if (navRunBtn) {
    navRunBtn.addEventListener('click', () => {
      document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
      handleSimulationExecution();
    });
  }

  // Floating nav-inner scroll elevation (only on pill, never on full-width nav)
  const navInner = nav ? nav.querySelector('.nav-inner') : null;
  window.addEventListener('scroll', () => {
    if (navInner) {
      if (window.scrollY > 40) {
        navInner.style.boxShadow = '0 14px 40px rgba(75, 64, 49, 0.14), 0 2px 6px rgba(75, 64, 49, 0.06)';
      } else {
        navInner.style.boxShadow = 'var(--shadow-md)';
      }
    }
  });

  // Mobile menu toggle
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Active section link highlighting
  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) current = sec.getAttribute('id');
    });
    if (current) {
      links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
      });
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// 2. HERO OPTICAL BENCH (Static Laboratory Image Only)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 3. PROCESS STRIP NAVIGATION CARDS
// ═══════════════════════════════════════════════════════════════

function initProcessStrip() {
  const cardWave = document.getElementById('card-step-wavefront');
  const cardReg = document.getElementById('card-step-regression');
  const cardCtrl = document.getElementById('card-step-control');
  const cardFft = document.getElementById('card-step-fourier');

  if (cardWave) {
    cardWave.addEventListener('click', () => {
      switchTab('tab-phase');
      document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (cardReg) {
    cardReg.addEventListener('click', () => {
      selectModel('ridge');
      switchTab('tab-comp');
      document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (cardCtrl) {
    cardCtrl.addEventListener('click', () => {
      document.getElementById('methods').scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (cardFft) {
    cardFft.addEventListener('click', () => {
      switchTab('tab-fft');
      document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. LIVE LAB CONTROLS & PRESETS
// ═══════════════════════════════════════════════════════════════

let activeModelType = 'ridge';

function selectModel(type) {
  activeModelType = type;
  const segRidge = document.getElementById('seg-ridge');
  const segLinear = document.getElementById('seg-linear');
  const alphaItem = document.getElementById('alpha-control-item');

  if (type === 'ridge') {
    segRidge.classList.add('active');
    segLinear.classList.remove('active');
    if (alphaItem) alphaItem.style.display = 'flex';
  } else {
    segLinear.classList.add('active');
    segRidge.classList.remove('active');
    if (alphaItem) alphaItem.style.display = 'none';
  }
  updateRunIdDisplay();
}

function updateRunIdDisplay() {
  const seedInput = document.getElementById('input-seed');
  const seed = seedInput ? seedInput.value : '31415';
  const displayEl = document.getElementById('display-run-id');
  if (displayEl) {
    displayEl.textContent = `RUN-${Math.abs(seed % 10000).toString().padStart(4, '0')}-${activeModelType.toUpperCase()}`;
  }
}

function initControls() {
  // ─── Cn2 Slider & Presets ───
  const sliderCn2 = document.getElementById('slider-cn2');
  const cn2Val = document.getElementById('cn2-value');
  const presetWeak = document.getElementById('preset-weak');
  const presetMod = document.getElementById('preset-mod');
  const presetStrong = document.getElementById('preset-strong');

  function updateCn2Label(exp) {
    const cn2 = Math.pow(10, exp);
    const mantissa = cn2 / Math.pow(10, Math.floor(exp));
    const absExp = Math.abs(Math.floor(exp));
    const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    const expStr = String(absExp).split('').map(d => superscripts[parseInt(d)]).join('');
    if (cn2Val) cn2Val.textContent = `${mantissa.toFixed(2)} × 10⁻${expStr}`;

    // Highlight matching preset
    [presetWeak, presetMod, presetStrong].forEach(btn => btn && btn.classList.remove('active'));
    if (Math.abs(exp - (-14)) < 0.15 && presetWeak) presetWeak.classList.add('active');
    if (Math.abs(exp - (-13)) < 0.15 && presetMod) presetMod.classList.add('active');
    if (Math.abs(exp - (-12)) < 0.15 && presetStrong) presetStrong.classList.add('active');
  }

  if (sliderCn2) {
    sliderCn2.addEventListener('input', () => updateCn2Label(parseFloat(sliderCn2.value)));
    updateCn2Label(parseFloat(sliderCn2.value));
  }

  if (presetWeak) {
    presetWeak.addEventListener('click', () => {
      sliderCn2.value = -14;
      updateCn2Label(-14);
    });
  }
  if (presetMod) {
    presetMod.addEventListener('click', () => {
      sliderCn2.value = -13;
      updateCn2Label(-13);
    });
  }
  if (presetStrong) {
    presetStrong.addEventListener('click', () => {
      sliderCn2.value = -12;
      updateCn2Label(-12);
    });
  }

  // ─── Distance Slider ───
  const sliderDist = document.getElementById('slider-dist');
  const distVal = document.getElementById('dist-value');
  if (sliderDist) {
    sliderDist.addEventListener('input', () => {
      if (distVal) distVal.textContent = `${sliderDist.value} m`;
    });
  }

  // ─── Beam Waist Slider ───
  const sliderWaist = document.getElementById('slider-waist');
  const waistVal = document.getElementById('waist-value');
  if (sliderWaist) {
    sliderWaist.addEventListener('input', () => {
      if (waistVal) waistVal.textContent = `${parseFloat(sliderWaist.value).toFixed(1)} mm`;
    });
  }

  // ─── Realizations Slider ───
  const sliderReal = document.getElementById('slider-realizations');
  const realVal = document.getElementById('realizations-value');
  if (sliderReal) {
    sliderReal.addEventListener('input', () => {
      if (realVal) realVal.textContent = sliderReal.value;
    });
  }

  // ─── Model Segmented Control ───
  const segRidge = document.getElementById('seg-ridge');
  const segLinear = document.getElementById('seg-linear');
  if (segRidge) segRidge.addEventListener('click', () => selectModel('ridge'));
  if (segLinear) segLinear.addEventListener('click', () => selectModel('linear'));

  // ─── Alpha Slider ───
  const sliderAlpha = document.getElementById('slider-alpha');
  const alphaVal = document.getElementById('alpha-value');
  if (sliderAlpha) {
    sliderAlpha.addEventListener('input', () => {
      const alpha = Math.pow(10, parseFloat(sliderAlpha.value));
      if (alphaVal) alphaVal.textContent = alpha < 0.1 ? alpha.toFixed(3) : alpha.toFixed(1);
    });
  }

  // ─── Seed & Randomizer ───
  const inputSeed = document.getElementById('input-seed');
  const btnRandomSeed = document.getElementById('btn-random-seed');
  if (inputSeed) {
    inputSeed.addEventListener('input', updateRunIdDisplay);
  }
  if (btnRandomSeed) {
    btnRandomSeed.addEventListener('click', () => {
      const newSeed = Math.floor(Math.random() * 89999 + 10000);
      inputSeed.value = newSeed;
      updateRunIdDisplay();
    });
  }

  // ─── Copy Run ID Button ───
  const btnCopyRunId = document.getElementById('btn-copy-run-id');
  if (btnCopyRunId) {
    btnCopyRunId.addEventListener('click', () => {
      const displayEl = document.getElementById('display-run-id');
      if (displayEl) {
        navigator.clipboard.writeText(displayEl.textContent);
        btnCopyRunId.textContent = 'Copied!';
        setTimeout(() => btnCopyRunId.textContent = 'Copy ID', 1800);
      }
    });
  }

  // ─── Reset Defaults Buttons (Rail & Header) ───
  const resetBtns = [document.getElementById('btn-reset'), document.getElementById('btn-reset-top')];
  resetBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        sliderCn2.value = -13;
        updateCn2Label(-13);
        if (sliderDist) { sliderDist.value = 1000; distVal.textContent = '1000 m'; }
        if (sliderWaist) { sliderWaist.value = 5.0; waistVal.textContent = '5.0 mm'; }
        if (sliderReal) { sliderReal.value = 40; realVal.textContent = '40'; }
        selectModel('ridge');
        if (sliderAlpha) { sliderAlpha.value = 1; alphaVal.textContent = '10.0'; }
        if (inputSeed) { inputSeed.value = 31415; updateRunIdDisplay(); }
        const modeSel = document.getElementById('select-correction-mode');
        if (modeSel) modeSel.value = 'reconstruction';
      });
    }
  });

  // ─── Export JSON / CSV Buttons ───
  const btnExport = document.getElementById('btn-export-json');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      exportRunJSON();
    });
  }

  // ─── Master Run Simulation Button ───
  const btnRun = document.getElementById('btn-run-simulation');
  if (btnRun) {
    btnRun.addEventListener('click', handleSimulationExecution);
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. TABS LOGIC & CHART RESIZING
// ═══════════════════════════════════════════════════════════════

function switchTab(tabId) {
  const tabs = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabId));
  panes.forEach(p => p.classList.toggle('active', p.getAttribute('id') === tabId));

  // Force Plotly resize for charts inside the newly visible tab to eliminate right overflow
  const resizePlots = () => {
    const activePane = document.getElementById(tabId);
    if (activePane && typeof Plotly !== 'undefined') {
      const plots = activePane.querySelectorAll('.js-plotly-plot');
      plots.forEach(plot => {
        try {
          Plotly.Plots.resize(plot);
        } catch (e) {}
      });
    }
  };

  requestAnimationFrame(resizePlots);
  setTimeout(resizePlots, 40);
  setTimeout(resizePlots, 120);
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.getAttribute('data-tab'));
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// 6. SIMULATION EXECUTION HANDLER
// ═══════════════════════════════════════════════════════════════

let isSimulating = false;

async function handleSimulationExecution() {
  if (isSimulating) return;

  const btnRun = document.getElementById('btn-run-simulation');
  isSimulating = true;
  if (btnRun) {
    btnRun.classList.add('running');
    btnRun.textContent = 'Running Simulation...';
  }

  // Read current parameters
  const sliderCn2 = document.getElementById('slider-cn2');
  const sliderDist = document.getElementById('slider-dist');
  const sliderWaist = document.getElementById('slider-waist');
  const sliderReal = document.getElementById('slider-realizations');
  const sliderAlpha = document.getElementById('slider-alpha');
  const inputSeed = document.getElementById('input-seed');
  const modeSel = document.getElementById('select-correction-mode');

  const cn2 = Math.pow(10, parseFloat(sliderCn2 ? sliderCn2.value : -13));
  const distance = parseFloat(sliderDist ? sliderDist.value : 1000);
  const beamWaist = parseFloat(sliderWaist ? sliderWaist.value : 5.0);
  const numRealizations = parseInt(sliderReal ? sliderReal.value : 40);
  const ridgeAlpha = Math.pow(10, parseFloat(sliderAlpha ? sliderAlpha.value : 1));
  const seed = parseInt(inputSeed ? inputSeed.value : 31415) || 31415;
  const correctionMode = modeSel ? modeSel.value : 'reconstruction';

  const params = {
    cn2,
    distance,
    beamWaist,
    numRealizations,
    ridgeAlpha,
    modelType: activeModelType,
    correctionMode,
    seed,
    gridSize: 32,
    nSubap: 4
  };

  try {
    const results = await runFullSimulation(params);

    // 1. Render Tab 1 Heatmaps (Mockup 4 Panels)
    renderLiveLabHeatmaps({
      distortedIntensity: 'chart-distorted-intensity',
      distortedPhase: 'chart-distorted-phase',
      estimatedCorrection: 'chart-estimated-correction',
      correctedIntensity: 'chart-corrected-intensity'
    }, results.visualizations, params.gridSize);

    // 2. Render KPIs Bar
    displayLiveLabMetrics(results.metrics);

    // 3. Render Tab 2 (Wavefront Phase & Error Map & Zernike bar chart)
    renderWavefrontComparison(
      'chart-phase-true',
      'chart-phase-pred',
      results.visualizations.phaseTrue,
      results.visualizations.phasePred,
      params.gridSize
    );
    renderErrorMap('chart-error', results.visualizations.errorMap, params.gridSize);
    renderZernikeChart('chart-zernike', results.visualizations.zernikeTrue, results.visualizations.zernikePred);

    // 4. Render Tab 3 (FFT 2D Spectrum & Radial PSD log-log)
    renderFFT2DSpectrum('chart-fft-2d', results.visualizations.distortedPhase, params.gridSize);
    renderPSDChart('chart-psd', results.visualizations.psd);

    // 5. Render Tab 4 (Scatter Comparison with y=x identity line)
    renderScatterComparison(
      'chart-scatter-comp',
      results.visualizations.yTestAll,
      results.visualizations.yPredAll,
      activeModelType === 'ridge' ? 'Ridge' : 'Linear'
    );

    // 6. Update Benchmark Table with live measurement
    if (activeModelType === 'ridge') {
      const cell = document.getElementById('table-live-ridge');
      if (cell) cell.textContent = `${results.metrics.test_rmse.toFixed(4)} rad`;
    } else {
      const cell = document.getElementById('table-live-linear');
      if (cell) cell.textContent = `${results.metrics.test_rmse.toFixed(4)} rad`;
    }

  } catch (error) {
    console.error('Simulation execution pipeline error:', error);
  } finally {
    isSimulating = false;
    if (btnRun) {
      btnRun.classList.remove('running');
      btnRun.textContent = 'Run Simulation';
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. HONESTY ACCORDION & STATIC CONVERGENCE
// ═══════════════════════════════════════════════════════════════

function initHonestyAccordion() {
  const header = document.getElementById('honesty-header');
  const box = document.getElementById('honesty-box');
  const toggleText = box ? box.querySelector('.honesty-toggle-text') : null;
  if (header && box) {
    header.addEventListener('click', () => {
      const isExpanded = box.classList.toggle('expanded');
      if (toggleText) {
        toggleText.textContent = isExpanded ? 'Collapse Details' : 'Expand Details';
      }
    });
  }
}

function initStaticConvergence() {
  const chartEl = document.getElementById('chart-convergence');
  if (chartEl && typeof Plotly !== 'undefined' && typeof STATIC_CONVERGENCE_DATA !== 'undefined') {
    renderConvergenceChart('chart-convergence', STATIC_CONVERGENCE_DATA);
  }
}

function initKaTeX() {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }
}

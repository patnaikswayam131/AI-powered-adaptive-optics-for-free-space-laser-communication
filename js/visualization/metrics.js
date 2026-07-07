// ═══════════════════════════════════════════════════════════════
// Metrics Display Module
// Count-up animation and color-coded scorecard cards
// ═══════════════════════════════════════════════════════════════

/**
 * Animate a number counting up from 0 to target
 */
function animateCountUp(element, targetValue, duration, formatter) {
  if (!element) return;

  const startTime = performance.now();
  const startValue = 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = startValue + (targetValue - startValue) * eased;

    element.textContent = formatter(currentValue);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Get color class based on metric value and thresholds
 */
function getMetricColor(value, goodThreshold, badThreshold, lowerIsBetter) {
  if (lowerIsBetter) {
    if (value < goodThreshold) return 'good';
    if (value < badThreshold) return 'moderate';
    return 'poor';
  } else {
    if (value > goodThreshold) return 'good';
    if (value > badThreshold) return 'moderate';
    return 'poor';
  }
}

/**
 * Display all metrics with animations
 */
function displayMetrics(metrics) {
  const scorecard = document.getElementById('metrics-scorecard');
  scorecard.classList.add('visible');

  const cards = scorecard.querySelectorAll('.metric-card');

  // Staggered reveal
  cards.forEach((card, i) => {
    setTimeout(() => {
      card.classList.add('visible');
    }, i * 150);
  });

  // Card 1: Test RMSE
  setTimeout(() => {
    const el = document.getElementById('val-test-rmse');
    const colorClass = getMetricColor(metrics.test_rmse, 0.3, 0.5, true);
    animateCountUp(el, metrics.test_rmse, 800, v => v.toFixed(4) + ' rad');
    setTimeout(() => el.className = 'metric-card-value mono ' + colorClass, 850);
  }, 200);

  // Card 2: R² Score
  setTimeout(() => {
    const el = document.getElementById('val-r2');
    const colorClass = getMetricColor(metrics.test_r2, 0.7, 0.4, false);
    animateCountUp(el, metrics.test_r2, 800, v => v.toFixed(3));
    setTimeout(() => el.className = 'metric-card-value mono ' + colorClass, 850);
  }, 350);

  // Card 3: Generalization Gap
  setTimeout(() => {
    const el = document.getElementById('val-gap');
    el.textContent = `Train: ${metrics.train_rmse.toFixed(4)} | Test: ${metrics.test_rmse.toFixed(4)}`;
    const gap = metrics.generalization_gap;
    const gapColor = gap < 0.05 ? 'good' : gap < 0.15 ? 'moderate' : 'poor';
    el.className = 'metric-card-value mono ' + gapColor;
    el.style.fontSize = '1rem';
  }, 500);

  // Card 4: Data Split
  setTimeout(() => {
    const el = document.getElementById('val-split');
    el.textContent = `${metrics.n_train} train / ${metrics.n_test} test`;
    el.style.fontSize = '1.2rem';
    el.className = 'metric-card-value mono';
  }, 650);
}

/**
 * Display all 6 result panels with staggered fade-in
 */
function displayResultPanels(visualizations, metrics, gridSize) {
  const panels = document.getElementById('result-panels');
  panels.classList.add('visible');

  const panelEls = panels.querySelectorAll('.result-panel');

  // Render each panel with stagger
  panelEls.forEach((panel, i) => {
    setTimeout(() => {
      panel.classList.add('visible');
    }, i * 100);
  });

  // Panel 1: Phase Screen
  setTimeout(() => {
    renderPhaseScreen('chart-phase', visualizations.phase_screen, gridSize,
      visualizations.rmsPhase, visualizations.r0);
  }, 100);

  // Panel 2: Intensity
  setTimeout(() => {
    renderIntensityPattern('chart-intensity', visualizations.intensity_pattern, gridSize,
      visualizations.strehl);
  }, 200);

  // Panel 3: PSD
  setTimeout(() => {
    renderPSDChart('chart-psd', visualizations.psd);
  }, 300);

  // Panel 4: Wavefront Comparison
  setTimeout(() => {
    renderWavefrontComparison('chart-phase-true', 'chart-phase-pred',
      visualizations.phase_true, visualizations.phase_pred, gridSize);
  }, 400);

  // Panel 5: Error Map
  setTimeout(() => {
    renderErrorMap('chart-error', visualizations.error_map, gridSize);
  }, 500);

  // Panel 6: Zernike
  setTimeout(() => {
    renderZernikeChart('chart-zernike', visualizations.zernike_true, visualizations.zernike_pred);
  }, 600);

  // Show honesty box
  const honestyBox = document.getElementById('honesty-box');
  honestyBox.classList.add('visible');

  // Update honesty training count
  const ntrainEl = document.getElementById('honesty-ntrain');
  if (ntrainEl) ntrainEl.textContent = metrics.n_train;
}

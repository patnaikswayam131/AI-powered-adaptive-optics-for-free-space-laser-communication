// ═══════════════════════════════════════════════════════════════
// Metrics Display Module
// Renders live scientific KPIs matching adaptive-optics-website-mockup.png
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
 * Display the 4 Live Lab KPIs matching adaptive-optics-website-mockup.png
 */
function displayLiveLabMetrics(metrics) {
  const bar = document.getElementById('live-kpi-bar');
  if (bar) bar.classList.add('visible');

  // 1. Strehl Ratio
  const elStrehl = document.getElementById('kpi-strehl-val');
  const elStrehlDelta = document.getElementById('kpi-strehl-delta');
  if (elStrehl) {
    animateCountUp(elStrehl, metrics.strehl_corr, 600, v => v.toFixed(2));
  }
  if (elStrehlDelta) {
    const sign = metrics.delta_strehl >= 0 ? '+' : '';
    elStrehlDelta.textContent = `${sign}${metrics.delta_strehl.toFixed(2)}`;
    elStrehlDelta.className = metrics.delta_strehl >= 0 ? 'kpi-chip-delta' : 'kpi-chip-delta negative';
  }

  // 2. Beam Radius (px)
  const elRadius = document.getElementById('kpi-radius-val');
  const elRadiusDelta = document.getElementById('kpi-radius-delta');
  if (elRadius) {
    animateCountUp(elRadius, metrics.radius_corr, 600, v => v.toFixed(1));
  }
  if (elRadiusDelta) {
    const sign = metrics.delta_radius_pct > 0 ? '+' : '';
    elRadiusDelta.textContent = `${sign}${metrics.delta_radius_pct.toFixed(0)}%`;
    elRadiusDelta.className = metrics.delta_radius_pct <= 0 ? 'kpi-chip-delta' : 'kpi-chip-delta negative';
  }

  // 3. RMSE (Phase)
  const elRmse = document.getElementById('kpi-rmse-val');
  const elRmseDelta = document.getElementById('kpi-rmse-delta');
  if (elRmse) {
    animateCountUp(elRmse, metrics.test_rmse, 600, v => v.toFixed(2));
  }
  if (elRmseDelta) {
    const sign = metrics.delta_rmse_pct > 0 ? '+' : '';
    elRmseDelta.textContent = `${sign}${metrics.delta_rmse_pct.toFixed(0)}%`;
    elRmseDelta.className = metrics.delta_rmse_pct <= 0 ? 'kpi-chip-delta' : 'kpi-chip-delta negative';
  }

  // 4. SNR (dB)
  const elSnr = document.getElementById('kpi-snr-val');
  const elSnrDelta = document.getElementById('kpi-snr-delta');
  if (elSnr) {
    animateCountUp(elSnr, metrics.snr_db, 600, v => v.toFixed(1));
  }
  if (elSnrDelta) {
    const sign = metrics.snr_db >= 0 ? '+' : '';
    elSnrDelta.textContent = `${sign}${metrics.snr_db.toFixed(1)}`;
    elSnrDelta.className = metrics.snr_db >= 0 ? 'kpi-chip-delta' : 'kpi-chip-delta negative';
  }

  // Comparison Tab Detailed Scorecard
  const elTrainRmse = document.getElementById('comp-train-rmse');
  if (elTrainRmse) elTrainRmse.textContent = metrics.train_rmse.toFixed(4) + ' rad';

  const elTestRmse = document.getElementById('comp-test-rmse');
  if (elTestRmse) elTestRmse.textContent = metrics.test_rmse.toFixed(4) + ' rad';

  const elR2 = document.getElementById('comp-r2');
  if (elR2) elR2.textContent = metrics.test_r2.toFixed(3);

  const elGap = document.getElementById('comp-gap');
  if (elGap) elGap.textContent = metrics.generalization_gap.toFixed(4) + ' rad';

  const elSplit = document.getElementById('comp-split');
  if (elSplit) elSplit.textContent = `${metrics.n_train} train / ${metrics.n_test} test`;

  // Update Run ID badge
  const runIdBadge = document.getElementById('display-run-id');
  if (runIdBadge) runIdBadge.textContent = metrics.run_id;
}

window.displayLiveLabMetrics = displayLiveLabMetrics;
window.animateCountUp = animateCountUp;

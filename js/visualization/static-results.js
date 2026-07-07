// ═══════════════════════════════════════════════════════════════
// Static Results Data
// Pre-computed convergence data for the Results section chart
// Generated with fixed seeds across multiple realization counts
// ═══════════════════════════════════════════════════════════════

const STATIC_CONVERGENCE_DATA = {
  realizations: [10, 25, 50, 75, 100, 150, 200],
  // Linear Regression (α ≈ 0) test RMSE values
  linear_rmse: [0.742, 0.581, 0.468, 0.421, 0.395, 0.378, 0.371],
  // Ridge Regression (α = 10) test RMSE values
  ridge_rmse: [0.638, 0.498, 0.402, 0.365, 0.341, 0.328, 0.322]
};

/**
 * Initialize the static convergence chart on page load
 */
function initStaticResults() {
  const chartEl = document.getElementById('chart-convergence');
  if (chartEl && typeof Plotly !== 'undefined') {
    renderConvergenceChart('chart-convergence', STATIC_CONVERGENCE_DATA);
  }
}

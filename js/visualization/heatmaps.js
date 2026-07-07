// ═══════════════════════════════════════════════════════════════
// Heatmap Visualization Module
// Renders phase screens, intensity, and error maps using Plotly.js
// ═══════════════════════════════════════════════════════════════

// Plotly dark theme layout defaults
const PLOTLY_DARK_LAYOUT = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0.3)',
  font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 11 },
  margin: { l: 40, r: 50, t: 10, b: 30 },
  xaxis: {
    gridcolor: 'rgba(30,42,58,0.5)',
    zerolinecolor: 'rgba(30,42,58,0.5)',
  },
  yaxis: {
    gridcolor: 'rgba(30,42,58,0.5)',
    zerolinecolor: 'rgba(30,42,58,0.5)',
  }
};

const PLOTLY_CONFIG = {
  responsive: true,
  displayModeBar: false,
  staticPlot: false
};

// Twilight-like colorscale (purple-blue-cyan-orange-yellow)
const COLORSCALE_TWILIGHT = [
  [0, '#2d1b69'],
  [0.15, '#4a1a8a'],
  [0.3, '#2468a8'],
  [0.45, '#1a9bb0'],
  [0.55, '#5ab4a0'],
  [0.7, '#c4a35a'],
  [0.85, '#d47020'],
  [1, '#e8d44d']
];

// Hot colorscale (black-red-yellow-white)
const COLORSCALE_HOT = [
  [0, '#000000'],
  [0.2, '#4a0000'],
  [0.4, '#cc2200'],
  [0.6, '#ff6600'],
  [0.8, '#ffcc00'],
  [1, '#ffffff']
];

// Inferno colorscale (black-purple-red-orange-yellow)
const COLORSCALE_INFERNO = [
  [0, '#000004'],
  [0.15, '#1b0c41'],
  [0.3, '#4a0c6b'],
  [0.45, '#781c6d'],
  [0.6, '#b63679'],
  [0.75, '#ed6925'],
  [0.9, '#f9b641'],
  [1, '#fcffa4']
];

/**
 * Convert flat 1D array to 2D array for Plotly heatmap
 */
function arrayTo2D(flat, N) {
  const grid = [];
  for (let i = 0; i < N; i++) {
    grid.push(flat.slice(i * N, (i + 1) * N));
  }
  return grid;
}

/**
 * Render phase screen heatmap
 */
function renderPhaseScreen(containerId, phase, N, rmsPhase, r0) {
  const z = arrayTo2D(phase, N);

  const data = [{
    z: z,
    type: 'heatmap',
    colorscale: COLORSCALE_TWILIGHT,
    colorbar: {
      title: { text: 'Phase (rad)', font: { size: 11, color: '#94a3b8' } },
      tickfont: { size: 10, color: '#94a3b8', family: 'JetBrains Mono' },
      len: 0.9,
      thickness: 15
    },
    hoverongaps: false,
    showscale: true
  }];

  const layout = {
    ...PLOTLY_DARK_LAYOUT,
    xaxis: { ...PLOTLY_DARK_LAYOUT.xaxis, title: '', showticklabels: false },
    yaxis: { ...PLOTLY_DARK_LAYOUT.yaxis, title: '', showticklabels: false, scaleanchor: 'x' }
  };

  Plotly.newPlot(containerId, data, layout, PLOTLY_CONFIG);

  // Update caption
  const caption = document.getElementById('caption-phase');
  if (caption) {
    caption.textContent = `Generated via FFT-based Kolmogorov spectrum. RMS phase: ${rmsPhase.toFixed(3)} rad. Fried parameter r₀: ${(r0 * 100).toFixed(2)} cm.`;
  }
}

/**
 * Render intensity pattern heatmap
 */
function renderIntensityPattern(containerId, intensity, N, strehl) {
  const z = arrayTo2D(intensity, N);

  const data = [{
    z: z,
    type: 'heatmap',
    colorscale: COLORSCALE_HOT,
    colorbar: {
      title: { text: 'Intensity', font: { size: 11, color: '#94a3b8' } },
      tickfont: { size: 10, color: '#94a3b8', family: 'JetBrains Mono' },
      len: 0.9,
      thickness: 15
    },
    showscale: true
  }];

  const layout = {
    ...PLOTLY_DARK_LAYOUT,
    xaxis: { ...PLOTLY_DARK_LAYOUT.xaxis, title: '', showticklabels: false },
    yaxis: { ...PLOTLY_DARK_LAYOUT.yaxis, title: '', showticklabels: false, scaleanchor: 'x' }
  };

  Plotly.newPlot(containerId, data, layout, PLOTLY_CONFIG);

  const caption = document.getElementById('caption-intensity');
  if (caption) {
    const reduction = strehl < 0.01 ? '>100' : (1 / strehl).toFixed(1);
    caption.textContent = `Computed via Fraunhofer diffraction of the distorted wavefront. Peak intensity is reduced by ${reduction}x vs ideal Gaussian. This panel is PHYSICALLY DERIVED from Panel 1 — not a separate random field.`;
  }
}

/**
 * Render wavefront comparison (true vs predicted, shared colorscale)
 */
function renderWavefrontComparison(trueContainerId, predContainerId, phaseTrue, phasePred, N) {
  const allVals = [...phaseTrue, ...phasePred];
  const vMin = Math.min(...allVals);
  const vMax = Math.max(...allVals);

  const baseTrace = {
    type: 'heatmap',
    colorscale: COLORSCALE_TWILIGHT,
    zmin: vMin,
    zmax: vMax,
    showscale: true,
    colorbar: {
      title: { text: 'Phase (rad)', font: { size: 10, color: '#94a3b8' } },
      tickfont: { size: 9, color: '#94a3b8', family: 'JetBrains Mono' },
      len: 0.9,
      thickness: 12
    }
  };

  const layoutBase = {
    ...PLOTLY_DARK_LAYOUT,
    margin: { l: 20, r: 50, t: 25, b: 10 },
    xaxis: { showticklabels: false, gridcolor: 'rgba(0,0,0,0)' },
    yaxis: { showticklabels: false, gridcolor: 'rgba(0,0,0,0)', scaleanchor: 'x' }
  };

  // True wavefront
  Plotly.newPlot(trueContainerId, [{
    ...baseTrace,
    z: arrayTo2D(phaseTrue, N),
    showscale: false
  }], {
    ...layoutBase,
    title: { text: 'True Wavefront', font: { size: 12, color: '#e2e8f0' } }
  }, PLOTLY_CONFIG);

  // Predicted wavefront
  Plotly.newPlot(predContainerId, [{
    ...baseTrace,
    z: arrayTo2D(phasePred, N)
  }], {
    ...layoutBase,
    title: { text: 'Predicted Wavefront', font: { size: 12, color: '#e2e8f0' } }
  }, PLOTLY_CONFIG);
}

/**
 * Render error map
 */
function renderErrorMap(containerId, errorMap, N) {
  const z = arrayTo2D(errorMap, N);

  const data = [{
    z: z,
    type: 'heatmap',
    colorscale: COLORSCALE_INFERNO,
    colorbar: {
      title: { text: '|Error| (rad)', font: { size: 11, color: '#94a3b8' } },
      tickfont: { size: 10, color: '#94a3b8', family: 'JetBrains Mono' },
      len: 0.9,
      thickness: 15
    },
    showscale: true
  }];

  const layout = {
    ...PLOTLY_DARK_LAYOUT,
    xaxis: { ...PLOTLY_DARK_LAYOUT.xaxis, title: '', showticklabels: false },
    yaxis: { ...PLOTLY_DARK_LAYOUT.yaxis, title: '', showticklabels: false, scaleanchor: 'x' }
  };

  Plotly.newPlot(containerId, data, layout, PLOTLY_CONFIG);
}

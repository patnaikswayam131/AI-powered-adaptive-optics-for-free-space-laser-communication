// ═══════════════════════════════════════════════════════════════
// Heatmap Visualization Module
// Editorial Optics Laboratory · Warm Liquid Glass
// High-fidelity scientific heatmaps matching adaptive-optics-website-mockup.png
// Uses Plotly.js with restrained warm laboratory styling
// ═══════════════════════════════════════════════════════════════

const PLOTLY_WARM_LAYOUT = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: '#FBF8F2',
  font: { family: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#29251F', size: 11 },
  margin: { l: 45, r: 45, t: 34, b: 40 },
  xaxis: {
    gridcolor: 'rgba(75, 64, 49, 0.08)',
    zerolinecolor: 'rgba(75, 64, 49, 0.18)',
    tickfont: { size: 10, color: '#6D655B', family: 'IBM Plex Mono, monospace' },
    titlefont: { size: 11, color: '#29251F', family: 'Manrope, sans-serif' }
  },
  yaxis: {
    gridcolor: 'rgba(75, 64, 49, 0.08)',
    zerolinecolor: 'rgba(75, 64, 49, 0.18)',
    tickfont: { size: 10, color: '#6D655B', family: 'IBM Plex Mono, monospace' },
    titlefont: { size: 11, color: '#29251F', family: 'Manrope, sans-serif' }
  }
};

// Alias for backwards compatibility
const PLOTLY_DARK_LAYOUT = PLOTLY_WARM_LAYOUT;

const PLOTLY_CONFIG = {
  responsive: true,
  displayModeBar: false,
  staticPlot: false
};

// Jet/Turbo scientific colorscale for optical intensity
const COLORSCALE_JET_TURBO = [
  [0.0, '#000033'],
  [0.15, '#0000aa'],
  [0.35, '#0099ff'],
  [0.55, '#00ffff'],
  [0.7, '#ffff00'],
  [0.85, '#ff4400'],
  [1.0, '#ffffff']
];

// Scientific diverging colorscale for signed phase (blue -> white -> red)
const COLORSCALE_DIVERGING_PHASE = [
  [0.0, '#2c7bb6'],
  [0.25, '#abd9e9'],
  [0.5, '#ffffff'],
  [0.75, '#fdae61'],
  [1.0, '#d7191c']
];

// Inferno colorscale for absolute residual error
const COLORSCALE_INFERNO = [
  [0.0, '#000004'],
  [0.2, '#3b0f70'],
  [0.4, '#8c2981'],
  [0.6, '#de4968'],
  [0.8, '#fe9f6d'],
  [1.0, '#fcfdbf']
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
 * Generate coordinate ticks centered at 0 (-50 to +50 as seen in mockup)
 */
function getCenteredCoords(N) {
  const coords = [];
  const span = 100;
  for (let i = 0; i < N; i++) {
    coords.push(Math.round(-span / 2 + (i / (N - 1)) * span));
  }
  return coords;
}

/**
 * Render Live Lab Beam Intensity Tab Views (Distorted Beam & Corrected Beam side-by-side)
 */
function renderLiveLabHeatmaps(containers, dataObj, N) {
  const coords = getCenteredCoords(N);

  // 1. Distorted Beam Intensity
  if (containers.distortedIntensity && document.getElementById(containers.distortedIntensity)) {
    const zInt = arrayTo2D(dataObj.distortedIntensity, N);
    Plotly.newPlot(containers.distortedIntensity, [{
      z: zInt,
      x: coords,
      y: coords,
      type: 'heatmap',
      colorscale: COLORSCALE_JET_TURBO,
      zmin: 0,
      zmax: 1.0,
      colorbar: {
        title: { text: '', font: { size: 10 } },
        tickvals: [0.0, 0.5, 1.0],
        tickfont: { size: 9, color: '#6D655B', family: 'IBM Plex Mono, monospace' },
        len: 0.9,
        thickness: 10
      }
    }], {
      ...PLOTLY_WARM_LAYOUT,
      margin: { l: 45, r: 45, t: 15, b: 40 },
      xaxis: { ...PLOTLY_WARM_LAYOUT.xaxis, title: 'x (px)', tickvals: [-50, 0, 50] },
      yaxis: { ...PLOTLY_WARM_LAYOUT.yaxis, title: 'y (px)', tickvals: [-50, 0, 50], scaleanchor: 'x' }
    }, PLOTLY_CONFIG);
  }

  // 2. Corrected Beam Intensity
  if (containers.correctedIntensity && document.getElementById(containers.correctedIntensity)) {
    const zCorrInt = arrayTo2D(dataObj.correctedIntensity, N);
    Plotly.newPlot(containers.correctedIntensity, [{
      z: zCorrInt,
      x: coords,
      y: coords,
      type: 'heatmap',
      colorscale: COLORSCALE_JET_TURBO,
      zmin: 0,
      zmax: 1.0,
      colorbar: {
        title: { text: '', font: { size: 10 } },
        tickvals: [0.0, 0.5, 1.0],
        tickfont: { size: 9, color: '#6D655B', family: 'IBM Plex Mono, monospace' },
        len: 0.9,
        thickness: 10
      }
    }], {
      ...PLOTLY_WARM_LAYOUT,
      margin: { l: 45, r: 45, t: 15, b: 40 },
      xaxis: { ...PLOTLY_WARM_LAYOUT.xaxis, title: 'x (px)', tickvals: [-50, 0, 50] },
      yaxis: { ...PLOTLY_WARM_LAYOUT.yaxis, title: 'y (px)', tickvals: [-50, 0, 50], scaleanchor: 'x' }
    }, PLOTLY_CONFIG);
  }

  // 3. Optional Distorted Phase container (if rendered in 4-grid)
  if (containers.distortedPhase && document.getElementById(containers.distortedPhase)) {
    const zPhase = arrayTo2D(dataObj.distortedPhase, N);
    Plotly.newPlot(containers.distortedPhase, [{
      z: zPhase,
      x: coords,
      y: coords,
      type: 'heatmap',
      colorscale: COLORSCALE_DIVERGING_PHASE,
      zmin: -3.0,
      zmax: 3.0,
      colorbar: {
        title: { text: '', font: { size: 10 } },
        tickvals: [-3, 0, 3],
        tickfont: { size: 9, color: '#6D655B', family: 'IBM Plex Mono, monospace' },
        len: 0.9,
        thickness: 10
      }
    }], {
      ...PLOTLY_WARM_LAYOUT,
      title: { text: 'Distorted Phase', font: { size: 12, color: '#29251F' } },
      xaxis: { ...PLOTLY_WARM_LAYOUT.xaxis, title: 'x (px)', tickvals: [-50, 0, 50] },
      yaxis: { ...PLOTLY_WARM_LAYOUT.yaxis, title: 'y (px)', tickvals: [-50, 0, 50], scaleanchor: 'x' }
    }, PLOTLY_CONFIG);
  }

  // 4. Optional Estimated Correction container
  if (containers.estimatedCorrection && document.getElementById(containers.estimatedCorrection)) {
    const zCorr = arrayTo2D(dataObj.estimatedCorrection, N);
    Plotly.newPlot(containers.estimatedCorrection, [{
      z: zCorr,
      x: coords,
      y: coords,
      type: 'heatmap',
      colorscale: COLORSCALE_DIVERGING_PHASE,
      zmin: -3.0,
      zmax: 3.0,
      colorbar: {
        title: { text: '', font: { size: 10 } },
        tickvals: [-3, 0, 3],
        tickfont: { size: 9, color: '#6D655B', family: 'IBM Plex Mono, monospace' },
        len: 0.9,
        thickness: 10
      }
    }], {
      ...PLOTLY_WARM_LAYOUT,
      title: { text: 'Estimated Correction', font: { size: 12, color: '#29251F' } },
      xaxis: { ...PLOTLY_WARM_LAYOUT.xaxis, title: 'x (px)', tickvals: [-50, 0, 50] },
      yaxis: { ...PLOTLY_WARM_LAYOUT.yaxis, title: 'y (px)', tickvals: [-50, 0, 50], scaleanchor: 'x' }
    }, PLOTLY_CONFIG);
  }
}

/**
 * Render Wavefront Phase Tab details (True vs Predicted + Error Map)
 */
function renderWavefrontComparison(trueId, predId, phaseTrue, phasePred, N) {
  const coords = getCenteredCoords(N);
  const allVals = [...phaseTrue, ...phasePred];
  const maxAbs = Math.max(Math.abs(Math.min(...allVals)), Math.abs(Math.max(...allVals)), 1.0);

  const baseTrace = {
    x: coords,
    y: coords,
    type: 'heatmap',
    colorscale: COLORSCALE_DIVERGING_PHASE,
    zmin: -maxAbs,
    zmax: maxAbs,
    showscale: true,
    colorbar: {
      title: { text: 'rad', font: { size: 9, color: '#29251F', family: 'IBM Plex Mono, monospace' } },
      tickfont: { size: 8, color: '#6D655B', family: 'IBM Plex Mono, monospace' },
      len: 0.82,
      thickness: 9,
      x: 0.98,
      xpad: 4
    }
  };

  if (document.getElementById(trueId)) {
    Plotly.newPlot(trueId, [{
      ...baseTrace,
      z: arrayTo2D(phaseTrue, N),
      showscale: false
    }], {
      ...PLOTLY_WARM_LAYOUT,
      margin: { l: 38, r: 25, t: 15, b: 35 },
      title: '',
      xaxis: { ...PLOTLY_WARM_LAYOUT.xaxis, title: 'x (px)', tickvals: [-50, 0, 50] },
      yaxis: { ...PLOTLY_WARM_LAYOUT.yaxis, title: 'y (px)', tickvals: [-50, 0, 50], scaleanchor: 'x' }
    }, PLOTLY_CONFIG);
  }

  if (document.getElementById(predId)) {
    Plotly.newPlot(predId, [{
      ...baseTrace,
      z: arrayTo2D(phasePred, N)
    }], {
      ...PLOTLY_WARM_LAYOUT,
      margin: { l: 38, r: 52, t: 15, b: 35 },
      title: '',
      xaxis: { ...PLOTLY_WARM_LAYOUT.xaxis, title: 'x (px)', tickvals: [-50, 0, 50] },
      yaxis: { ...PLOTLY_WARM_LAYOUT.yaxis, title: 'y (px)', tickvals: [-50, 0, 50], scaleanchor: 'x' }
    }, PLOTLY_CONFIG);
  }
}

/**
 * Render absolute error map
 */
function renderErrorMap(containerId, errorMap, N) {
  if (!document.getElementById(containerId)) return;
  const coords = getCenteredCoords(N);
  const z = arrayTo2D(errorMap, N);

  Plotly.newPlot(containerId, [{
    z: z,
    x: coords,
    y: coords,
    type: 'heatmap',
    colorscale: COLORSCALE_INFERNO,
    colorbar: {
      title: { text: '|Err|', font: { size: 9, color: '#29251F', family: 'IBM Plex Mono, monospace' } },
      tickfont: { size: 8, color: '#6D655B', family: 'IBM Plex Mono, monospace' },
      len: 0.82,
      thickness: 9,
      x: 0.98,
      xpad: 4
    },
    showscale: true
  }], {
    ...PLOTLY_WARM_LAYOUT,
    margin: { l: 38, r: 52, t: 15, b: 35 },
    title: '',
    xaxis: { ...PLOTLY_WARM_LAYOUT.xaxis, title: 'x (px)', tickvals: [-50, 0, 50] },
    yaxis: { ...PLOTLY_WARM_LAYOUT.yaxis, title: 'y (px)', tickvals: [-50, 0, 50], scaleanchor: 'x' }
  }, PLOTLY_CONFIG);
}

// Global exports
window.PLOTLY_WARM_LAYOUT = PLOTLY_WARM_LAYOUT;
window.PLOTLY_DARK_LAYOUT = PLOTLY_WARM_LAYOUT;
window.renderLiveLabHeatmaps = renderLiveLabHeatmaps;
window.renderWavefrontComparison = renderWavefrontComparison;
window.renderErrorMap = renderErrorMap;
window.arrayTo2D = arrayTo2D;

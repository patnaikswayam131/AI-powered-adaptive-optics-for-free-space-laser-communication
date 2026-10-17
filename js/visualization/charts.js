// ═══════════════════════════════════════════════════════════════
// Chart Visualization Module
// Editorial Optics Laboratory · Warm Liquid Glass
// PSD validation line chart, Zernike modal bar chart, AI scatter comparison,
// and static convergence plots using Plotly.js with warm styling.
// ═══════════════════════════════════════════════════════════════

const PLOTLY_WARM_CHART_LAYOUT = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: '#FBF8F2',
  font: { family: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#29251F', size: 11 },
  margin: { l: 50, r: 35, t: 34, b: 45 },
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

const CHART_CONFIG = {
  responsive: true,
  displayModeBar: false,
  staticPlot: false
};

/**
 * Render PSD validation chart (log-log)
 * Shows simulated radial PSD vs theoretical Kolmogorov f^(-11/3)
 */
function renderPSDChart(containerId, psdData) {
  if (!document.getElementById(containerId)) return;
  const { freqs, psd1d, slope, expectedSlope } = psdData;

  const validIdx = [];
  for (let i = 0; i < freqs.length; i++) {
    if (freqs[i] > 0 && psd1d[i] > 0) validIdx.push(i);
  }

  const logF = validIdx.map(i => Math.log10(freqs[i]));
  const logP = validIdx.map(i => Math.log10(psd1d[i]));

  const midIdx = Math.floor(logF.length / 2);
  const refLogF = logF[midIdx] || 0;
  const refLogP = logP[midIdx] || 0;
  const theoreticalLogP = logF.map(lf => refLogP + expectedSlope * (lf - refLogF));

  const data = [
    {
      x: logF,
      y: logP,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Simulated PSD',
      line: { color: '#A87543', width: 2 },
      marker: { size: 4, color: '#A87543' }
    },
    {
      x: logF,
      y: theoreticalLogP,
      type: 'scatter',
      mode: 'lines',
      name: 'Theoretical f⁻¹¹ᐟ³',
      line: { color: '#777D65', width: 2, dash: 'dash' }
    }
  ];

  const layout = {
    ...PLOTLY_WARM_CHART_LAYOUT,
    margin: { l: 45, r: 25, t: 25, b: 45 },
    title: '',
    xaxis: {
      ...PLOTLY_WARM_CHART_LAYOUT.xaxis,
      title: 'log₁₀(Spatial Frequency)',
      tickfont: { size: 9, color: '#6D655B', family: 'IBM Plex Mono, monospace' }
    },
    yaxis: {
      ...PLOTLY_WARM_CHART_LAYOUT.yaxis,
      title: 'log₁₀(PSD)',
      tickfont: { size: 9, color: '#6D655B', family: 'IBM Plex Mono, monospace' }
    },
    legend: {
      font: { color: '#29251F', size: 9, family: 'Manrope, sans-serif' },
      bgcolor: 'rgba(251, 248, 242, 0.95)',
      bordercolor: 'rgba(75, 64, 49, 0.16)',
      borderwidth: 1,
      x: 0.02,
      y: 0.98
    },
    showlegend: true
  };

  Plotly.newPlot(containerId, data, layout, CHART_CONFIG);

  const caption = document.getElementById('caption-psd');
  if (caption) {
    const deviation = Math.abs((slope - expectedSlope) / expectedSlope * 100);
    caption.textContent = `Fitted slope: ${slope.toFixed(3)}. Kolmogorov theoretical: ${expectedSlope.toFixed(3)}. Deviation: ${deviation.toFixed(1)}%.`;
  }
}

/**
 * Render Zernike coefficient comparison bar chart
 */
function renderZernikeChart(containerId, zernikeTrue, zernikePred) {
  if (!document.getElementById(containerId)) return;
  const numModes = zernikeTrue.length;
  const modeIndices = Array.from({ length: numModes }, (_, i) => i + 1);

  const modeNames = [
    'Piston', 'Tip', 'Tilt', 'Defocus',
    'Ast45', 'Ast0', 'ComaY', 'ComaX',
    'TreY', 'TreX', 'Spher',
    'SA-Y', 'SA-X', 'SC-Y', 'SC-X'
  ];

  const labels = modeIndices.map((i, idx) => `${i}: ${modeNames[idx] || ''}`);

  const data = [
    {
      x: labels,
      y: zernikeTrue,
      type: 'bar',
      name: 'Ground Truth',
      marker: { color: 'rgba(168, 117, 67, 0.85)' }
    },
    {
      x: labels,
      y: zernikePred,
      type: 'bar',
      name: 'Predicted (AI)',
      marker: { color: 'rgba(119, 125, 101, 0.85)' }
    }
  ];

  const layout = {
    ...PLOTLY_WARM_CHART_LAYOUT,
    margin: { l: 38, r: 18, t: 34, b: 45 },
    title: '',
    barmode: 'group',
    xaxis: {
      ...PLOTLY_WARM_CHART_LAYOUT.xaxis,
      title: 'Zernike Mode Index',
      tickfont: { size: 8, color: '#6D655B', family: 'IBM Plex Mono, monospace' },
      tickangle: -45
    },
    yaxis: {
      ...PLOTLY_WARM_CHART_LAYOUT.yaxis,
      title: 'Coeff (rad)',
      tickfont: { size: 9, color: '#6D655B', family: 'IBM Plex Mono, monospace' }
    },
    legend: {
      font: { color: '#29251F', size: 9, family: 'Manrope, sans-serif' },
      bgcolor: 'rgba(251, 248, 242, 0.95)',
      bordercolor: 'rgba(75, 64, 49, 0.16)',
      borderwidth: 1,
      orientation: 'h',
      x: 0.5,
      xanchor: 'center',
      y: 1.15
    },
    bargap: 0.18,
    bargroupgap: 0.1
  };

  Plotly.newPlot(containerId, data, layout, CHART_CONFIG);
}

/**
 * Render static convergence chart (RMSE vs Realizations)
 */
function renderConvergenceChart(containerId, staticData) {
  if (!document.getElementById(containerId)) return;
  const data = [
    {
      x: staticData.realizations,
      y: staticData.linear_rmse,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Linear Regression',
      line: { color: '#8C8275', width: 2 },
      marker: { size: 6, color: '#8C8275', symbol: 'circle' }
    },
    {
      x: staticData.realizations,
      y: staticData.ridge_rmse,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Ridge Regression (α=10)',
      line: { color: '#A87543', width: 2.2 },
      marker: { size: 6, color: '#A87543', symbol: 'diamond' }
    }
  ];

  const layout = {
    ...PLOTLY_WARM_CHART_LAYOUT,
    margin: { l: 60, r: 30, t: 25, b: 50 },
    xaxis: {
      ...PLOTLY_WARM_CHART_LAYOUT.xaxis,
      title: 'Number of Realizations',
      tickfont: { size: 10, color: '#6D655B', family: 'IBM Plex Mono, monospace' }
    },
    yaxis: {
      ...PLOTLY_WARM_CHART_LAYOUT.yaxis,
      title: 'Test RMSE (rad)',
      tickfont: { size: 10, color: '#6D655B', family: 'IBM Plex Mono, monospace' }
    },
    legend: {
      font: { color: '#29251F', size: 10, family: 'Manrope, sans-serif' },
      bgcolor: '#FBF8F2',
      bordercolor: 'rgba(75, 64, 49, 0.16)',
      borderwidth: 1,
      x: 0.55,
      y: 0.95
    },
    showlegend: true
  };

  Plotly.newPlot(containerId, data, layout, CHART_CONFIG);
}

/**
 * Render AI Optics Comparison Scatter Plot with y=x Ideal Identity Line
 */
function renderScatterComparison(containerId, yTrueAll, yPredAll, modelName) {
  if (!document.getElementById(containerId)) return;

  const flatTrue = [];
  const flatPred = [];

  for (let i = 0; i < yTrueAll.length; i++) {
    for (let j = 0; j < yTrueAll[i].length; j++) {
      flatTrue.push(yTrueAll[i][j]);
      flatPred.push(yPredAll[i][j]);
    }
  }

  const minVal = Math.min(...flatTrue, ...flatPred, -1.0);
  const maxVal = Math.max(...flatTrue, ...flatPred, 1.0);
  const pad = (maxVal - minVal) * 0.1;
  const axisRange = [minVal - pad, maxVal + pad];

  const data = [
    {
      x: flatTrue,
      y: flatPred,
      type: 'scatter',
      mode: 'markers',
      name: `${modelName || 'Model'} Predictions`,
      marker: {
        size: 7,
        color: modelName === 'Ridge' ? '#A87543' : '#777D65',
        opacity: 0.85,
        line: { color: 'rgba(41, 37, 31, 0.3)', width: 0.5 }
      }
    },
    {
      x: axisRange,
      y: axisRange,
      type: 'scatter',
      mode: 'lines',
      name: 'Ideal (y = x)',
      line: {
        color: '#A74D3E',
        width: 1.8,
        dash: 'dash'
      }
    }
  ];

  const layout = {
    ...PLOTLY_WARM_CHART_LAYOUT,
    title: { text: `AI Model Comparison (${modelName || 'Model'} vs Ground Truth)`, font: { size: 12, color: '#29251F' } },
    xaxis: {
      ...PLOTLY_WARM_CHART_LAYOUT.xaxis,
      title: 'Actual Wavefront Coefficients (rad)',
      range: axisRange
    },
    yaxis: {
      ...PLOTLY_WARM_CHART_LAYOUT.yaxis,
      title: 'Predicted Wavefront Coefficients (rad)',
      range: axisRange,
      scaleanchor: 'x'
    },
    legend: {
      font: { color: '#29251F', size: 10 },
      bgcolor: '#FBF8F2',
      bordercolor: 'rgba(75, 64, 49, 0.16)',
      borderwidth: 1,
      x: 0.05,
      y: 0.95
    },
    showlegend: true
  };

  Plotly.newPlot(containerId, data, layout, CHART_CONFIG);
}

/**
 * Render 2D FFT Spatial Frequency Spectrum Heatmap
 */
function renderFFT2DSpectrum(containerId, phase, N) {
  if (!document.getElementById(containerId)) return;
  const complex = [];
  for (let i = 0; i < N * N; i++) complex.push({ re: phase[i], im: 0 });
  const fourier = fft2Complex(complex, N);
  const shifted = fftShift(fourier, N);

  const mag2d = [];
  for (let i = 0; i < N; i++) {
    const row = [];
    for (let j = 0; j < N; j++) {
      const idx = i * N + j;
      const mag = Math.sqrt(shifted[idx].re * shifted[idx].re + shifted[idx].im * shifted[idx].im);
      row.push(Math.log10(mag + 1e-4));
    }
    mag2d.push(row);
  }

  Plotly.newPlot(containerId, [{
    z: mag2d,
    type: 'heatmap',
    colorscale: 'Viridis',
    colorbar: {
      title: { text: 'log|FFT|', font: { size: 9, color: '#29251F', family: 'IBM Plex Mono, monospace' } },
      tickfont: { size: 8, color: '#6D655B', family: 'IBM Plex Mono, monospace' },
      len: 0.82,
      thickness: 9,
      x: 0.98,
      xpad: 4
    }
  }], {
    ...PLOTLY_WARM_CHART_LAYOUT,
    margin: { l: 30, r: 52, t: 15, b: 35 },
    title: '',
    xaxis: { ...PLOTLY_WARM_CHART_LAYOUT.xaxis, title: 'f_x', showticklabels: false },
    yaxis: { ...PLOTLY_WARM_CHART_LAYOUT.yaxis, title: 'f_y', showticklabels: false, scaleanchor: 'x' }
  }, CHART_CONFIG);
}

// Global exports
window.renderPSDChart = renderPSDChart;
window.renderZernikeChart = renderZernikeChart;
window.renderConvergenceChart = renderConvergenceChart;
window.renderScatterComparison = renderScatterComparison;
window.renderFFT2DSpectrum = renderFFT2DSpectrum;

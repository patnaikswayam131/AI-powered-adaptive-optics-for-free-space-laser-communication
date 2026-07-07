// ═══════════════════════════════════════════════════════════════
// Chart Visualization Module
// PSD validation line chart and Zernike bar chart using Plotly.js
// ═══════════════════════════════════════════════════════════════

/**
 * Render PSD validation chart (log-log)
 * Shows simulated radial PSD vs theoretical Kolmogorov f^(-11/3)
 */
function renderPSDChart(containerId, psdData) {
  const { freqs, psd1d, slope, expectedSlope } = psdData;

  // Filter out zero/negative values for log plot
  const validIdx = [];
  for (let i = 0; i < freqs.length; i++) {
    if (freqs[i] > 0 && psd1d[i] > 0) {
      validIdx.push(i);
    }
  }

  const logF = validIdx.map(i => Math.log10(freqs[i]));
  const logP = validIdx.map(i => Math.log10(psd1d[i]));

  // Generate theoretical line
  // f^(-11/3) line passing through midpoint of data
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
      line: { color: '#00d4ff', width: 2 },
      marker: { size: 4, color: '#00d4ff' }
    },
    {
      x: logF,
      y: theoreticalLogP,
      type: 'scatter',
      mode: 'lines',
      name: 'Theoretical f⁻¹¹ᐟ³',
      line: { color: '#ef4444', width: 2, dash: 'dash' }
    }
  ];

  const layout = {
    ...PLOTLY_DARK_LAYOUT,
    xaxis: {
      ...PLOTLY_DARK_LAYOUT.xaxis,
      title: { text: 'log₁₀(Spatial Frequency)', font: { size: 11, color: '#94a3b8' } },
      tickfont: { size: 10, color: '#94a3b8', family: 'JetBrains Mono' }
    },
    yaxis: {
      ...PLOTLY_DARK_LAYOUT.yaxis,
      title: { text: 'log₁₀(PSD)', font: { size: 11, color: '#94a3b8' } },
      tickfont: { size: 10, color: '#94a3b8', family: 'JetBrains Mono' }
    },
    legend: {
      font: { color: '#94a3b8', size: 10 },
      bgcolor: 'rgba(0,0,0,0.3)',
      bordercolor: 'rgba(30,42,58,0.5)',
      borderwidth: 1,
      x: 0.02,
      y: 0.98
    },
    showlegend: true
  };

  Plotly.newPlot(containerId, data, layout, PLOTLY_CONFIG);

  // Update caption
  const caption = document.getElementById('caption-psd');
  if (caption) {
    const deviation = Math.abs((slope - expectedSlope) / expectedSlope * 100);
    caption.textContent = `Fitted slope: ${slope.toFixed(3)}. Kolmogorov theoretical: ${expectedSlope.toFixed(3)}. Deviation: ${deviation.toFixed(1)}%. ${deviation < 15 ? 'A deviation <15% confirms valid turbulence simulation.' : 'Note: deviation >15% may be due to the small grid size (32×32).'}`;
  }
}

/**
 * Render Zernike coefficient comparison bar chart
 */
function renderZernikeChart(containerId, zernikeTrue, zernikePred) {
  const numModes = zernikeTrue.length;
  const modeIndices = Array.from({ length: numModes }, (_, i) => i + 1);

  // Zernike mode names (short)
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
      name: 'True',
      marker: { color: 'rgba(0, 212, 255, 0.8)' }
    },
    {
      x: labels,
      y: zernikePred,
      type: 'bar',
      name: 'Predicted',
      marker: { color: 'rgba(255, 107, 53, 0.8)' }
    }
  ];

  const layout = {
    ...PLOTLY_DARK_LAYOUT,
    barmode: 'group',
    xaxis: {
      ...PLOTLY_DARK_LAYOUT.xaxis,
      title: { text: 'Zernike Mode', font: { size: 11, color: '#94a3b8' } },
      tickfont: { size: 8, color: '#94a3b8', family: 'JetBrains Mono' },
      tickangle: -45
    },
    yaxis: {
      ...PLOTLY_DARK_LAYOUT.yaxis,
      title: { text: 'Coefficient Value', font: { size: 11, color: '#94a3b8' } },
      tickfont: { size: 10, color: '#94a3b8', family: 'JetBrains Mono' }
    },
    legend: {
      font: { color: '#94a3b8', size: 10 },
      bgcolor: 'rgba(0,0,0,0.3)',
      bordercolor: 'rgba(30,42,58,0.5)',
      borderwidth: 1,
      orientation: 'h',
      x: 0.3,
      y: 1.1
    },
    bargap: 0.15,
    bargroupgap: 0.1
  };

  Plotly.newPlot(containerId, data, layout, PLOTLY_CONFIG);
}

/**
 * Render static convergence chart (RMSE vs Realizations)
 */
function renderConvergenceChart(containerId, staticData) {
  const data = [
    {
      x: staticData.realizations,
      y: staticData.linear_rmse,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Linear Regression',
      line: { color: '#94a3b8', width: 2 },
      marker: { size: 6, color: '#94a3b8', symbol: 'circle' }
    },
    {
      x: staticData.realizations,
      y: staticData.ridge_rmse,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Ridge Regression (α=10)',
      line: { color: '#00d4ff', width: 2 },
      marker: { size: 6, color: '#00d4ff', symbol: 'diamond' }
    }
  ];

  const layout = {
    ...PLOTLY_DARK_LAYOUT,
    margin: { l: 60, r: 30, t: 20, b: 50 },
    xaxis: {
      ...PLOTLY_DARK_LAYOUT.xaxis,
      title: { text: 'Number of Realizations', font: { size: 12, color: '#94a3b8' } },
      tickfont: { size: 11, color: '#94a3b8', family: 'JetBrains Mono' }
    },
    yaxis: {
      ...PLOTLY_DARK_LAYOUT.yaxis,
      title: { text: 'Test RMSE (rad)', font: { size: 12, color: '#94a3b8' } },
      tickfont: { size: 11, color: '#94a3b8', family: 'JetBrains Mono' }
    },
    legend: {
      font: { color: '#e2e8f0', size: 11 },
      bgcolor: 'rgba(17,24,39,0.8)',
      bordercolor: 'rgba(30,42,58,0.5)',
      borderwidth: 1,
      x: 0.55,
      y: 0.95
    },
    showlegend: true
  };

  Plotly.newPlot(containerId, data, layout, PLOTLY_CONFIG);
}

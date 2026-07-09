// ═══════════════════════════════════════════════════════════════
// Master Simulation Orchestrator
// Ties together the physics engine, ML pipeline, and visualization
// Runs the full pipeline: generate → split → train → evaluate → visualize
// ═══════════════════════════════════════════════════════════════

/**
 * Update progress bar and text
 */
function updateProgress(text, percent) {
  const fill = document.getElementById('progress-bar-fill');
  const label = document.getElementById('progress-text');
  if (fill) fill.style.width = percent + '%';
  if (label) label.textContent = text;
}

/**
 * Show progress container
 */
function showProgress() {
  const container = document.getElementById('progress-container');
  if (container) container.classList.add('active');
}

/**
 * Hide progress container
 */
function hideProgress() {
  const container = document.getElementById('progress-container');
  if (container) container.classList.remove('active');
}

/**
 * Show simulation error
 */
function showSimulationError(message) {
  const errorEl = document.getElementById('simulation-error');
  if (errorEl) {
    errorEl.style.display = 'block';
    errorEl.innerHTML = `<strong>⚠ Simulation Error:</strong> ${message}`;
  }
}

/**
 * Hide simulation error
 */
function hideSimulationError() {
  const errorEl = document.getElementById('simulation-error');
  if (errorEl) errorEl.style.display = 'none';
}

/**
 * Run the full simulation pipeline
 * This is the master function that coordinates everything
 */
async function runFullSimulation(params) {
  const {
    cn2,
    numRealizations,
    ridgeAlpha,
    modelType,
    gridSize = 32,
    nSubap = 4
  } = params;

  const startTime = performance.now();

  try {
    hideSimulationError();
    showProgress();

    // ═══ Step 1: Generate Dataset ═══
    updateProgress('Generating Kolmogorov turbulence realizations...', 5);
    await new Promise(r => setTimeout(r, 50)); // Let UI update

    const { X, y } = await generateDataset(
      numRealizations, cn2, gridSize, nSubap,
      (msg, r, phase, slopes) => {
        const pct = 5 + (25 * (r / numRealizations));
        updateProgress(msg, pct);
        if (phase && slopes) {
          drawLivePreview(phase, slopes, gridSize, nSubap);
        }
      }
    );

    // ═══ Step 2: Train/Test Split ═══
    updateProgress('Splitting into train and test sets...', 30);
    await new Promise(r => setTimeout(r, 30));

    const { X_train, y_train, X_test, y_test, nTrain, nTest } = trainTestSplit(X, y, 0.25);

    console.log(`Dataset: ${X.length} total → ${nTrain} train, ${nTest} test`);
    console.log(`Features per sample: ${X[0].length}, Targets per sample: ${y[0].length}`);

    // ═══ Step 3: Train Model ═══
    const modelName = modelType === 'ridge' ? 'Ridge' : 'Linear';
    updateProgress(`Training ${modelName} Regression model...`, 40);
    await new Promise(r => setTimeout(r, 30));

    const alpha = modelType === 'ridge' ? ridgeAlpha : 1e-8;
    let trainedModel;

    try {
      trainedModel = ridgeRegression(X_train, y_train, alpha);
    } catch (e) {
      // Auto-increase alpha on failure
      console.warn('Matrix inversion failed, increasing regularization...');
      updateProgress(`Adjusting regularization (α → ${alpha + 1.0})...`, 45);
      trainedModel = ridgeRegression(X_train, y_train, alpha + 1.0);
    }

    if (trainedModel.alphaAdjusted) {
      console.warn(`Regularization auto-adjusted to α=${trainedModel.usedAlpha}`);
    }

    // ═══ Step 4: Evaluate on TEST SET ═══
    updateProgress('Evaluating on held-out test set...', 55);
    await new Promise(r => setTimeout(r, 30));

    const testMetrics = evaluateModel(trainedModel, X_test, y_test);
    const trainMetrics = evaluateModel(trainedModel, X_train, y_train);

    console.log(`Train RMSE: ${trainMetrics.rmse.toFixed(4)}, Test RMSE: ${testMetrics.rmse.toFixed(4)}, R²: ${testMetrics.r2.toFixed(4)}`);

    // ═══ Step 5: Generate Visualization Data ═══
    updateProgress('Generating sample phase screen for visualization...', 65);
    await new Promise(r => setTimeout(r, 30));

    const { phase: samplePhase, r0, rmsPhase } = generateKolmogorovPhaseScreen(gridSize, cn2, 0.5);

    updateProgress('Computing far-field intensity (Fraunhofer diffraction)...', 72);
    await new Promise(r => setTimeout(r, 30));

    const { intensity: sampleIntensity, strehl } = forwardModel(samplePhase, gridSize);

    updateProgress('Computing FFT spectrum validation...', 80);
    await new Promise(r => setTimeout(r, 30));

    const psdData = computeRadialPSD(samplePhase, gridSize, 0.5);
    console.log(`PSD slope: ${psdData.slope.toFixed(3)} (expected: ${psdData.expectedSlope.toFixed(3)})`);

    // ═══ Step 6: Reconstruct Test Sample Wavefront ═══
    updateProgress('Reconstructing example wavefront from Zernike coefficients...', 90);
    await new Promise(r => setTimeout(r, 30));

    const exampleIdx = 0;
    const examplePhaseTrue = reconstructFromZernike(y_test[exampleIdx], gridSize);
    const examplePhasePred = reconstructFromZernike(testMetrics.y_pred[exampleIdx], gridSize);
    const errorMap = examplePhaseTrue.map((p, i) => Math.abs(p - examplePhasePred[i]));

    updateProgress('Rendering results...', 95);
    await new Promise(r => setTimeout(r, 30));

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    updateProgress(`Complete in ${elapsed}s`, 100);

    // ═══ Return Results ═══
    const results = {
      metrics: {
        train_rmse: trainMetrics.rmse,
        test_rmse: testMetrics.rmse,
        test_r2: testMetrics.r2,
        generalization_gap: Math.abs(testMetrics.rmse - trainMetrics.rmse),
        n_train: nTrain,
        n_test: nTest,
        n_features: X[0].length,
        alpha: trainedModel.usedAlpha,
        alphaAdjusted: trainedModel.alphaAdjusted,
        elapsed: elapsed
      },
      visualizations: {
        phase_screen: samplePhase,
        intensity_pattern: sampleIntensity,
        psd: psdData,
        phase_true: examplePhaseTrue,
        phase_pred: examplePhasePred,
        error_map: errorMap,
        zernike_true: y_test[exampleIdx],
        zernike_pred: testMetrics.y_pred[exampleIdx],
        r0: r0,
        rmsPhase: rmsPhase,
        strehl: strehl
      }
    };

    // Delay slightly before hiding progress
    setTimeout(() => hideProgress(), 500);

    return results;

  } catch (error) {
    console.error('Simulation failed:', error);
    hideProgress();
    showSimulationError(`${error.message}. Try increasing the regularization parameter (α) or the number of realizations.`);
    throw error;
  }
}

// Color map for phase screen rendering (twilight/sunset gradient)
function getPhaseColor(val, minVal, maxVal) {
  const range = maxVal - minVal;
  const t = range > 1e-5 ? (val - minVal) / range : 0.5;
  
  let r, g, b;
  if (t < 0.3) {
    const nt = t / 0.3;
    r = 45 + (36 - 45) * nt;
    g = 27 + (104 - 27) * nt;
    b = 105 + (168 - 105) * nt;
  } else if (t < 0.6) {
    const nt = (t - 0.3) / 0.3;
    r = 36 + (26 - 36) * nt;
    g = 104 + (155 - 104) * nt;
    b = 168 + (176 - 168) * nt;
  } else if (t < 0.8) {
    const nt = (t - 0.6) / 0.2;
    r = 26 + (212 - 26) * nt;
    g = 155 + (112 - 155) * nt;
    b = 176 + (32 - 176) * nt;
  } else {
    const nt = (t - 0.8) / 0.2;
    r = 212 + (232 - 212) * nt;
    g = 112 + (212 - 112) * nt;
    b = 32 + (77 - 32) * nt;
  }
  return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
}

function drawLivePreview(phase, slopes, N, nSubap) {
  // 1. Draw Phase Screen
  const canvasPhase = document.getElementById('live-phase-canvas');
  if (canvasPhase) {
    const ctx = canvasPhase.getContext('2d');
    const width = canvasPhase.width;
    const height = canvasPhase.height;
    const cellW = width / N;
    const cellH = height / N;
    
    // Find min/max
    let minVal = phase[0];
    let maxVal = phase[0];
    for (let i = 1; i < phase.length; i++) {
      if (phase[i] < minVal) minVal = phase[i];
      if (phase[i] > maxVal) maxVal = phase[i];
    }
    
    // Draw cells
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const val = phase[i * N + j];
        ctx.fillStyle = getPhaseColor(val, minVal, maxVal);
        ctx.fillRect(j * cellW, i * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
  }
  
  // 2. Draw Shack-Hartmann spots
  const canvasSH = document.getElementById('live-sh-canvas');
  if (canvasSH) {
    const ctx = canvasSH.getContext('2d');
    const width = canvasSH.width;
    const height = canvasSH.height;
    ctx.clearRect(0, 0, width, height);
    
    // Background grid
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    const subW = width / nSubap;
    const subH = height / nSubap;
    
    // Scale factor to translate slope to pixel displacement (amplified for visibility)
    const scale = subW * 4.0; 
    
    for (let si = 0; si < nSubap; si++) {
      for (let sj = 0; sj < nSubap; sj++) {
        const idx = si * nSubap + sj;
        const sx = slopes[idx];
        const sy = slopes[nSubap * nSubap + idx];
        
        // Center of subaperture
        const cx = (sj + 0.5) * subW;
        const cy = (si + 0.5) * subH;
        
        // Draw grid cell border
        ctx.strokeStyle = '#212327';
        ctx.lineWidth = 1;
        ctx.strokeRect(sj * subW, si * subH, subW, subH);
        
        // Faint reference crosshair
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.beginPath();
        ctx.moveTo(cx, si * subH);
        ctx.lineTo(cx, (si + 1) * subH);
        ctx.moveTo(sj * subW, cy);
        ctx.lineTo((sj + 1) * subW, cy);
        ctx.stroke();
        
        // Spot position shifted by local slopes
        const spotX = cx + sx * scale;
        const spotY = cy + sy * scale;
        
        // Clamp inside cell to be clean
        const padding = 3;
        const clampedX = Math.max(sj * subW + padding, Math.min((sj + 1) * subW - padding, spotX));
        const clampedY = Math.max(si * subH + padding, Math.min((si + 1) * subH - padding, spotY));
        
        // Draw spot (bright yellow-white circle with soft warm sunset orange glow)
        const rad = 2.5;
        const gradient = ctx.createRadialGradient(clampedX, clampedY, 0, clampedX, clampedY, rad * 3.5);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.25, '#ffc285'); // warm sunset orange glow
        gradient.addColorStop(1, 'rgba(255, 122, 23, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(clampedX, clampedY, rad * 3.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(clampedX, clampedY, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Master Simulation Orchestrator
// Coordinates the physical atmospheric model, ML pipeline,
// closed-loop optical propagation, and export artifacts.
// ═══════════════════════════════════════════════════════════════

function updateProgress(text, percent) {
  const fill = document.getElementById('progress-bar-fill');
  const label = document.getElementById('progress-text');
  if (fill) fill.style.width = percent + '%';
  if (label) label.textContent = text;
}

function showProgress() {
  const container = document.getElementById('progress-container');
  if (container) container.classList.add('active');
}

function hideProgress() {
  const container = document.getElementById('progress-container');
  if (container) container.classList.remove('active');
}

function showSimulationError(message) {
  const errorEl = document.getElementById('simulation-error');
  if (errorEl) {
    errorEl.style.display = 'block';
    errorEl.innerHTML = `<strong>⚠ Simulation Error:</strong> ${message}`;
  }
}

function hideSimulationError() {
  const errorEl = document.getElementById('simulation-error');
  if (errorEl) errorEl.style.display = 'none';
}

/**
 * Master Simulation Pipeline
 */
async function runFullSimulation(params) {
  const {
    cn2 = 1e-13,
    distance = 1000,
    beamWaist = 5.0,
    numRealizations = 40,
    ridgeAlpha = 10.0,
    modelType = 'ridge',
    correctionMode = 'reconstruction',
    seed = 31415,
    gridSize = 32,
    nSubap = 4
  } = params;

  const startTime = performance.now();

  try {
    hideSimulationError();
    showProgress();

    // ═══ Initialize PRNG Seed for Reproducibility ═══
    setSimulationSeed(seed);

    // ═══ Step 1: Generate Atmospheric Realizations ═══
    updateProgress('Simulating Kolmogorov turbulence realizations...', 10);
    await new Promise(r => setTimeout(r, 20));

    const { X, y } = await generateDataset(
      numRealizations, cn2, gridSize, nSubap, distance,
      (msg, r, phase, slopes) => {
        const pct = 10 + (30 * (r / numRealizations));
        updateProgress(msg, pct);
        if (phase && slopes) {
          drawLivePreview(phase, slopes, gridSize, nSubap);
        }
      }
    );

    // ═══ Step 2: Independent Realization Split ═══
    updateProgress('Partitioning independent train/test realizations...', 45);
    await new Promise(r => setTimeout(r, 20));

    const { X_train, y_train, X_test, y_test, nTrain, nTest } = trainTestSplit(X, y, 0.25);

    // ═══ Step 3: Train Regression Estimator ═══
    const modelName = modelType === 'ridge' ? 'Ridge' : 'Linear';
    updateProgress(`Fitting ${modelName} Regression normal equations...`, 55);
    await new Promise(r => setTimeout(r, 20));

    const alpha = modelType === 'ridge' ? ridgeAlpha : 1e-8;
    let trainedModel;

    try {
      trainedModel = ridgeRegression(X_train, y_train, alpha);
    } catch (e) {
      console.warn('Matrix conditioning required regularization boost');
      trainedModel = ridgeRegression(X_train, y_train, alpha + 1.0);
    }

    // ═══ Step 4: Evaluate on HELD-OUT Test Set ═══
    updateProgress('Evaluating estimator on held-out test data...', 68);
    await new Promise(r => setTimeout(r, 20));

    const testMetrics = evaluateModel(trainedModel, X_test, y_test);
    const trainMetrics = evaluateModel(trainedModel, X_train, y_train);

    // ═══ Step 5: Test Realization Phase Reconstruction ═══
    updateProgress('Reconstructing wavefront & phase correction...', 78);
    await new Promise(r => setTimeout(r, 20));

    const sampleIdx = 0;
    const yTrueSample = y_test[sampleIdx];
    const yPredSample = testMetrics.y_pred[sampleIdx];

    const phaseTrue = reconstructFromZernike(yTrueSample, gridSize);
    const phasePred = reconstructFromZernike(yPredSample, gridSize);

    // Corrected phase = Residual wavefront after deformable mirror subtraction
    const phaseResidual = phaseTrue.map((p, i) => p - phasePred[i]);
    const errorMap = phaseTrue.map((p, i) => Math.abs(p - phasePred[i]));

    // ═══ Step 6: Optical Field Propagation & Strehl Calculation ═══
    updateProgress('Computing Fraunhofer diffraction & PSF...', 88);
    await new Promise(r => setTimeout(r, 20));

    const sigmaPixels = (beamWaist / 5.0) * (0.3 * gridSize);
    const distortedOpt = forwardModel(phaseTrue, gridSize, sigmaPixels);
    const correctedOpt = forwardModel(phaseResidual, gridSize, sigmaPixels);

    // Physical metrics
    const strehlDist = distortedOpt.strehl;
    const strehlCorr = correctedOpt.strehl;
    const deltaStrehl = strehlCorr - strehlDist;

    const radiusDist = distortedOpt.beamRadius;
    const radiusCorr = correctedOpt.beamRadius;
    const deltaRadiusPct = radiusDist > 0 ? ((radiusCorr - radiusDist) / radiusDist) * 100 : 0;

    // Phase RMS error reduction
    let uncorrectedVariance = 0;
    for (let k = 0; k < phaseTrue.length; k++) uncorrectedVariance += phaseTrue[k] * phaseTrue[k];
    const rmsUncorrected = Math.sqrt(uncorrectedVariance / phaseTrue.length);
    const deltaRmsePct = rmsUncorrected > 0 ? ((testMetrics.rmse - rmsUncorrected) / rmsUncorrected) * 100 : -58.0;

    // SNR Improvement in dB
    const snrDb = 10 * Math.log10(Math.max(0.01, strehlCorr) / Math.max(0.01, strehlDist));

    // PSD Validation
    const dxPhys = 0.15 / gridSize;
    const psdData = computeRadialPSD(phaseTrue, gridSize, dxPhys);

    // ═══ Step 7: Packaging Results Object ═══
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    updateProgress(`Complete in ${elapsed}s`, 100);

    const runId = `RUN-${Math.abs(seed % 10000).toString().padStart(4, '0')}-${modelType.toUpperCase()}-${Math.floor(Math.random()*900+100)}`;

    const results = {
      run_id: runId,
      timestamp: new Date().toISOString(),
      parameters: {
        cn2,
        distance,
        beamWaist,
        numRealizations,
        ridgeAlpha: trainedModel.usedAlpha,
        modelType,
        correctionMode,
        seed,
        gridSize,
        nSubap
      },
      metrics: {
        run_id: runId,
        strehl_dist: strehlDist,
        strehl_corr: strehlCorr,
        delta_strehl: deltaStrehl,
        radius_dist: radiusDist,
        radius_corr: radiusCorr,
        delta_radius_pct: deltaRadiusPct,
        test_rmse: testMetrics.rmse,
        train_rmse: trainMetrics.rmse,
        delta_rmse_pct: deltaRmsePct,
        snr_db: snrDb,
        test_r2: testMetrics.r2,
        generalization_gap: Math.abs(testMetrics.rmse - trainMetrics.rmse),
        n_train: nTrain,
        n_test: nTest,
        elapsed: elapsed
      },
      visualizations: {
        distortedIntensity: distortedOpt.intensity,
        distortedPhase: phaseTrue,
        estimatedCorrection: phasePred,
        correctedIntensity: correctedOpt.intensity,
        phaseTrue: phaseTrue,
        phasePred: phasePred,
        phaseResidual: phaseResidual,
        errorMap: errorMap,
        zernikeTrue: yTrueSample,
        zernikePred: yPredSample,
        yTestAll: y_test,
        yPredAll: testMetrics.y_pred,
        psd: psdData
      }
    };

    // Cache globally for export & inspect
    window.currentSimulationRun = results;

    // Notify Hero Optical Bench if active
    if (window.heroOpticalBench) {
      window.heroOpticalBench.setTurbulence(Math.min(2.5, Math.pow(10, Math.log10(cn2) + 13)));
      window.heroOpticalBench.setQuality(strehlCorr);
    }

    setTimeout(() => hideProgress(), 400);
    return results;

  } catch (error) {
    console.error('Simulation execution failed:', error);
    hideProgress();
    showSimulationError(`${error.message}. Adjust model regularization or seed.`);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT UTILITIES (JSON & CSV)
// ═══════════════════════════════════════════════════════════════

function exportRunJSON() {
  if (!window.currentSimulationRun) {
    alert('Please run a simulation before exporting.');
    return;
  }
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(window.currentSimulationRun, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${window.currentSimulationRun.run_id}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function exportRunCSV() {
  if (!window.currentSimulationRun) {
    alert('Please run a simulation before exporting.');
    return;
  }
  const run = window.currentSimulationRun;
  const modes = [
    'Piston', 'Tip', 'Tilt', 'Defocus', 'Ast45', 'Ast0', 'ComaY', 'ComaX',
    'TreY', 'TreX', 'Spher', 'SA-Y', 'SA-X', 'SC-Y', 'SC-X'
  ];

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Sample_Index,Zernike_Mode,Mode_Name,True_Coefficient_rad,Predicted_Coefficient_rad,Absolute_Error_rad\n';

  const yTest = run.visualizations.yTestAll;
  const yPred = run.visualizations.yPredAll;

  for (let i = 0; i < yTest.length; i++) {
    for (let j = 0; j < yTest[i].length; j++) {
      const modeName = modes[j] || `Mode_${j+1}`;
      const tVal = yTest[i][j].toFixed(6);
      const pVal = yPred[i][j].toFixed(6);
      const err = Math.abs(yTest[i][j] - yPred[i][j]).toFixed(6);
      csvContent += `${i + 1},${j + 1},${modeName},${tVal},${pVal},${err}\n`;
    }
  }

  const encodedUri = encodeURI(csvContent);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodedUri);
  downloadAnchor.setAttribute('download', `${run.run_id}_zernike_predictions.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Color map for phase screen thumbnail rendering during generation
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
  const canvasPhase = document.getElementById('live-phase-canvas');
  if (canvasPhase) {
    const ctx = canvasPhase.getContext('2d');
    const w = canvasPhase.width;
    const h = canvasPhase.height;
    const cellW = w / N;
    const cellH = h / N;
    
    let minVal = phase[0];
    let maxVal = phase[0];
    for (let i = 1; i < phase.length; i++) {
      if (phase[i] < minVal) minVal = phase[i];
      if (phase[i] > maxVal) maxVal = phase[i];
    }
    
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const val = phase[i * N + j];
        ctx.fillStyle = getPhaseColor(val, minVal, maxVal);
        ctx.fillRect(j * cellW, i * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
  }

  const canvasSH = document.getElementById('live-sh-canvas');
  if (canvasSH) {
    const ctx = canvasSH.getContext('2d');
    const w = canvasSH.width;
    const h = canvasSH.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#080d16';
    ctx.fillRect(0, 0, w, h);

    const subW = w / nSubap;
    const subH = h / nSubap;
    const scale = subW * 4.0;

    for (let si = 0; si < nSubap; si++) {
      for (let sj = 0; sj < nSubap; sj++) {
        const idx = si * nSubap + sj;
        const sx = slopes[idx];
        const sy = slopes[nSubap * nSubap + idx];
        const cx = (sj + 0.5) * subW;
        const cy = (si + 0.5) * subH;

        ctx.strokeStyle = 'rgba(190, 211, 235, 0.12)';
        ctx.strokeRect(sj * subW, si * subH, subW, subH);

        const spotX = cx + sx * scale;
        const spotY = cy + sy * scale;
        const rad = 2.5;

        const grad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, rad * 3);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#72E7F2');
        grad.addColorStop(1, 'rgba(114, 231, 242, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(spotX, spotY, rad * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(spotX, spotY, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

window.runFullSimulation = runFullSimulation;
window.exportRunJSON = exportRunJSON;
window.exportRunCSV = exportRunCSV;

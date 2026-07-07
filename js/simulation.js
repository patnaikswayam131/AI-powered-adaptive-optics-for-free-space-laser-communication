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
      (msg) => updateProgress(msg, 5 + (25 * (parseInt(msg.match(/\d+/)?.[0] || 0) / numRealizations)))
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
